const OpenAI = require('openai');
const { cache: cacheService } = require('./cache/cache.service');
// Optional prisma for recording AI usage; fallback if not available
let prismaClient = null;
try {
  prismaClient = require('../utils/prisma');
} catch (e) {
  // prisma not available or not generated — instrumentation will be skipped
}
const {
  analyzeAccessibility,
  analyzeSecurity,
  analyzeSEO,
  analyzePerformance,
  analyzeI18n,
  validateDesignSystem,
  analyzeStructure,
  analyzeAdditionalHTMLHeuristics,
} = require('./analyzers');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.cache = cacheService;
    this.modelRouter = {
      small: 'gpt-3.5-turbo',
      medium: 'gpt-4',
      large: 'gpt-4-32k',
    };
  }

  async analyzeCode({ content, type, filename }) {
    // Logging: record analyze request
    try {
      console.log(`AIService.analyzeCode() called for file=${filename} type=${type} contentLen=${content ? content.length : 0}`);
    } catch (e) {}
    // Cache handling (allow bypass via env flag)
    const cacheKey = `${filename}-${cacheService.hashContent(content)}`;
    let cachedResult = null;
    const bypassCache = process.env.FORCE_BYPASS_CACHE === 'true';
    if (!bypassCache) {
      cachedResult = await this.cache.get(cacheKey);
    } else {
      console.log('AIService: FORCE_BYPASS_CACHE active, skipping cache lookup');
    }
    if (cachedResult) {
      console.log('AIService: cache hit for', cacheKey);
      return cachedResult;
    }
    console.log('AIService: cache miss for', cacheKey, 'bypassCache=', bypassCache);

    // Initialize analysis results
    const analysis = {
      issues: [],
      suggestions: [],
      metrics: {
        accessibility: 0,
        performance: 0,
        seo: 0,
        security: 0,
        i18n: 0,
      },
    };

    try {
      // Run static analyzers first
      const [
        accessibilityIssues,
        securityIssues,
        seoIssues,
        performanceIssues,
        i18nIssues,
        designIssues,
        structureIssues,
        extraHtmlIssues,
      ] = await Promise.all([
        analyzeAccessibility(content, type),
        analyzeSecurity(content, type),
        analyzeSEO(content, type),
        analyzePerformance(content, type),
        analyzeI18n(content, type),
        validateDesignSystem(content, type),
        analyzeStructure(content, type),
        analyzeAdditionalHTMLHeuristics(content, type),
      ]);

      // Combine all issues
      analysis.issues = [
        ...accessibilityIssues,
        ...securityIssues,
        ...seoIssues,
        ...performanceIssues,
        ...i18nIssues,
        ...designIssues,
        ...structureIssues,
        ...extraHtmlIssues,
      ];

      // Calculate metrics based on issues
      this.calculateMetrics(analysis);

      // Decide whether to call AI:
      // - call when static analyzers found issues
      // - OR when the file type is one that benefits from LLM analysis (HTML/CSS/JS/TS/JSX/TSX/SCSS)
      // - OR when explicit env flags force AI
      const fileType = (filename && filename.split('.').pop()) || (type || '');
      const aiPreferredTypes = ['html', 'css', 'scss', 'js', 'ts', 'jsx', 'tsx'];
      const ext = String(fileType || '').toLowerCase();
      const shouldCallAI = (analysis.issues && analysis.issues.length > 0)
        || aiPreferredTypes.includes(ext)
        || process.env.FORCE_AI === 'true'
        || process.env.ALWAYS_AI === 'true';
      if (shouldCallAI) {
        const aiResult = await this.getAISuggestions({
          content,
          type,
          issues: analysis.issues,
          filename
        });
        // aiResult: { suggestions, raw, model, latencyMs, usage }
        analysis.suggestions = aiResult.suggestions || [];
        analysis.aiRaw = aiResult.raw || '';
        analysis.aiMeta = {
          model: aiResult.model,
          latencyMs: aiResult.latencyMs,
          usage: aiResult.usage || null
        };
      } else {
        console.log('AIService.analyzeCode: Skipping AI call (no issues and no FORCE_AI/ALWAYS_AI flags)');
      }

      // Cache the results
      await this.cache.set(cacheKey, analysis);

      return analysis;
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Fallback to static analysis results
      return analysis;
    }
  }

  needsAIAnalysis(analysis) {
    // Determine if AI analysis is needed based on:
    // 1. Number and severity of issues
    // 2. Complexity of the code
    // 3. Previous cache hits
    const criticalIssues = analysis.issues.filter(i => i.severity === 'critical').length;
    const highIssues = analysis.issues.filter(i => i.severity === 'high').length;
    
    return criticalIssues > 0 || highIssues > 2;
  }

  async getAISuggestions({ content, type, issues, filename }) {
    // Select appropriate model based on content size
    const model = this.selectModel(content.length);
    
    try {
      const prompt = this.buildPrompt({ content, type, issues });
      // Redact helper for logging
      const redact = (s) => {
        if (!s) return '';
        // keep first 300 chars, remove any API keys if accidentally included
        return s.toString().slice(0, 300).replace(process.env.OPENAI_API_KEY || '', '[REDACTED]');
      };

      console.log(`AIService.getAISuggestions: calling model=${model} filename=${filename || 'unknown'} promptLen=${prompt.length}`);
      // Perform the OpenAI call and measure latency
      const start = Date.now();
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `You are an expert web developer providing suggestions to improve code quality, accessibility, security, and performance. Focus on practical, minimal changes that have high impact.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });
      const latencyMs = Date.now() - start;

      // Extract AI text and usage (if provided)
      const aiText = response?.choices?.[0]?.message?.content || '';
      const usageInfo = response?.usage || null;

  console.log('AIService.getAISuggestions: latencyMs=', latencyMs, 'response.usage=', usageInfo || 'N/A');
  console.log('AIService.getAISuggestions: model response preview:', redact(aiText));

      // Persist AI usage synchronously if prisma available
      try {
        const usageDelegate = prismaClient && (prismaClient.aIUsage || prismaClient.aiUsage);
        if (usageDelegate && usageDelegate.create) {
          await usageDelegate.create({
            data: {
              model,
              promptTokens: usageInfo?.prompt_tokens || usageInfo?.promptTokens || 0,
              completionTokens: usageInfo?.completion_tokens || usageInfo?.completionTokens || 0,
              totalTokens: usageInfo?.total_tokens || usageInfo?.totalTokens || ((usageInfo?.prompt_tokens || 0) + (usageInfo?.completion_tokens || 0)),
              costUsd: 0,
              latencyMs,
              success: true,
              context: filename ? `file-analysis:${filename}` : 'file-analysis'
            }
          });
          console.log('AIService: persisted ai_usage record');
        }
      } catch (e) {
        console.warn('AIService: failed to persist AIUsage', e && e.message ? e.message : e);
      }

      const parsed = this.parseSuggestions(aiText);
      // If parser couldn't produce structured suggestions, create a fallback that includes the raw AI text
      if ((!parsed || parsed.length === 0) && aiText && aiText.trim().length > 0) {
        parsed.push({
          category: 'GENERAL',
          description: aiText.split('\n').slice(0, 2).join(' ').slice(0, 300),
          changes: [aiText],
          rationale: '',
          example: aiText
        });
      }
      return { suggestions: parsed, raw: aiText, model, latencyMs, usage: usageInfo };
    } catch (error) {
      console.error('OpenAI API call failed:', error && (error.message || error.error || error.response) ? (error.message || JSON.stringify(error.error || error.response || {})) : error);
      // Persist failed attempt if prisma available
      try {
        const usageDelegate = prismaClient && (prismaClient.aIUsage || prismaClient.aiUsage);
        if (usageDelegate && usageDelegate.create) {
          await usageDelegate.create({
            data: {
              model,
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0,
              costUsd: 0,
              latencyMs: 0,
              success: false,
              context: filename ? `file-analysis:${filename}` : 'file-analysis',
              errorMessage: (error && error.message ? error.message : 'OpenAI call failed')
            }
          });
          console.log('AIService: persisted failed ai_usage record');
        }
      } catch (e2) {
        console.warn('AIService: failed to persist failed AIUsage', e2 && e2.message ? e2.message : e2);
      }
      // Fallback to static suggestions
      return { suggestions: this.generateStaticSuggestions(issues), raw: '', model, latencyMs: 0, usage: null, error: error && error.message ? error.message : 'error' };
    }
  }

  selectModel(contentLength) {
    if (contentLength < 1000) return this.modelRouter.small;
    if (contentLength < 5000) return this.modelRouter.medium;
    return this.modelRouter.large;
  }

  buildPrompt({ content, type, issues }) {
    return `
Analyze the following ${type.toUpperCase()} code and provide specific, actionable improvements:

${content}

Current issues:
${issues.map(i => `- ${i.severity}: ${i.message}`).join('\n')}

Provide suggestions in the following format:
1. [CATEGORY] Brief description
- Specific change to make
- Why it's important
- Code example (if applicable)
    `;
  }

  parseSuggestions(aiResponse) {
    // Parse AI response into structured suggestions
    const suggestions = [];
    const lines = aiResponse.split('\n');
    let currentSuggestion = null;

    for (const line of lines) {
      if (line.match(/^\d+\.\s+\[[\w-]+\]/)) {
        if (currentSuggestion) {
          suggestions.push(currentSuggestion);
        }
        currentSuggestion = {
          category: line.match(/\[([\w-]+)\]/)[1],
          description: line.replace(/^\d+\.\s+\[[\w-]+\]\s*/, ''),
          changes: [],
          rationale: '',
          example: '',
        };
      } else if (line.startsWith('- ')) {
        if (currentSuggestion) {
          currentSuggestion.changes.push(line.slice(2));
        }
      }
    }

    if (currentSuggestion) {
      suggestions.push(currentSuggestion);
    }

    // Normalize suggestion objects to expected shape
    return suggestions.map(s => ({
      category: s.category || 'GENERAL',
      description: s.description || s.summary || '',
      changes: Array.isArray(s.changes) ? s.changes : (s.example ? [s.example] : []),
      rationale: s.rationale || '',
      example: s.example || ''
    }));
  }

  generateStaticSuggestions(issues) {
    // Fallback static suggestions based on common patterns
    return issues.map(issue => ({
      category: issue.category,
      description: `Fix ${issue.severity} issue: ${issue.message}`,
      changes: [this.getStaticFix(issue)],
      rationale: this.getStaticRationale(issue),
    }));
  }

  getStaticFix(issue) {
    // Predefined fixes for common issues
    const fixes = {
      'missing-alt': 'Add descriptive alt text to the image',
      'contrast-ratio': 'Increase color contrast to meet WCAG AA standards',
      'missing-lang': 'Add lang attribute to HTML element',
      // Add more static fixes...
    };
    return fixes[issue.code] || 'Review and fix the issue manually';
  }

  getStaticRationale(issue) {
    // Predefined rationales for common issues
    const rationales = {
      'missing-alt': 'Screen readers require alt text to convey image content to users',
      'contrast-ratio': 'Sufficient color contrast is essential for readability',
      'missing-lang': 'Language declaration helps screen readers use correct pronunciation',
      // Add more rationales...
    };
    return rationales[issue.code] || 'This improvement will help meet web standards';
  }

  calculateMetrics(analysis) {
    const weights = {
      critical: 1,
      high: 0.7,
      medium: 0.4,
      low: 0.2,
    };

    // Calculate normalized scores (0-100) for each category
    const totalIssues = analysis.issues.length || 1;
    
    Object.keys(analysis.metrics).forEach(metric => {
      const metricIssues = analysis.issues.filter(i => i.category === metric);
      const weightedSum = metricIssues.reduce((sum, issue) => 
        sum + weights[issue.severity.toLowerCase()], 0);
      
      analysis.metrics[metric] = Math.max(0, 100 - (weightedSum / totalIssues * 100));
    });
  }
}

module.exports = new AIService();
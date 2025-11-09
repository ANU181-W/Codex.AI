// Basic analyzer implementations
const RULES = require('./ruleDictionary');

// helpers to compute line/column from a substring index
function positionAt(text, index) {
  const lines = text.slice(0, index).split(/\n/);
  const line = lines.length; // 1-based
  const column = lines[lines.length - 1].length + 1; // 1-based
  return { line, column };
}

function makeIssue({ code, category, severity, message, title, index, content }) {
  const dict = RULES[code] || {};
  const pos = typeof index === 'number' && index >= 0 ? positionAt(content, index) : { line: undefined, column: undefined };
  return {
    code,
    category,
    severity,
    title: title || dict.title || undefined,
    message: message || dict.message || undefined,
    line: pos.line,
    column: pos.column,
  };
}
const analyzeAccessibility = async (content, type) => {
  const issues = [];
  
  if (type.toLowerCase() === 'html' || type.toLowerCase() === 'jsx' || type.toLowerCase() === 'tsx') {
    // Check for missing alt attributes on images
    if (content.includes('<img') && !content.includes('alt=')) {
      const idx = content.indexOf('<img');
      issues.push(makeIssue({ code: 'missing-alt', category: 'accessibility', severity: 'high', content, index: Math.max(0, idx) }));
    }
    
    // Check for semantic HTML elements
    if (!content.includes('<nav') && !content.includes('<main') && !content.includes('<header')) {
      const idx = content.indexOf('<html');
      issues.push(makeIssue({ code: 'semantic-html', category: 'accessibility', severity: 'medium', content, index: Math.max(0, idx) }));
    }

    // Empty alt attribute on likely informative images (no role=presentation/aria-hidden)
    const imgTags = content.match(/<img[^>]*>/gi) || [];
    imgTags.forEach((tag) => {
      const hasEmptyAlt = /\salt\s*=\s*(["'])\s*\1/i.test(tag);
      const decorative = /role\s*=\s*(["'])presentation\1/i.test(tag) || /aria-hidden\s*=\s*"?true"?/i.test(tag);
      if (hasEmptyAlt && !decorative) {
        const idx = content.indexOf(tag);
        issues.push(makeIssue({ code: 'empty-alt', category: 'accessibility', severity: 'high', content, index: Math.max(0, idx) }));
      }
    });

    // Heading order check (detect large skips e.g., h1 -> h3)
    const headingMatches = Array.from(content.matchAll(/<(h[1-6])\b[^>]*>/gi)).map(m => parseInt(m[1].replace('h',''), 10));
    for (let i = 1; i < headingMatches.length; i++) {
      if (headingMatches[i] - headingMatches[i-1] > 1) {
        const idx = content.indexOf('<' + 'h' + headingMatches[i]);
        issues.push(makeIssue({ code: 'heading-order', category: 'accessibility', severity: 'medium', content, index: Math.max(0, idx) }));
        break;
      }
    }
  }
  
  return issues;
};

const analyzeSecurity = async (content, type) => {
  const issues = [];
  
  // Check for potentially unsafe inline scripts
  const jsProtoIdx = content.indexOf('javascript:');
  if (jsProtoIdx !== -1) {
    issues.push(makeIssue({ code: 'unsafe-inline', category: 'security', severity: 'critical', content, index: jsProtoIdx }));
  }
  
  // Check for innerHTML usage (React)
  if (content.includes('dangerouslySetInnerHTML')) {
    issues.push({
      severity: 'high',
      category: 'security',
      message: 'Use of dangerouslySetInnerHTML may lead to XSS vulnerabilities',
      code: 'dangerous-html'
    });
  }

  // <a target="_blank"> without rel="noopener noreferrer"
  if (/(<a[^>]*target\s*=\s*["']?_blank["']?[^>]*>)/i.test(content)) {
    const anchors = content.match(/<a[^>]*target\s*=\s*["']?_blank["']?[^>]*>/gi) || [];
    anchors.forEach(a => {
      if (!/rel\s*=\s*["'][^"']*(noopener|noreferrer)[^"']*["']/i.test(a)) {
        const idx = content.indexOf(a);
        issues.push(makeIssue({ code: 'target-blank-no-rel', category: 'security', severity: 'medium', content, index: Math.max(0, idx) }));
      }
    });
  }

  // Inline <script> blocks (not minified/sanitized)
  const scriptBlocks = content.match(/<script\b[\s\S]*?>[\s\S]*?<\/script>/gi) || [];
  if (scriptBlocks.some(s => /<script(?![^>]*src=)/i.test(s))) {
    const idx = content.indexOf('<script');
    issues.push(makeIssue({ code: 'inline-script', category: 'security', severity: 'high', content, index: Math.max(0, idx) }));
  }
  
  return issues;
};

const analyzeSEO = async (content, type) => {
  const issues = [];
  
  if (type.toLowerCase() === 'html' || type.toLowerCase() === 'jsx' || type.toLowerCase() === 'tsx') {
    // Check for missing meta description
    if (!content.toLowerCase().includes('<meta name="description"')) {
      const idx = content.toLowerCase().indexOf('<head');
      issues.push(makeIssue({ code: 'missing-meta-desc', category: 'seo', severity: 'medium', content, index: Math.max(0, idx) }));
    }
    
    // Check for heading hierarchy
    if (!content.includes('<h1') && (content.includes('<h2') || content.includes('<h3'))) {
      const idx = content.indexOf('<h2') !== -1 ? content.indexOf('<h2') : content.indexOf('<h3');
      issues.push(makeIssue({ code: 'missing-h1', category: 'seo', severity: 'medium', content, index: Math.max(0, idx) }));
    }

    // Title tag presence and duplicates
    const titleMatches = content.match(/<title[\s\S]*?>[\s\S]*?<\/title>/gi) || [];
    if (titleMatches.length === 0) {
      const idx = content.toLowerCase().indexOf('<head');
      issues.push(makeIssue({ code: 'missing-title', category: 'seo', severity: 'medium', content, index: Math.max(0, idx) }));
    } else if (titleMatches.length > 1) {
      const idx = content.toLowerCase().indexOf('<title');
      issues.push(makeIssue({ code: 'duplicate-title', category: 'seo', severity: 'medium', content, index: Math.max(0, idx) }));
    }

    // Canonical link: present and absolute
    const canonicalMatch = content.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
    if (!canonicalMatch) {
      const idx = content.toLowerCase().indexOf('<head');
      issues.push(makeIssue({ code: 'missing-canonical', category: 'seo', severity: 'low', content, index: Math.max(0, idx) }));
    } else {
      const hrefMatch = canonicalMatch[0].match(/href=["']([^"']+)["']/i);
      const href = hrefMatch ? hrefMatch[1] : '';
      if (href && !/^https?:\/\//i.test(href)) {
        const idx = content.indexOf(canonicalMatch[0]);
        issues.push(makeIssue({ code: 'relative-canonical', category: 'seo', severity: 'low', content, index: Math.max(0, idx) }));
      }
    }
  }
  
  return issues;
};

const analyzePerformance = async (content, type) => {
  const issues = [];
  const BASE64_SIZE_THRESHOLD = parseInt(process.env.PERF_BASE64_THRESHOLD || '500', 10); // chars in base64 payload
  const INLINE_BLOCK_MINLEN = parseInt(process.env.PERF_INLINE_BLOCK_MINLEN || '200', 10);
  
  if (type.toLowerCase() === 'css' || type.toLowerCase() === 'scss') {
    // Check for * selector usage
    if (content.includes('*{') || content.includes('* {')) {
      issues.push({
        severity: 'medium',
        category: 'performance',
        message: 'Universal selector (*) may impact performance',
        code: 'universal-selector'
      });
    }
  }
  
  // Check for large inline assets
  if (content.includes('data:image/') || content.includes('data:font/')) {
    const idx = Math.max(content.indexOf('data:image/'), content.indexOf('data:font/'));
    issues.push(makeIssue({ code: 'inline-assets', category: 'performance', severity: 'medium', content, index: Math.max(0, idx) }));
  }

  // Very large base64 images embedded
  const base64Pattern = new RegExp(`data:image\\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]{${BASE64_SIZE_THRESHOLD},}`);
  if (base64Pattern.test(content)) {
    const idx = content.search(/data:image\/[a-zA-Z+]+;base64/);
    issues.push(makeIssue({ code: 'large-base64-image', category: 'performance', severity: 'high', content, index: Math.max(0, idx) }));
  }

  // Non-minified inline CSS/JS: presence of <style> or <script> with lots of whitespace/newlines
  const styleBlocks = content.match(/<style\b[\s\S]*?>[\s\S]*?<\/style>/gi) || [];
  const scriptBlocksHere = content.match(/<script\b[\s\S]*?>[\s\S]*?<\/script>/gi) || [];
  const hasVerboseStyle = styleBlocks.some(s => s.length > INLINE_BLOCK_MINLEN && /\n\s{2,}/.test(s));
  const hasVerboseScript = scriptBlocksHere.some(s => s.length > INLINE_BLOCK_MINLEN && /\n\s{2,}/.test(s));
  if (hasVerboseStyle || hasVerboseScript) {
    const idx = hasVerboseStyle ? content.indexOf('<style') : content.indexOf('<script');
    issues.push(makeIssue({ code: 'non-minified-inline', category: 'performance', severity: 'low', content, index: Math.max(0, idx) }));
  }
  
  return issues;
};

const analyzeI18n = async (content, type) => {
  const issues = [];
  
  if (type.toLowerCase() === 'html' || type.toLowerCase() === 'jsx' || type.toLowerCase() === 'tsx') {
    // Check for hardcoded text
    const hardcodedTextPattern = />[\w\s]+</g;
    if (content.match(hardcodedTextPattern)) {
      issues.push({
        severity: 'medium',
        category: 'i18n',
        message: 'Consider extracting hardcoded text for internationalization',
        code: 'hardcoded-text'
      });
    }
  }
  
  return issues;
};

const validateDesignSystem = async (content, type) => {
  const issues = [];
  
  if (type.toLowerCase() === 'css' || type.toLowerCase() === 'scss') {
    // Check for hardcoded colors
    const colorPattern = /#[a-fA-F0-9]{3,6}|rgb\(|rgba\(/g;
    if (content.match(colorPattern)) {
      issues.push({
        severity: 'low',
        category: 'design',
        message: 'Use design system color tokens instead of hardcoded values',
        code: 'hardcoded-colors'
      });
    }
  }
  // HTML/JSX inline styles
  if (type.toLowerCase() === 'html' || type.toLowerCase() === 'jsx' || type.toLowerCase() === 'tsx') {
    const inlineStylePattern = /style\s*=\s*"[^"]+"|style\s*=\s*'[^']+'/gi;
    if (content.match(inlineStylePattern)) {
      const idx = content.search(inlineStylePattern);
      issues.push(makeIssue({ code: 'inline-styles', category: 'design', severity: 'medium', content, index: Math.max(0, idx) }));
    }
  }
  
  return issues;
};

// Structural HTML checks
const analyzeStructure = async (content, type) => {
  const issues = [];
  const t = type.toLowerCase();
  if (t === 'html' || t === 'jsx' || t === 'tsx') {
    // Invalid nesting: block inside inline (simple heuristic for <span> containing block elements)
    const badNestingPattern = /<span[^>]*>[\s\S]*?<\s*(div|section|article|header|footer|nav)[^>]*>[\s\S]*?<\/(div|section|article|header|footer|nav)>[\s\S]*?<\/span>/i;
    if (badNestingPattern.test(content)) {
      const idx = content.search(badNestingPattern);
      issues.push(makeIssue({ code: 'invalid-nesting', category: 'structure', severity: 'medium', content, index: Math.max(0, idx) }));
    }
  }
  return issues;
};

// Additional accessibility and performance heuristics commonly evaluated
const analyzeAdditionalHTMLHeuristics = async (content, type) => {
  const issues = [];
  const t = type.toLowerCase();
  if (t === 'html' || t === 'jsx' || t === 'tsx') {
    // Missing lang attribute on <html>
    const htmlTag = content.match(/<html[^>]*>/i);
    if (htmlTag && !/\slang=\s*["'][a-zA-Z-]+["']/i.test(htmlTag[0])) {
      const idx = content.indexOf(htmlTag[0]);
      issues.push(makeIssue({ code: 'missing-lang', category: 'accessibility', severity: 'high', content, index: Math.max(0, idx) }));
    }

    // Form controls missing labels (very rough heuristic for inputs without aria-label/label)
    const inputPattern = /<input[^>]*>/gi;
    const inputs = content.match(inputPattern) || [];
    inputs.forEach((inp) => {
      if (!/(aria-label|aria-labelledby|id)\s*=/.test(inp)) {
        const idx = content.indexOf(inp);
        issues.push(makeIssue({ code: 'missing-form-label', category: 'accessibility', severity: 'high', content, index: Math.max(0, idx) }));
      }
    });

    // Images missing loading="lazy"
    const imgPattern = /<img[^>]*>/gi;
    const imgs = content.match(imgPattern) || [];
    imgs.forEach((img) => {
      if (!/\sloading=/.test(img)) {
        const idx = content.indexOf(img);
        issues.push(makeIssue({ code: 'missing-lazy-loading', category: 'performance', severity: 'medium', content, index: Math.max(0, idx) }));
      }
    });
  }
  return issues;
};

module.exports = {
  analyzeAccessibility,
  analyzeSecurity,
  analyzeSEO,
  analyzePerformance,
  analyzeI18n,
  validateDesignSystem,
  analyzeStructure,
  analyzeAdditionalHTMLHeuristics
};
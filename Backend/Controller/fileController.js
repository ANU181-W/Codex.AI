const prisma = require('../utils/prisma');
const fileParserService = require('../services/fileParser.service');

// In-memory fallback store
const inMemoryFiles = [];

const usePrisma = () => !!(prisma && prisma.file);

const aiService = require('../services/ai.service');
const { redactSensitiveInfo } = require('../utils/security');
const path = require('path');

exports.uploadFiles = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const files = Array.isArray(req.files) ? req.files : [req.files];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }
    
    if (files.length > 200) {
      return res.status(400).json({ error: 'Maximum 200 files allowed per project' });
    }
    
    const uploadedFiles = [];
    // Allow .css, .tsx, .ts, .html, .js (and keep jsx/scss)
    const supportedExtensions = ['.html', '.jsx', '.tsx', '.ts', '.js', '.css', '.scss'];

    const mapSeverity = (sev) => {
      const s = String(sev || '').toUpperCase();
      switch (s) {
        case 'CRITICAL':
        case 'HIGH':
        case 'MEDIUM':
        case 'LOW':
        case 'INFO':
          return s;
        default:
          return 'LOW';
      }
    };

    const mapCategory = (cat) => {
      const c = String(cat || '').toLowerCase();
      if (c === 'accessibility' || c === 'a11y') return 'ACCESSIBILITY';
      if (c === 'security') return 'SECURITY';
      if (c === 'performance') return 'PERFORMANCE';
      if (c === 'seo') return 'SEO';
      if (c === 'i18n' || c === 'internationalization') return 'I18N';
      if (c === 'design' || c === 'design-system' || c === 'css') return 'DESIGN_SYSTEM';
      if (c === 'best-practices' || c === 'best_practices' || c === 'best_practice') return 'BEST_PRACTICE';
      if (c === 'typescript' || c === 'ts' || c === 'js' || c === 'jsx' || c === 'tsx' || c === 'structure' || c === 'structural') return 'STRUCTURAL';
      return 'BEST_PRACTICE';
    };
    
    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!supportedExtensions.includes(ext)) {
        continue; // Skip unsupported files
      }
      
      // Redact sensitive information before processing
      const content = redactSensitiveInfo(file.buffer.toString());
      
      const parsedFile = await fileParserService.parseFile({
        content,
        type: ext.slice(1).toUpperCase(),
      });
      
      // Get initial analysis from AI
      const analysis = await aiService.analyzeCode({
        content,
        type: ext.slice(1),
        filename: file.originalname,
      });
      
      const mapFileTypeForPrisma = (t) => {
        // Prisma FileType enum does not include JS/TS; map to closest buckets used by scanner
        if (t === 'JS') return 'JSX';
        if (t === 'TS') return 'TSX';
        return t;
      };

      const fileData = {
        projectId,
        filename: file.originalname,
        path: file.originalname,
        type: mapFileTypeForPrisma(parsedFile.type),
        content,
        hash: parsedFile.hash,
        size: file.size,
        encoding: 'utf-8'
      };
      
      if (usePrisma()) {
        // Try to create the file. If a file with same projectId+path exists, update it instead.
        let savedFile;
        try {
          console.log(`Creating file record for project=${fileData.projectId} path=${fileData.path}`);
          savedFile = await prisma.file.create({ data: fileData });
          console.log(`File created id=${savedFile.id}`);
        } catch (err) {
          // Handle unique constraint on (projectId, path)
          if (err && err.code === 'P2002' && err.meta && err.meta.target && err.meta.target.includes('files_project_id_path_key')) {
            console.log(`Duplicate file detected for project=${fileData.projectId} path=${fileData.path}, attempting update`);
            // find existing file by the composite unique (projectId, path)
            const existing = await prisma.file.findUnique({
              where: { projectId_path: { projectId: fileData.projectId, path: fileData.path } }
            });

            if (existing) {
              // update file content/hash/size
              console.log(`Updating existing file id=${existing.id}`);
              savedFile = await prisma.file.update({
                where: { id: existing.id },
                data: {
                  content: fileData.content,
                  hash: fileData.hash,
                  size: fileData.size,
                  encoding: fileData.encoding
                }
              });

              // remove old issues for this file so we can recreate fresh ones
              console.log(`Deleting old issues for file id=${savedFile.id}`);
              await prisma.issue.deleteMany({ where: { fileId: savedFile.id } });
            } else {
              // rethrow if we couldn't resolve the conflict
              console.error('P2002 occurred but existing file not found:', err);
              throw err;
            }
          } else {
            console.error('Unexpected error creating file:', err);
            throw err;
          }
        }

        // Then create any issues found during analysis (fresh set)
        let createdIssues = []
        if (analysis.issues && analysis.issues.length > 0) {
          console.log(`Creating ${analysis.issues.length} issues for file id=${savedFile.id}`);
          createdIssues = await Promise.all(analysis.issues.map(issue => 
            prisma.issue.create({
              data: {
                fileId: savedFile.id,
                category: mapCategory(issue.category),
                severity: mapSeverity(issue.severity),
                title: issue.title || issue.message || 'Issue',
                message: issue.message || issue.title || '',
                line: issue.line,
                column: issue.column,
                code: issue.code,
                rule: issue.rule,
                status: 'OPEN'
              }
            })
          ));

          // Create AI-generated Fix records when suggestions are present
          const suggestions = Array.isArray(analysis.suggestions) ? analysis.suggestions : []
          if (suggestions.length > 0) {
            const byCategory = suggestions.reduce((acc, s) => {
              const key = String(s.category || '').toUpperCase()
              if (!acc[key]) acc[key] = []
              acc[key].push(s)
              return acc
            }, {})
            await Promise.all(createdIssues.map((iss) => {
              const cat = iss.category // already Prisma enum
              const pool = byCategory[cat] || byCategory[cat?.toUpperCase?.() || ''] || []
              const picked = pool.length ? pool.shift() : null
              if (!picked) return Promise.resolve()
              const generatedContent = picked.example || (Array.isArray(picked.changes) ? picked.changes.join('\n') : null)
              const rationale = picked.rationale || picked.description || ''
              if (!generatedContent && !rationale) return Promise.resolve()
              return prisma.fix.create({
                data: {
                  issueId: iss.id,
                  patchDiff: generatedContent ? `--- before\n+++ after\n${generatedContent}` : '',
                  rationale,
                  aiGenerated: true,
                  aiModel: analysis?.aiMeta?.model || null,
                  generatedContent,
                  confidence: analysis?.aiMeta?.usage ? 0.8 : 0.7,
                  applied: false,
                }
              })
            }))
          }
        } else {
          console.log(`No issues to create for file id=${savedFile.id}`);
        }

        // Get the file with its issues
        const fileWithIssues = await prisma.file.findUnique({
          where: { id: savedFile.id },
          include: { issues: true }
        });

        console.log(`Completed processing for file id=${savedFile.id}`);
        // Attach analysis/AI metadata to the response object (not persisted to DB)
        uploadedFiles.push({
          ...fileWithIssues,
          analysis: analysis || null,
          aiRaw: (analysis && analysis.aiRaw) || null,
          aiMeta: (analysis && analysis.aiMeta) || null
        });
      } else {
        const newFile = {
          id: String(Date.now() + Math.random()),
          ...fileData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        inMemoryFiles.push(newFile);
        uploadedFiles.push({
          ...newFile,
          analysis: analysis || null,
          aiRaw: (analysis && analysis.aiRaw) || null,
          aiMeta: (analysis && analysis.aiMeta) || null
        });
      }
    }
    
    // Return summary of uploaded files with initial analysis
    const summary = {
      totalFiles: uploadedFiles.length,
      metrics: {
        accessibility: 100, // Start with perfect scores
        performance: 100,
        seo: 100,
        security: 100
      },
      totalIssues: 0,
      issuesBySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      },
      files: uploadedFiles.map(file => ({
        ...file,
        issues: file.issues || []
      }))
    };
    
    // Initialize metric counters
    const metricCounters = {
      accessibility: { issues: 0, files: 0 },
      performance: { issues: 0, files: 0 },
      seo: { issues: 0, files: 0 },
      security: { issues: 0, files: 0 }
    };

    // Process each file
    uploadedFiles.forEach(file => {
      if (file.issues && Array.isArray(file.issues)) {
        // Count total issues
        summary.totalIssues += file.issues.length;
        
            // Collect categories present in this file to count files affected once per category
            const categoriesInFile = new Set();
            file.issues.forEach(issue => {
              // Count by severity
              const severityKey = (issue.severity || '').toLowerCase();
              if (summary.issuesBySeverity.hasOwnProperty(severityKey)) {
                summary.issuesBySeverity[severityKey]++;
              }

              // Count issues by category for metrics
              const category = (issue.category || '').toLowerCase();
              if (metricCounters.hasOwnProperty(category)) {
                metricCounters[category].issues++;
                categoriesInFile.add(category);
              }
            });

            // For each distinct category present in this file, increment files counter once
            categoriesInFile.forEach(cat => {
              if (metricCounters.hasOwnProperty(cat)) metricCounters[cat].files++;
            });
      }
    });

    // Calculate final metrics
    Object.keys(metricCounters).forEach(category => {
      const counter = metricCounters[category];
      if (counter.files > 0) {
        // Base score 100, subtract 10 points per issue on average
        summary.metrics[category] = Math.max(0, Math.min(100, 100 - (counter.issues / counter.files) * 10));
      }
    });
    
    res.status(201).json(summary);
  } catch (err) {
    console.error('File upload failed:', err);
    res.status(500).json({ error: 'Failed to upload files' });
  }
};

exports.getFiles = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    
    if (usePrisma()) {
      const files = await prisma.file.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(files);
    }
    
    const files = inMemoryFiles
      .filter(f => f.projectId === projectId)
      .sort((a, b) => b.createdAt - a.createdAt);
    return res.json(files);
  } catch (err) {
    console.error('Failed to fetch files:', err);
    return res.status(500).json({ error: 'Failed to fetch files' });
  }
};

exports.getFileById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (usePrisma()) {
      const file = await prisma.file.findUnique({
        where: { id },
        include: {
          issues: {
            orderBy: { severity: 'desc' },
          },
        },
      });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      return res.json(file);
    }
    
    const file = inMemoryFiles.find(f => f.id === id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    return res.json({
      ...file,
      issues: []
    });
  } catch (err) {
    console.error('Failed to fetch file:', err);
    return res.status(500).json({ error: 'Failed to fetch file details' });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (usePrisma()) {
      await prisma.file.delete({
        where: { id },
      });
      return res.json({ message: 'File deleted successfully' });
    }
    
    const idx = inMemoryFiles.findIndex(f => f.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    inMemoryFiles.splice(idx, 1);
    return res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('File deletion failed:', err);
    return res.status(500).json({ error: 'Failed to delete file' });
  }
};
// Try to use Prisma if available and configured; otherwise fall back to an in-memory store
let prisma = null;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (err) {
  console.warn('Prisma client not available or not generated; using in-memory fallback.');
}

const fileParserService = require('../services/fileParser.service');
const scannerService = require('../services/scanner.service');

// In-memory fallback store
const inMemoryScanResults = [];
const inMemoryIssues = [];
const inMemoryFiles = [];

const usePrisma = () => !!(prisma && prisma.scanResult && prisma.issue);

// Helpers to normalize enum values to Prisma enums
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
  // Normalize common sources into Prisma IssueCategory
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

exports.startScan = async (req, res) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    const startTime = Date.now();
    
    // Get all project files
    let files = [];
    if (usePrisma()) {
      files = await prisma.file.findMany({
        where: { projectId },
      });
    } else {
      files = inMemoryFiles.filter(f => f.projectId === projectId);
    }
    
    let totalIssues = 0;
    const issuesBySeverity = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      INFO: 0,
    };
    
  const scanIssues = [];
    
    // Scan each file
    for (const file of files) {
      const parsedFile = await fileParserService.parseFile({
        content: file.content,
        type: file.type,
      });
      
  const issues = await scannerService.scanFile(parsedFile);
      
      // Store issues
      for (const issue of issues) {
        const issueData = {
          fileId: file.id,
          category: mapCategory(issue.category),
          severity: mapSeverity(issue.severity),
          title: issue.title || issue.message || 'Issue',
          message: issue.message || issue.title || '',
          line: issue.line,
          column: issue.column,
          code: issue.code,
          rule: issue.rule,
        };
        
        if (usePrisma()) {
          const created = await prisma.issue.create({ data: issueData });
          // Push a lightweight issue object including filename for immediate client rendering
          scanIssues.push({
            ...created,
            file: { id: file.id, filename: file.filename },
          });
        } else {
          const newIssue = {
            id: String(Date.now() + Math.random()),
            ...issueData,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          inMemoryIssues.push(newIssue);
          scanIssues.push(newIssue);
        }
        
        totalIssues++;
        const sevKey = mapSeverity(issue.severity);
        if (issuesBySeverity[sevKey] !== undefined) {
          issuesBySeverity[sevKey]++;
        }
      }
    }
    
    const scanDuration = Date.now() - startTime;
    
    // Create scan result
    const scanResultData = {
      projectId,
      totalFiles: files.length,
      totalIssues,
      criticalIssues: issuesBySeverity.CRITICAL,
      highIssues: issuesBySeverity.HIGH,
      mediumIssues: issuesBySeverity.MEDIUM,
      lowIssues: issuesBySeverity.LOW,
      infoIssues: issuesBySeverity.INFO,
      fixesGenerated: 0,
      fixesApplied: 0,
      scanDuration,
      cacheHits: 0,
      aiCallsMade: 0,
      metadata: {
        fileIds: files.map(f => f.id),
        fileNames: files.map(f => f.filename),
      },
    };
    
    let scanResult;
    if (usePrisma()) {
      scanResult = await prisma.scanResult.create({
        data: scanResultData,
      });
      // Return issues immediately for first render without requiring a follow-up fetch
      scanResult = {
        ...scanResult,
        issues: scanIssues,
        fileNames: scanResultData.metadata?.fileNames || [],
        aiSuggestions: [],
      };
    } else {
      scanResult = {
        id: String(Date.now()),
        ...scanResultData,
        createdAt: new Date(),
        updatedAt: new Date(),
        issues: scanIssues,
      };
      inMemoryScanResults.push(scanResult);
    }
    
    res.json(scanResult);
  } catch (err) {
    console.error('Scan failed:', err);
    res.status(500).json({ error: 'Failed to complete scan' });
  }
};

exports.getScanResults = async (req, res) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    
    if (usePrisma()) {
      const results = await prisma.scanResult.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
      // For each scan, fetch issues for the files snapshot if available; fallback to project-wide issues
      const enriched = [];
      for (const r of results) {
        const fileIds = r?.metadata?.fileIds;
        let issues;
        if (Array.isArray(fileIds) && fileIds.length > 0) {
          issues = await prisma.issue.findMany({ 
            where: { fileId: { in: fileIds } },
            include: { fixes: true, file: { select: { id: true, filename: true } } }
          });
        } else {
          issues = await prisma.issue.findMany({ 
            where: { file: { projectId } },
            include: { fixes: true, file: { select: { id: true, filename: true } } }
          });
        }
  let sorted = [...issues].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
        // Derive file names consistently
        let fileNames = [];
        try {
          const idsToLookup = Array.isArray(fileIds) && fileIds.length > 0
            ? fileIds
            : Array.from(new Set(sorted.map(i => i.fileId)));
          if (idsToLookup.length > 0) {
            const files = await prisma.file.findMany({
              where: { id: { in: idsToLookup } },
              select: { id: true, filename: true }
            });
            fileNames = files.map(f => f.filename);
          }
        } catch (e) {
          // non-fatal
        }
        // Build AI suggestions from fixes table
        const aiSuggestions = sorted.flatMap((iss, idx) => {
          const fixes = Array.isArray(iss.fixes) ? iss.fixes.filter(f => f.aiGenerated) : []
          return fixes.map((fx, j) => ({
            id: `${iss.id}-${j}`,
            issueId: iss.id,
            title: iss.title,
            category: String(iss.category || '').toLowerCase(),
            severity: String(iss.severity || '').toLowerCase(),
            file: iss.file?.filename || '',
            line: iss.line || null,
            original: iss.code || '',
            suggested: fx.generatedContent || fx.patchDiff || '',
            rationale: fx.rationale || '',
            confidence: fx.confidence || 0.8,
            explanation: fx.rationale || ''
          }))
        })

        // If no issues recorded yet but we have fixes, synthesize light-weight issues so UI isn't blank
        if ((!sorted || sorted.length === 0) && aiSuggestions.length > 0) {
          sorted = aiSuggestions.map((sug, k) => ({
            id: `synth-${r.id}-${k}`,
            fileId: null,
            category: sug.category?.toUpperCase?.() || 'BEST_PRACTICE',
            severity: (sug.severity || 'LOW').toUpperCase(),
            title: sug.title || 'AI Suggested Improvement',
            message: sug.rationale || sug.explanation || 'Auto-generated by AI',
            line: sug.line || null,
            column: null,
            code: sug.original || '',
            rule: null,
            file: { id: null, filename: sug.file || '' },
            fixes: []
          }))
        }
        enriched.push({ ...r, issues: sorted, fileNames, aiSuggestions });
      }
      return res.json(enriched);
    }
    
    const results = inMemoryScanResults
      .filter(s => s.projectId === projectId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(result => ({
        ...result,
        issues: inMemoryIssues.filter(i => 
          inMemoryFiles.some(f => 
            f.projectId === projectId && f.id === i.fileId
          )
        ).sort((a, b) => {
          const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        })
      }));
    
    return res.json(results);
  } catch (err) {
    console.error('Failed to fetch scan results:', err);
    res.status(500).json({ error: 'Failed to fetch scan results' });
  }
};

exports.getLatestScan = async (req, res) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    
    if (usePrisma()) {
      const result = await prisma.scanResult.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });
      
      if (!result) {
        return res.status(404).json({ error: 'No scan results found' });
      }
      // attach issues for this scan's file snapshot if present, else fallback to project issues
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
      let issues;
      const fileIds = result?.metadata?.fileIds;
      if (Array.isArray(fileIds) && fileIds.length > 0) {
        issues = await prisma.issue.findMany({ 
          where: { fileId: { in: fileIds } },
          include: { fixes: true, file: { select: { id: true, filename: true } } }
        });
      } else {
        issues = await prisma.issue.findMany({ 
          where: { file: { projectId } },
          include: { fixes: true, file: { select: { id: true, filename: true } } }
        });
      }
      const sortedIssues = issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
      let fileNames = [];
      try {
        const fileIdsSnapshot = result?.metadata?.fileIds;
        const idsToLookup = Array.isArray(fileIdsSnapshot) && fileIdsSnapshot.length > 0
          ? fileIdsSnapshot
          : Array.from(new Set(sortedIssues.map(i => i.fileId)));
        if (idsToLookup.length > 0) {
          const files = await prisma.file.findMany({
            where: { id: { in: idsToLookup } },
            select: { id: true, filename: true }
          });
            fileNames = files.map(f => f.filename);
        }
      } catch (e) {}
      // Build AI suggestions from fixes table
      const aiSuggestions = sortedIssues.flatMap((iss, idx) => {
        const fixes = Array.isArray(iss.fixes) ? iss.fixes.filter(f => f.aiGenerated) : []
        return fixes.map((fx, j) => ({
          id: `${iss.id}-${j}`,
          issueId: iss.id,
          title: iss.title,
          category: String(iss.category || '').toLowerCase(),
          severity: String(iss.severity || '').toLowerCase(),
          file: iss.file?.filename || '',
          line: iss.line || null,
          original: iss.code || '',
          suggested: fx.generatedContent || fx.patchDiff || '',
          rationale: fx.rationale || '',
          confidence: fx.confidence || 0.8,
          explanation: fx.rationale || ''
        }))
      })
      return res.json({ ...result, issues: sortedIssues, fileNames, aiSuggestions });
    }
    
    const result = inMemoryScanResults
      .filter(s => s.projectId === projectId)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    
    if (!result) {
      return res.status(404).json({ error: 'No scan results found' });
    }
    
    result.issues = inMemoryIssues
      .filter(i => 
        inMemoryFiles.some(f => 
          f.projectId === projectId && f.id === i.fileId
        )
      )
      .sort((a, b) => {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
    
    return res.json(result);
  } catch (err) {
    console.error('Failed to fetch latest scan result:', err);
    res.status(500).json({ error: 'Failed to fetch latest scan result' });
  }
};
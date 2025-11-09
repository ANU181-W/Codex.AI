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
          category: issue.category,
          severity: issue.severity,
          title: issue.title,
          message: issue.message,
          line: issue.line,
          column: issue.column,
          code: issue.code,
          rule: issue.rule,
        };
        
        if (usePrisma()) {
          await prisma.issue.create({ data: issueData });
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
        issuesBySeverity[issue.severity]++;
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
    };
    
    let scanResult;
    if (usePrisma()) {
      scanResult = await prisma.scanResult.create({
        data: scanResultData,
      });
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
      // Fetch all issues for this project's files and attach a sorted copy to each result
      const projectIssues = await prisma.issue.findMany({
        where: { file: { projectId } },
      });
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
      const sortedIssues = [...projectIssues].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
      const withIssues = results.map(r => ({ ...r, issues: sortedIssues }));
      return res.json(withIssues);
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
      // attach project issues sorted by severity
      const projectIssues = await prisma.issue.findMany({ where: { file: { projectId } } });
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
      const sortedIssues = projectIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
      return res.json({ ...result, issues: sortedIssues });
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
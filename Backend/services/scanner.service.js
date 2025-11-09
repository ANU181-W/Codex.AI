class ScannerService {
  constructor() {
    this.rulesets = {
      JS: this.getJavaScriptRules(),
      JSX: this.getJavaScriptRules(),
      TS: this.getTypeScriptRules(),
      TSX: this.getTypeScriptRules(),
      CSS: this.getCSSRules(),
      SCSS: this.getCSSRules(),
      HTML: this.getHTMLRules(),
    };
  }
  
  async scanFile(parsedFile) {
    const { type, content } = parsedFile;
    const rules = this.rulesets[type] || [];
    const issues = [];
    
    for (const rule of rules) {
      const ruleIssues = await rule.check(content);
      issues.push(...ruleIssues);
    }
    
    return issues;
  }
  
  getJavaScriptRules() {
    return [
      {
        id: 'no-console',
        severity: 'LOW',
        category: 'best-practices',
        check: async (content) => {
          const issues = [];
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            if (line.includes('console.')) {
              issues.push({
                rule: 'no-console',
                severity: 'LOW',
                category: 'best-practices',
                title: 'Console statement found',
                message: 'Avoid using console statements in production code',
                line: index + 1,
                column: line.indexOf('console.') + 1,
                code: line.trim(),
              });
            }
          });
          
          return issues;
        }
      },
      
      {
        id: 'no-debugger',
        severity: 'MEDIUM',
        category: 'best-practices',
        check: async (content) => {
          const issues = [];
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            if (line.includes('debugger')) {
              issues.push({
                rule: 'no-debugger',
                severity: 'MEDIUM',
                category: 'best-practices',
                title: 'Debugger statement found',
                message: 'Remove debugger statements before deploying',
                line: index + 1,
                column: line.indexOf('debugger') + 1,
                code: line.trim(),
              });
            }
          });
          
          return issues;
        }
      },
    ];
  }
  
  getTypeScriptRules() {
    return [
      ...this.getJavaScriptRules(),
      {
        id: 'explicit-types',
        severity: 'LOW',
        category: 'typescript',
        check: async (content) => {
          const issues = [];
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            if (line.includes(':any')) {
              issues.push({
                rule: 'explicit-types',
                severity: 'LOW',
                category: 'typescript',
                title: 'Avoid using any type',
                message: 'Explicit types are preferred over any',
                line: index + 1,
                column: line.indexOf(':any') + 1,
                code: line.trim(),
              });
            }
          });
          
          return issues;
        }
      },
    ];
  }
  
  getCSSRules() {
    return [
      {
        id: 'no-important',
        severity: 'LOW',
        category: 'css',
        check: async (content) => {
          const issues = [];
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            if (line.includes('!important')) {
              issues.push({
                rule: 'no-important',
                severity: 'LOW',
                category: 'css',
                title: '!important usage found',
                message: 'Avoid using !important as it breaks CSS specificity',
                line: index + 1,
                column: line.indexOf('!important') + 1,
                code: line.trim(),
              });
            }
          });
          
          return issues;
        }
      },
    ];
  }
  
  getHTMLRules() {
    return [
      {
        id: 'img-alt',
        severity: 'HIGH',
        category: 'accessibility',
        check: async (content) => {
          const issues = [];
          const lines = content.split('\n');
          
          lines.forEach((line, index) => {
            if (line.includes('<img') && !line.includes('alt=')) {
              issues.push({
                rule: 'img-alt',
                severity: 'HIGH',
                category: 'accessibility',
                title: 'Missing alt attribute',
                message: 'Images should have an alt attribute for accessibility',
                line: index + 1,
                column: line.indexOf('<img') + 1,
                code: line.trim(),
              });
            }
          });
          
          return issues;
        }
      },
    ];
  }
}

module.exports = new ScannerService();
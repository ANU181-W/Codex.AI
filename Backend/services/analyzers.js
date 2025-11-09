// Basic analyzer implementations
const analyzeAccessibility = async (content, type) => {
  const issues = [];
  
  if (type.toLowerCase() === 'html' || type.toLowerCase() === 'jsx' || type.toLowerCase() === 'tsx') {
    // Check for missing alt attributes on images
    if (content.includes('<img') && !content.includes('alt=')) {
      issues.push({
        severity: 'high',
        category: 'accessibility',
        message: 'Image missing alt attribute',
        code: 'missing-alt'
      });
    }
    
    // Check for semantic HTML elements
    if (!content.includes('<nav') && !content.includes('<main') && !content.includes('<header')) {
      issues.push({
        severity: 'medium',
        category: 'accessibility',
        message: 'Consider using semantic HTML elements',
        code: 'semantic-html'
      });
    }
  }
  
  return issues;
};

const analyzeSecurity = async (content, type) => {
  const issues = [];
  
  // Check for potentially unsafe inline scripts
  if (content.includes('javascript:')) {
    issues.push({
      severity: 'critical',
      category: 'security',
      message: 'Potentially unsafe inline javascript: protocol usage',
      code: 'unsafe-inline'
    });
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
  
  return issues;
};

const analyzeSEO = async (content, type) => {
  const issues = [];
  
  if (type.toLowerCase() === 'html' || type.toLowerCase() === 'jsx' || type.toLowerCase() === 'tsx') {
    // Check for missing meta description
    if (!content.toLowerCase().includes('<meta name="description"')) {
      issues.push({
        severity: 'medium',
        category: 'seo',
        message: 'Missing meta description',
        code: 'missing-meta-desc'
      });
    }
    
    // Check for heading hierarchy
    if (!content.includes('<h1') && (content.includes('<h2') || content.includes('<h3'))) {
      issues.push({
        severity: 'medium',
        category: 'seo',
        message: 'Missing H1 heading',
        code: 'missing-h1'
      });
    }
  }
  
  return issues;
};

const analyzePerformance = async (content, type) => {
  const issues = [];
  
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
    issues.push({
      severity: 'medium',
      category: 'performance',
      message: 'Large inline assets may impact load time',
      code: 'inline-assets'
    });
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
  
  return issues;
};

module.exports = {
  analyzeAccessibility,
  analyzeSecurity,
  analyzeSEO,
  analyzePerformance,
  analyzeI18n,
  validateDesignSystem
};
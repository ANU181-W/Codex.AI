const crypto = require('crypto');

class FileParserService {
  constructor() {
    this.supportedTypes = new Set(['JS', 'JSX', 'TS', 'TSX', 'CSS', 'SCSS', 'HTML', 'JSON']);
  }
  
  async parseFile({ content, type }) {
    if (!content) {
      throw new Error('File content is required');
    }
    
    // Normalize file type
    type = type.toUpperCase();
    if (!this.supportedTypes.has(type)) {
      throw new Error(`Unsupported file type: ${type}`);
    }
    
    // Generate hash for caching and comparison
    const hash = this.generateHash(content);
    
    // Basic parsing based on file type
    let parsedContent = content;
    switch (type) {
      case 'JSON':
        try {
          parsedContent = JSON.parse(content);
        } catch (err) {
          throw new Error(`Invalid JSON: ${err.message}`);
        }
        break;
      
      case 'JS':
      case 'JSX':
      case 'TS':
      case 'TSX':
        // Remove comments for consistent parsing
        parsedContent = this.removeComments(content);
        break;
      
      case 'CSS':
      case 'SCSS':
        // Remove comments and normalize whitespace
        parsedContent = this.normalizeCSS(content);
        break;
      
      case 'HTML':
        // Remove comments and normalize
        parsedContent = this.normalizeHTML(content);
        break;
    }
    
    return {
      type,
      content: parsedContent,
      hash,
      metadata: {
        lines: content.split('\n').length,
        size: Buffer.from(content).length,
        type,
      }
    };
  }
  
  generateHash(content) {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }
  
  removeComments(content) {
    // Remove multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove single-line comments
    content = content.replace(/\/\/.*/g, '');
    return content;
  }
  
  normalizeCSS(content) {
    // Remove CSS comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    // Normalize whitespace
    content = content.replace(/\s+/g, ' ').trim();
    return content;
  }
  
  normalizeHTML(content) {
    // Remove HTML comments
    content = content.replace(/<!--[\s\S]*?-->/g, '');
    // Normalize whitespace between tags
    content = content.replace(/>\s+</g, '><');
    return content;
  }
}

module.exports = new FileParserService();
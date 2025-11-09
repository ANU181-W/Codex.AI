async function analyzeSecurity(content, type) {
    const issues = [];

    try {
        if (type === 'HTML' || type === 'JSX' || type === 'TSX') {
            const securityChecks = {
                'unsafe-target-blank': {
                    regex: /<a[^>]+target=["']_blank["'][^>]*(?!rel=["'](?:noreferrer|noopener)["'])[^>]*>/g,
                    message: 'Link with target="_blank" missing rel="noreferrer noopener"',
                    severity: 'high',
                },
                'inline-script': {
                    regex: /<script>[\s\S]*?<\/script>/g,
                    message: 'Inline script detected - potential security risk',
                    severity: 'medium',
                },
                'unsafe-href': {
                    regex: /href=["']javascript:/g,
                    message: 'Unsafe javascript: URL detected',
                    severity: 'high',
                },
                'unsafe-eval': {
                    regex: /eval\(|new Function\(|setTimeout\(['"`]/g,
                    message: 'Potentially unsafe code execution detected',
                    severity: 'critical',
                },
                'innerHTML-usage': {
                    regex: /\.innerHTML\s*=/g,
                    message: 'innerHTML usage detected - potential XSS risk',
                    severity: 'medium',
                },
            };

            // Check each security pattern
            for (const [code, check] of Object.entries(securityChecks)) {
                const matches = content.matchAll(check.regex);
                for (const match of matches) {
                    issues.push({
                        code,
                        category: 'security',
                        severity: check.severity,
                        message: check.message,
                        line: content.substring(0, match.index).split('\n').length,
                        column: match.index - content.lastIndexOf('\n', match.index),
                        context: match[0],
                    });
                }
            }

            // Check for sensitive data exposure
            const sensitivePatterns = {
                'api-key': {
                    regex: /['"`](api[_-]?key|api[_-]?secret|app[_-]?secret)['"`]\s*:\s*['"`][^\s'"`]+['"`]/gi,
                    message: 'Potential API key or secret exposed',
                    severity: 'critical',
                },
                'auth-token': {
                    regex: /['"`](auth[_-]?token|access[_-]?token|jwt[_-]?token)['"`]\s*:\s*['"`][^\s'"`]+['"`]/gi,
                    message: 'Authentication token potentially exposed',
                    severity: 'critical',
                },
                'password': {
                    regex: /['"`]password['"`]\s*:\s*['"`][^\s'"`]+['"`]/gi,
                    message: 'Password value potentially exposed',
                    severity: 'critical',
                },
            };

            // Check sensitive data patterns
            for (const [code, pattern] of Object.entries(sensitivePatterns)) {
                const matches = content.matchAll(pattern.regex);
                for (const match of matches) {
                    issues.push({
                        code,
                        category: 'security',
                        severity: pattern.severity,
                        message: pattern.message,
                        line: content.substring(0, match.index).split('\n').length,
                        column: match.index - content.lastIndexOf('\n', match.index),
                        context: match[0].replace(/(['"])[^\s'"]+(['"])/, '$1[REDACTED]$2'),
                    });
                }
            }
        }

        if (type === 'CSS' || type === 'SCSS') {
            // CSS-specific security checks
            const cssSecurityChecks = {
                'css-injection': {
                    regex: /expression\s*\(|behavior\s*:|[-]moz-binding|@import\s+url/g,
                    message: 'Potentially unsafe CSS feature used',
                    severity: 'high',
                },
            };

            // Check CSS security patterns
            for (const [code, check] of Object.entries(cssSecurityChecks)) {
                const matches = content.matchAll(check.regex);
                for (const match of matches) {
                    issues.push({
                        code,
                        category: 'security',
                        severity: check.severity,
                        message: check.message,
                        line: content.substring(0, match.index).split('\n').length,
                        column: match.index - content.lastIndexOf('\n', match.index),
                        context: match[0],
                    });
                }
            }
        }

    } catch (error) {
        console.error('Security analysis error:', error);
    }

    return issues;
}

module.exports = { analyzeSecurity };
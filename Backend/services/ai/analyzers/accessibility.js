const axe = require('axe-core');

async function analyzeAccessibility(content, type) {
    const issues = [];

    try {
        if (type === 'HTML' || type === 'JSX' || type === 'TSX') {
            // Basic accessibility checks
            const patterns = {
                'missing-alt': {
                    regex: /<img[^>]+?(?!alt=)[^>]*?>/g,
                    message: 'Image missing alt text',
                    severity: 'high',
                },
                'missing-label': {
                    regex: /<(input|select|textarea)[^>]*?(?!aria-label|aria-labelledby|title)[^>]*?>/g,
                    message: 'Form control missing label or aria-label',
                    severity: 'high',
                },
                'empty-button': {
                    regex: /<button[^>]*?>(\s*)<\/button>/g,
                    message: 'Button has no content',
                    severity: 'medium',
                },
                'poor-contrast': {
                    regex: /style=["'][^"']*color:\s*#([0-9A-F]{3}|[0-9A-F]{6})/gi,
                    message: 'Potential poor color contrast - needs manual verification',
                    severity: 'medium',
                },
            };

            // Check each pattern
            for (const [code, pattern] of Object.entries(patterns)) {
                const matches = content.matchAll(pattern.regex);
                for (const match of matches) {
                    issues.push({
                        code,
                        category: 'accessibility',
                        severity: pattern.severity,
                        message: pattern.message,
                        line: content.substring(0, match.index).split('\n').length,
                        column: match.index - content.lastIndexOf('\n', match.index),
                        context: match[0],
                    });
                }
            }

            // Additional checks for WAI-ARIA usage
            const ariaChecks = {
                'invalid-role': {
                    regex: /role=["'](?!alert|alertdialog|button|checkbox|dialog|gridcell|link|log|marquee|menuitem|menuitemcheckbox|menuitemradio|option|progressbar|radio|scrollbar|searchbox|slider|spinbutton|status|tab|tabpanel|textbox|timer|tooltip|treeitem)[^"']*["']/g,
                    message: 'Invalid ARIA role',
                    severity: 'medium',
                },
                'aria-invalid': {
                    regex: /aria-[a-z]+?=["'][^"']*["']/g,
                    validate: (attr) => {
                        const valid = [
                            'aria-label', 'aria-labelledby', 'aria-describedby',
                            'aria-hidden', 'aria-expanded', 'aria-controls',
                            'aria-live', 'aria-atomic', 'aria-relevant'
                        ];
                        return valid.some(v => attr.startsWith(v));
                    },
                    message: 'Invalid ARIA attribute',
                    severity: 'medium',
                },
            };

            // Check ARIA patterns
            for (const [code, check] of Object.entries(ariaChecks)) {
                const matches = content.matchAll(check.regex);
                for (const match of matches) {
                    if (check.validate && !check.validate(match[0])) {
                        issues.push({
                            code,
                            category: 'accessibility',
                            severity: check.severity,
                            message: check.message,
                            line: content.substring(0, match.index).split('\n').length,
                            column: match.index - content.lastIndexOf('\n', match.index),
                            context: match[0],
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Accessibility analysis error:', error);
    }

    return issues;
}

module.exports = { analyzeAccessibility };
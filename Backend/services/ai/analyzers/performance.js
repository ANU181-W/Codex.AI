async function analyzePerformance(content, type) {
    const issues = [];

    try {
        if (type === 'HTML' || type === 'JSX' || type === 'TSX') {
            const performanceChecks = {
                'unoptimized-images': {
                    regex: /<img[^>]+src=["'][^"']+\.(?:jpg|jpeg|png|gif|webp)["'][^>]*(?!loading=["']lazy["'])[^>]*>/gi,
                    message: 'Image missing lazy loading attribute',
                    severity: 'medium',
                    recommendation: 'Add loading="lazy" to images below the fold',
                },
                'render-blocking-resource': {
                    regex: /<link[^>]+rel=["']stylesheet["'][^>]*(?!media=["']print["'])[^>]*>/gi,
                    message: 'Potential render-blocking stylesheet',
                    severity: 'medium',
                    recommendation: 'Consider using media queries or loading non-critical CSS asynchronously',
                },
                'inline-styles': {
                    regex: /<[^>]+style=["'][^"']+["'][^>]*>/g,
                    message: 'Inline styles detected',
                    severity: 'low',
                    recommendation: 'Move styles to external stylesheet for better caching',
                },
                'font-display': {
                    regex: /@font-face\s*{[^}]*(?!font-display:)[^}]*}/g,
                    message: 'Font-face missing font-display property',
                    severity: 'medium',
                    recommendation: 'Add font-display: swap or font-display: optional for better loading performance',
                },
            };

            // Check performance patterns
            for (const [code, check] of Object.entries(performanceChecks)) {
                const matches = content.matchAll(check.regex);
                for (const match of matches) {
                    issues.push({
                        code,
                        category: 'performance',
                        severity: check.severity,
                        message: check.message,
                        recommendation: check.recommendation,
                        line: content.substring(0, match.index).split('\n').length,
                        column: match.index - content.lastIndexOf('\n', match.index),
                        context: match[0],
                    });
                }
            }

            // Check for large scripts/inline code blocks
            const largeScriptCheck = /<script[^>]*>[\s\S]{10000,}?<\/script>/g;
            const matches = content.matchAll(largeScriptCheck);
            for (const match of matches) {
                issues.push({
                    code: 'large-script-block',
                    category: 'performance',
                    severity: 'medium',
                    message: 'Large script block detected (>10KB)',
                    recommendation: 'Consider splitting into smaller chunks and loading asynchronously',
                    line: content.substring(0, match.index).split('\n').length,
                    column: match.index - content.lastIndexOf('\n', match.index),
                    context: 'Large script block',
                });
            }
        }

        if (type === 'CSS' || type === 'SCSS') {
            const cssPerformanceChecks = {
                'expensive-selectors': {
                    regex: /[#\.][^{}\s]*[#\.][^{}\s]*/g,
                    message: 'Complex selector pattern detected',
                    severity: 'low',
                    recommendation: 'Simplify selector hierarchy for better performance',
                },
                'universal-selector': {
                    regex: /\*\s*[{,]/g,
                    message: 'Universal selector usage',
                    severity: 'low',
                    recommendation: 'Use more specific selectors to improve performance',
                },
                'expensive-properties': {
                    regex: /box-shadow|transform|filter|opacity/g,
                    message: 'Paint-expensive CSS property used',
                    severity: 'info',
                    recommendation: 'Consider will-change property for frequently animated elements',
                },
            };

            // Check CSS performance patterns
            for (const [code, check] of Object.entries(cssPerformanceChecks)) {
                const matches = content.matchAll(check.regex);
                for (const match of matches) {
                    issues.push({
                        code,
                        category: 'performance',
                        severity: check.severity,
                        message: check.message,
                        recommendation: check.recommendation,
                        line: content.substring(0, match.index).split('\n').length,
                        column: match.index - content.lastIndexOf('\n', match.index),
                        context: match[0],
                    });
                }
            }
        }

    } catch (error) {
        console.error('Performance analysis error:', error);
    }

    return issues;
}

module.exports = { analyzePerformance };
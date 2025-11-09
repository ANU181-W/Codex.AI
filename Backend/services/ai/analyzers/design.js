async function validateDesignSystem(content, type) {
    const issues = [];

    try {
        if (type === 'HTML' || type === 'JSX' || type === 'TSX' || type === 'CSS' || type === 'SCSS') {
            const designChecks = {
                // Color consistency
                'inconsistent-colors': {
                    regex: /#[0-9a-f]{3,6}|rgb\(\d+,\s*\d+,\s*\d+\)|rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)/gi,
                    validate: (matches) => {
                        const colors = new Set();
                        for (const match of matches) {
                            colors.add(match.toLowerCase());
                        }
                        if (colors.size > 10) {
                            return {
                                message: 'Too many different colors used',
                                severity: 'medium',
                                recommendation: 'Use a consistent color palette from your design system',
                            };
                        }
                        return null;
                    }
                },

                // Typography
                'inconsistent-fonts': {
                    regex: /font-family:\s*([^;]+);/g,
                    validate: (matches) => {
                        const fonts = new Set();
                        for (const match of matches) {
                            fonts.add(match.toLowerCase());
                        }
                        if (fonts.size > 3) {
                            return {
                                message: 'Too many different font families used',
                                severity: 'medium',
                                recommendation: 'Limit font families to those defined in your design system',
                            };
                        }
                        return null;
                    }
                },

                // Spacing
                'inconsistent-spacing': {
                    regex: /margin|padding|gap/g,
                    validate: (matches, content) => {
                        const spacingValues = content.match(/\d+(?:px|rem|em)/g) || [];
                        const uniqueValues = new Set(spacingValues);
                        if (uniqueValues.size > 8) {
                            return {
                                message: 'Too many different spacing values',
                                severity: 'medium',
                                recommendation: 'Use consistent spacing tokens from your design system',
                            };
                        }
                        return null;
                    }
                },

                // Component patterns
                'non-semantic-naming': {
                    regex: /class(Name)?=["']([^"']+)["']/g,
                    validate: (matches) => {
                        const nonSemanticPatterns = /(?:red|blue|green|yellow|white|black|margin|padding|center|left|right)/i;
                        const issues = [];
                        for (const match of matches) {
                            if (nonSemanticPatterns.test(match)) {
                                issues.push({
                                    message: 'Non-semantic class name detected',
                                    severity: 'low',
                                    recommendation: 'Use semantic class names that reflect component purpose rather than appearance',
                                    context: match,
                                });
                            }
                        }
                        return issues.length > 0 ? issues : null;
                    }
                },

                // Responsive design
                'hardcoded-dimensions': {
                    regex: /(?:width|height):\s*\d+px/g,
                    message: 'Hardcoded pixel dimensions found',
                    severity: 'medium',
                    recommendation: 'Use relative units or design system tokens for responsive layouts',
                },

                // Accessibility
                'design-contrast': {
                    regex: /color:\s*([^;]+);[\s\S]*?background(?:-color)?:\s*([^;]+);/g,
                    message: 'Potential contrast issues in color combination',
                    severity: 'high',
                    recommendation: 'Ensure color combinations meet WCAG contrast requirements',
                },
            };

            // Check design patterns
            for (const [code, check] of Object.entries(designChecks)) {
                const matches = content.matchAll(check.regex);
                const matchArray = [...matches];

                if (check.validate) {
                    const validationResult = check.validate(matchArray, content);
                    if (validationResult) {
                        const validationIssues = Array.isArray(validationResult) ? validationResult : [validationResult];
                        validationIssues.forEach(issue => {
                            issues.push({
                                code,
                                category: 'design',
                                ...issue,
                                line: content.substring(0, content.indexOf(issue.context || '')).split('\n').length,
                                column: content.indexOf(issue.context || '') - content.lastIndexOf('\n', content.indexOf(issue.context || '')),
                            });
                        });
                    }
                } else {
                    matchArray.forEach(match => {
                        issues.push({
                            code,
                            category: 'design',
                            severity: check.severity,
                            message: check.message,
                            recommendation: check.recommendation,
                            line: content.substring(0, match.index).split('\n').length,
                            column: match.index - content.lastIndexOf('\n', match.index),
                            context: match[0],
                        });
                    });
                }
            }
        }

    } catch (error) {
        console.error('Design system validation error:', error);
    }

    return issues;
}

module.exports = { validateDesignSystem };
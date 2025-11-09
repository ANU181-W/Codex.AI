async function analyzeSEO(content, type) {
    const issues = [];

    try {
        if (type === 'HTML' || type === 'JSX' || type === 'TSX') {
            const seoChecks = {
                'missing-title': {
                    regex: /<head>(?![\s\S]*<title>[\s\S]*<\/title>)[\s\S]*<\/head>/i,
                    message: 'Missing title tag',
                    severity: 'high',
                    recommendation: 'Add a descriptive title tag within the head section',
                },
                'missing-meta-description': {
                    regex: /<head>(?![\s\S]*<meta[^>]+name=["']description["'][^>]*>)[\s\S]*<\/head>/i,
                    message: 'Missing meta description',
                    severity: 'high',
                    recommendation: 'Add a meta description tag with relevant page description',
                },
                'empty-heading': {
                    regex: /<h[1-6][^>]*>[\s\n]*<\/h[1-6]>/g,
                    message: 'Empty heading tag detected',
                    severity: 'medium',
                    recommendation: 'Add content to the empty heading',
                },
                'missing-alt': {
                    regex: /<img[^>]+(?!alt=["'][^"']*["'])[^>]*>/g,
                    message: 'Image missing alt attribute',
                    severity: 'medium',
                    recommendation: 'Add descriptive alt text to image',
                },
                'invalid-heading-structure': {
                    regex: /<h([1-6])[^>]*>[\s\S]*?<\/h\1>/g,
                    validate: (matches, content) => {
                        const headings = [...matches].map(match => {
                            const level = parseInt(match[1]);
                            return { level, text: match[0] };
                        });
                        
                        const issues = [];
                        let lastLevel = 0;
                        
                        headings.forEach((heading, index) => {
                            if (index === 0 && heading.level !== 1) {
                                issues.push({
                                    message: 'First heading is not h1',
                                    severity: 'medium',
                                    context: heading.text,
                                });
                            } else if (heading.level - lastLevel > 1) {
                                issues.push({
                                    message: `Skipped heading level (h${lastLevel} to h${heading.level})`,
                                    severity: 'medium',
                                    context: heading.text,
                                });
                            }
                            lastLevel = heading.level;
                        });
                        
                        return issues;
                    }
                },
                'no-meta-viewport': {
                    regex: /<head>(?![\s\S]*<meta[^>]+name=["']viewport["'][^>]*>)[\s\S]*<\/head>/i,
                    message: 'Missing viewport meta tag',
                    severity: 'high',
                    recommendation: 'Add viewport meta tag for responsive design',
                },
                'broken-links': {
                    regex: /<a[^>]+href=["'](?!https?:\/\/|mailto:|tel:|#|\/)[^"']+["'][^>]*>/g,
                    message: 'Potentially broken relative link',
                    severity: 'medium',
                    recommendation: 'Verify link path is correct',
                },
                'meta-robots': {
                    regex: /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*(?:noindex|nofollow)[^"']*["'][^>]*>/i,
                    message: 'Page may be blocked from search engines',
                    severity: 'high',
                    recommendation: 'Review robots meta tag if page should be indexed',
                },
            };

            // Perform SEO checks
            for (const [code, check] of Object.entries(seoChecks)) {
                if (check.validate) {
                    const matches = content.matchAll(check.regex);
                    const validationIssues = check.validate(matches, content);
                    validationIssues.forEach(issue => {
                        issues.push({
                            code,
                            category: 'seo',
                            ...issue,
                            line: content.substring(0, content.indexOf(issue.context)).split('\n').length,
                            column: content.indexOf(issue.context) - content.lastIndexOf('\n', content.indexOf(issue.context)),
                        });
                    });
                } else {
                    const matches = content.matchAll(check.regex);
                    for (const match of matches) {
                        issues.push({
                            code,
                            category: 'seo',
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
        }

        // Schema.org structured data validation
        const schemaCheck = /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/g;
        const schemaMatches = content.matchAll(schemaCheck);
        for (const match of schemaMatches) {
            try {
                const schema = JSON.parse(match[0].replace(/<script[^>]*>|<\/script>/g, ''));
                if (!schema['@context'] || !schema['@type']) {
                    issues.push({
                        code: 'invalid-schema',
                        category: 'seo',
                        severity: 'medium',
                        message: 'Invalid or incomplete Schema.org markup',
                        recommendation: 'Ensure Schema.org markup includes @context and @type',
                        line: content.substring(0, match.index).split('\n').length,
                        column: match.index - content.lastIndexOf('\n', match.index),
                        context: match[0],
                    });
                }
            } catch (e) {
                issues.push({
                    code: 'malformed-schema',
                    category: 'seo',
                    severity: 'high',
                    message: 'Malformed JSON-LD Schema.org markup',
                    recommendation: 'Fix JSON syntax in Schema.org markup',
                    line: content.substring(0, match.index).split('\n').length,
                    column: match.index - content.lastIndexOf('\n', match.index),
                    context: match[0],
                });
            }
        }

    } catch (error) {
        console.error('SEO analysis error:', error);
    }

    return issues;
}

module.exports = { analyzeSEO };
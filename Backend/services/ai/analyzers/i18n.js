async function analyzeI18n(content, type) {
    const issues = [];

    try {
        if (type === 'HTML' || type === 'JSX' || type === 'TSX') {
            const i18nChecks = {
                'hard-coded-text': {
                    regex: />([^<>{}\n]+)</g,
                    message: 'Potentially hard-coded text found',
                    severity: 'medium',
                    recommendation: 'Consider using translation keys for internationalization',
                },
                'missing-lang-attribute': {
                    regex: /<html(?![^>]*lang=["'][a-z-]+["'])[^>]*>/i,
                    message: 'HTML element missing lang attribute',
                    severity: 'high',
                    recommendation: 'Add lang attribute to HTML element',
                },
                'dir-attribute': {
                    regex: /<html(?![^>]*dir=["'](?:ltr|rtl|auto)["'])[^>]*>/i,
                    message: 'HTML element missing dir attribute',
                    severity: 'medium',
                    recommendation: 'Add dir attribute for RTL language support',
                },
                'numeric-date': {
                    regex: /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{2,4}-\d{1,2}-\d{1,2}/g,
                    message: 'Hardcoded date format detected',
                    severity: 'medium',
                    recommendation: 'Use localized date formatting',
                },
                'currency-symbol': {
                    regex: /[\$€£¥]|USD|EUR|GBP|JPY/g,
                    message: 'Hardcoded currency symbol/code found',
                    severity: 'medium',
                    recommendation: 'Use localized currency formatting',
                },
            };

            // Check i18n patterns
            for (const [code, check] of Object.entries(i18nChecks)) {
                const matches = content.matchAll(check.regex);
                for (const match of matches) {
                    issues.push({
                        code,
                        category: 'i18n',
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

        // Check for common localization library usage
        const commonI18nLibs = [
            'react-i18next',
            'i18next',
            'vue-i18n',
            'formatjs',
            'lingui',
        ];

        const importCheck = new RegExp(`import.*?(?:${commonI18nLibs.join('|')}).*?from`, 'g');
        if (!content.match(importCheck)) {
            issues.push({
                code: 'missing-i18n-lib',
                category: 'i18n',
                severity: 'info',
                message: 'No internationalization library detected',
                recommendation: 'Consider using an i18n library for better localization support',
                line: 1,
                column: 1,
                context: 'File level',
            });
        }

    } catch (error) {
        console.error('i18n analysis error:', error);
    }

    return issues;
}

module.exports = { analyzeI18n };
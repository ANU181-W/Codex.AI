// Central rule dictionary for consistent titles/messages and export mapping
// Each entry: code -> { title, message, severityOverride?, categoryOverride? }

module.exports = {
  'missing-alt': { title: 'Missing alt attribute', message: 'Images should have an alt attribute for accessibility.' },
  'empty-alt': { title: 'Empty alt attribute on informative image', message: 'Provide descriptive alt text or mark decorative images appropriately.' },
  'semantic-html': { title: 'Lack of semantic landmarks', message: 'Consider adding semantic HTML elements like <main>, <nav>, or <header>.' },
  'heading-order': { title: 'Incorrect heading order', message: 'Avoid skipping heading levels (e.g., h1 directly to h3).' },
  'unsafe-inline': { title: 'Unsafe javascript: URL', message: 'Remove javascript: protocol usage to prevent injection.' },
  'dangerous-html': { title: 'dangerouslySetInnerHTML usage', message: 'Sanitize content or avoid dangerouslySetInnerHTML to mitigate XSS.' },
  'target-blank-no-rel': { title: 'target=_blank without rel', message: 'Add rel="noopener noreferrer" to external links opened in new tabs.' },
  'inline-script': { title: 'Inline script tag', message: 'Inline scripts can be unsafe and reduce caching. Externalize and sanitize content.' },
  'missing-meta-desc': { title: 'Missing meta description', message: 'Add a concise meta description for SEO.' },
  'missing-h1': { title: 'Missing H1 heading', message: 'Provide a single primary <h1> heading to improve structure.' },
  'missing-title': { title: 'Missing <title> tag', message: 'Add a descriptive <title> to the document head.' },
  'duplicate-title': { title: 'Duplicate <title> tags', message: 'Only one <title> tag should exist per document.' },
  'missing-canonical': { title: 'Missing canonical link', message: 'Add a canonical <link rel="canonical"> to indicate preferred URL.' },
  'relative-canonical': { title: 'Relative canonical link', message: 'Canonical link should be an absolute URL.' },
  'universal-selector': { title: 'Universal selector (*) used', message: 'Avoid * selector; it is expensive and may degrade performance.' },
  'inline-assets': { title: 'Large inline asset', message: 'Consider extracting large data URIs to external files for better caching.' },
  'large-base64-image': { title: 'Large base64 image embedded', message: 'Externalize large images; base64 inflates bundle size.' },
  'non-minified-inline': { title: 'Non-minified inline CSS/JS', message: 'Minify or externalize verbose inline styles/scripts.' },
  'hardcoded-colors': { title: 'Hardcoded color values', message: 'Use design system tokens instead of raw hex/rgb values.' },
  'inline-styles': { title: 'Inline styles in markup', message: 'Replace inline styles with class names or design tokens.' },
  'invalid-nesting': { title: 'Invalid block nesting inside inline', message: 'Avoid placing block-level elements directly inside <span>.' },
  'missing-lang': { title: 'Missing lang attribute', message: 'Add lang attribute to <html> for accessibility and i18n.' },
  'missing-form-label': { title: 'Form control missing label', message: 'Associate inputs with a label or aria attributes.' },
  'missing-lazy-loading': { title: 'Image missing loading="lazy"', message: 'Add loading="lazy" to defer offscreen image loads.' }
};

const codeAnalyzerService = {
  analyzeFiles: async (files, options, onProgress) => {
    const issues = []
    let analyzedFiles = 0

    for (const file of files) {
      const content = await file.text()
      const fileIssues = analyzeFileContent(content, file.name, options)
      issues.push(...fileIssues)

      analyzedFiles++
      onProgress(Math.round((analyzedFiles / files.length) * 100))
    }

    const score = calculateQualityScore(issues, files.length)
    return { issues, score }
  },
}

function analyzeFileContent(content, filename, options) {
  const issues = []
  const extension = filename.split(".").pop()

  // Always check JavaScript/TypeScript files for syntax errors and common mistakes
  if (extension === "js" || extension === "jsx" || extension === "ts" || extension === "tsx") {
    issues.push(...checkJavaScriptErrors(content, filename))
  }

  if (options.checkAccessibility && (extension === "html" || extension === "jsx" || extension === "tsx")) {
    issues.push(...checkAccessibility(content, filename))
  }

  if (options.checkSecurity) {
    issues.push(...checkSecurity(content, filename))
  }

  if (options.checkPerformance) {
    issues.push(...checkPerformance(content, filename))
  }

  if (options.checkSEO && extension === "html") {
    issues.push(...checkSEO(content, filename))
  }

  if (options.checkStructure) {
    issues.push(...checkStructure(content, filename))
  }

  // New: run language-specific heuristics to detect the error types requested
  issues.push(...checkLanguageSpecificErrors(content, filename, extension))

  return issues
}

function checkAccessibility(content, filename) {
  const issues = []

  // Check for missing alt text
  const imgRegex = /<img[^>]*>/g
  const imgs = content.match(imgRegex) || []
  imgs.forEach((img, idx) => {
    if (!img.includes("alt=")) {
      const lines = content.split('\n')
      const lineNumber = content.substring(0, content.indexOf(img)).split('\n').length
      const contextStart = Math.max(0, lineNumber - 2)
      const contextEnd = Math.min(lines.length, lineNumber + 2)
      const codeContext = lines.slice(contextStart, contextEnd).join('\n')
      
      issues.push({
        title: "Missing alt attribute",
        description: "Images should have alt text for accessibility",
        category: "accessibility",
        severity: "high",
        file: filename,
        line: lineNumber,
        code: img,
        codeContext: codeContext,
        suggestion: img.replace(/>/, ' alt="Descriptive text for image" />'),
        rationale: "Improves screen reader support and SEO",
      })
    }
  })

  // Check for buttons without text
  if (content.includes("<button>") || content.includes("<button ")) {
    const buttonRegex = /<button[^>]*>\s*<\/button>/g
    const matches = content.match(buttonRegex)
    if (matches && matches.length > 0) {
      matches.forEach((match) => {
        const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length
        const lines = content.split('\n')
        const contextStart = Math.max(0, lineNumber - 2)
        const contextEnd = Math.min(lines.length, lineNumber + 2)
        const codeContext = lines.slice(contextStart, contextEnd).join('\n')
        
        issues.push({
          title: "Empty button element",
          description: "Buttons should have descriptive text or aria-label",
          category: "accessibility",
          severity: "high",
          file: filename,
          line: lineNumber,
          code: match,
          codeContext: codeContext,
          suggestion: match.replace('</button>', 'aria-label="Action description">Button Label</button>'),
          rationale: "Ensures button purpose is clear to screen readers",
        })
      })
    }
  }

  // Check for missing lang attribute
  if (content.includes("<html") && !content.includes("lang=")) {
    const htmlMatch = content.match(/<html[^>]*>/)
    if (htmlMatch) {
      const lineNumber = content.substring(0, content.indexOf(htmlMatch[0])).split('\n').length
      const lines = content.split('\n')
      const contextStart = Math.max(0, lineNumber - 1)
      const contextEnd = Math.min(lines.length, lineNumber + 3)
      const codeContext = lines.slice(contextStart, contextEnd).join('\n')
      
      issues.push({
        title: "Missing lang attribute",
        description: "HTML element should have a lang attribute",
        category: "accessibility",
        severity: "medium",
        file: filename,
        line: lineNumber,
        code: htmlMatch[0],
        codeContext: codeContext,
        suggestion: htmlMatch[0].replace(/>/, ' lang="en">'),
        rationale: "Helps screen readers and search engines understand document language",
      })
    }
  }

  return issues
}

function checkSecurity(content, filename) {
  const issues = []

  // Check for target="_blank" without rel
  const blankTargetRegex = /<a[^>]*target="_blank"[^>]*(?!.*rel=)[^>]*>/g
  const blankMatches = content.match(blankTargetRegex)
  if (blankMatches && blankMatches.length > 0) {
    blankMatches.forEach((match) => {
      const lineNumber = content.substring(0, content.indexOf(match)).split('\n').length
      const lines = content.split('\n')
      const contextStart = Math.max(0, lineNumber - 2)
      const contextEnd = Math.min(lines.length, lineNumber + 2)
      const codeContext = lines.slice(contextStart, contextEnd).join('\n')
      
      issues.push({
        title: 'Unsafe target="_blank" usage',
        description: 'Links with target="_blank" should have rel="noopener noreferrer"',
        category: "security",
        severity: "high",
        file: filename,
        line: lineNumber,
        code: match,
        codeContext: codeContext,
        suggestion: match.replace(/>/, ' rel="noopener noreferrer">'),
        rationale: "Prevents malicious websites from accessing window object",
      })
    })
  }

  // Check for inline scripts
  const inlineScriptRegex = /<script[^>]*>[^<]*<\/script>/g
  if (inlineScriptRegex.test(content)) {
    issues.push({
      title: "Inline script usage",
      description: "Avoid inline scripts for better security",
      category: "security",
      severity: "medium",
      file: filename,
      code: '<script>console.log("inline")</script>',
      suggestion: "Move to external file",
      rationale: "Content Security Policy (CSP) compliance",
    })
  }

  return issues
}

function checkPerformance(content, filename) {
  const issues = []

  // Check for large unoptimized images
  if (content.includes("<img") && content.length > 100000) {
    issues.push({
      title: "Large file size",
      description: "Consider optimizing images and minifying code",
      category: "performance",
      severity: "medium",
      file: filename,
      code: "Large file detected",
      suggestion: "Optimize images, use lazy loading, minify code",
      rationale: "Improves page load time and Core Web Vitals",
    })
  }

  // Check for missing lazy loading
  const imgCount = (content.match(/<img/g) || []).length
  if (imgCount > 3 && !content.includes('loading="lazy"')) {
    issues.push({
      title: "Missing lazy loading",
      description: "Images should use lazy loading for performance",
      category: "performance",
      severity: "low",
      file: filename,
      code: '<img src="..." />',
      suggestion: '<img src="..." loading="lazy" />',
      rationale: "Reduces initial page load time",
    })
  }

  return issues
}

function checkSEO(content, filename) {
  const issues = []

  // Check for missing meta description
  if (!content.includes('meta name="description"')) {
    issues.push({
      title: "Missing meta description",
      description: "Add a meta description for better SEO",
      category: "seo",
      severity: "medium",
      file: filename,
      code: "<head>...",
      suggestion: '<meta name="description" content="Page description" />',
      rationale: "Improves search engine rankings and click-through rate",
    })
  }

  // Check for missing title
  if (!content.includes("<title>")) {
    issues.push({
      title: "Missing page title",
      description: "Every page should have a unique title",
      category: "seo",
      severity: "high",
      file: filename,
      code: "<head>...</head>",
      suggestion: "<title>Page Title - Website</title>",
      rationale: "Essential for SEO and user experience",
    })
  }

  // Check for missing h1
  if (!content.includes("<h1>")) {
    issues.push({
      title: "Missing h1 heading",
      description: "Page should have exactly one h1 element",
      category: "seo",
      severity: "high",
      file: filename,
      code: "No h1 found",
      suggestion: "<h1>Page Main Heading</h1>",
      rationale: "Critical for page structure and SEO",
    })
  }

  return issues
}

function checkJavaScriptErrors(content, filename) {
  const issues = []
  const lines = content.split('\n')

  // Common typos in built-in functions
  const commonTypos = {
    'consoole': 'console',
    'consol': 'console',
    'consloe': 'console',
    'getelementByUserName': 'getElementById',
    'getelementbyid': 'getElementById',
    'getelementbyclassname': 'getElementsByClassName',
    'getelementbytagname': 'getElementsByTagName',
    'getelementbyusername': 'getElementById',
    'queryseletor': 'querySelector',
    'queryseletorall': 'querySelectorAll',
    'addeventlistner': 'addEventListener',
    'removeeventlistner': 'removeEventListener',
    'getattribut': 'getAttribute',
    'setattribut': 'setAttribute',
    'innerhtml': 'innerHTML',
    'textcontent': 'textContent',
    'classlist': 'classList',
    'appendchild': 'appendChild',
    'removechild': 'removeChild',
    'createelement': 'createElement',
  }

  // Check for typos in console methods - check the whole word
  const consoleTypoPatterns = [
    { pattern: /\bconsoole\b/gi, correct: 'console', typo: 'consoole' },
    { pattern: /\bconsol\b(?!e)/gi, correct: 'console', typo: 'consol' },
    { pattern: /\bconsloe\b/gi, correct: 'console', typo: 'consloe' },
  ]
  
  consoleTypoPatterns.forEach(({ pattern, correct, typo }) => {
    const matches = content.matchAll(pattern)
    for (const match of matches) {
      const lineNumber = content.substring(0, match.index).split('\n').length
      const line = lines[lineNumber - 1] || ''
      const contextStart = Math.max(0, lineNumber - 2)
      const contextEnd = Math.min(lines.length, lineNumber + 2)
      const codeContext = lines.slice(contextStart, contextEnd).join('\n')
      
      issues.push({
        title: `Typo in console: "${typo}"`,
        description: `Found "${match[0]}" - did you mean "${correct}"?`,
        category: "structure",
        severity: "critical",
        file: filename,
        line: lineNumber,
        code: line.trim(),
        codeContext: codeContext,
        suggestion: line.replace(new RegExp(typo, 'gi'), 'console'),
        rationale: "This will cause a runtime error. 'console' is the correct spelling.",
      })
    }
  })

  // Check for invalid document methods - be more flexible with patterns
  const invalidDocumentMethods = [
    { pattern: /document\.getelementByUserName\s*\(/gi, correct: 'document.getElementById(', description: 'Invalid method getelementByUserName', suggestion: 'document.getElementById()' },
    { pattern: /document\.getelementbyid\s*\(/gi, correct: 'document.getElementById(', description: 'Case-sensitive: should be getElementById' },
    { pattern: /document\.getelementbyclassname\s*\(/gi, correct: 'document.getElementsByClassName(', description: 'Case-sensitive: should be getElementsByClassName' },
    { pattern: /document\.getelementbytagname\s*\(/gi, correct: 'document.getElementsByTagName(', description: 'Case-sensitive: should be getElementsByTagName' },
    { pattern: /document\.getelementbyusername\s*\(/gi, correct: 'document.getElementById(', description: 'Invalid method getelementbyusername', suggestion: 'document.getElementById()' },
    { pattern: /document\.queryseletor\s*\(/gi, correct: 'document.querySelector(', description: 'Typo: should be querySelector' },
    { pattern: /document\.queryseletorall\s*\(/gi, correct: 'document.querySelectorAll(', description: 'Typo: should be querySelectorAll' },
  ]

  invalidDocumentMethods.forEach(({ pattern, correct, description, suggestion: customSuggestion }) => {
    const matches = content.matchAll(pattern)
    for (const match of matches) {
      const lineNumber = content.substring(0, match.index).split('\n').length
      const line = lines[lineNumber - 1] || ''
      const contextStart = Math.max(0, lineNumber - 2)
      const contextEnd = Math.min(lines.length, lineNumber + 2)
      const codeContext = lines.slice(contextStart, contextEnd).join('\n')
      
      // Try to replace the pattern, but if it fails, use custom suggestion
      let fixedLine = line
      try {
        fixedLine = line.replace(pattern, correct)
      } catch (e) {
        fixedLine = customSuggestion || line.replace(match[0], correct)
      }
      
      issues.push({
        title: description,
        description: `Found invalid method call. JavaScript is case-sensitive.`,
        category: "structure",
        severity: "critical",
        file: filename,
        line: lineNumber,
        code: line.trim(),
        codeContext: codeContext,
        suggestion: fixedLine || customSuggestion || correct,
        rationale: "This will cause a runtime error. JavaScript method names are case-sensitive.",
      })
    }
  })

  // Check for common JavaScript syntax errors
  // Missing semicolons (optional but good practice)
  const missingSemicolonRegex = /(console\.log|document\.|window\.|const |let |var |return |break |continue )([^;}\n]*)\n/g
  // This is less strict - we'll focus on critical errors

  // Check for undefined variables that look like typos
  const commonVariables = ['document', 'window', 'console', 'localStorage', 'sessionStorage', 'navigator']
  const variableTypoPattern = /\b(documet|windw|consol|localStorag|sessionStorag|navigatr)\b/gi
  const variableMatches = content.matchAll(variableTypoPattern)
  for (const match of variableMatches) {
    const lineNumber = content.substring(0, match.index).split('\n').length
    const line = lines[lineNumber - 1] || ''
    const contextStart = Math.max(0, lineNumber - 2)
    const contextEnd = Math.min(lines.length, lineNumber + 2)
    const codeContext = lines.slice(contextStart, contextEnd).join('\n')
    
    const typo = match[1].toLowerCase()
    let correct = ''
    if (typo.includes('documet')) correct = 'document'
    else if (typo.includes('windw')) correct = 'window'
    else if (typo.includes('consol')) correct = 'console'
    else if (typo.includes('localstorag')) correct = 'localStorage'
    else if (typo.includes('sessionstorag')) correct = 'sessionStorage'
    else if (typo.includes('navigatr')) correct = 'navigator'
    
    issues.push({
      title: `Typo in variable name: "${match[1]}"`,
      description: `Did you mean "${correct}"?`,
      category: "structure",
      severity: "critical",
      file: filename,
      line: lineNumber,
      code: line.trim(),
      codeContext: codeContext,
      suggestion: line.replace(new RegExp(match[1], 'gi'), correct),
      rationale: "This will cause a ReferenceError at runtime.",
    })
  }

  // Check for common method name typos
  const methodTypos = [
    { pattern: /\.addeventlistner\s*\(/gi, correct: '.addEventListener(', name: 'addEventListener' },
    { pattern: /\.removeeventlistner\s*\(/gi, correct: '.removeEventListener(', name: 'removeEventListener' },
    { pattern: /\.getattribut\s*\(/gi, correct: '.getAttribute(', name: 'getAttribute' },
    { pattern: /\.setattribut\s*\(/gi, correct: '.setAttribute(', name: 'setAttribute' },
    { pattern: /\.innerhtml\s*=/gi, correct: '.innerHTML =', name: 'innerHTML' },
    { pattern: /\.textcontent\s*=/gi, correct: '.textContent =', name: 'textContent' },
    { pattern: /\.classlist\s*\./gi, correct: '.classList.', name: 'classList' },
    { pattern: /\.appendchild\s*\(/gi, correct: '.appendChild(', name: 'appendChild' },
    { pattern: /\.removechild\s*\(/gi, correct: '.removeChild(', name: 'removeChild' },
    { pattern: /\.createelement\s*\(/gi, correct: '.createElement(', name: 'createElement' },
  ]

  methodTypos.forEach(({ pattern, correct, name }) => {
    const matches = content.matchAll(pattern)
    for (const match of matches) {
      const lineNumber = content.substring(0, match.index).split('\n').length
      const line = lines[lineNumber - 1] || ''
      const contextStart = Math.max(0, lineNumber - 2)
      const contextEnd = Math.min(lines.length, lineNumber + 2)
      const codeContext = lines.slice(contextStart, contextEnd).join('\n')
      
      issues.push({
        title: `Typo in method name: "${name}"`,
        description: `JavaScript is case-sensitive. Found incorrect casing.`,
        category: "structure",
        severity: "critical",
        file: filename,
        line: lineNumber,
        code: line.trim(),
        codeContext: codeContext,
        suggestion: line.replace(pattern, correct),
        rationale: `This will cause a runtime error. "${name}" is the correct method name.`,
      })
    }
  })

  // Check for common syntax errors
  // Unclosed brackets
  const openBraces = (content.match(/{/g) || []).length
  const closeBraces = (content.match(/}/g) || []).length
  if (openBraces !== closeBraces) {
    issues.push({
      title: "Unclosed braces",
      description: `Found ${openBraces} opening braces but ${closeBraces} closing braces`,
      category: "structure",
      severity: "critical",
      file: filename,
      code: "Check for missing { or }",
      suggestion: "Ensure all opening braces have matching closing braces",
      rationale: "This will cause a syntax error.",
    })
  }

  const openParens = (content.match(/\(/g) || []).length
  const closeParens = (content.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    issues.push({
      title: "Unclosed parentheses",
      description: `Found ${openParens} opening parentheses but ${closeParens} closing parentheses`,
      category: "structure",
      severity: "critical",
      file: filename,
      code: "Check for missing ( or )",
      suggestion: "Ensure all opening parentheses have matching closing parentheses",
      rationale: "This will cause a syntax error.",
    })
  }

  return issues
}

function checkStructure(content, filename) {
  const issues = []

  // Check for deeply nested elements
  const depthMatch = content.match(/(?:<[^>]*>(?:[^<]*<){5,})/g)
  if (depthMatch) {
    issues.push({
      title: "Deeply nested elements",
      description: "Consider flattening your DOM structure",
      category: "structure",
      severity: "low",
      file: filename,
      code: "Deeply nested HTML detected",
      suggestion: "Refactor to reduce nesting depth",
      rationale: "Improves DOM performance and maintainability",
    })
  }

  // Check for duplicate IDs
  const idMatches = content.match(/id="([^"]+)"/g) || []
  const ids = idMatches.map((id) => id.slice(4, -1))
  const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx)
  if (duplicates.length > 0) {
    issues.push({
      title: "Duplicate ID attributes",
      description: `Found duplicate IDs: ${[...new Set(duplicates)].join(", ")}`,
      category: "structure",
      severity: "high",
      file: filename,
      code: `id="${duplicates[0]}"`,
      suggestion: `Make IDs unique or use classes instead`,
      rationale: "IDs must be unique for CSS and JavaScript selectors",
    })
  }

  return issues
}

function calculateQualityScore(issues, filesCount) {
  if (issues.length === 0) return 100

  let penaltyPoints = 0
  issues.forEach((issue) => {
    switch (issue.severity) {
      case "critical":
        penaltyPoints += 10
        break
      case "high":
        penaltyPoints += 5
        break
      case "medium":
        penaltyPoints += 2
        break
      case "low":
        penaltyPoints += 1
        break
      default:
        penaltyPoints += 1
    }
  })

  return Math.max(0, 100 - penaltyPoints)
}

// New function: lightweight heuristics for many language-specific error types requested
function checkLanguageSpecificErrors(content, filename, extension) {
  const issues = []
  const lines = content.split('\n')

  function pushIssue(props) {
    issues.push(Object.assign({
      category: "lint",
      severity: "medium",
      file: filename,
      codeContext: getContext(props.index || 0),
      line: props.line || 1,
    }, props))
  }

  function getContext(index) {
    const lineNumber = content.substring(0, index).split('\n').length
    const start = Math.max(0, lineNumber - 2)
    const end = Math.min(lines.length, lineNumber + 2)
    return lines.slice(start, end).join('\n')
  }

  // Common helpers
  const has = (rx) => rx.test(content)

  // JavaScript (.js)
  if (extension === "js") {
    // Eval usage -> EvalError
    const evalMatch = content.match(/(^|\W)eval\s*\(/)
    if (evalMatch) {
      const idx = content.indexOf("eval")
      pushIssue({
        title: "Eval usage (possible EvalError/risk)",
        description: "Using eval() can cause security issues and runtime errors.",
        severity: "high",
        index: idx,
        code: "eval(...)",
        suggestion: "Avoid eval(); use JSON.parse, Function constructors carefully, or safer parsing.",
        rationale: "Eval executes arbitrary code and is often unnecessary."
      })
    }

    // Throwing built-in errors explicitly
    ;['SyntaxError','ReferenceError','TypeError','RangeError','EvalError','URIError','ImportError'].forEach(name => {
      const rx = new RegExp(`throw\\s+new\\s+${name}\\b`, 'g')
      let m
      while ((m = rx.exec(content)) !== null) {
        pushIssue({
          title: `${name} thrown`,
          description: `The code explicitly throws ${name}. Ensure this is intended and handled.`,
          severity: "high",
          index: m.index,
          code: m[0],
          suggestion: `Consider creating/applying a clear error-handling strategy or use custom Error subclass if needed.`,
          rationale: `Explicit throws should be intentional and caught by callers.`,
        })
      }
    })

    // ReferenceError-like heuristics (undeclared global usage)
    const undeclaredRx = /\b([A-Za-z_$][\w$]*)\b/g
    const suspectNames = ['process','require','module','exports'] // heuristic
    suspectNames.forEach(name => {
      if (content.includes(name) && !content.match(new RegExp(`\\b${name}\\b`))) { /* noop */ }
    })
    // Basic heuristic: common runtime error via typeof wrong usage
    if (has(/\bundefinedVariable\b/)) { /* placeholder - no-op */ }
  }

  // TypeScript (.ts)
  if (extension === "ts") {
    // Implicit any / Missing type annotation heuristics
    const implicitAnyUsage = content.match(/\b(any)\b/g)
    if (implicitAnyUsage && implicitAnyUsage.length > 0) {
      pushIssue({
        title: "Implicit/explicit 'any' usage",
        description: "Using 'any' defeats TypeScript's safety guarantees. Consider providing a precise type.",
        severity: "medium",
        index: content.indexOf('any'),
        code: "any",
        suggestion: "Replace 'any' with a specific type or a generic type parameter.",
        rationale: "Provides better type safety and tool support."
      })
    }

    // Missing type annotations for exported functions/params (heuristic)
    const fnNoType = content.match(/export\s+(function|const)\s+[A-Za-z0-9_$]+\s*\([^)]*\)\s*[:{]/)
    if (fnNoType) {
      pushIssue({
        title: "Missing type annotation",
        description: "Exported functions or variables may lack explicit type annotations.",
        severity: "medium",
        index: fnNoType.index,
        code: fnNoType[0],
        suggestion: "Add explicit parameter and return type annotations.",
        rationale: "Improves readability and reduces accidental type mismatches."
      })
    }

    // Decorator usage heuristics
    if (has(/@\w+/)) {
      if (!has(/experimentalDecorators/) && !has(/@ts-ignore/)) {
        pushIssue({
          title: "Decorator usage (DecoratorError)",
          description: "Decorators require TS compiler support (experimentalDecorators).",
          severity: "low",
          index: content.indexOf('@'),
          code: "@decorator",
          suggestion: "Enable \"experimentalDecorators\" in tsconfig.json or remove unsupported decorators.",
          rationale: "Decorators are an opt-in compiler feature."
        })
      }
    }

    // Enum reassignment heuristic
    if (has(/enum\s+[A-Za-z0-9_]+\s*{[^}]*}/) && has(/\w+\s*=\s*[A-Za-z0-9_]+\.[A-Za-z0-9_]+/)) {
      // If code assigns to enum members, flag
      const assignEnum = content.match(/=[\s]*[A-Za-z0-9_]+\.[A-Za-z0-9_]+/g)
      if (assignEnum) {
        pushIssue({
          title: "Enum assignment or misuse (EnumAssignmentError)",
          description: "Assigning to enum members is likely a mistake.",
          severity: "high",
          index: content.indexOf(assignEnum[0]),
          code: assignEnum[0],
          suggestion: "Use enum members as readonly values; don't assign to them.",
          rationale: "Enums are meant to represent constant values."
        })
      }
    }
  }

  // JSX (.jsx)
  if (extension === "jsx") {
    // Unclosed JSX tags: simple tag-pair counting
    const tagRx = /<([A-Za-z][A-Za-z0-9_-]*)([^/>]*)>/g
    const closeRx = /<\/([A-Za-z][A-Za-z0-9_-]*)>/g
    const openings = {}
    let m
    while ((m = tagRx.exec(content)) !== null) {
      const tag = m[1]
      openings[tag] = (openings[tag] || 0) + 1
    }
    while ((m = closeRx.exec(content)) !== null) {
      const tag = m[1]
      openings[tag] = (openings[tag] || 0) - 1
    }
    Object.keys(openings).forEach(tag => {
      if (openings[tag] > 0) {
        pushIssue({
          title: "UnclosedTagError",
          description: `Found ${openings[tag]} more opening <${tag}> than closing tags.`,
          severity: "high",
          index: content.indexOf(`<${tag}`),
          code: `<${tag}> ...`,
          suggestion: `Ensure each <${tag}> has a matching </${tag}> or convert to self-closing if appropriate.`,
          rationale: "Unclosed tags break rendering and cause syntax errors in JSX."
        })
      }
    })

    // Hook usage heuristic: using hooks outside of component
    if (has(/\buse(State|Effect|Memo|Callback|Ref)\b/)) {
      // crude: check for "function" or "=>" above the hook usage
      const hookIdx = content.search(/\buse(State|Effect|Memo|Callback|Ref)\b/)
      const before = content.substring(Math.max(0, hookIdx - 200), hookIdx)
      if (!/function\s+[A-Za-z0-9_$]+\s*\(|=>/.test(before)) {
        pushIssue({
          title: "HookUsageError",
          description: "Hook usage may be outside of a React function component (rules of hooks violation).",
          severity: "high",
          index: hookIdx,
          code: "useXxx(...)",
          suggestion: "Use hooks only inside React function components or custom hooks.",
          rationale: "Hooks must follow the rules of hooks to avoid runtime errors."
        })
      }
    }
  }

  // TSX (.tsx) - type-related JSX/React type heuristics
  if (extension === "tsx") {
    if (has(/:\s*any\b/)) {
      pushIssue({
        title: "PropTypeMismatch / Implicit any (TSX)",
        description: "Found 'any' type usage in TSX — this can hide prop type mismatches.",
        severity: "medium",
        index: content.indexOf(': any'),
        code: ': any',
        suggestion: "Define explicit prop interfaces and use them for component props.",
        rationale: "Stronger typing prevents runtime prop errors."
      })
    }

    // Generic type angle-bracket issues heuristic (unmatched < or >)
    const openAngles = (content.match(/</g) || []).length
    const closeAngles = (content.match(/>/g) || []).length
    if (openAngles !== closeAngles) {
      pushIssue({
        title: "JSXTypeError / GenericTypeError",
        description: `Angle bracket mismatch in TSX (found ${openAngles} '<' vs ${closeAngles} '>').`,
        severity: "high",
        index: 0,
        code: "Mismatched angle brackets",
        suggestion: "Check JSX and generic type syntax for unclosed tags or generic brackets.",
        rationale: "Unmatched angle brackets will cause parsing/type errors."
      })
    }
  }

  // HTML (.html)
  if (extension === "html") {
    // Missing or malformed doctype
    if (!/^\s*<!DOCTYPE\s+html>/i.test(content)) {
      pushIssue({
        title: "MalformedDoctypeError",
        description: "Document does not start with <!DOCTYPE html>.",
        severity: "medium",
        index: 0,
        code: "<!DOCTYPE html>",
        suggestion: "Add <!DOCTYPE html> at the top of the document.",
        rationale: "Ensures standards mode and consistent rendering."
      })
    }

    // Unquoted attributes
    const unquotedAttrRx = /<[^>]+\s+[a-zA-Z-:]+=[^\s"'>][^>\s]*/g
    const unquotedMatches = content.match(unquotedAttrRx) || []
    unquotedMatches.forEach(m => {
      pushIssue({
        title: "UnquotedAttributeError",
        description: "Attribute value should be quoted.",
        severity: "low",
        index: content.indexOf(m),
        code: m,
        suggestion: m.replace(/([a-zA-Z-:]+=)([^"'\s>]+)/, '$1"$2"'),
        rationale: "Unquoted attributes can break HTML parsing."
      })
    })

    // Broken resource links: empty src/href
    const emptyResRx = /<(img|script|link|a)[^>]*(src|href)\s*=\s*("[^"]*"|'[^']*'|)\s*[^>]*>/g
    let em
    while ((em = emptyResRx.exec(content)) !== null) {
      const val = em[0]
      if (/=\s*["']?\s*["']?/.test(val)) {
        pushIssue({
          title: "BrokenResourceLinkError",
          description: "Resource tag with empty src/href.",
          severity: "high",
          index: em.index,
          code: val,
          suggestion: 'Provide a valid src/href value or remove the tag.',
          rationale: "Empty resource links break functionality and lead to 404s."
        })
      }
    }

    // Tag mismatch / invalid nesting heuristic
    const openTags = content.match(/<([a-zA-Z][a-zA-Z0-9-]*)(?:\s|>)/g) || []
    const closeTags = content.match(/<\/([a-zA-Z][a-zA-Z0-9-]*)>/g) || []
    if (openTags.length < closeTags.length || openTags.length > closeTags.length + 5) {
      pushIssue({
        title: "TagMismatchError / InvalidNestingError",
        description: "Possible mismatched or invalidly nested HTML tags (heuristic).",
        severity: "medium",
        index: 0,
        code: "Mismatched tags",
        suggestion: "Validate HTML structure and nesting (use an HTML validator).",
        rationale: "Invalid nesting leads to rendering issues and accessibility problems."
      })
    }
  }

  // CSS (.css)
  if (extension === "css") {
    // Missing semicolons in property declarations (simple heuristic)
    const linesNoSemi = lines.filter(l => /:\s*[^;{}]+$/.test(l.trim()))
    linesNoSemi.slice(0,5).forEach(l => {
      pushIssue({
        title: "MissingSemicolonError",
        description: "CSS property declaration appears to be missing a trailing semicolon.",
        severity: "low",
        index: content.indexOf(l),
        code: l.trim(),
        suggestion: l.trim() + ';',
        rationale: "Missing semicolons can break subsequent declarations."
      })
    })

    // Unclosed comment
    if (content.indexOf('/*') !== -1 && content.indexOf('*/') === -1) {
      pushIssue({
        title: "UnclosedCommentError",
        description: "Found '/*' without a matching '*/'.",
        severity: "high",
        index: content.indexOf('/*'),
        code: "/* ...",
        suggestion: "Add '*/' to close the comment.",
        rationale: "Unclosed comments can comment out large parts of the stylesheet."
      })
    }

    // Invalid property heuristic (common misspellings)
    const commonTypos = ['bakcground','widht','heigth','margn','paddng']
    commonTypos.forEach(t => {
      if (content.indexOf(t) !== -1) {
        pushIssue({
          title: "InvalidPropertyError",
          description: `Found suspicious property name "${t}".`,
          severity: "medium",
          index: content.indexOf(t),
          code: t,
          suggestion: `Replace "${t}" with the correct property (e.g. background, width, height, margin, padding).`,
          rationale: "Misspelled properties are ignored by browsers."
        })
      }
    })
  }

  // SCSS (.scss)
  if (extension === "scss") {
    // Undefined variable (use heuristic: $var used but no $var: before)
    const varUses = [...content.matchAll(/\$([A-Za-z0-9_-]+)/g)].map(m => m[1])
    const varDefs = [...content.matchAll(/\$([A-Za-z0-9_-]+)\s*:/g)].map(m => m[1])
    varUses.forEach(v => {
      if (!varDefs.includes(v)) {
        pushIssue({
          title: "UndefinedVariableError",
          description: `SCSS variable "$${v}" is used but not defined in this file (or missing import).`,
          severity: "high",
          index: content.indexOf(`$${v}`),
          code: `$${v}`,
          suggestion: `Define "$${v}: value;" or import the file that defines it.`,
          rationale: "Undefined variables will cause compilation errors."
        })
      }
    })

    // Mixin not found
    const includes = [...content.matchAll(/@include\s+([A-Za-z0-9_-]+)/g)].map(m => m[1])
    const mixins = [...content.matchAll(/@mixin\s+([A-Za-z0-9_-]+)/g)].map(m => m[1])
    includes.forEach(name => {
      if (!mixins.includes(name)) {
        pushIssue({
          title: "MixinNotFoundError",
          description: `@include references mixin "${name}" that is not defined in this file.`,
          severity: "high",
          index: content.indexOf(`@include ${name}`),
          code: `@include ${name}`,
          suggestion: `Define @mixin ${name} or import the file that contains it.`,
          rationale: "Missing mixins cause build failures."
        })
      }
    })
  }

    // LESS (.less)
    if (extension === "less") {
      // Undefined mixin / variable heuristics for LESS (@var)
      const atVarUses = [...content.matchAll(/@([A-Za-z0-9_-]+)/g)].map(m => m[1])
      const atVarDefs = [...content.matchAll(/@([A-Za-z0-9_-]+)\s*:/g)].map(m => m[1])
      atVarUses.forEach(v => {
        if (!atVarDefs.includes(v)) {
          pushIssue({
            title: "UndefinedVariableError",
            description: `LESS variable "@${v}" is used but not defined in this file (or missing import).`,
            severity: "high",
            index: content.indexOf(`@${v}`),
            code: `@${v}`,
            suggestion: `Define "@${v}: value;" or import the file that defines it.`,
            rationale: "Undefined variables will cause compilation errors."
          })
        }
      })
  
      // Mixin not found (LESS uses .mixin() or #mixin())
      const mixinUses = [...content.matchAll(/\.([A-Za-z0-9_-]+)\s*\(/g)].map(m => m[1])
      const mixinDefs = [...content.matchAll(/\.([A-Za-z0-9_-]+)\s*\([^\)]*\)\s*{?/g)].map(m => m[1])
      mixinUses.forEach(name => {
        if (!mixinDefs.includes(name)) {
          pushIssue({
            title: "MixinNotFoundError",
            description: `Mixin ".${name}()" is referenced but not defined in this file.`,
            severity: "high",
            index: content.indexOf(`.${name}(`),
            code: `.${name}()`,
            suggestion: `Define .${name}() or import the file that contains it.`,
            rationale: "Missing mixins cause build failures."
          })
        }
      })
    }
  
    return issues
  }

export default codeAnalyzerService

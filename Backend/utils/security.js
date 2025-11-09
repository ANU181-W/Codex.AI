const patterns = {
  apiKeys: [
    /(['"]?[a-zA-Z0-9_-]*api[_-]?key['"]?\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"])/gi,
    /(['"]?[a-zA-Z0-9_-]*secret[_-]?key['"]?\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"])/gi,
  ],
  tokens: [
    /(['"]?[a-zA-Z0-9_-]*token['"]?\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"])/gi,
    /(['"]?[a-zA-Z0-9_-]*auth['"]?\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"])/gi,
  ],
  passwords: [
    /(['"]?password['"]?\s*[:=]\s*['"][^'"]{8,}['"])/gi,
    /(['"]?passwd['"]?\s*[:=]\s*['"][^'"]{8,}['"])/gi,
  ],
  emails: [
    /[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/g,
  ],
  phoneNumbers: [
    /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  ],
  ipAddresses: [
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  ],
  urls: [
    /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g,
  ],
};

function redactMatch(match, type) {
  const length = match.length;
  return `[REDACTED-${type}-${length}]`;
}

function redactSensitiveInfo(content) {
  let redactedContent = content;

  // Redact each pattern type
  Object.entries(patterns).forEach(([type, patternList]) => {
    patternList.forEach(pattern => {
      redactedContent = redactedContent.replace(pattern, (match) => redactMatch(match, type));
    });
  });

  return redactedContent;
}

module.exports = {
  redactSensitiveInfo,
  patterns,
};
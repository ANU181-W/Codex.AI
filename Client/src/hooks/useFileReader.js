export function useFileReader() {
  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const getFileHash = (content) => {
    return content
      .split("")
      .reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)
      .toString(16)
  }

  return { readFile, getFileHash }
}

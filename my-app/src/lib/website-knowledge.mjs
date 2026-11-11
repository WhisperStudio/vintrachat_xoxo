// Sources remain in websiteUrls; editable facts contain only readable content.
export function cleanImportedKnowledge(value) {
  const seen = new Set();
  return String(value || '').split(/\r?\n/).map(line => {
    const page = line.match(/\|\s*Page:\s*(.*?)\s*\|\s*Source:/i)?.[1];
    let text = line.replace(/\s*\|\s*(?:Page:|Source:|Product not confirmed;)[\s\S]*$/i, '').trim();
    const label = text.match(/^\[([^\]]+)\]\s*/)?.[1];
    if (label) {
      text = text.replace(/^\[[^\]]+\]\s*/, '');
      if (label !== page && !text.toLowerCase().startsWith(label.toLowerCase())) text = label + ': ' + text;
    }
    return text.replace(/\s+/g, ' ').trim();
  }).filter(text => {
    const key = text.toLocaleLowerCase().replace(/\s+/g, ' ');
    if (!text || seen.has(key)) return false;
    seen.add(key); return true;
  }).join('\n\n');
}

export function canonicalKnowledgeUrls(urls) {
  const seen = new Set();
  return (Array.isArray(urls) ? urls : []).filter(value => {
    try {
      const url = new URL(value);
      const key = url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/$/, '') + url.search;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    } catch { return false; }
  });
}

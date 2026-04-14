type RichNode = {
  children?: RichNode[]
  text?: string
}

export function lexicalToPlainText(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return ''
  }

  const nodes = (value as { root?: { children?: RichNode[] } }).root?.children ?? []
  return nodes
    .map((node) => walkNode(node).trim())
    .filter(Boolean)
    .join('\n\n')
}

function walkNode(node: RichNode): string {
  const chunks = [node.text || '']

  for (const child of node.children || []) {
    chunks.push(walkNode(child))
  }

  return chunks.join('')
}

export function plainTextToLexical(text: string) {
  const paragraphs = text
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)

  return {
    root: {
      children:
        paragraphs.length > 0
          ? paragraphs.map((paragraph) => ({
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal' as const,
                  style: '',
                  text: paragraph,
                  type: 'text' as const,
                  version: 1,
                },
              ],
              direction: 'ltr' as const,
              format: '' as const,
              indent: 0,
              type: 'paragraph' as const,
              version: 1,
            }))
          : [
              {
                children: [],
                direction: 'ltr' as const,
                format: '' as const,
                indent: 0,
                type: 'paragraph' as const,
                version: 1,
              },
            ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      type: 'root' as const,
      version: 1,
    },
  }
}

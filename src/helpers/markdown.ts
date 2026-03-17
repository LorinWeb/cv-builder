function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function stripMarkdownToPlainText(markdown: string) {
  return normalizeWhitespace(
    markdown
      .replace(/\r\n?/g, '\n')
      .replace(/```([\s\S]*?)```/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
      .replace(/^ {0,3}#{1,6}\s+/gm, '')
      .replace(/^ {0,3}>\s?/gm, '')
      .replace(/^ {0,3}(?:[-+*]|\d+\.)\s+/gm, '')
      .replace(/^ {0,3}[-*_]{3,}\s*$/gm, '')
      .replace(/\*\*(.*?)\*\*/gs, '$1')
      .replace(/__(.*?)__/gs, '$1')
      .replace(/\*(.*?)\*/gs, '$1')
      .replace(/_(.*?)_/gs, '$1')
      .replace(/~~(.*?)~~/gs, '$1')
      .replace(/<\/?[^>]+>/g, '')
      .replace(/[ \t]*\n[ \t]*/g, ' ')
  );
}

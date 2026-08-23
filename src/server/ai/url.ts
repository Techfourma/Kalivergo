export function buildAssistantUrl(base: string): string {
  const normalized = base.trim().replace(/\/+$/, "");

  if (/\/api\/assistant$/i.test(normalized)) {
    return normalized;
  }

  if (/\/api$/i.test(normalized)) {
    return `${normalized}/assistant`;
  }

  return `${normalized}/api/assistant`;
}
/**
 * Builds a URL with query parameters.
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(path.startsWith('http') ? path : baseUrl + path)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    }
  }
  return url.toString()
}

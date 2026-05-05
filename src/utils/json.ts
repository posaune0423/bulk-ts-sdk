/**
 * Safely parses a JSON string. Returns undefined if parsing fails.
 */
export function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

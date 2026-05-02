// Centralized friendly copy for duplicate-article conflicts.
// Used by Generator/BulkGenerator UIs so backend phrasing changes don't ripple
// through string-heuristic matching scattered across components.

export const DUPLICATE_COPY = {
  TOPIC_ALREADY_HAS_ARTICLE: 'This topic already has an article.',
  SLUG_ALREADY_EXISTS:       'That slug is already in use by another article.',
};

export const DEFAULT_DUPLICATE_COPY = 'Already covered.';

// Resolve a friendly duplicate message from a structured conflict code first,
// then a backend-provided string as fallback heuristic, then a default.
export function friendlyDuplicateCopy({ code, fallback } = {}) {
  if (code && DUPLICATE_COPY[code]) return DUPLICATE_COPY[code];
  const raw = String(fallback || '');
  const lower = raw.toLowerCase();
  if (lower.includes('topic already')) return DUPLICATE_COPY.TOPIC_ALREADY_HAS_ARTICLE;
  if (lower.includes('slug'))          return DUPLICATE_COPY.SLUG_ALREADY_EXISTS;
  return raw || DEFAULT_DUPLICATE_COPY;
}

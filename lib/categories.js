/**
 * Category activation control.
 *
 * To deactivate a category, remove it from ACTIVE_CATEGORIES.
 * Inactive categories return 404 on their listing pages.
 *
 * To activate a future category (e.g. 'bible-verses', 'teachings'),
 * add it to ACTIVE_CATEGORIES AND ensure articles with that category exist in DB.
 */
export const ACTIVE_CATEGORIES = new Set(['topics', 'questions', 'guides']);

export function isCategoryActive(category) {
  return ACTIVE_CATEGORIES.has(category);
}

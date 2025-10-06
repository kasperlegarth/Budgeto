/**
 * Category utilities
 * Helper funktioner til at arbejde med kategorier og translations
 */

import type { Category, Subcategory } from '../types';

/**
 * Hent kategori navn fra translation key eller fallback til navn felt
 * @param category - Kategori object
 * @param t - vue-i18n translate function
 * @returns Translated category name
 */
export function getCategoryName(
  category: Category | Subcategory,
  t: (key: string) => string
): string {
  // Hvis nameKey findes, brug translation
  if (category.nameKey) {
    return t(category.nameKey);
  }

  // Fallback til navn felt (backward compatibility)
  return category.navn || category.id;
}

/**
 * Category labels shown by the web application for each supplier category of the OrganiK Platform.
 */
const LABELS: Readonly<Record<string, string>> = {
  FRUITS_AND_VEGETABLES: 'Frutas y verduras',
  GRAINS: 'Granos',
  DAIRY: 'Lácteos',
  FROZEN: 'Congelados'
};

/**
 * Words that identify each supplier category in the free text typed by the user.
 */
const KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  FRUITS_AND_VEGETABLES: ['fruta', 'verdura', 'fruit', 'vegetable', 'hortaliza'],
  GRAINS: ['grano', 'grain', 'cereal', 'menestra'],
  DAIRY: ['lácteo', 'lacteo', 'dairy', 'leche', 'queso'],
  FROZEN: ['congelado', 'frozen']
};

/**
 * Translates supplier categories between the web application (free text) and the OrganiK Platform (fixed values).
 */
export class SupplierCategoryAssembler {
  /**
   * @param labels - Categories typed by the user, e.g. `Lácteos` or `Frutas y verduras`.
   * @returns The platform categories that match the labels, without duplicates.
   */
  static toPlatformCategories(labels: readonly string[]): string[] {
    const normalized = labels.map(label => label.trim().toLowerCase()).filter(Boolean);
    return Object.keys(KEYWORDS).filter(category =>
      normalized.some(label => label === category.toLowerCase() || KEYWORDS[category].some(keyword => label.includes(keyword)))
    );
  }

  /**
   * @param categories - Platform categories, e.g. `DAIRY`.
   * @returns The labels shown by the web application.
   */
  static toLabels(categories: readonly string[]): string[] {
    return categories.map(category => LABELS[category] ?? category);
  }
}

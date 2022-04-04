import { Proportion, Recipe } from '.';

/**
 * List of common ingredients that can be removed while similarity matching
 */
const COMMON_INGREDIENTS = [
  'garlic',
  'ginger',
  'salt',
  'salt and pepper',
  'pepper',
  'oil',
  'scallions',
  'onion',
  'cumin',
  'chilli powder',
  'chilli',
  'paprika',
  'cayenne',
  'water',
  'bell pepper',
];

/**
 * Determing whether the specified ingredient is a common one or not
 * @param {string} ingredient ingredient to check
 * @return {boolean}
 */
const isCommonIngredient = (ingredient: string): boolean => {
  // Convert to lowercase to ensure consistency and do an includes since a bell pepper can be named as 'yellow bell pepper'
  return COMMON_INGREDIENTS.some((ci) => ingredient.toLowerCase().includes(ci));
};

/**
 * Convert proportions object to list of "uncommon" ingredients list to use to similarity matching
 * @param {Proportion[]} proportions array of Proportions object pulled from firestore that you want to convert
 * @return {string[]} Names of "uncommon" ingredients
 */
export const proportionsToIngredientList = (proportions: Proportion[] | undefined): string[] => {
  if (!proportions) return [];

  const ingredientList = proportions.map((prop) => prop.ingredient);
  const filteredIngredientList = ingredientList.filter((ingredient) => isCommonIngredient(ingredient));

  return filteredIngredientList;
};

/**
 * Combine tags for given recipes
 * @param {(Recipe | undefined)[]} recipes
 * @return {string[]} Combined tags
 */
export const combineTags = (recipes: (Recipe | undefined)[]): string[] => {
  const tags: string[] = [];
  recipes.forEach((recipe) => tags.push(...recipe?.tags || []));

  return tags;
};

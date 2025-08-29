import { Proportion, RecipeMap } from '.';

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
  'corn starch',
  'sugar',
  'olive oil',
  'vegetable oil',
  'black pepper',
  'white pepper',
  'soy sauce',
  'vinegar',
  'flour',
  'baking powder',
  'baking soda',
  'butter',
  'eggs',
  'milk',
  'vanilla extract',
  'cinnamon',
  'oregano',
  'thyme',
  'basil',
  'parsley',
  'bay leaves',
  'rosemary',
  'sage',
];

/**
 * Determing whether the specified ingredient is a common one or not
 * @param {string} ingredient ingredient to check
 * @return {boolean}
 */
function isCommonIngredient(ingredient: string): boolean {
  // Convert to lowercase to ensure consistency and do an includes since a bell pepper can be named as 'yellow bell pepper'
  return COMMON_INGREDIENTS.some(ci => ingredient.toLowerCase().includes(ci));
}

/**
 * Convert proportions object to list of "uncommon" ingredients list to use to similarity matching
 * @param {Proportion[]} proportions array of Proportions object pulled from firestore that you want to convert
 * @return {string[]} Names of "uncommon" ingredients
 */
export const proportionsToIngredientList = (proportions: Proportion[] | undefined): string[] => {
  return proportions
    ?.map(prop => prop.ingredient)
    .filter(ingredient => !isCommonIngredient(ingredient)) ?? [];
};

/**
 * Combine tags for given recipes
 * @param {string[]} recipes
 * @param {RecipeMap} recipeMap
 * @return {string[]} Combined tags
 */
export function combineTags(recipes: string[], recipeMap: RecipeMap): string[] {
  return recipes.flatMap(r => recipeMap.get(r)?.tags ?? []);
}

/**
 * Convert string to kebab case
 * @param {str} str
 * @return {str}
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-').toLowerCase();
}

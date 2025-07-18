import { Proportion, RecipeMap } from '.';
export declare const proportionsToIngredientList: (proportions: Proportion[] | undefined) => string[];
export declare const combineTags: (recipes: string[], recipeMap: RecipeMap) => string[];
export declare const kebabCase: (string: string) => string;

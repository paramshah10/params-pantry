import { scheduler } from 'firebase-functions';
import { initializeApp } from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { combineTags, kebabCase, proportionsToIngredientList } from './utils';

initializeApp();
const db = getFirestore();

export interface Proportion {
  ingredient: string
  maxQty: string
  minQty: string
  quantity: string
  unit: string
}

export interface Recipe {
  content?: string
  created: Timestamp
  lastCooked: Timestamp
  name: string
  proportions?: Proportion[]
  tags: string[]
}

export type RecipeMap = {[key: string]: Recipe}

/**
 * Weekly recipe update functions to update the 7 weekly recipes. It runs every Monday at midnight.
 */
export const weeklyRecipeUpdate = scheduler.onSchedule('0 0 * * MON', async () => {
// export const weeklyRecipeUpdate = https.onRequest(async (_, res) => {
  const recipeSnapshot = await db.collection('/recipes').orderBy('lastCooked', 'desc').get();
  const recipesDoc: Recipe[] = recipeSnapshot.docs.map((doc) => <Recipe>doc.data());

  const recipes = recipesDoc.filter((recipe) => recipe.tags.includes('Entrée'));

  const recipeMap: RecipeMap = {};
  recipes.forEach((recipe) => {
    recipeMap[recipe.name] = recipe;
  });

  const LRURecipeDate = recipes[0].lastCooked;
  const LRURecipes = recipes.filter((recipe) => recipe.lastCooked.isEqual(LRURecipeDate));
  const randIndex = Math.floor(Math.random() * LRURecipes.length) ?? 0;
  const pickedRecipes = [(LRURecipes.at(randIndex) ?? LRURecipes[0]).name];

  const currentIngredients = proportionsToIngredientList(recipeMap[pickedRecipes[0]].proportions);

  // for picking recipe for each day after the randomly picked one
  for (let i = 0; i < 6; i++) {
    // score each recipe based on similarity
    const scores = recipes.map((recipe, index) => {
      let score = 0;

      let ingredientScore = 0;
      for (const prop of proportionsToIngredientList(recipe.proportions)) {
        if (currentIngredients.includes(prop)) {
          ingredientScore++;
        }
      }
      // number of days between the two dates
      const dateScore =
        (recipe.lastCooked.toMillis() - (recipeMap[pickedRecipes[0]]?.lastCooked.toMillis() || 0)) / (1000 * 3600 * 24);

      let tagScore = 0;
      recipe.tags.forEach((tag) => {
        if (combineTags(pickedRecipes, recipeMap).includes(tag)) tagScore++;
      });

      score = ingredientScore * 0.4 + dateScore * 0.4 + tagScore * 0.2;

      return [score, index];
    });

    scores.sort((a, b) => a[0] - b[0]);
    // add the recipe with the lowest score
    pickedRecipes.push(recipes[scores[0][1]].name);

    // remove that recipe so that we don't use it again
    recipes.splice(scores[0][1], 1);
  }

  // Add names of the recipes picked this week the document
  await db.doc('/website/weekly-recipes').update({
    recipes: pickedRecipes.map((recipe) => kebabCase(recipe)),
  });

  const date = new Date();
  const timestamp = new Timestamp(date.getSeconds(), date.getMilliseconds());

  // Add the last cooked date for each picked recipe to right now, and make sure its the same value
  // Need the same value just because of how the logic above works
  pickedRecipes.forEach(async (recipeName) => {
    await db.doc('/recipes/' + kebabCase(recipeName)).update({
      lastCooked: timestamp,
    });
  });
});

import { pubsub } from 'firebase-functions';
import { initializeApp } from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { combineTags, proportionsToIngredientList } from './utils';

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

/**
 * Weekly recipe update functoins to update the 7 weekly recipes. It runs every Monday at midnight.
 */
export const weeklyRecipeUpdate = pubsub.schedule('0 0 * * MON').onRun(async () => {
// export const weeklyRecipeUpdate = https.onRequest(async (_, res) => {
  const recipeSnapshot = await db.collection('/recipes').orderBy('lastCooked', 'desc').get();
  const recipesDoc: Recipe[] = recipeSnapshot.docs.map((doc) => <Recipe>doc.data());

  const weeklyRecipeDoc = (await db.doc('/website/weekly-recipes').get()).data();
  const lastWeeksRecipesNames: string[] = weeklyRecipeDoc?.recipes?.map((recipe: Recipe) => recipe.name);

  const recipes = recipesDoc.filter((recipe) => recipe.tags.includes('Entrée') && !lastWeeksRecipesNames?.includes(recipe.name));

  const LRURecipeDate = recipes[0].lastCooked;
  const LRURecipes = recipes.filter((recipe) => recipe.lastCooked.isEqual(LRURecipeDate));
  const randIndex = Math.floor(Math.random() * LRURecipes.length);
  const pickedRecipes = [LRURecipes.at(randIndex)];

  const currentIngredients = proportionsToIngredientList(pickedRecipes[0]?.proportions);

  // for picking recipe for each day
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
        (recipe.lastCooked.toMillis() - (pickedRecipes[0]?.lastCooked.toMillis() || 0)) / (1000 * 3600 * 24);

      let tagScore = 0;
      recipe.tags.forEach((tag) => {
        if (combineTags(pickedRecipes).includes(tag)) tagScore++;
      });

      score = ingredientScore * 0.4 + dateScore * 0.4 + tagScore * 0.2;

      return [score, index];
    });

    scores.sort((a, b) => a[0] - b[0]);
    // add the recipe with the lowest score
    pickedRecipes.push(recipes[scores[0][1]]);

    // remove that recipe so that we don't use it again
    recipes.splice(scores[0][1], 1);
  }

  await db.doc('/website/weekly-recipes').update({
    recipes: pickedRecipes,
  });
});

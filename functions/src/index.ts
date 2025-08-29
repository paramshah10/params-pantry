import { scheduler } from 'firebase-functions';
import { initializeApp } from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { combineTags, kebabCase, proportionsToIngredientList } from './utils';

initializeApp();
const db = getFirestore();

export interface Proportion {
  readonly ingredient: string;
  readonly maxQty: string;
  readonly minQty: string;
  readonly quantity: string;
  readonly unit: string;
}

export interface Recipe {
  readonly content?: string
  readonly created: Timestamp
  readonly lastCooked: Timestamp
  readonly name: string
  readonly proportions?: Proportion[]
  readonly tags: string[]
}

export type RecipeMap = Map<string, Recipe>;

/**
 * Weekly recipe update function to select 4 diverse recipes for the week.
 * Runs every Monday at midnight using a scoring algorithm that considers:
 * - Ingredient diversity (avoid similar ingredients)
 * - Recipe freshness (prefer recipes not cooked recently)
 * - Tag variety (ensure diverse meal types)
 */
export const weeklyRecipeUpdate = scheduler.onSchedule('0 0 * * MON', async context => {
  try {
    console.log('Starting weekly recipe update...');

    // Fetch all entrée recipes ordered by last cooked date (oldest first for better LRU logic)
    const recipeSnapshot = await db.collection('/recipes')
      .where('tags', 'array-contains', 'Entrée')
      .orderBy('lastCooked', 'asc')
      .get();

    if (recipeSnapshot.empty) {
      console.warn('No entrée recipes found');
      return;
    }

    const recipes = recipeSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Recipe,
    }));

    console.log(`Found ${recipes.length} entrée recipes`);

    if (recipes.length < 4) {
      console.warn(`Only ${recipes.length} recipes available, need at least 4`);
      return;
    }

    const recipeMap: RecipeMap = new Map();
    recipes.forEach(recipe => recipeMap.set(recipe.name, recipe));

    // Find the least recently used recipes (oldest lastCooked date)
    const oldestDate = recipes[0].lastCooked;
    const lruRecipes = recipes.filter(recipe => recipe.lastCooked.isEqual(oldestDate));

    // Randomly select from LRU recipes as starting point
    const randomIndex = Math.floor(Math.random() * lruRecipes.length);
    const firstRecipe = lruRecipes[randomIndex];
    const pickedRecipes = [firstRecipe.name];

    console.log(`Starting with recipe: ${firstRecipe.name}`);

    // Create a working copy of recipes (excluding the first picked recipe)
    const availableRecipes = recipes.filter(recipe => recipe.name !== firstRecipe.name);

    // Select remaining 6 recipes using scoring algorithm
    for (let day = 1; day < 4; day++) {
      if (availableRecipes.length === 0) break;

      const scores = availableRecipes.map((recipe, index) => {
        // Calculate ingredient overlap score (lower is better - less overlap)
        const currentIngredients = new Set(
          pickedRecipes.flatMap(recipeName =>
            proportionsToIngredientList(recipeMap.get(recipeName)?.proportions),
          ),
        );
        const recipeIngredients = proportionsToIngredientList(recipe.proportions);
        const ingredientOverlap = recipeIngredients.filter(ing => currentIngredients.has(ing)).length;
        const ingredientScore = ingredientOverlap / Math.max(recipeIngredients.length, 1);

        // Calculate days since last cooked (higher is better - longer since cooked)
        const daysSinceCooked = (Date.now() - recipe.lastCooked.toMillis()) / (1000 * 60 * 60 * 24);
        const dateScore = Math.min(daysSinceCooked / 30, 1); // Normalize to max 30 days

        // Calculate tag diversity score (lower is better - less tag overlap)
        const currentTags = new Set(combineTags(pickedRecipes, recipeMap));
        const tagOverlap = recipe.tags.filter(tag => currentTags.has(tag)).length;
        const tagScore = tagOverlap / Math.max(recipe.tags.length, 1);

        // Combined score (lower is better)
        const totalScore = (ingredientScore * 0.5) + (tagScore * 0.3) - (dateScore * 0.2);

        return { score: totalScore, index, recipe: recipe.name };
      });

      // Sort by score (ascending - lower scores are better)
      scores.sort((a, b) => a.score - b.score);

      const selectedRecipe = availableRecipes[scores[0].index];
      pickedRecipes.push(selectedRecipe.name);

      console.log(`Day ${day + 1}: Selected ${selectedRecipe.name} (score: ${scores[0].score.toFixed(3)})`);

      // Remove selected recipe from available recipes
      availableRecipes.splice(scores[0].index, 1);
    }

    console.log('Selected recipes for the week:', pickedRecipes);

    // Create timestamp for batch update
    const timestamp = Timestamp.now();

    // Use batch write for better performance and atomicity
    const batch = db.batch();

    // Update weekly recipes document
    const weeklyRecipesRef = db.doc('/website/weekly-recipes');
    batch.update(weeklyRecipesRef, {
      recipes: pickedRecipes.map(kebabCase),
      lastUpdated: timestamp,
    });

    // Update lastCooked timestamp for all selected recipes
    pickedRecipes.forEach(recipeName => {
      const recipeRef = db.doc(`/recipes/${kebabCase(recipeName)}`);
      batch.update(recipeRef, { lastCooked: timestamp });
    });

    // Commit all updates atomically
    await batch.commit();

    console.log('Weekly recipe update completed successfully');
  } catch (error) {
    console.error('Error in weekly recipe update:', error);
    throw error; // Re-throw to ensure Cloud Functions logs the error
  }
});

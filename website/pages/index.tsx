import type { NextPage } from 'next';
import React, { useContext, useEffect, useState } from 'react';
import RecipeCarousel from '../components/recipe-carousel';
import { _Firebase } from '../utils/firebase';
import { fetchImageURL, Recipe } from '../utils/recipes';
import { AppContext } from './_app';

const FALLBACK_RECIPE_IMAGE = 'https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80';

interface RecipeListDoc {
  recipes: string[];
}

function isRecipeListDoc(doc: unknown): doc is RecipeListDoc {
  return Boolean(
    doc
    && typeof doc === 'object'
    && Array.isArray((doc as RecipeListDoc).recipes),
  );
}

function isRecipe(recipe: unknown): recipe is Recipe {
  return Boolean(
    recipe
    && typeof recipe === 'object'
    && typeof (recipe as Recipe).name === 'string',
  );
}

async function fetchRecipeList(firebase: _Firebase | null, path: string): Promise<Recipe[]> {
  if (!firebase) return [];

  const doc = await firebase.get(path);
  if (!isRecipeListDoc(doc)) return [];

  const recipes = (await Promise.all(
    doc.recipes.map(recipeName => firebase.get(`/recipes/${recipeName}`)),
  )).filter(isRecipe);

  return Promise.all(
    recipes.map(async recipe => ({
      ...recipe,
      imageUrl: recipe.image
        ? await fetchImageURL(recipe.image, firebase)
        : FALLBACK_RECIPE_IMAGE,
    })),
  );
}

const Home: NextPage = () => {
  const [weeklyRecipes, setWeeklyRecipes] = useState<Recipe[]>([]);
  const [highProteinRecipes, setHighProteinRecipes] = useState<Recipe[]>([]);
  const { firebase } = useContext(AppContext);

  useEffect(() => {
    let isMounted = true;

    const fetchHomeRecipes = async () => {
      const [weeklyRecipeList, highProteinRecipeList] = await Promise.all([
        fetchRecipeList(firebase, '/website/weekly-recipes'),
        fetchRecipeList(firebase, '/website/high-protein-recipes'),
      ]);

      if (!isMounted) return;

      setWeeklyRecipes(weeklyRecipeList);
      setHighProteinRecipes(highProteinRecipeList);
    };

    void fetchHomeRecipes();

    return () => {
      isMounted = false;
    };
  }, [firebase]);

  return (
    <>
      <div className="flex flex-col justify-center items-center relative w-full h-screen">
        <div className={
          `-z-50 mx-0 my-0 overflow-hidden h-screen w-full absolute 
          bg-[url('../public/assets/pizza.jfif')] bg-no-repeat bg-center bg-fixed bg-cover`
        }
          // Bg image properties taken from https://css-tricks.com/perfect-full-page-background-image/
        />
        <h1 className="z-30 lg:leading-5 lg:text-8xl md:text-7xl text-6xl text-center font-bold text-white cursor-text">
          Fasting is overrated.
        </h1>
      </div>
      <div className="px-8 min-h-screen py-8 flex flex-col items-center text-center">
        <h1 className="my-24 lg:text-7xl md:text-6xl text-5xl leading-snug">
          Welcome to
          {' '}
          {'Param\'s'}
          {' '}
          Pantry!
        </h1>

        <h2 className="">
          Here's what to cook this week
        </h2>
        {/* Carousel of cards for what to cook this week */}
        <RecipeCarousel recipes={weeklyRecipes} />

        <h2 className="mt-8">
          High protein picks
        </h2>
        <RecipeCarousel recipes={highProteinRecipes} />

        {/* Add random but higly rated recipes here; updates every day (similar to https://www.bonappetit.com/) */}
      </div>
    </>
  );
};

export default Home;

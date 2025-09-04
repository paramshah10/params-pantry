import type { NextPage } from 'next';
import React, { useContext, useEffect, useState } from 'react';
import RecipeCarousel from '../components/recipe-carousel';
import { fetchImageURL, Recipe } from '../utils/recipes';
import { AppContext } from './_app';

const Home: NextPage = () => {
  const [weeklyRecipes, setWeeklyRecipes] = useState<Recipe[]>([]);
  const { firebase } = useContext(AppContext);

  const fetchWeeklyRecipes = async () => {
    const image = 'https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80';
    const doc = await firebase?.get('/website/weekly-recipes');
    const recipeNames: string[] = doc.recipes;

    const recipes = await Promise.all(recipeNames.map(recName => firebase?.get('/recipes/' + recName)));

    const recipeImageUrls = await Promise.all(
      recipes.map(rec => {
        if (rec.image) return fetchImageURL(rec.image, firebase!!);
        else return image;
      }),
    );

    for (let i = 0; i < recipes.length; i++) {
      // TODO: check if the auth token in the image url stays the same or not. if it is then you can just save the image url.
      // Test: image url for spicy zucchini quesadillas on April 10, 2022 was
      // (https://firebasestorage.googleapis.com/v0/b/recipes-b2baa.appspot.com/o/spicy-zucchini-quesadillas.webp?alt=media&token=4b13dc3c-ee71-4257-bedb-f2bf30cf3d3a)
      recipes[i].imageUrl = recipeImageUrls[i];
    }

    setWeeklyRecipes(recipes);
  };

  useEffect(() => {
    void fetchWeeklyRecipes();
  }, []);

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

        {/* Add random but higly rated recipes here; updates every day (similar to https://www.bonappetit.com/) */}
      </div>
    </>
  );
};

export default Home;

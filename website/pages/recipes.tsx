import { JSX, useContext, useEffect, useState } from 'react';
import RecipeToolbar from '../components/list-card-toggle';
import RecipeCard from '../components/recipe-card';
import { fetchImageURL, Recipe } from '../utils/recipes';
import { AppContext } from './_app';

export default function AllRecipesPage(): JSX.Element {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const { firebase } = useContext(AppContext);
  const [listViewActive, setListViewActive] = useState(false);

  const fetchAllRecipes = async () => {
    const image = 'https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80';

    const recipes = await firebase?.queryCollection('recipes');

    const recipeImageUrls = await Promise.all(
      recipes.map((rec: any) => {
        if (rec.image) return fetchImageURL(rec.image, firebase!!);
        else return image;
      }),
    );

    for (let i = 0; i < recipes.length; i++)
      // TODO: check if the auth token in the image url stays the same or not. if it is then you can just save the image url.
      // Test: image url for spicy zucchini quesadillas on April 10, 2022 was
      // (https://firebasestorage.googleapis.com/v0/b/recipes-b2baa.appspot.com/o/spicy-zucchini-quesadillas.webp?alt=media&token=4b13dc3c-ee71-4257-bedb-f2bf30cf3d3a)
      recipes[i].imageUrl = recipeImageUrls[i];

    setAllRecipes(recipes);
  };

  useEffect(() => {
    void fetchAllRecipes();
  }, []);

  const returnCardView = () => {
    return (
      <div className="grid xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 xs:grid-cols-1 grid-flow-row gap-x-6 gap-y-12 m-4  transition-all duration-500 ease-in-out">
        {allRecipes.map(recipe => {
          if (!recipe.name) return;
          return <RecipeCard recipe={recipe} key={recipe.name} />;
        },
        )}
      </div>
    );
  };

  const returnListView = () => {
    return (
      <div className="grid xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 xs:grid-cols-1 grid-flow-row gap-x-6 gap-y-12  transition-all duration-500 ease-in-out">
      </div>
    );
  };

  return (
    <div className="">
      <div className={
        `-z-50 mx-0 my-0 overflow-hidden h-3/5 w-full absolute 
        bg-[url('../public/assets/pizza.jfif')] bg-no-repeat bg-center bg-fixed bg-cover`
      }
      />
      <div className="pt-96 pb-24 px-24">
        <RecipeToolbar listViewActive={listViewActive} setListViewActive={setListViewActive} />
        {
          listViewActive ? returnListView() : returnCardView()
        }
      </div>
    </div>
  );
}

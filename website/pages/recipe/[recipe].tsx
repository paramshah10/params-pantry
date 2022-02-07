import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import TextEditor from '../../components/text-editor';
import { Recipe } from '../../utils/recipes';

interface RecipePageProps {
  details?: Recipe
}

export default function RecipePage(props: RecipePageProps) {
  const router = useRouter();
  const { recipe: recipeName } = router.query;

  const [recipeData, setRecipeData] = useState<Recipe | undefined>(props.details);
  const imageURL = 'https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80';

  const fetchRecipe = async (name: string) => {
    const res = await window.fetch('/api/fetch-recipe', {
      method: 'POST',
      body: JSON.stringify({ recipeName: name }),
    });
    if (!res.ok) return;

    const data = await res.json();
    setRecipeData(data);
  };

  useEffect(() => {
    if (props.details) {
      setRecipeData(props.details);
    } else {
      void fetchRecipe(String(recipeName));
    }
  }, [props, recipeName]);

  return (
    <>
      <div className='-z-50 flex flex-col justify-center items-center relative w-full h-[75vh]'>
        <div className={
          `z-10 mx-0 my-0 overflow-hidden h-screen w-full absolute 
          bg-no-repeat bg-center bg-fixed bg-cover`
        }
        style={{backgroundImage: `url('${imageURL}')`}}
          // Bg image properties taken from https://css-tricks.com/perfect-full-page-background-image/
        />
        <h1 className="z-30 lg:leading-5 lg:text-8xl md:text-7xl text-6xl text-center font-bold text-white cursor-text">
          {recipeData?.name}
        </h1>
      </div>
      <div className="flex flex-row items-center">
        <div className="mt-8 min-h-screen py-24 items-center w-4/6">
          <TextEditor editorContent={recipeData?.content}/>
        </div>
      </div>
      {/*
      <div className="px-8 min-h-screen py-8 flex flex-col items-center text-center">
        <h1 className="my-24 lg:text-7xl md:text-6xl text-5xl leading-snug">
          Welcome to {"Param's"} Pantry!
        </h1>
      </div> */}
    </>
  );
}

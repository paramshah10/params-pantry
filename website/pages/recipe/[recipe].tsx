import { useRouter } from 'next/router';
import { useEffect, useState, useContext } from 'react';
import EditPictureButton from '../../components/edit-button';
import TextEditor from '../../components/text-editor';
import { fetchImageURL, Recipe } from '../../utils/recipes';
import { AppContext } from '../_app';

interface RecipePageProps {
  details?: Recipe
}

export default function RecipePage(props: RecipePageProps) {
  const { isAuthenticated } = useContext(AppContext);
  const router = useRouter();
  const { recipe: recipeName } = router.query;

  const [recipeData, setRecipeData] = useState<Recipe | undefined>(undefined);
  const imageURL = 'https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80';

  const fetchRecipe = async (name: string) => {
    const res = await window.fetch('/api/fetch-recipe', {
      method: 'POST',
      body: JSON.stringify({ recipeName: name }),
    });
    if (!res.ok) return;

    const data: Recipe = await res.json();
    if (data.image) data.image = await fetchImageURL(data.image);
    else data.image = imageURL;
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
      <div className='flex flex-col justify-center items-center relative w-full h-[75vh] mb-32'
      >
        <div className={
          `-z-50 mx-0 my-0 overflow-hidden h-screen w-full absolute 
          bg-no-repeat bg-center bg-fixed bg-cover`
        }
        style={{backgroundImage: `url('${recipeData?.image}')`}}
        // Bg image properties taken from https://css-tricks.com/perfect-full-page-background-image/
        />
        <h1 className="z-30 lg:text-8xl md:text-7xl text-6xl text-center font-bold text-white cursor-text">
          {recipeData?.name}
        </h1>
        {
          isAuthenticated ?
            <EditPictureButton recipeName={String(recipeName)}/>
            : <></>
        }
      </div>
      <div className="flex flex-row items-center">
        <div className="my-8 ml-4 min-h-screen items-center w-4/6 rounded-lg shadow-lg">
          <TextEditor editorContent={recipeData?.content}/>
        </div>
      </div>
    </>
  );
}

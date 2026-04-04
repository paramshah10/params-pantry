import { useRouter } from 'next/router';
import { useEffect, useState, useContext } from 'react';
import EditPictureButton from '../../components/edit-button';
import IngredientEditor from '../../components/ingredient-editor';
import MacroEditor from '../../components/macro-editor';
import TagEditor from '../../components/tag-editor';
import TextEditor from '../../components/text-editor';
import DeleteButton from '../../components/delete-button';
import { DEFAULT_RECIPE_TAGS, fetchImageURL, normalizeTagList, Proportion, Recipe, RecipeMacros } from '../../utils/recipes';
import { AppContext } from '../_app';

interface RecipePageProps {
  details?: Recipe;
}

export default function RecipePage(props: RecipePageProps) {
  const { isAuthenticated, firebase } = useContext(AppContext);
  const router = useRouter();
  const { recipe: recipeName } = router.query;

  const [recipeData, setRecipeData] = useState<Recipe | undefined>(undefined);
  const [availableTags, setAvailableTags] = useState<string[]>(DEFAULT_RECIPE_TAGS);
  const [isRecipeLoading, setIsRecipeLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const imageURL = 'https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80';

  const fetchRecipe = async (name: string) => {
    if (!name || !firebase) return;

    setIsRecipeLoading(true);
    try {
      const [data, tagOptionsDoc] = await Promise.all([
        firebase.get(`/recipes/${name}`),
        firebase.get('/website/recipe-tags'),
      ]);
      if (!data) {
        setRecipeData(undefined);
        setErrorMessage('Recipe not found.');
        return;
      }

      setAvailableTags(normalizeTagList([
        ...(tagOptionsDoc?.tags ?? DEFAULT_RECIPE_TAGS),
        ...(data.tags ?? []),
      ]));

      await updateImageState(data);
    } finally {
      setIsRecipeLoading(false);
    }
  };

  const updateImageState = async (data: Recipe | undefined) => {
    if (!data) {
      setRecipeData(undefined);
      return;
    }

    if (data.image)
      data.image = await fetchImageURL(data.image, firebase!!);
    else
      data.image = imageURL;

    setRecipeData(data);
  };

  const updateFirebaseImage = async (file: string): Promise<boolean> => {
    if (!file) return false;

    const recipe = String(recipeName);
    const imageUrl = await firebase?.uploadImage({ file: file, location: recipe });
    await firebase?.put({
      path: 'recipes/' + recipe,
      data: {
        image: recipe,
      },
    });

    const newRecipeData = Object.assign({}, recipeData);
    newRecipeData.image = imageUrl;
    await setRecipeData(newRecipeData);

    return true;
  };

  const handleIngredientSave = async ({
    ingredients,
    servings,
  }: {
    ingredients: Proportion[];
    servings?: number;
  }): Promise<boolean> => {
    if (!firebase || !recipeName || typeof recipeName !== 'string') {
      setErrorMessage('Recipe ingredients could not be saved. Please refresh and try again.');
      return false;
    }

    const saveSucceeded = await firebase.put({
      path: `recipes/${recipeName}`,
      data: {
        proportions: ingredients,
        servings,
      },
    });

    if (!saveSucceeded) {
      setErrorMessage('Failed to save ingredients. Please try again.');
      return false;
    }

    setRecipeData(currentRecipeData => {
      if (!currentRecipeData) return currentRecipeData;

      return {
        ...currentRecipeData,
        proportions: ingredients,
        servings,
      };
    });
    setSuccessMessage('Ingredients saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    return true;
  };

  const handleTagSave = async ({
    availableTags: nextAvailableTags,
    selectedTags,
  }: {
    availableTags: string[];
    selectedTags: string[];
  }): Promise<boolean> => {
    if (!firebase || !recipeName || typeof recipeName !== 'string') {
      setErrorMessage('Recipe tags could not be saved. Please refresh and try again.');
      return false;
    }

    const [savedRecipeTags, savedTagOptions] = await Promise.all([
      firebase.put({
        path: `recipes/${recipeName}`,
        data: {
          tags: selectedTags,
        },
      }),
      firebase.put({
        path: '/website/recipe-tags',
        data: {
          tags: nextAvailableTags,
        },
      }),
    ]);

    if (!savedRecipeTags || !savedTagOptions) {
      setErrorMessage('Failed to save tags. Please try again.');
      return false;
    }

    setAvailableTags(nextAvailableTags);
    setRecipeData(currentRecipeData => {
      if (!currentRecipeData) return currentRecipeData;

      return {
        ...currentRecipeData,
        tags: selectedTags,
      };
    });
    setSuccessMessage('Tags saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    return true;
  };

  const handleMacroSave = async (macros: RecipeMacros): Promise<boolean> => {
    if (!firebase || !recipeName || typeof recipeName !== 'string') {
      setErrorMessage('Recipe macros could not be saved. Please refresh and try again.');
      return false;
    }

    const saveSucceeded = await firebase.put({
      path: `recipes/${recipeName}`,
      data: {
        macros,
      },
    });

    if (!saveSucceeded) {
      setErrorMessage('Failed to save macros. Please try again.');
      return false;
    }

    setRecipeData(currentRecipeData => {
      if (!currentRecipeData) return currentRecipeData;

      return {
        ...currentRecipeData,
        macros,
      };
    });
    setSuccessMessage('Macros saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
    return true;
  };

  const handleDeleteSuccess = () => {
    // Display success message before redirect
    setSuccessMessage('Recipe deleted successfully!');

    // Redirect to recipes list page after showing success message
    setTimeout(() => {
      router.push('/recipes');
    }, 2000); // 2 second delay to show success message
  };

  const handleDeleteError = (error: string) => {
    // Display error message to user
    setErrorMessage(error);
    // Clear error message after 5 seconds
    setTimeout(() => setErrorMessage(''), 5000);
  };

  useEffect(() => {
    if (props.details) {
      setRecipeData(props.details);
      setIsRecipeLoading(false);
    } else {
      if (!router.isReady || typeof recipeName !== 'string') return;
      void fetchRecipe(recipeName);
    }
  }, [props, recipeName, router.isReady, firebase]);

  return (
    <>
      <div className="flex flex-col justify-center items-center relative w-full h-[75vh] mb-32">
        <div
          className={
            `-z-50 mx-0 my-0 overflow-hidden h-screen w-full absolute 
          bg-no-repeat bg-center bg-fixed bg-cover`
          }
          style={{ backgroundImage: `url('${recipeData?.image}')` }}
        // Bg image properties taken from https://css-tricks.com/perfect-full-page-background-image/
        />
        <h1 className="z-30 lg:text-8xl md:text-7xl text-6xl text-center font-bold text-white cursor-text">
          {recipeData?.name}
        </h1>
        {(recipeData?.durationMinutes || recipeData?.servings) && (
          <div className="z-30 mt-4 text-center text-sm font-semibold tracking-wide text-white/90">
            <p>
              (
              {recipeData?.servings && (
                <>
                  {' '}
                  serves:
                  {' '}
                  {recipeData.servings}
                </>
              )}
              {recipeData?.servings && recipeData?.durationMinutes && ', '}
              {recipeData?.durationMinutes && (
                <>
                  time:
                  {' '}
                  {recipeData.durationMinutes}
                  {' '}
                  min
                </>
              )}
              {' '}
              )
            </p>
          </div>
        )}
        {
          isAuthenticated
            ? <EditPictureButton updateFirebaseImage={updateFirebaseImage} />
            : <></>
        }
      </div>
      {/* Responsive content container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-7xl">
          {isRecipeLoading && (
            <div className="mb-8 rounded-3xl border border-gray-200 bg-white px-6 py-8 text-center text-gray-600 shadow-sm">
              Loading recipe…
            </div>
          )}
          {recipeData && (
            <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <TagEditor
                  availableTags={availableTags}
                  isAuthenticated={isAuthenticated}
                  onSave={handleTagSave}
                  selectedTags={recipeData.tags}
                />
                <IngredientEditor
                  ingredients={recipeData.proportions}
                  isAuthenticated={isAuthenticated}
                  onSave={handleIngredientSave}
                  servings={recipeData.servings}
                />
              </div>

              <div
                className="
                  min-w-0 bg-white rounded-lg shadow-lg overflow-hidden
                  min-h-[60vh]
                  border border-gray-200
                "
              >
                <MacroEditor
                  isAuthenticated={isAuthenticated}
                  macros={recipeData.macros}
                  onSave={handleMacroSave}
                />
                <TextEditor
                  editorContent={recipeData.content || ''}
                  isAuthenticated={isAuthenticated}
                  recipeName={String(recipeName)}
                  onContentSave={content => {
                    // Content change callback - will be used in future tasks for auto-save
                    console.log('Content changed:', content);
                  }}
                  onSaveSuccess={() => {
                    setSuccessMessage('Recipe content saved successfully!');
                    setTimeout(() => setSuccessMessage(''), 3000);
                  }}
                  onSaveError={error => {
                    setErrorMessage(`Failed to save content: ${error}`);
                    setTimeout(() => setErrorMessage(''), 5000);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error message display */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage('')}
                className="ml-2 text-red-500 hover:text-red-700"
                aria-label="Close error message"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success message display */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
              <div className="ml-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete button at bottom of page for authenticated users only */}
      {isAuthenticated && recipeData && (
        <div className="flex justify-center pb-8 mt-8">
          <DeleteButton
            recipeName={String(recipeName)}
            onDeleteSuccess={handleDeleteSuccess}
            onDeleteError={handleDeleteError}
          />
        </div>
      )}
    </>
  );
}

import Link from 'next/link';
import { JSX, useContext, useDeferredValue, useEffect, useState } from 'react';
import RecipeToolbar from '../components/list-card-toggle';
import RecipeCard from '../components/recipe-card';
import { fetchImageURL, normalizeTagList, Recipe } from '../utils/recipes';
import { AppContext } from './_app';

function normalizeUnknownTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];

  return normalizeTagList(tags.filter((tag): tag is string => typeof tag === 'string'));
}

function toDisplayableRecipe(recipe: unknown): Recipe | null {
  if (!recipe || typeof recipe !== 'object') return null;

  const recipeData = recipe as Partial<Recipe> & { name?: unknown; tags?: unknown };
  if (typeof recipeData.name !== 'string') return null;

  const normalizedName = recipeData.name.trim();
  if (!normalizedName) return null;

  return {
    ...(recipeData as Recipe),
    name: normalizedName,
    tags: normalizeUnknownTags(recipeData.tags),
  };
}

export default function AllRecipesPage(): JSX.Element {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const { firebase, isAuthenticated } = useContext(AppContext);
  const [listViewActive, setListViewActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredSelectedTags = useDeferredValue(selectedTags);

  const fetchAllRecipes = async () => {
    if (!firebase) return;

    const image = 'https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80';

    const [rawRecipes, tagOptionsDoc] = await Promise.all([
      firebase.queryCollection('recipes'),
      firebase.get('/website/recipe-tags'),
    ]);

    const recipes = Array.isArray(rawRecipes)
      ? rawRecipes
          .map(toDisplayableRecipe)
          .filter((recipe): recipe is Recipe => recipe !== null)
      : [];
    const nextAvailableTags = normalizeTagList([
      ...normalizeUnknownTags(tagOptionsDoc?.tags),
      ...recipes.flatMap(recipe => recipe.tags),
    ]);

    const recipeImageUrls = await Promise.all(
      recipes.map(rec => {
        if (rec.image) return fetchImageURL(rec.image, firebase!!);
        else return image;
      }),
    );

    for (let i = 0; i < recipes.length; i++)
      // TODO: check if the auth token in the image url stays the same or not. if it is then you can just save the image url.
      // Test: image url for spicy zucchini quesadillas on April 10, 2022 was
      // (https://firebasestorage.googleapis.com/v0/b/recipes-b2baa.appspot.com/o/spicy-zucchini-quesadillas.webp?alt=media&token=4b13dc3c-ee71-4257-bedb-f2bf30cf3d3a)
      recipes[i].imageUrl = recipeImageUrls[i];

    setAvailableTags(nextAvailableTags);
    setSelectedTags(currentSelectedTags => currentSelectedTags.filter(tag => nextAvailableTags.includes(tag)));
    setAllRecipes(recipes);
  };

  useEffect(() => {
    void fetchAllRecipes();
  }, [firebase]);

  const filteredRecipes = allRecipes.filter(recipe => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    const matchesSearch = !normalizedQuery || recipe.name.toLowerCase().includes(normalizedQuery);
    if (!matchesSearch) return false;

    if (!deferredSelectedTags.length) return true;

    return deferredSelectedTags.every(tag => recipe.tags.includes(tag));
  });

  const returnCardView = () => {
    return (
      <div className="grid xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 xs:grid-cols-1 grid-flow-row gap-x-6 gap-y-12 m-4  transition-all duration-500 ease-in-out">
        {filteredRecipes.map(recipe => {
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
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <RecipeToolbar
            availableTags={availableTags}
            listViewActive={listViewActive}
            searchQuery={searchQuery}
            selectedTags={selectedTags}
            setSearchQuery={setSearchQuery}
            setSelectedTags={setSelectedTags}
            setListViewActive={setListViewActive}
          />
          {isAuthenticated && (
            <Link
              href="/recipe/new"
              className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 lg:flex-shrink-0"
            >
              New Recipe
            </Link>
          )}
        </div>
        {filteredRecipes.length === 0 && (
          <div className="mx-4 rounded-2xl border border-dashed border-gray-300 bg-white/80 px-6 py-12 text-center text-gray-600 shadow-sm">
            <p className="text-base text-gray-700">No recipes match the current filters.</p>
            {deferredSearchQuery.trim() && (
              <p className="mt-2 text-sm text-gray-500">
                Search:
                {' '}
                <span className="font-semibold text-gray-900">{deferredSearchQuery}</span>
              </p>
            )}
            {deferredSelectedTags.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {deferredSelectedTags.map(tag => (
                  <span
                    key={tag}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        {
          listViewActive ? returnListView() : returnCardView()
        }
      </div>
    </div>
  );
}

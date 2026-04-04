import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, JSX, MouseEvent, useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../_app';
import { DEFAULT_RECIPE_TAGS, normalizeTagList, Proportion, RecipeMacros } from '../../utils/recipes';
import { kebabCase } from '../../utils/recipes';

interface RecipeDraft {
  caloriesPerServing: string;
  carbohydrates: string;
  content: string;
  durationMinutes: string;
  fats: string;
  fiber: string;
  ingredients: string;
  name: string;
  protein: string;
  selectedTags: string[];
  servings: string;
}

function parseMacros(draft: RecipeDraft): RecipeMacros {
  const parseMacroField = (value: string) => value.trim() === '' ? undefined : Number(value);

  return {
    caloriesPerServing: parseMacroField(draft.caloriesPerServing),
    carbohydrates: parseMacroField(draft.carbohydrates),
    fats: parseMacroField(draft.fats),
    fiber: parseMacroField(draft.fiber),
    protein: parseMacroField(draft.protein),
  };
}

function parseIngredientLines(ingredients: string): Proportion[] {
  return ingredients
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/^(\d+(?:\s+\d+\/\d+|\/\d+|\.\d+)?|(?:\d+\/\d+))?\s*([a-zA-Z]+)?\s*(.*)$/);
      const quantity = match?.[1]?.trim() ?? '';
      const unit = match?.[2]?.trim() ?? '';
      const ingredient = (match?.[3]?.trim() || line).trim();

      return {
        ingredient,
        maxQty: quantity,
        minQty: quantity,
        quantity,
        unit,
      };
    });
}

export default function NewRecipePage(): JSX.Element {
  const router = useRouter();
  const { firebase, isAuthenticated, signIn } = useContext(AppContext);
  const allowNavigationRef = useRef(false);
  const [draft, setDraft] = useState<RecipeDraft>({
    caloriesPerServing: '',
    carbohydrates: '',
    content: '',
    durationMinutes: '',
    fats: '',
    fiber: '',
    ingredients: '',
    name: '',
    protein: '',
    selectedTags: [],
    servings: '',
  });
  const [availableTags, setAvailableTags] = useState<string[]>(DEFAULT_RECIPE_TAGS);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTag, setNewTag] = useState('');
  const hasDraftContent = Object.entries(draft).some(([key, value]) => {
    if (key === 'selectedTags') {
      return (value as string[]).length > 0;
    }

    return typeof value === 'string' && value.trim().length > 0;
  });

  useEffect(() => {
    if (!firebase) {
      return;
    }

    const fetchTagOptions = async () => {
      const tagOptionsDoc = await firebase.get('/website/recipe-tags');
      setAvailableTags(normalizeTagList(tagOptionsDoc?.tags ?? DEFAULT_RECIPE_TAGS));
    };

    void fetchTagOptions();
  }, [firebase]);

  const confirmDiscardDraft = (): boolean => {
    if (!hasDraftContent || allowNavigationRef.current) {
      return true;
    }

    return window.confirm(
      'You have unsaved recipe details. If you leave now, your draft will be lost.'
    );
  };

  const handleNavigateAway = async (event: MouseEvent<HTMLElement>, href: string) => {
    event.preventDefault();

    if (!confirmDiscardDraft()) {
      return;
    }

    allowNavigationRef.current = true;
    await router.push(href);
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag) {
      return;
    }

    setAvailableTags(currentAvailableTags => normalizeTagList([...currentAvailableTags, trimmedTag]));
    setDraft(prev => ({
      ...prev,
      selectedTags: normalizeTagList([...prev.selectedTags, trimmedTag]),
    }));
    setNewTag('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedRecipeName = draft.name.trim();
    if (!trimmedRecipeName) {
      setErrorMessage('Recipe name is required.');
      return;
    }

    if (!firebase) {
      setErrorMessage('Firebase is not ready yet. Please refresh and try again.');
      return;
    }

    if (!isAuthenticated) {
      setErrorMessage('You must be signed in to create a recipe.');
      return;
    }

    setIsCreating(true);
    setErrorMessage('');

    try {
      const recipeId = kebabCase(trimmedRecipeName);
      const parsedDuration = draft.durationMinutes.trim() ? Number(draft.durationMinutes) : undefined;
      if (parsedDuration !== undefined && (!Number.isFinite(parsedDuration) || parsedDuration <= 0)) {
        setErrorMessage('Duration must be a positive number of minutes.');
        setIsCreating(false);
        return;
      }

      const parsedServings = draft.servings.trim() ? Number(draft.servings) : undefined;
      if (parsedServings !== undefined && (!Number.isFinite(parsedServings) || parsedServings <= 0)) {
        setErrorMessage('Servings must be a positive number.');
        setIsCreating(false);
        return;
      }

      const existingRecipe = await firebase.get(`recipes/${recipeId}`);
      if (existingRecipe) {
        setErrorMessage('A recipe with that name already exists.');
        setIsCreating(false);
        return;
      }

      const parsedIngredients = parseIngredientLines(draft.ingredients);
      const parsedMacros = parseMacros(draft);
      for (const [key, value] of Object.entries(parsedMacros)) {
        if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
          setErrorMessage(`${key} must be zero or greater.`);
          setIsCreating(false);
          return;
        }
      }
      const parsedTags = normalizeTagList(draft.selectedTags);
      const savedTagOptions = await firebase.put({
        path: '/website/recipe-tags',
        data: {
          tags: normalizeTagList([...availableTags, ...parsedTags]),
        },
      });
      if (!savedTagOptions) {
        throw new Error('Recipe tags could not be saved. Please try again.');
      }
      const timestamp = Timestamp.now();
      const created = await firebase.put({
        path: `recipes/${recipeId}`,
        data: {
          content: draft.content.trim(),
          created: timestamp,
          durationMinutes: parsedDuration,
          lastCooked: timestamp,
          macros: parsedMacros,
          name: trimmedRecipeName,
          proportions: parsedIngredients,
          servings: parsedServings,
          tags: parsedTags,
        },
      });

      if (!created) {
        throw new Error('Firebase rejected the new recipe.');
      }

      allowNavigationRef.current = true;
      await router.push(`/recipe/${recipeId}`);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'An unexpected error occurred while creating the recipe.';
      setErrorMessage(message);
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasDraftContent || allowNavigationRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    const handleRouteChangeStart = () => {
      if (confirmDiscardDraft()) {
        allowNavigationRef.current = true;
        return;
      }

      router.events.emit('routeChangeError');
      throw 'Route change aborted by user';
    };

    router.beforePopState(() => {
      if (confirmDiscardDraft()) {
        allowNavigationRef.current = true;
        return true;
      }

      return false;
    });

    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.beforePopState(() => true);
    };
  }, [hasDraftContent, router]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Sign in to create recipes</h1>
        <p className="mb-8 text-lg text-gray-600">
          Creating recipes is only available to authenticated users.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={signIn}
            className="rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            Sign In
          </button>
          <Link
            href="/recipes"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
          >
            Back to Recipes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-24">
      <Link
        href="/recipes"
        onClick={event => void handleNavigateAway(event, '/recipes')}
        className="mb-8 inline-flex w-fit items-center text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900"
      >
        Back to recipes
      </Link>

      <h1 className="mb-3 text-5xl font-bold text-gray-900">Create a New Recipe</h1>
      <p className="mb-10 text-lg text-gray-600" />

      <form onSubmit={handleSubmit} className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(20rem,0.8fr)]">
          <section className="border-b border-gray-200 px-8 py-8 lg:border-b-0 lg:border-r">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
              Basics
            </p>
            <h2 className="mb-6 text-2xl font-semibold text-gray-900">Name, timing, and tags</h2>

            <label htmlFor="recipe-name" className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Recipe Name
            </label>
            <input
              id="recipe-name"
              name="recipe-name"
              type="text"
              value={draft.name}
              onChange={event => setDraft(prev => ({ ...prev, name: event.target.value }))}
              placeholder="Weeknight Coconut Curry…"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-gray-900 outline-none transition-colors duration-200 focus:border-black focus-visible:ring-2 focus-visible:ring-black/10"
              autoComplete="off"
              autoFocus
            />

            <p className="mt-3 text-sm text-gray-500">
              The URL slug will be generated automatically from the recipe name.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="recipe-duration" className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Duration (Minutes)
                </label>
                <input
                  id="recipe-duration"
                  name="recipe-duration"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={draft.durationMinutes}
                  onChange={event => setDraft(prev => ({ ...prev, durationMinutes: event.target.value }))}
                  placeholder="45…"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-gray-900 outline-none transition-colors duration-200 focus:border-black focus-visible:ring-2 focus-visible:ring-black/10"
                />
              </div>
              <div>
                <label htmlFor="recipe-servings" className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Servings
                </label>
                <input
                  id="recipe-servings"
                  name="recipe-servings"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={draft.servings}
                  onChange={event => setDraft(prev => ({ ...prev, servings: event.target.value }))}
                  placeholder="4…"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-gray-900 outline-none transition-colors duration-200 focus:border-black focus-visible:ring-2 focus-visible:ring-black/10"
                />
              </div>
              <div>
                <label className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Tags
                </label>
                <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      name="new-recipe-tag"
                      value={newTag}
                      onChange={event => setNewTag(event.target.value)}
                      placeholder="Add a new tag…"
                      autoComplete="off"
                      className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors duration-200 focus:border-black focus-visible:ring-2 focus-visible:ring-black/10"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
                      aria-label="Add tag"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => {
                      const isSelected = draft.selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setDraft(prev => ({
                            ...prev,
                            selectedTags: isSelected
                              ? prev.selectedTags.filter(selectedTag => selectedTag !== tag)
                              : normalizeTagList([...prev.selectedTags, tag]),
                          }))}
                          aria-pressed={isSelected}
                          className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 ${
                            isSelected
                              ? 'border-black bg-black text-white'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Pick from your saved tag list. Add
              {' '}
              <span className="font-semibold text-gray-700">Entrée</span>
              {' '}
              if you want the weekly selector to consider this recipe.
            </p>

            <div className="mt-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                Macros Per Serving
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ['caloriesPerServing', 'Calories', 'kcal'],
                  ['protein', 'Protein', 'g'],
                  ['carbohydrates', 'Carbs', 'g'],
                  ['fats', 'Fat', 'g'],
                  ['fiber', 'Fiber', 'g'],
                ].map(([field, label, suffix]) => (
                  <label key={field} className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {label}
                    </span>
                    <div className="flex items-end gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        value={draft[field as keyof RecipeDraft]}
                        onChange={event => setDraft(prev => ({ ...prev, [field]: event.target.value }))}
                        placeholder="0"
                        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-lg font-semibold text-gray-900 outline-none"
                      />
                      <span className="pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {suffix}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-gray-50/70 px-8 py-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
              Structure
            </p>
            <h2 className="mb-6 text-2xl font-semibold text-gray-900">Ingredients and content</h2>

            <label htmlFor="recipe-ingredients" className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Ingredients
            </label>
            <textarea
              id="recipe-ingredients"
              name="recipe-ingredients"
              value={draft.ingredients}
              onChange={event => setDraft(prev => ({ ...prev, ingredients: event.target.value }))}
              placeholder={'1 lb chicken thighs…\n2 tbsp olive oil…\n1 cup coconut milk…'}
              className="min-h-[180px] w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition-colors duration-200 focus:border-black focus-visible:ring-2 focus-visible:ring-black/10"
            />

            <p className="mt-3 text-sm text-gray-500">
              Add one ingredient per line. We&apos;ll parse quantity and unit automatically.
            </p>
          </section>
        </div>

        <section className="border-t border-gray-200 px-8 py-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
            Instructions
          </p>
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">Starting content</h2>
          <label htmlFor="recipe-content" className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-700">
            Recipe Content
          </label>
          <textarea
            id="recipe-content"
            name="recipe-content"
            value={draft.content}
            onChange={event => setDraft(prev => ({ ...prev, content: event.target.value }))}
            placeholder={'Marinate the chicken for 20 minutes…\n\n1. Heat a heavy pot over medium heat…'}
            className="min-h-[240px] w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition-colors duration-200 focus:border-black focus-visible:ring-2 focus-visible:ring-black/10"
          />

          <p className="mt-3 text-sm text-gray-500">
            You can keep refining the rich text content after creation.
          </p>
        </section>

        {errorMessage && (
          <div className="mx-8 mb-0 mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" aria-live="polite">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 border-t border-gray-200 px-8 py-6">
          <button
            type="submit"
            disabled={isCreating}
            className={`rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 ${
              isCreating ? 'cursor-not-allowed bg-slate-400' : 'bg-black hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20'
            }`}
          >
            {isCreating ? 'Creating Recipe…' : 'Create Recipe & Open Editor'}
          </button>
          <Link
            href="/recipes"
            onClick={event => void handleNavigateAway(event, '/recipes')}
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

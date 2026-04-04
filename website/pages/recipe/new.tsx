import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, JSX, MouseEvent, useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../_app';
import { Proportion, RecipeMacros } from '../../utils/recipes';
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
  servings: string;
  tags: string;
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

function parseTags(tags: string): string[] {
  return Array.from(
    new Set(
      tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
    ),
  );
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
    servings: '',
    tags: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const hasDraftContent = Object.values(draft).some(value => value.trim().length > 0);

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
      const parsedTags = parseTags(draft.tags);
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
                <label htmlFor="recipe-tags" className="mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Tags
                </label>
                <input
                  id="recipe-tags"
                  name="recipe-tags"
                  type="text"
                  value={draft.tags}
                  onChange={event => setDraft(prev => ({ ...prev, tags: event.target.value }))}
                  placeholder="Entrée, Vegetarian, Weeknight…"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-gray-900 outline-none transition-colors duration-200 focus:border-black focus-visible:ring-2 focus-visible:ring-black/10"
                  autoComplete="off"
                />
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Separate tags with commas. Add
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

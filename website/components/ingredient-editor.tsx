import { JSX, useEffect, useState } from 'react';
import { Proportion } from '../utils/recipes';

interface IngredientEditorProps {
  ingredients?: Proportion[];
  isAuthenticated: boolean;
  onSave: (payload: { ingredients: Proportion[]; servings?: number }) => Promise<boolean>;
  servings?: number;
}

function parseFractionToken(token: string): number | null {
  if (!token) return null;

  if (!token.includes('/')) {
    const parsedNumber = Number(token);
    return Number.isFinite(parsedNumber) ? parsedNumber : null;
  }

  const [numerator, denominator] = token.split('/');
  const parsedNumerator = Number(numerator);
  const parsedDenominator = Number(denominator);

  if (!Number.isFinite(parsedNumerator) || !Number.isFinite(parsedDenominator) || parsedDenominator === 0) {
    return null;
  }

  return parsedNumerator / parsedDenominator;
}

function parseQuantityString(quantity: string): number | null {
  const normalizedQuantity = quantity.trim();
  if (!normalizedQuantity) return null;

  const parts = normalizedQuantity.split(/\s+/);
  let total = 0;

  for (const part of parts) {
    const parsedPart = parseFractionToken(part);
    if (parsedPart === null) {
      return null;
    }
    total += parsedPart;
  }

  return total;
}

function formatScaledQuantity(value: number): string {
  const roundedValue = Math.round(value * 100) / 100;
  const wholeNumber = Math.floor(roundedValue);
  const fractionPart = roundedValue - wholeNumber;
  const fractionCandidates = [
    { denominator: 2, label: '1/2' },
    { denominator: 3, label: '1/3' },
    { denominator: 3, label: '2/3', numerator: 2 },
    { denominator: 4, label: '1/4' },
    { denominator: 4, label: '3/4', numerator: 3 },
    { denominator: 8, label: '1/8' },
    { denominator: 8, label: '3/8', numerator: 3 },
    { denominator: 8, label: '5/8', numerator: 5 },
    { denominator: 8, label: '7/8', numerator: 7 },
  ];

  for (const candidate of fractionCandidates) {
    const numerator = candidate.numerator ?? 1;
    const candidateValue = numerator / candidate.denominator;
    if (Math.abs(fractionPart - candidateValue) < 0.03) {
      if (wholeNumber === 0) {
        return candidate.label;
      }

      return `${wholeNumber} ${candidate.label}`;
    }
  }

  if (Math.abs(roundedValue - wholeNumber) < 0.01) {
    return `${wholeNumber}`;
  }

  return `${roundedValue}`.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function scaleQuantity(quantity: string, baseServings?: number, previewServings?: number): string | null {
  if (!baseServings || !previewServings || baseServings <= 0 || previewServings <= 0) {
    return null;
  }

  const parsedQuantity = parseQuantityString(quantity);
  if (parsedQuantity === null) {
    return null;
  }

  return formatScaledQuantity((parsedQuantity / baseServings) * previewServings);
}

function formatIngredientLine({
  ingredient,
  quantity,
  unit,
}: {
  ingredient: string;
  quantity: string;
  unit: string;
}): string {
  return [quantity, unit, ingredient]
    .map(part => part.trim())
    .filter(Boolean)
    .join(' ');
}

function normalizeIngredients(ingredients: Proportion[] | undefined): Proportion[] {
  if (!ingredients?.length) {
    return [];
  }

  return ingredients.map(ingredient => ({
    ingredient: ingredient.ingredient ?? '',
    maxQty: ingredient.maxQty ?? ingredient.quantity ?? '',
    minQty: ingredient.minQty ?? ingredient.quantity ?? '',
    quantity: ingredient.quantity ?? '',
    unit: ingredient.unit ?? '',
  }));
}

function createEmptyIngredient(): Proportion {
  return {
    ingredient: '',
    maxQty: '',
    minQty: '',
    quantity: '',
    unit: '',
  };
}

function sanitizeIngredients(ingredients: Proportion[]): Proportion[] {
  return ingredients
    .map(ingredient => ({
      ingredient: ingredient.ingredient.trim(),
      maxQty: ingredient.quantity.trim(),
      minQty: ingredient.quantity.trim(),
      quantity: ingredient.quantity.trim(),
      unit: ingredient.unit.trim(),
    }))
    .filter(ingredient => ingredient.ingredient.length > 0);
}

function areIngredientsEqual(left: Proportion[], right: Proportion[]): boolean {
  return JSON.stringify(sanitizeIngredients(left)) === JSON.stringify(sanitizeIngredients(right));
}

export default function IngredientEditor({
  ingredients,
  isAuthenticated,
  onSave,
  servings,
}: IngredientEditorProps): JSX.Element {
  const [draftIngredients, setDraftIngredients] = useState<Proportion[]>(normalizeIngredients(ingredients));
  const [savedIngredients, setSavedIngredients] = useState<Proportion[]>(normalizeIngredients(ingredients));
  const [draftServings, setDraftServings] = useState(servings?.toString() ?? '');
  const [savedServings, setSavedServings] = useState(servings?.toString() ?? '');
  const [previewServings, setPreviewServings] = useState(servings?.toString() ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const normalizedIngredients = normalizeIngredients(ingredients);
    setDraftIngredients(
      normalizedIngredients.length || !isAuthenticated
        ? normalizedIngredients
        : [createEmptyIngredient()],
    );
    setSavedIngredients(normalizedIngredients);
    setDraftServings(servings?.toString() ?? '');
    setSavedServings(servings?.toString() ?? '');
    setPreviewServings(servings?.toString() ?? '');
    setErrorMessage('');
  }, [ingredients, servings, isAuthenticated]);

  const hasUnsavedChanges = !areIngredientsEqual(draftIngredients, savedIngredients) || draftServings !== savedServings;
  const visibleIngredients = draftIngredients.length ? draftIngredients : [createEmptyIngredient()];
  const parsedBaseServings = draftServings.trim() ? Number(draftServings) : undefined;
  const parsedPreviewServings = previewServings.trim() ? Number(previewServings) : parsedBaseServings;
  const currentPreviewServings = parsedPreviewServings && parsedPreviewServings > 0
    ? Math.round(parsedPreviewServings)
    : parsedBaseServings && parsedBaseServings > 0
      ? Math.round(parsedBaseServings)
      : 1;

  const updateIngredient = (index: number, key: keyof Proportion, value: string) => {
    setDraftIngredients(currentIngredients => currentIngredients.map((ingredient, ingredientIndex) => {
      if (ingredientIndex !== index) return ingredient;

      if (key === 'quantity') {
        return {
          ...ingredient,
          maxQty: value,
          minQty: value,
          quantity: value,
        };
      }

      return {
        ...ingredient,
        [key]: value,
      };
    }));
  };

  const addIngredient = () => {
    setDraftIngredients(currentIngredients => [
      ...currentIngredients,
      createEmptyIngredient(),
    ]);
  };

  const updatePreviewServings = (delta: number) => {
    const nextPreviewServings = Math.max(1, currentPreviewServings + delta);
    setPreviewServings(String(nextPreviewServings));
  };

  const removeIngredient = (index: number) => {
    setDraftIngredients(currentIngredients => currentIngredients.filter((_, ingredientIndex) => ingredientIndex !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      const nextIngredients = sanitizeIngredients(draftIngredients);
      const nextServings = draftServings.trim() ? Number(draftServings) : undefined;
      if (nextServings !== undefined && (!Number.isFinite(nextServings) || nextServings <= 0)) {
        throw new Error('Servings must be a positive number.');
      }

      const success = await onSave({
        ingredients: nextIngredients,
        servings: nextServings,
      });

      if (!success) {
        throw new Error('Could not save ingredients and servings. Please try again.');
      }

      setDraftIngredients(nextIngredients);
      setSavedIngredients(nextIngredients);
      setSavedServings(draftServings.trim() ? draftServings.trim() : '');
      if (!previewServings.trim() || previewServings === savedServings) {
        setPreviewServings(draftServings.trim());
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save ingredients and servings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="px-6 py-6">
      {errorMessage && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" aria-live="polite">
          {errorMessage}
        </div>
      )}

      <div className="mb-5 py-4 sm:py-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => updatePreviewServings(-1)}
            aria-label="Decrease preview servings"
            className="inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-gray-300 bg-white text-gray-700 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => updatePreviewServings(1)}
            aria-label="Increase preview servings"
            className="inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-gray-300 bg-white text-gray-700 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="min-w-[9rem] text-xl font-semibold tracking-tight text-gray-900">
            {currentPreviewServings}
            {' '}
            {currentPreviewServings === 1 ? 'Serving' : 'Servings'}
          </div>
        </div>

        {isAuthenticated
          ? (
              <div className="mt-4 grid gap-3]">
                <label className="block min-w-0">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Change Default Recipe Servings
                  </span>

                  <input
                    type="number"
                    name="recipe-servings"
                    min="1"
                    inputMode="numeric"
                    value={draftServings}
                    onChange={event => setDraftServings(event.target.value)}
                    placeholder="4…"
                    autoComplete="off"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors duration-200 focus:border-black focus-visible:ring-2 focus-visible:ring-black/10"
                  />
                </label>
              </div>
            )
          : <></>}
      </div>

      <div className="my-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-md font-bold uppercase tracking-[0.24em] text-gray-800">
            Ingredients
          </p>
        </div>
      </div>

      <div className={isAuthenticated ? 'space-y-3' : 'space-y-2'}>
        {visibleIngredients.map((ingredient, index) => {
          const scaledQuantity = scaleQuantity(ingredient.quantity, parsedBaseServings, parsedPreviewServings);
          const displayLine = formatIngredientLine({
            ingredient: ingredient.ingredient,
            quantity: scaledQuantity || ingredient.quantity,
            unit: ingredient.unit,
          });

          return (
            isAuthenticated
              ? (
                  <div
                    key={index}
                    className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50/80 p-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,2fr)_auto]"
                  >
                    <label className="block min-w-0">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Qty
                      </span>
                      <input
                        type="text"
                        name={`ingredient-quantity-${index}`}
                        value={ingredient.quantity}
                        onChange={event => updateIngredient(index, 'quantity', event.target.value)}
                        placeholder="1"
                        autoComplete="off"
                        className="w-full rounded-xl border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 outline-none transition-colors duration-200 focus:border-black focus-visible:ring-2 focus-visible:ring-black/10"
                      />
                    </label>

                    <label className="block min-w-0">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Unit
                      </span>
                      <input
                        type="text"
                        name={`ingredient-unit-${index}`}
                        value={ingredient.unit}
                        onChange={event => updateIngredient(index, 'unit', event.target.value)}
                        placeholder="cup"
                        autoComplete="off"
                        className="w-full rounded-xl border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 outline-none transition-colors duration-200 focus:border-black focus-visible:ring-2 focus-visible:ring-black/10"
                      />
                    </label>

                    <label className="block min-w-0">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Ingredient
                      </span>
                      <input
                        type="text"
                        name={`ingredient-name-${index}`}
                        value={ingredient.ingredient}
                        onChange={event => updateIngredient(index, 'ingredient', event.target.value)}
                        placeholder="Coconut milk…"
                        autoComplete="off"
                        className="w-full rounded-xl border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 outline-none transition-colors duration-200 focus:border-black focus-visible:ring-2 focus-visible:ring-black/10"
                      />
                    </label>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        aria-label={`Remove ingredient ${index + 1}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition-colors duration-200 hover:border-red-300 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              : (
                  <div
                    key={index}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-[0.55rem] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" aria-hidden="true" />
                    <p className="text-base font-normal leading-relaxed text-gray-800 break-words">
                      {displayLine || '—'}
                    </p>
                  </div>
                )
          );
        })}
      </div>

      {isAuthenticated && (
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={addIngredient}
            aria-label="Add ingredient"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            aria-label={isSaving ? 'Saving ingredients' : 'Save ingredients'}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
              isSaving || !hasUnsavedChanges
                ? 'cursor-not-allowed bg-slate-400'
                : 'bg-black hover:bg-slate-800'
            }`}
          >
            {isSaving
              ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-b-white" />
                )
              : (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
          </button>
        </div>
      )}
    </section>
  );
}

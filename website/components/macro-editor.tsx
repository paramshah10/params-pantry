import { JSX, useEffect, useState } from 'react';
import { RecipeMacros } from '../utils/recipes';

interface MacroEditorProps {
  isAuthenticated: boolean;
  macros?: RecipeMacros;
  onSave: (macros: RecipeMacros) => Promise<boolean>;
}

interface MacroField {
  accentClassName: string;
  accentLabelClassName: string;
  accentValueClassName: string;
  id: keyof RecipeMacros;
  label: string;
  suffix: string;
}

const MACRO_FIELDS: MacroField[] = [
  {
    id: 'caloriesPerServing',
    label: 'Calories',
    suffix: 'kcal',
    accentClassName: 'border-blue-200 bg-blue-950/[0.04]',
    accentLabelClassName: 'text-blue-900',
    accentValueClassName: 'text-blue-950',
  },
  {
    id: 'protein',
    label: 'Protein',
    suffix: 'g',
    accentClassName: 'border-red-200 bg-red-500/[0.06]',
    accentLabelClassName: 'text-red-800',
    accentValueClassName: 'text-red-900',
  },
  {
    id: 'carbohydrates',
    label: 'Carbs',
    suffix: 'g',
    accentClassName: 'border-purple-200 bg-purple-500/[0.07]',
    accentLabelClassName: 'text-purple-800',
    accentValueClassName: 'text-purple-900',
  },
  {
    id: 'fats',
    label: 'Fat',
    suffix: 'g',
    accentClassName: 'border-sky-200 bg-sky-400/[0.10]',
    accentLabelClassName: 'text-sky-800',
    accentValueClassName: 'text-sky-900',
  },
  {
    id: 'fiber',
    label: 'Fiber',
    suffix: 'g',
    accentClassName: 'border-emerald-200 bg-emerald-500/[0.08]',
    accentLabelClassName: 'text-emerald-800',
    accentValueClassName: 'text-emerald-900',
  },
];

function normalizeMacros(macros?: RecipeMacros): RecipeMacros {
  return {
    caloriesPerServing: macros?.caloriesPerServing,
    carbohydrates: macros?.carbohydrates,
    fats: macros?.fats,
    fiber: macros?.fiber,
    protein: macros?.protein,
  };
}

function serializeMacros(macros: RecipeMacros): string {
  return JSON.stringify(normalizeMacros(macros));
}

export default function MacroEditor({
  isAuthenticated,
  macros,
  onSave,
}: MacroEditorProps): JSX.Element {
  const [draftMacros, setDraftMacros] = useState<RecipeMacros>(normalizeMacros(macros));
  const [savedMacros, setSavedMacros] = useState<RecipeMacros>(normalizeMacros(macros));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const normalizedMacros = normalizeMacros(macros);
    setDraftMacros(normalizedMacros);
    setSavedMacros(normalizedMacros);
    setErrorMessage('');
  }, [macros]);

  const hasUnsavedChanges = serializeMacros(draftMacros) !== serializeMacros(savedMacros);

  const handleMacroChange = (field: keyof RecipeMacros, value: string) => {
    setDraftMacros(currentMacros => ({
      ...currentMacros,
      [field]: value.trim() === '' ? undefined : Number(value),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      for (const field of MACRO_FIELDS) {
        const value = draftMacros[field.id];
        if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
          throw new Error(`${field.label} must be zero or greater.`);
        }
      }

      const normalizedMacros = normalizeMacros(draftMacros);
      const success = await onSave(normalizedMacros);
      if (!success) {
        throw new Error('Could not save macros. Please try again.');
      }

      setSavedMacros(normalizedMacros);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save macros.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="border-b border-gray-200 px-5 py-5 sm:px-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
            Macros Per Serving
          </p>
        </div>
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            aria-label={isSaving ? 'Saving macros' : 'Save macros'}
            className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
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
        )}
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" aria-live="polite">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {MACRO_FIELDS.map(field => (
          <div key={field.id} className={`rounded-2xl border px-4 py-4 ${field.accentClassName}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${field.accentLabelClassName}`}>
              {field.label}
            </p>
            {isAuthenticated
              ? (
                  <label className="mt-3 flex items-end gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      inputMode="decimal"
                      value={draftMacros[field.id] ?? ''}
                      onChange={event => handleMacroChange(field.id, event.target.value)}
                      placeholder="0"
                      className={`min-w-0 flex-1 border-0 bg-transparent p-0 text-2xl font-semibold tracking-tight outline-none placeholder:text-gray-300 ${field.accentValueClassName}`}
                    />
                    <span className={`pb-1 text-xs font-semibold uppercase tracking-wide ${field.accentLabelClassName}`}>
                      {field.suffix}
                    </span>
                  </label>
                )
              : (
                  <div className="mt-3 flex items-end gap-2">
                    <span className={`text-2xl font-semibold tracking-tight ${field.accentValueClassName}`}>
                      {draftMacros[field.id] ?? '—'}
                    </span>
                    <span className={`pb-1 text-xs font-semibold uppercase tracking-wide ${field.accentLabelClassName}`}>
                      {field.suffix}
                    </span>
                  </div>
                )}
          </div>
        ))}
      </div>
    </section>
  );
}

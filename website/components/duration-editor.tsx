import { JSX, useEffect, useState } from 'react';

interface DurationEditorProps {
  durationMinutes?: number;
  isAuthenticated: boolean;
  onSave: (durationMinutes?: number) => Promise<boolean>;
}

export default function DurationEditor({
  durationMinutes,
  isAuthenticated,
  onSave,
}: DurationEditorProps): JSX.Element {
  const [draftDuration, setDraftDuration] = useState(durationMinutes?.toString() ?? '');
  const [savedDuration, setSavedDuration] = useState(durationMinutes?.toString() ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setDraftDuration(durationMinutes?.toString() ?? '');
    setSavedDuration(durationMinutes?.toString() ?? '');
    setErrorMessage('');
  }, [durationMinutes]);

  const hasUnsavedChanges = draftDuration !== savedDuration;
  const parsedDuration = draftDuration.trim() ? Number(draftDuration) : undefined;

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      if (
        parsedDuration !== undefined
        && (!Number.isFinite(parsedDuration) || parsedDuration <= 0 || !Number.isInteger(parsedDuration))
      ) {
        throw new Error('Cook time must be a positive whole number of minutes.');
      }

      const success = await onSave(parsedDuration);
      if (!success) {
        throw new Error('Could not save cook time. Please try again.');
      }

      setSavedDuration(draftDuration.trim());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save cook time.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated && durationMinutes === undefined) {
    return <></>;
  }

  return (
    <section className="border-b border-gray-200 px-6 py-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
            Cook Time
          </p>
          {!isAuthenticated && (
            <p className="text-2xl font-semibold tracking-tight text-gray-900">
              {durationMinutes}
              {' '}
              min
            </p>
          )}
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            aria-label={isSaving ? 'Saving cook time' : 'Save cook time'}
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

      {isAuthenticated && (
        <label className="block min-w-0">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Minutes
          </span>
          <input
            type="number"
            name="recipe-duration"
            min="1"
            inputMode="numeric"
            value={draftDuration}
            onChange={event => setDraftDuration(event.target.value)}
            placeholder="45…"
            autoComplete="off"
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors duration-200 focus:border-black focus-visible:ring-2 focus-visible:ring-black/10"
          />
        </label>
      )}
    </section>
  );
}

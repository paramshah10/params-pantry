import { JSX, useEffect, useState } from 'react';
import { normalizeTagList } from '../utils/recipes';

interface TagEditorProps {
  availableTags: string[];
  isAuthenticated: boolean;
  onSave: (payload: { availableTags: string[]; selectedTags: string[] }) => Promise<boolean>;
  selectedTags: string[];
}

function arraysEqual(leftItems: string[], rightItems: string[]): boolean {
  return JSON.stringify(normalizeTagList(leftItems)) === JSON.stringify(normalizeTagList(rightItems));
}

export default function TagEditor({
  availableTags,
  isAuthenticated,
  onSave,
  selectedTags,
}: TagEditorProps): JSX.Element {
  const [draftAvailableTags, setDraftAvailableTags] = useState<string[]>(normalizeTagList(availableTags));
  const [draftSelectedTags, setDraftSelectedTags] = useState<string[]>(normalizeTagList(selectedTags));
  const [savedAvailableTags, setSavedAvailableTags] = useState<string[]>(normalizeTagList(availableTags));
  const [savedSelectedTags, setSavedSelectedTags] = useState<string[]>(normalizeTagList(selectedTags));
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const normalizedAvailableTags = normalizeTagList(availableTags);
    const normalizedSelectedTags = normalizeTagList(selectedTags);
    setDraftAvailableTags(normalizedAvailableTags);
    setDraftSelectedTags(normalizedSelectedTags);
    setSavedAvailableTags(normalizedAvailableTags);
    setSavedSelectedTags(normalizedSelectedTags);
    setNewTag('');
    setErrorMessage('');
  }, [availableTags, selectedTags]);

  const hasUnsavedChanges = !arraysEqual(draftAvailableTags, savedAvailableTags) || !arraysEqual(draftSelectedTags, savedSelectedTags);
  const displayedTags = isAuthenticated ? draftAvailableTags : draftSelectedTags;

  const toggleTag = (tag: string) => {
    if (!isAuthenticated) {
      return;
    }

    setDraftSelectedTags(currentSelectedTags => currentSelectedTags.includes(tag)
      ? currentSelectedTags.filter(selectedTag => selectedTag !== tag)
      : normalizeTagList([...currentSelectedTags, tag]));
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag) {
      return;
    }

    const normalizedTags = normalizeTagList([...draftAvailableTags, trimmedTag]);
    setDraftAvailableTags(normalizedTags);
    setDraftSelectedTags(currentSelectedTags => normalizeTagList([...currentSelectedTags, trimmedTag]));
    setNewTag('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      const nextAvailableTags = normalizeTagList(draftAvailableTags);
      const nextSelectedTags = normalizeTagList(draftSelectedTags);
      const success = await onSave({
        availableTags: nextAvailableTags,
        selectedTags: nextSelectedTags,
      });

      if (!success) {
        throw new Error('Could not save tags. Please try again.');
      }

      setSavedAvailableTags(nextAvailableTags);
      setSavedSelectedTags(nextSelectedTags);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save tags.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="border-t border-gray-200 px-5 py-5 sm:px-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="mb-2 text-s font-semibold uppercase tracking-[0.24em] text-gray-500">
          Tags
        </div>
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            aria-label={isSaving ? 'Saving tags' : 'Save tags'}
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
        <div className="mb-4 flex gap-3">
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
      )}

      <div className="flex flex-wrap gap-3">
        {displayedTags.length
          ? displayedTags.map(tag => {
              const isSelected = draftSelectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  disabled={!isAuthenticated}
                  aria-pressed={isAuthenticated ? isSelected : undefined}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    isSelected
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 bg-white text-gray-700'
                  } ${isAuthenticated ? 'hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 cursor-pointer' : 'cursor-default'}`}
                >
                  {tag}
                </button>
              );
            })
          : (
              <p className="text-sm text-gray-500">No tags yet.</p>
            )}
      </div>
    </section>
  );
}

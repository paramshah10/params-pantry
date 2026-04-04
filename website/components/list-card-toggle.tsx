import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { normalizeTagList } from '../utils/recipes';

interface RecipeToolbarProps {
  availableTags: string[];
  listViewActive: boolean;
  searchQuery: string;
  selectedTags: string[];
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSelectedTags: Dispatch<SetStateAction<string[]>>;
  setListViewActive: Dispatch<SetStateAction<boolean>>;
}

export default function RecipeToolbar(props: RecipeToolbarProps) {
  const hasActiveFilters = props.searchQuery.trim().length > 0 || props.selectedTags.length > 0;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center">
        <SearchTool searchQuery={props.searchQuery} setSearchQuery={props.setSearchQuery} />
        {props.availableTags.length > 0 && (
          <TagFilterDropdown
            availableTags={props.availableTags}
            selectedTags={props.selectedTags}
            setSelectedTags={props.setSelectedTags}
          />
        )}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              props.setSearchQuery('');
              props.setSelectedTags([]);
            }}
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:border-gray-400 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 lg:flex-shrink-0"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

interface SearchToolProps {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

export function SearchTool({ searchQuery, setSearchQuery }: SearchToolProps) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-gray-300 bg-white px-4 py-3 shadow-sm transition-colors duration-200 focus-within:border-black focus-within:ring-2 focus-within:ring-black/10">
      <svg
        className="h-4 w-4 flex-shrink-0 text-gray-500"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M8.5 14a5.5 5.5 0 1 1 3.89-1.61L17 17" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <input
        type="search"
        name="recipe-search"
        value={searchQuery}
        onChange={event => setSearchQuery(event.target.value)}
        placeholder="Search recipes…"
        aria-label="Search recipes"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
      />
    </label>
  );
}

interface TagFiltersProps {
  availableTags: string[];
  selectedTags: string[];
  setSelectedTags: Dispatch<SetStateAction<string[]>>;
}

function TagFilterDropdown({ availableTags, selectedTags, setSelectedTags }: TagFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(currentSelectedTags => currentSelectedTags.includes(tag)
      ? currentSelectedTags.filter(selectedTag => selectedTag !== tag)
      : normalizeTagList([...currentSelectedTags, tag]));
  };

  const selectedTagsLabel = selectedTags.length === 0
    ? 'Tags'
    : selectedTags.length === 1
      ? selectedTags[0]
      : `${selectedTags.length} tags`;

  return (
    <div ref={dropdownRef} className="relative lg:flex-shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(currentValue => !currentValue)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`inline-flex h-12 min-w-40 items-center justify-between gap-3 rounded-2xl border bg-white px-4 text-sm font-semibold shadow-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 ${
          selectedTags.length > 0
            ? 'border-black text-gray-900'
            : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-100'
        }`}
      >
        <span className="truncate">{selectedTagsLabel}</span>
        <svg
          className={`h-4 w-4 flex-shrink-0 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M5 7.5 10 12.5l5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
              Filter By Tag
            </div>
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 transition-colors duration-200 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10"
              >
                Reset
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto pr-1">
            <div className="flex flex-col gap-2">
              {availableTags.map(tag => {
                const isSelected = selectedTags.includes(tag);

                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={isSelected}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 ${
                      isSelected
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span>{tag}</span>
                    <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isSelected ? 'text-white/80' : 'text-transparent'}`}>
                      On
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Dispatch, SetStateAction } from 'react';

interface RecipeToolbarProps {
  listViewActive: boolean;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setListViewActive: Dispatch<SetStateAction<boolean>>;
}

export default function RecipeToolbar(props: RecipeToolbarProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center">
      <ListCardToggleProps listViewActive={props.listViewActive} setListViewActive={props.setListViewActive} />
      <SearchTool searchQuery={props.searchQuery} setSearchQuery={props.setSearchQuery} />
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

interface ListCardToggleProps {
  listViewActive: boolean;
  setListViewActive: Dispatch<SetStateAction<boolean>>;
}

export function ListCardToggleProps(props: ListCardToggleProps) {
  const buttonCSS = 'w-24 rounded-xl px-4 py-3 font-medium transition-colors duration-200';

  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-gray-300 bg-white p-1 shadow-sm">
      <button
        type="button"
        className={`${buttonCSS} ${props.listViewActive ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-100'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20`}
        onClick={() => props.setListViewActive(true)}
      >
        List
      </button>
      <button
        type="button"
        className={`${buttonCSS} ${!props.listViewActive ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-100'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20`}
        onClick={() => props.setListViewActive(false)}
      >
        Card
      </button>
    </div>
  );
}

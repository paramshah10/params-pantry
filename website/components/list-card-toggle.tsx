import { Dispatch, SetStateAction } from 'react';

interface RecipeToolbarProps {
  listViewActive: boolean;
  setListViewActive: Dispatch<SetStateAction<boolean>>;
}

export default function RecipeToolbar(props: RecipeToolbarProps) {
  return (
    <div className="flex justify-left ml-8 mb-8 gap-6 h-9">
      <ListCardToggleProps listViewActive={props.listViewActive} setListViewActive={props.setListViewActive} />
      <SearchTool />
    </div>
  );
}

export function SearchTool() {
  return (
    <div className="bg-white rounded-lg border border-black border-2 content-center py-1 px-6 w-9/12">
      Search
    </div>
  );
}

interface ListCardToggleProps {
  listViewActive: boolean;
  setListViewActive: Dispatch<SetStateAction<boolean>>;
}

export function ListCardToggleProps(props: ListCardToggleProps) {
  const buttonCSS = 'w-24 font-medium';

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        className={`${buttonCSS} rounded-lg ${props.listViewActive ? 'bg-black text-white' : 'bg-white'}`}
        onClick={() => props.setListViewActive(true)}
      >
        List
      </button>
      <button
        className={`${buttonCSS} rounded-lg ${!props.listViewActive ? 'bg-black text-white' : 'bg-white'}`}
        onClick={() => props.setListViewActive(false)}
      >
        Card
      </button>
    </div>
  );
}

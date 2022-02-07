import Link from 'next/link';
import { kebabCase, Recipe } from '../utils/recipes';

interface RecipeCardProps {
  recipe: Recipe
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={'recipe/' + kebabCase(recipe.name)} passHref>
      <div className="first:pl-6 last:pr-[calc(100%-21.5rem)] flex flex-col items-center">
        {/* Background image instead of img to maintain aspect ratio of the picture */}
        {/* <img src={props.img} className="w-56 h-72 rounded-xl shadow-xl bg-white" alt="Recipe food" /> */}
        <div className="w-56 h-72 rounded-xl shadow-xl bg-no-repeat bg-center bg-cover cursor-pointer"
          style={{ backgroundImage: `url(${recipe.image})` }}
        />
        <p className="text-xl mt-4 font-medium font-black text-center">
          {recipe.name}
        </p>
      </div>
    </Link>
  );
}

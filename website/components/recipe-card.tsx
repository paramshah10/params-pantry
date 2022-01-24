interface RecipeCardProps {
  img: string
  title: string
}

export default function RecipeCard(props: RecipeCardProps) {
  return (
    <div className="first:pl-6 last:pr-[calc(100%-21.5rem)] flex flex-col items-center">
      {/* Background image instead of img to maintain aspect ratio of the picture */}
      {/* <img src={props.img} className="w-56 h-72 rounded-xl shadow-xl bg-white" alt="Recipe food" /> */}
      <div className="w-56 h-72 rounded-xl shadow-xl bg-no-repeat bg-center bg-cover"
        style={{ backgroundImage: `url(${props.img})` }}
      />
      <p className="text-xl mt-4 font-medium font-black text-center">
        {props.title}
      </p>
    </div>
  );
}

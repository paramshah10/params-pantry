import { useEffect, useState } from 'react';
// Check out: https://github.com/import-js/eslint-plugin-import/issues/2266
/* eslint-disable import/no-unresolved */
import { Swiper, SwiperSlide } from 'swiper/react';
import { Recipe } from '../utils/recipes';
import RecipeCard from './recipe-card';
import 'swiper/css';

interface RecipeCarouselProps {
  recipes?: Recipe[]
}

export default function RecipeCarousel({ recipes }: RecipeCarouselProps) {
  const [numSlides, setNumSlides] = useState(3.2);

  useEffect(() => {
    const updateSlides = () => {
      const windowSize = [window.innerWidth, window.innerHeight];
      const remainder = windowSize[0] / 3000;
      const remainder2 = windowSize[0] / 5000;

      if (windowSize[0] < 620)
        setNumSlides(1.1 + remainder);
      else if (windowSize[0] < 1000)
        setNumSlides(2.1 + remainder);
      else if (windowSize[0] < 1300)
        setNumSlides(3.2 + remainder);
      else if (windowSize[0] < 1600)
        setNumSlides(4.5 + remainder + remainder2);
      else
        setNumSlides(4.5 + remainder + 3*remainder2);
    };

    window.addEventListener('resize', updateSlides);
    updateSlides();
    return () => window.removeEventListener('resize', updateSlides);
  });

  return (
    <div className="w-full py-10 px-4 m-4 overflow-x-clip">
      <Swiper slidesPerView={numSlides}
        className="flex flex-col items-center w-full h-96"
      >
        {recipes.map(recipe =>
          <SwiperSlide key={recipe.name}>
            <RecipeCard recipe={recipe} />
          </SwiperSlide>,
        )}
      </Swiper>
    </div>
  );
}

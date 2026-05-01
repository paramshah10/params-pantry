// Check out: https://github.com/import-js/eslint-plugin-import/issues/2266
import { Swiper, SwiperSlide } from 'swiper/react';
import { Recipe } from '../utils/recipes';
import RecipeCard from './recipe-card';
import 'swiper/css';

interface RecipeCarouselProps {
  recipes?: Recipe[];
}

export default function RecipeCarousel({ recipes }: RecipeCarouselProps) {
  return (
    <div className="w-full max-w-5xl mx-auto py-10 px-8 overflow-visible">
      <Swiper
        centerInsufficientSlides
        slidesPerView="auto"
        spaceBetween={32}
        className="w-full h-96 !overflow-visible"
      >
        {recipes?.map(recipe => (
          <SwiperSlide key={recipe.name} className="!w-56">
            <RecipeCard recipe={recipe} />
          </SwiperSlide>
        ),
        )}
      </Swiper>
    </div>
  );
}

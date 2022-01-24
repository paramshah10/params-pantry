import { useEffect, useState } from 'react';
// Check out: https://github.com/import-js/eslint-plugin-import/issues/2266
/* eslint-disable import/no-unresolved */
import { Swiper, SwiperSlide } from 'swiper/react';
import RecipeCard from './recipe-card';
/* eslint-disable import/no-unresolved */
import 'swiper/css';

export default function RecipeCarousel() {
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

  const images = [
    { src: 'https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80', title: 'Paneer Tikka Masala'},
    { src: 'https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80', title: 'Tofu with Szechuan Peppercorns'},
    { src: 'https://images.unsplash.com/photo-1622890806166-111d7f6c7c97?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80', title: 'Anda Bhurji'},
    { src: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80', title: 'Tostadas'},
    { src: 'https://images.unsplash.com/photo-1575424909138-46b05e5919ec?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80', title: 'Sev Usal'},
    { src: 'https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80', title: 'Adai'},
    { src: 'https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80', title: 'Pav Bhaji'},
  ];
  return (
    <div className="w-full p-4 m-4">
      <Swiper slidesPerView={numSlides}
        className="flex flex-col items-center w-full"
      >
        {images.map(image =>
          <SwiperSlide key={image.src}>
            <RecipeCard img={image.src} title={image.title}/>
          </SwiperSlide>,
        )}
      </Swiper>
    </div>
  );
}

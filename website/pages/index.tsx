import type { NextPage } from 'next';
import React from 'react';

const Home: NextPage = () => {
  return (
    <>
      <div className='-z-50 flex flex-col justify-center items-center relative w-full h-screen'>
        <div className={
          `z-10 mx-0 my-0 overflow-hidden h-screen w-full absolute 
          bg-[url('../public/assets/pizza.jfif')] bg-no-repeat bg-center bg-fixed bg-cover`
        }
          // Bg image properties taken from https://css-tricks.com/perfect-full-page-background-image/
        />
        <h1 className="z-30 lg:leading-5 lg:text-8xl md:text-7xl text-6xl text-center font-bold text-white cursor-text">
          Fasting is overrated.
        </h1>
      </div>
      <div className="px-8 min-h-screen py-8 flex flex-1 flex-col items-center">
        <h1 className="my-24 lg:text-7xl md:text-6xl text-5xl leading-snug ">
          Welcome to {"Param's"} Pantry!
        </h1>

        <h2 className=''>
          {"Here's"} what to cook this week
        </h2>
        {/* Carousel of cards for what to cook this week */}
      </div>
    </>
  );
};

export default Home;

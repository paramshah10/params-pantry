import type { NextPage } from 'next'
import React from 'react';

const Home: NextPage = () => {
  return (
    <>
      <div className='-z-50 flex flex-col justify-center items-center relative w-screen h-screen'>
        <div className={
          `z-10 mx-0 my-0 overflow-hidden h-screen w-screen absolute 
          bg-[url('../public/assets/pizza.jfif')] bg-no-repeat bg-center bg-fixed bg-cover`
        }
          // Bg image properties taken from https://css-tricks.com/perfect-full-page-background-image/
        />
        <h1 className="z-30 leading5 text-8xl font-bold text-white cursor-text">
          Fasting is overrated.
        </h1>
      </div>
      <main className="px-8 py-8 min-h-screen py-16 flex flex-1 flex-col justify-center items-center">
        <h1 className="m-0 leading-5 text-6xl">
          Welcome to {"Param's"} Pantry!
        </h1>
      </main>
    </>
  )
}

export default Home

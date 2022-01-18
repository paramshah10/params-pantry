import type { NextPage } from 'next'
import React from 'react';

const Home: NextPage = () => {
  return (
    <>
      <div className="flex flex-col justify-end items-center x-0 y-0">
        <div className='-z-50 relative w-screen h-screen'>
          <div className={`mx-0 my-0 overflow-hidden h-screen w-screen absolute`}
            style={{
              background: "url('/assets/pizza.jfif') no-repeat center center fixed",
              backgroundSize: 'cover',
              WebkitBackgroundSize: 'cover'
            }}
          >
          </div>
        </div>

        <div className="-mt-96">
          <h1 className="leading5 text-8xl font-bold text-white">
            Fasting is overrated.
          </h1>
        </div>
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

import { useState } from "react";
import Link from "next/link";

interface Page {
  title: string,
  link: string
}

const Navbar = () => {
  const [menuActive, setMenuActive] = useState(false);
  const [opaqueNavbar, setOpaqueNavbar] = useState(false);

  const handleClick = () => {
    setMenuActive(!menuActive);
  };
  
  const pages: Page[] = [
    {
      title: 'Home',
      link: '/'
    },
    {
      title: 'Recipes',
      link: '/recipes'
    },
    {
      title: 'Login',
      link: '/login'
    },
  ]

  return (
    <div className="bg-transparent">
      <nav className={`fixed w-full flex items-center flex-wrap ${opaqueNavbar ? 'bg-slate-900' : ''} py-3 px-8`}>
        <Link href='/'>
          <a className='inline-flex items-center p-2 mr-4 '>
            <img className='fill-current text-white h-8 w-8 mr-6' src='/apple-touch-icon.png' alt="Param's Pantry Logo"/>
            <span className='text-xl text-white font-bold tracking-wide'>
              {'Param\'s Pantry'}
            </span>
          </a>
        </Link>
        {/* Hamburger menu for smaller devices */}
        <button className=' inline-flex p-3 hover:bg-green-600 rounded lg:hidden text-white ml-auto hover:text-white outline-none'
          onClick={handleClick}
        >
          <svg
            className='w-6 h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 6h16M4 12h16M4 18h16'
            />
          </svg>
        </button>
        <div className={`${
            menuActive ? '' : 'hidden'
          }   w-full lg:inline-flex lg:flex-grow lg:w-auto`}>
          <div className='z-50 lg:inline-flex lg:flex-row lg:ml-auto lg:w-auto w-full lg:items-center items-start  flex flex-col lg:h-auto'>
            {pages.map(page =>
              <Link key={page.title} href={page.link}>
                <a className='lg:inline-flex lg:w-auto w-full px-6 lg:py-2 py-4 rounded text-white font-bold items-center justify-center hover:text-slate-400 lowercase'>
                  {page.title}
                </a>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </div>
  )
}

export default Navbar;
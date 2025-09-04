import Hamburger from 'hamburger-react';
import Link from 'next/link';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../pages/_app';

interface Page {
  title: string;
  link: string;
}

const Navbar = () => {
  const { signIn, signOut, isAuthenticated } = useContext(AppContext);
  const [menuActive, setMenuActive] = useState(false);
  const [opaqueNavbar, setOpaqueNavbar] = useState(false);

  const handleClick = () => {
    setMenuActive(!menuActive);
    setOpaqueNavbar(!menuActive || window.scrollY >= 100);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY >= 100)
        setOpaqueNavbar(true);
      else
        setOpaqueNavbar(menuActive || false);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
  }, [menuActive]);

  const pages: Page[] = [
    {
      title: 'Home',
      link: '/',
    },
    {
      title: 'Recipes',
      link: '/recipes',
    },
    {
      title: 'Search',
      link: '/search',
    },
    {
      title: 'Discover',
      link: '/discover',
    },
  ];

  return (
    <nav className={`fixed w-full flex items-center flex-wrap ${opaqueNavbar ? 'bg-black' : ''} 
      ${menuActive ? '' : 'transition-colors delay-100'} py-3 px-8 z-50`}
    >
      <Link href="/">
        <a className="inline-flex items-center p-2 mr-4 ">
          <img className="fill-current text-white h-8 w-8 mr-6" src="/apple-touch-icon.png" alt="Param's Pantry Logo" />
          <span className="text-xl text-white font-bold tracking-wide">
            {'Param\'s Pantry'}
          </span>
        </a>
      </Link>
      {/* Hamburger menu for smaller devices */}
      <button
        className="inline-flex px-3 py-1 rounded lg:hidden text-white ml-auto hover:text-white outline-none"
        onClick={handleClick}
      >
        <Hamburger toggled={menuActive} />
      </button>
      <div className={`${menuActive ? 'bg-black h-screen' : ''} 
         lg:h-full w-screen lg:inline-flex lg:flex-grow lg:w-auto `}
      >
        <div className={`${menuActive ? 'opacity-100' : 'lg:opacity-100 opacity-0'} 
          z-50 lg:inline-flex lg:flex-row lg:ml-auto lg:w-auto w-full lg:items-center items-center justify-center 
          flex flex-col lg:h-auto transition-opacity duration-1000`}
        >
          {pages.map(page => (
            <Link key={page.title} href={page.link} passHref>
              <div className={`${menuActive ? '' : 'lg:block hidden'} lg:inline-flex lg:w-auto w-full px-6 lg:py-2 
                py-4 rounded text-white font-bold items-center text-center justify-center hover:text-slate-400 
                lowercase relative leading-10 text-lg cursor-pointer`}
              >
                {page.title}
              </div>
            </Link>
          ),
          )}
          <div className={`${menuActive ? '' : 'lg:block hidden'} lg:inline-flex lg:w-auto w-full px-6 lg:py-2 
            py-4 rounded text-white font-bold items-center text-center justify-center hover:text-slate-400 
            lowercase relative leading-10 text-lg cursor-pointer`}
          >
            <a onClick={isAuthenticated ? signOut : signIn}>
              {isAuthenticated ? 'Sign Out' : 'Login'}
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

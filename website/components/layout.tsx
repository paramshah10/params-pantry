import Head from 'next/head';
import Footer from './footer';
import Navbar from './navbar';
import { JSX } from 'react';

interface LayoutProps {
  children: JSX.Element
}

const Layout = (props: LayoutProps) => {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="title" content="Param's Pantry" />
        <meta name="description" content="Home to all of my recipes!"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />

        <meta property="og:type" content="website" />
        {/* <meta property="og:url" content="https://www.creativelabsucla.com/" /> */}
        <meta property="og:title" content="Param's Pantry" />
        <meta property="og:description" content="Home to all of my recipes!" />
        <meta property="og:image" content="/favicon.ico" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Param's Pantry" />
        <meta property="twitter:description" content="Home to all of my recipes!" />
        <meta property="twitter:image" content="/favicon.ico" />

        <title>{"Param's Pantry"}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main>
        {props.children}
      </main>
      <Footer />
    </>
  );
};

export default Layout;

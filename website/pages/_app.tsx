import '../styles/globals.css';
import { onAuthStateChanged } from 'firebase/auth';
import type { AppProps } from 'next/app';
import { createContext, JSX, useEffect, useState } from 'react';
import Layout from '../components/layout';
import { _Firebase } from '../utils/firebase';
import { IUserData } from '../utils/user-data';

export interface IAppContext {
  userData: IUserData | null,
  setUserData: (data: IUserData) => void,
  isAuthenticated: boolean;
  signIn: () => void,
  signOut: () => void;
  firebase: _Firebase | null;
}

export const AppContext = createContext<IAppContext>({
  userData: null,
  setUserData: (_data) => null,
  isAuthenticated: false,
  signIn: () => null,
  signOut: () => null,
  firebase: null,
});

function MyApp({ Component, pageProps }: AppProps): JSX.Element {
  const [userData, setUserData] = useState<IUserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [firebase] = useState(new _Firebase());

  useEffect(() => {
    onAuthStateChanged(firebase.auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserData(user);
      }
    });
  }, [firebase.auth]);

  const signIn = async () => {
    const result = await firebase.googleSignIn();

    if (result.code == 200) {
      setIsAuthenticated(true);
      setUserData(firebase.user);
    }
  };

  const signOut = async () => {
    const result = await firebase.signOut();

    if (result.code == 200) {
      setIsAuthenticated(false);
      setUserData(null);
    }
  };

  return (
    <AppContext.Provider value={{
      userData,
      setUserData,
      isAuthenticated,
      signIn,
      signOut,
      firebase,
    }}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AppContext.Provider>
  );
}

export default MyApp;

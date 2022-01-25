import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, User, Auth } from 'firebase/auth';
import firebase from 'firebase/compat/app';
import { arrayUnion, doc, Firestore, getDoc, getFirestore, setDoc, updateDoc } from 'firebase/firestore';
import FIREBASE_CONFIG from '../../firebase.config';

!firebase.apps.length
  ? (firebase.initializeApp(FIREBASE_CONFIG))
  : firebase.app();

interface PutFieldProps {
  path: string;
  key: string;
  value: any;
}

interface PutProps {
  path: string;
  data: Record<string, any>;
  defaults?: Record<string, any>;
}

interface AuthActionResult {
  code: number | string;
  message?: string
}

export class _Firebase {
  public readonly db: Firestore;
  public readonly provider: GoogleAuthProvider;
  public readonly auth: Auth;
  public loggedIn: boolean;
  public user: User;

  constructor() {
    this.db = getFirestore();
    this.provider = new GoogleAuthProvider();
    this.loggedIn = false;
    this.auth = getAuth();
  }

  public async googleSignIn(): Promise<AuthActionResult> {
    try {
      const result = await signInWithPopup(this.auth, this.provider);
      this.user = result.user;
      this.loggedIn = true;

      return {
        code: 200,
      };
    } catch (error) {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;

      return {
        code: errorCode,
        message: errorMessage,
      };
    }
  }

  public async signOut(): Promise<AuthActionResult> {
    try {
      await signOut(this.auth);
      return {
        code: 200,
      };
    } catch (error) {
      // An error happened.
      const errorCode = error.code;
      const errorMessage = error.message;

      return {
        code: errorCode,
        message: errorMessage,
      };
    }
  }

  public doc(path: string) {
    return doc(this.db, path);
  }

  public async get({path}): Promise<any | null> {
    const docRef = this.doc(path);
    const item = await getDoc(docRef);
    if (!item.exists()) return null;

    return item.data();
  }

  public async put({path, data, defaults = {}}: PutProps): Promise<boolean> {
    const docRef = this.doc(path);
    const item = await getDoc(docRef);
    const action = item.exists()
      ? updateDoc(docRef, data)
      : setDoc(docRef, {...data, ...defaults});

    return action
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  }

  public async updateArrayField({path, key, value}: PutFieldProps): Promise<boolean> {
    const docRef = this.doc(path);
    const item = await getDoc(docRef);
    if (!item.exists) return false;

    return updateDoc(docRef, {[key]: arrayUnion(value)})
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  }
}

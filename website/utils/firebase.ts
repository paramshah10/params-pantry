import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, User, Auth } from 'firebase/auth';
import firebase from 'firebase/compat/app';
import { arrayUnion, doc, Firestore, getDoc, getFirestore, setDoc, updateDoc } from 'firebase/firestore';
import { FirebaseStorage, getDownloadURL, getStorage, ref, StorageReference, uploadString } from 'firebase/storage';
import FIREBASE_CONFIG from '../firebase.config';

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

interface FetchImageProps {
  location: string
}

interface UploadImageProps {
  file: string
  location: string
}

export class _Firebase {
  public readonly db: Firestore;
  public readonly provider: GoogleAuthProvider;
  public readonly auth: Auth;
  public readonly storage: FirebaseStorage;
  public loggedIn: boolean;
  public user: User;

  constructor() {
    this.db = getFirestore();
    this.provider = new GoogleAuthProvider();
    this.loggedIn = false;
    this.auth = getAuth();
    this.storage = getStorage();
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

  public async get(path: string): Promise<any | null> {
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

  public getImageRef(location: string): StorageReference {
    return ref(this.storage, location);
  }

  public async fetchImageURL({location}: FetchImageProps): Promise<string> {
    const imageRef = this.getImageRef(location);
    return getDownloadURL(imageRef);
  }

  public async uploadImage({ file, location }: UploadImageProps): Promise<string> {
    const imageRef = this.getImageRef(location);
    return uploadString(imageRef, file, 'data_url')
      .then(() => {
        return this.fetchImageURL({ location });
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

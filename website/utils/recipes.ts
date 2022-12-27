import { Timestamp } from 'firebase/firestore';
import { _Firebase } from './firebase';

export interface Proportion {
  ingredient: string
  maxQty: string
  minQty: string
  quantity: string
  unit: string
}

export interface Recipe {
  content?: string
  created: Timestamp
  lastCooked: Timestamp
  name: string
  proportions?: Proportion[]
  tags: string[]
  image?: string
  imageUrl?: string
}

export const kebabCase = string => string
  .replace(/([a-z])([A-Z])/g, '$1-$2')
  .replace(/[\s_]+/g, '-')
  .toLowerCase();


export const fetchImageURL = async (location: string, firebase: _Firebase): Promise<string> =>
  await firebase.fetchImageURL({ location });

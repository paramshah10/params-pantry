import { Timestamp } from 'firebase/firestore';
import { _Firebase } from './firebase';

export interface Proportion {
  ingredient: string;
  maxQty: string;
  minQty: string;
  quantity: string;
  unit: string;
}

export interface RecipeMacros {
  caloriesPerServing?: number;
  carbohydrates?: number;
  fats?: number;
  fiber?: number;
  protein?: number;
}

export interface Recipe {
  content?: string;
  created: Timestamp;
  durationMinutes?: number;
  lastCooked: Timestamp;
  macros?: RecipeMacros;
  name: string;
  proportions?: Proportion[];
  servings?: number;
  tags: string[];
  image?: string;
  imageUrl?: string;
}

export const kebabCase = (str: string) => str
  .replace(/([a-z])([A-Z])/g, '$1-$2')
  .replace(/[\s_]+/g, '-')
  .toLowerCase();

export const fetchImageURL = async (location: string, firebase: _Firebase): Promise<string> =>
  await firebase.fetchImageURL({ location });

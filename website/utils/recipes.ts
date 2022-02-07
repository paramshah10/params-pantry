import { Timestamp } from 'firebase/firestore';

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
}

export const kebabCase = string => string
  .replace(/([a-z])([A-Z])/g, '$1-$2')
  .replace(/[\s_]+/g, '-')
  .toLowerCase();

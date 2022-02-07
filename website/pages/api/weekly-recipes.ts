import type { NextApiResponse } from 'next';
import { _Firebase } from '../../utils/firebase';

export default async (_, res: NextApiResponse) => {
  const firebase = new _Firebase();
  const recipes = await firebase.get('/website/weekly-recipes');
  res.status(200).json(recipes);
};

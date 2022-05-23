/* eslint-disable import/no-anonymous-default-export */
import type { NextApiResponse } from 'next';
import { _Firebase } from '../../utils/firebase';

export default async (_, res: NextApiResponse) => {
  const firebase = new _Firebase();
  const doc = await firebase.get('/website/weekly-recipes');
  const recipeNames: string[] = doc.recipes;

  const recipes = await Promise.all(recipeNames.map(recName => firebase.get('/recipes/' + recName)));

  res.status(200).json(recipes);
};

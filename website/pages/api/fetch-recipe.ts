import type { NextApiRequest, NextApiResponse } from 'next';
import { _Firebase } from '../../utils/firebase';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const firebase = new _Firebase();

  const body = JSON.parse(req.body);
  const recipeName = body.recipeName;
  const recipeData = await firebase.get(`/recipes/${recipeName}`);
  res.status(200).json(recipeData);
};

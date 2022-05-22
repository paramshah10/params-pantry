/* eslint-disable import/no-anonymous-default-export */
import type { NextApiRequest, NextApiResponse } from 'next';
import { _Firebase } from '../../utils/firebase';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const firebase = new _Firebase();

  const location = String(req.query.recipe);
  const body: string = await req.body;

  const imageURL = await firebase.uploadImage({ file: body, location });

  // add the image property to the recipe document
  await firebase.put({
    path: 'recipes/' + location,
    data: {
      image: location,
    },
  });

  res.status(200).json({
    image: imageURL,
  });
};

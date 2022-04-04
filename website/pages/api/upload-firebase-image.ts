/* eslint-disable import/no-anonymous-default-export */
import type { NextApiRequest, NextApiResponse } from 'next';
import { _Firebase } from '../../utils/firebase';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const firebase = new _Firebase();

  const body = JSON.parse(req.body);
  const location = body.location;
  const imageURL = await firebase.fetchImageURL({location});
  res.status(200).json(imageURL);
};

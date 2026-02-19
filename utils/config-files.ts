'server only';

import { PinataSDK } from 'pinata';

export const pinata = new PinataSDK({
  pinataJwt: `${process.env.PINATA_JWT}`,
  pinataGateway: `${process.env.NEXT_PUBLIC_GATEWAY_URL}`,
});

export const uploadFile = async (file: File) => {
  const { cid } = await pinata.upload.public.file(file);
  return await pinata.gateways.public.convert(cid);
};

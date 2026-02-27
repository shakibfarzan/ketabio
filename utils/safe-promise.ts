/* eslint-disable @typescript-eslint/no-explicit-any */
const safePromise = async <T>(promise: Promise<T>): Promise<[T | undefined, any]> => {
  try {
    const res = await promise;

    return [res, null];
  } catch (e: any) {
    return [undefined, e];
  }
};

export default safePromise;

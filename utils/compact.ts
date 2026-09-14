// eslint-disable-next-line @typescript-eslint/no-explicit-any
const compact = <T>(arr: any[]): T[] => {
  const out: T[] = [];
  arr.forEach((a) => {
    if (a) out.push(a as T);
  });
  return out;
};

export default compact;

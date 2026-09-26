import AuthorsManager from './_components/authors-manager';
import { listAuthorsAction } from './actions';

export const instant = false;

const AuthorsPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const params = await searchParams;
  const { res: authors } = await listAuthorsAction(params);

  return <AuthorsManager authors={authors} />;
};

export default AuthorsPage;

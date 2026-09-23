import CategoriesManager from './_components/categories-manager';
import { listCategoriesAction } from './actions';

export const instant = false;

const CategoriesPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const params = await searchParams;
  const { res: categories } = await listCategoriesAction(params);

  return <CategoriesManager categories={categories} />;
};

export default CategoriesPage;

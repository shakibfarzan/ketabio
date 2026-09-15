import { getCategories } from '@/db/categories';
import CategoriesManager from './_components/categories-manager';

const CategoriesPage = async () => {
  const categories = await getCategories();

  return <CategoriesManager categories={categories} />;
};

export default CategoriesPage;

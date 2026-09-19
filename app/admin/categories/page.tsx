import { listCategories } from '@/db/categories';
import CategoriesManager from './_components/categories-manager';

const CategoriesPage = async () => {
  const categories = await listCategories();

  return <CategoriesManager categories={categories} />;
};

export default CategoriesPage;

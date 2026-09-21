import { listCategoriesForAdmin } from '@/db/categories';
import { getRequestLocale } from '@/lib/request-locale';
import CategoriesManager from './_components/categories-manager';

const CategoriesPage = async () => {
  // Names are resolved for the admin's locale; the full translation list comes along for editing.
  const locale = await getRequestLocale();
  const categories = await listCategoriesForAdmin(locale);

  return <CategoriesManager categories={categories} />;
};

export default CategoriesPage;

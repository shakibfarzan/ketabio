import React from 'react';
import { redirect } from 'next/navigation';
import routes from '@/constants/routes';

const AdminPage: React.FC = () => {
  redirect(routes.ADMIN.BOOKS);
};

export default AdminPage;

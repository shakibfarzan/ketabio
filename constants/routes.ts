const routes = {
  AUTH: {
    LOGIN: '/login',
    SIGN_UP: '/sign-up',
  },
  ADMIN: {
    BASE: '/admin',
    BOOKS: '/admin/books',
    ADD_BOOK: '/admin/books/add',
    EDIT_BOOK: (slug: string) => `/admin/books/edit/${slug}`,
  },
} as const;

export default routes;

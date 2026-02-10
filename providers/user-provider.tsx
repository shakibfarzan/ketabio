import { getOrCreateUser } from '@/utils/auth';
import React, { PropsWithChildren, useContext } from 'react';

type UserContextType = Awaited<ReturnType<typeof getOrCreateUser>>;

const UserContext = React.createContext<UserContextType>(null);

const UserProvider: React.FC<PropsWithChildren<{ user: UserContextType }>> = ({
  user,
  children,
}) => {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export default UserProvider;

export const useUser = (): UserContextType => {
  return useContext(UserContext);
};

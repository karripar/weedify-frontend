import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { UpdateContext } from '../contexts/updateContext';

const useUserContext = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUserContext must be used within an UserProvider');
    }

    return context;
};

const useUpdateContext = () => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdateContext must be used within an UpdateProvider');
  }
  return context;
};

export { useUserContext, useUpdateContext };

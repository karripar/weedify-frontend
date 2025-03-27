import {Dispatch, SetStateAction, createContext, useState, useCallback, useMemo} from 'react';

type UpdateContextType = {
  update: boolean;
  setUpdate: Dispatch<SetStateAction<boolean>>;
  triggerUpdate: () => void;
};

const UpdateContext = createContext<UpdateContextType | null>(null);

const UpdateProvider = ({children}: {children: React.ReactNode}) => {
  const [update, setUpdate] = useState<boolean>(false);

  // Dedicated function to toggle update state
  const triggerUpdate = useCallback(() => {
     setUpdate((prevState) => !prevState);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
     () => ({
        update,
        setUpdate,
        triggerUpdate,
     }),
     [update, triggerUpdate],
  );

  return (
    <UpdateContext.Provider value={contextValue}>
      {children}
    </UpdateContext.Provider>
  );
};

export {UpdateProvider, UpdateContext};

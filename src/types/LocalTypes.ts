import {Credentials, UserWithNoPassword} from 'hybrid-types/DBTypes';

type AuthContextType = {
  user: UserWithNoPassword | null;
  handleLogin: (credentials: Credentials) => void;
  handleLogout: () => void;
  handleAutoLogin: () => void;
};

type NavigatorType = {
  // tab screen
  Home: undefined;
  Post: undefined;
  Favorites: undefined;
  Profile: undefined;
  Upload: undefined;
  // stack screen
  Back: undefined;
  Weedify: undefined;
};

export type {AuthContextType, NavigatorType};

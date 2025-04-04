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

type RecipeIngredient = {
  name: string;
  amount: number;
  unit: string;
};

// data to post in a recipe
type PostRecipeData = {
  title: string;
  instructions: string;
  cooking_time: number;
  media_type: string;
  filename: string;
  filesize: number;
  difficulty_level_id: number;
  ingredients: RecipeIngredient[];
  dietary_info: number[];
};


export type {AuthContextType, NavigatorType, PostRecipeData};

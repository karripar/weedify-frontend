import {
  Credentials,
  UserWithNoPassword,
  Recipe,
  RecipeWithOwner,
  DietType,
} from 'hybrid-types/DBTypes';

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

// Hakutoimintoa varten
// lisätty lokaalisti testausta varten
type DietTypeWithName = {
  diet_type_id: number;
  name: string;
};

// lisätty lokaalisti testausta varten
type RecipeWithPossibleLikes = RecipeWithOwner & {
  likes_count?: number;
};

// Laajennettu hakutoimintoa varten
// Lisätty lokaalisti testausta varten
type RecipeWithOwnerExtended = RecipeWithOwner & {
  ingredients?: {
    name: string;
    quantity: string;
  }[];
  diet_types?: DietTypeWithName[];
  likes_count: number;
};

export type {
  AuthContextType,
  NavigatorType,
  PostRecipeData,
  RecipeIngredient,
  DietTypeWithName,
  RecipeWithOwnerExtended,
  RecipeWithPossibleLikes,
};

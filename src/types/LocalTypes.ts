import {
  Credentials,
  RecipeWithOwner,
  UserWithProfilePicture,
} from 'hybrid-types/DBTypes';

type AuthContextType = {
  user: UserWithProfilePicture | null;
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
  Weedify: undefined;
  // stack screen
  Back: undefined;
  'Edit Profile': undefined;
  'Recipe': undefined;
};

type RecipeIngredient = {
  name: string;
  amount: number;
  unit: string;
};

// recipe with profile image
type RecipeWithProfileImage = RecipeWithOwner & {
  profile_picture: string;
};

// data to post in a recipe
type PostRecipeData = {
  title: string;
  instructions: string;
  cooking_time: number;
  portions: number;
  media_type: string;
  filename: string;
  filesize: number;
  difficulty_level_id: number;
  ingredients: RecipeIngredient[];
  dietary_info: number[];
};

// Hakutoimintoa varten
// lisätty lokaalisti testausta varten
// (recipeModel.ts rivi 56)
type DietTypeWithName = {
  diet_type_id: number;
  name: string;
};

// Laajennettu hakutoimintoa varten
// Lisätty lokaalisti testausta varten
type RecipeWithOwnerExtended = RecipeWithOwner & {
  diet_types?: DietTypeWithName[];
  ingredients?: RecipeIngredient[];
};

export type {
  AuthContextType,
  NavigatorType,
  PostRecipeData,
  RecipeWithProfileImage,
  RecipeWithOwnerExtended,
  DietTypeWithName
};

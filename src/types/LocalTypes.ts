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
  media_type: string;
  filename: string;
  filesize: number;
  difficulty_level_id: number;
  ingredients: RecipeIngredient[];
  dietary_info: number[];
};

// data to update the user
type UpdateUserData = {
  username: string | null;
  email: string | null;
  bio: string | null;
  dietary_info: number[] | null;
  media_type: string | null;
  filename: string | null;
  filesize: number | null;
};

export type {
  AuthContextType,
  NavigatorType,
  PostRecipeData,
  UpdateUserData,
  RecipeWithProfileImage,
};

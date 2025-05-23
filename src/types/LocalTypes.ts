import {
  Credentials,
  RecipeWithAllFields,
  RecipeWithOwner,
  UserWithDietaryInfo,
} from 'hybrid-types/DBTypes';
import {MessageResponse} from 'hybrid-types/MessageTypes';

// for testing
declare global {
  var TEST_MODE: boolean | undefined;
}

type AuthContextType = {
  user: UserWithDietaryInfo | null;
  handleLogin: (credentials: Credentials) => void;
  handleLogout: () => void;
  handleAutoLogin: () => void;
  setUpdatedUser: (updatedUser: UserWithDietaryInfo) => void;
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
  'Edit Recipe': undefined;
  Recipe: undefined;
  'User Profile': {user_id: number}
};

type RecipeIngredient = {
  name: string;
  amount: number;
  unit: string;
};

// recipe with profile image
type RecipeWithProfileImage = RecipeWithOwner &
  Pick<RecipeWithAllFields, 'diet_types' | 'ingredients'> & {
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
  dietary_info?: number[];
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
    unit: string;
    amount: number;
  }[];
  diet_types?: DietTypeWithName[];
  likes_count: number;
};

type UpdateUserResponse = MessageResponse & {
  user: UserWithDietaryInfo;
};

type EditRecipeInputs = {
  title: string;
  instructions: string;
  cooking_time: string;
  portions: string;
  difficulty_level: string;
};

export type {
  AuthContextType,
  NavigatorType,
  PostRecipeData,
  RecipeWithProfileImage,
  RecipeWithOwnerExtended,
  DietTypeWithName,
  RecipeWithPossibleLikes,
  UpdateUserResponse,
  EditRecipeInputs,
};

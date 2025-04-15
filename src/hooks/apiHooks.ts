import {fetchData} from '../lib/functions';
import {
  AvailableResponse,
  LoginResponse,
  MessageResponse,
  UploadResponse,
  UserResponse,
} from 'hybrid-types/MessageTypes';
import {
  Credentials,
  DietType,
  Recipe,
  RecipeWithOwner,
  RegisterCredentials,
  UserWithNoPassword,
  Like,
} from 'hybrid-types/DBTypes';
import {useEffect, useState} from 'react';
import * as FileSystem from 'expo-file-system';
import {useUpdateContext} from './contextHooks';
import {PostRecipeData} from '../types/LocalTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuthentication = () => {
  // login with user credentials
  const postLogin = async (credentials: Credentials) => {
    const options = {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {'Content-Type': 'application/json'},
    };
    try {
      // return token and user without password
      return await fetchData<LoginResponse>(
        process.env.EXPO_PUBLIC_AUTH_API + '/auth/login',
        options,
      );
    } catch (error) {
      throw new Error((error as Error).message);
    }
  };

  return {postLogin};
};

const useUser = () => {
  // get user from token when logged in
  const getUserByToken = async (token: string) => {
    const options = {
      headers: {Authorization: 'Bearer ' + token},
    };
    try {
      // return user without password
      return await fetchData<UserResponse>(
        process.env.EXPO_PUBLIC_AUTH_API + '/users/token',
        options,
      );
    } catch (error) {
      throw error as Error;
    }
  };

  // register new user
  const postRegister = async (credentials: RegisterCredentials) => {
    const options = {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {'Content-Type': 'application/json'},
    };
    try {
      // return created user without password
      return await fetchData<UserResponse>(
        process.env.EXPO_PUBLIC_AUTH_API + '/users',
        options,
      );
    } catch (error) {
      throw new Error((error as Error).message);
    }
  };

  // see if the username is available
  const getUsernameAvailable = async (username: string) => {
    // return true if username is available, false if not
    return await fetchData<AvailableResponse>(
      process.env.EXPO_PUBLIC_AUTH_API + '/users/username/' + username,
    );
  };

  // see if email is available
  const getEmailAvailable = async (email: string) => {
    // return true if email is available, false if not
    return await fetchData<AvailableResponse>(
      process.env.EXPO_PUBLIC_AUTH_API + '/users/email/' + email,
    );
  };

  // get user by user id and return the user without password
  const getUserById = async (user_id: number) => {
    return await fetchData<UserWithNoPassword>(
      process.env.EXPO_PUBLIC_AUTH_API + '/users/user/' + user_id,
    );
  };

  return {
    getUserByToken,
    postRegister,
    getUsernameAvailable,
    getEmailAvailable,
    getUserById,
  };
};

const useRecipes = () => {
  const [recipeArray, setRecipeArray] = useState<RecipeWithOwner[]>([]);
  const [loading, setLoading] = useState(false);
  const {update} = useUpdateContext();

  // Add update to the dependency array to trigger reload when likes change
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const recipes = await fetchData<RecipeWithOwner[]>(
          `${process.env.EXPO_PUBLIC_MEDIA_API}/recipes`,
        );
        setRecipeArray(recipes);
      } catch (error) {
        console.error('Error fetchRecipes: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [update]); // Add update to dependencies

  return {recipeArray, loading};
};

const useFile = () => {
  const [loading, setLoading] = useState(false);

  const postExpoFile = async (
    imageUri: string,
    token: string,
  ): Promise<UploadResponse> => {
    setLoading(true);
    const fileResult = await FileSystem.uploadAsync(
      process.env.EXPO_PUBLIC_UPLOAD_API + '/upload',
      imageUri,
      {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      },
    );

    setLoading(false);
    if (!fileResult.body) {
      throw new Error('File upload failed');
    }
    console.log('file result', fileResult.body);
    console.log('parsed file result', JSON.parse(fileResult.body));
    return JSON.parse(fileResult.body);
  };

  return {postExpoFile, loading};
};

const useDietTypes = () => {
  // get all diet types to display them in a selector
  const getAllDietTypes = async () => {
    return await fetchData<DietType[]>(
      process.env.EXPO_PUBLIC_MEDIA_API + '/dietary',
    );
  };
  return {getAllDietTypes};
};

const useLikes = () => {
  const {update, setUpdate} = useUpdateContext();

  const checkIfLiked = async (recipe_id: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return null;
      }

      const options = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await fetchData<Like | null>(
        `${process.env.EXPO_PUBLIC_MEDIA_API}/likes/recipe/${recipe_id}/user`,
        options,
      );
      return response;
    } catch (error) {
      console.error('Error checking like status:', error);
      return null;
    }
  };

  const likeRecipe = async (recipe_id: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('User not logged in');
      }

      const options = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({recipe_id}),
      };

      await fetchData<MessageResponse>(
        `${process.env.EXPO_PUBLIC_MEDIA_API}/likes`,
        options,
      );

      // Trigger update to refresh content
      setUpdate(!update);
      return true;
    } catch (error) {
      console.error('Error liking recipe:', error);
      return false;
    }
  };

  const unlikeRecipe = async (like_id: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('User not logged in');
      }

      const options = {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await fetchData<MessageResponse>(
        `${process.env.EXPO_PUBLIC_MEDIA_API}/likes/${like_id}`,
        options,
      );

      // Trigger update to refresh content
      setUpdate(!update);
      return true;
    } catch (error) {
      console.error('Error unliking recipe:', error);
      return false;
    }
  };

  return {checkIfLiked, likeRecipe, unlikeRecipe};
};

export {
  useAuthentication,
  useUser,
  useRecipes,
  useFile,
  useDietTypes,
  useLikes,
};

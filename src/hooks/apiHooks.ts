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
  ProfilePicture,
  Recipe,
  RecipeWithOwner,
  RegisterCredentials,
  UserWithNoPassword,
} from 'hybrid-types/DBTypes';
import {useEffect, useState} from 'react';
import * as FileSystem from 'expo-file-system';
import {useUpdateContext} from './contextHooks';
import {
  PostRecipeData,
  RecipeWithProfileImage,
  UpdateUserData,
} from '../types/LocalTypes';

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

  // update a user
  const updateUser = async (
    token: string,
    profile_picture: UploadResponse,
    inputs: Record<string, string | string[]>,
  ) => {
    const dietaryInfo = Array.isArray(inputs.diet_type)
      ? inputs.diet_type.map((id) => Number(id))
      : [];

    // Create update object with only non-empty fields
    const update: UpdateUserData = {
      username:
        typeof inputs.username === 'string' && inputs.username.trim() !== ''
          ? inputs.username
          : null,
      email:
        typeof inputs.email === 'string' && inputs.email.trim() !== ''
          ? inputs.email
          : null,
      bio:
        typeof inputs.bio === 'string' && inputs.bio.trim() !== ''
          ? (inputs.bio as string)
          : null,
      dietary_info: dietaryInfo.length > 0 ? dietaryInfo : null,
      media_type: profile_picture.data?.media_type || null,
      filename: profile_picture.data?.filename || null,
      filesize: profile_picture.data?.filesize || null,
    };
    const options = {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    };

    try {
      // send input to the auth server
      return await fetchData<UserResponse>(
        process.env.EXPO_PUBLIC_AUTH_API + '/users/user/update',
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
    updateUser,
    getUsernameAvailable,
    getEmailAvailable,
    getUserById,
  };
};

const useRecipes = (user_id?: number) => {
  const [recipeArray, setRecipeArray] = useState<RecipeWithOwner[]>([]);
  const [loading, setLoading] = useState(false);
  const {update} = useUpdateContext();
  const url = user_id ? '/recipes/byuser/byuserid/' + user_id : '/recipes';

  useEffect(() => {
    // get all or a singular recipe by user id
    const getRecipes = async () => {
      try {
        setLoading(true);
        const recipes = await fetchData<Recipe[]>(
          process.env.EXPO_PUBLIC_MEDIA_API + url,
        );

        const recipeWithOwner: RecipeWithOwner[] = await Promise.all(
          recipes.map(async (recipe) => {
            const owner = await fetchData<UserWithNoPassword>(
              process.env.EXPO_PUBLIC_AUTH_API +
                '/users/user/byuserid/' +
                recipe.user_id,
            );

            let profilePictureUrl = 'defaultprofileimage.png';

            if ('profile_picture_id' in owner) {
              try {
                const profilePicture = await fetchData<ProfilePicture>(
                  process.env.EXPO_PUBLIC_AUTH_API +
                    '/users/profilepicture/id/' +
                    (owner as any).profile_picture_id,
                );

                if (profilePicture && profilePicture.filename) {
                  profilePictureUrl = profilePicture.filename;
                }
              } catch (err) {
                console.log('Error fetching profile picture:', err);
              }
            }

            const recipeItem: RecipeWithProfileImage = {
              ...recipe,
              username: owner.username,
              profile_picture: profilePictureUrl,
            };
            return recipeItem;
          }),
        );

        console.log(recipeWithOwner);

        recipeWithOwner.reverse();

        setRecipeArray(recipeWithOwner);
      } catch (error) {
        console.error((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    getRecipes();
  }, [update]);

  // post a new recipe
  const postRecipe = async (
    file: UploadResponse,
    inputs: Record<string, string | number | string[]>,
    token: string,
  ) => {
    // format the ingredients to sent them to db
    const formattedIngredients = (inputs.ingredients as string[]).map(
      (ingredient) => {
        const parts = ingredient.toString().trim().split(' ');
        const amount = parseFloat(parts[0]);
        const unit = parts[1];
        const name = parts.slice(2).join(' ');

        return {
          name,
          amount,
          unit,
        };
      },
    );

    // format dietary info to be an array of numbers to send them with the recipe
    const dietaryInfo = Array.isArray(inputs.diet_type)
      ? inputs.diet_type.map((id) => Number(id))
      : [];

    const recipe: PostRecipeData = {
      title: inputs.title as string,
      instructions: inputs.instructions as string,
      cooking_time:
        typeof inputs.cooking_time === 'number'
          ? inputs.cooking_time
          : Number(inputs.cooking_time),
      media_type: file.data.media_type,
      filename: file.data.filename,
      filesize: file.data.filesize,
      difficulty_level_id: Number(inputs.difficulty_level_id) || 1, // 1 is set to default for now because the form for it is still missing...
      ingredients: formattedIngredients,
      dietary_info: dietaryInfo,
    };

    console.log('posting recipe', recipe);

    console.log('Recipe object:', recipe);
    console.log('Stringified body:', JSON.stringify(recipe));

    // post the data to Media API and get the data as MessageResponse
    const options = {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-type': 'application/json',
      },
      body: JSON.stringify(recipe),
    };
    return await fetchData<MessageResponse>(
      process.env.EXPO_PUBLIC_MEDIA_API + '/recipes',
      options,
    );
  };

  // delete recipe
  const deleteRecipe = async (recipe_id: number, token: string) => {
    const options = {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + token,
      },
    };
    return await fetchData<MessageResponse>(
      process.env.EXPO_PUBLIC_MEDIA_API + '/recipes/' + recipe_id,
      options,
    );
  };

  return {recipeArray, postRecipe, deleteRecipe, loading};
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

export {useAuthentication, useUser, useRecipes, useFile, useDietTypes};

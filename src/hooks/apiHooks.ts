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
  Comment,
  RecipeWithOwner,
  RegisterCredentials,
  UserWithNoPassword,
  Like,
  RecipeWithAllFields,
  UserWithDietaryInfo,
  Notification
} from 'hybrid-types/DBTypes';
import {useEffect, useState} from 'react';
import * as FileSystem from 'expo-file-system';
import {useUpdateContext} from './contextHooks';
import {
  EditRecipeInputs,
  PostRecipeData,
  RecipeWithProfileImage,
  UpdateUserResponse,
} from '../types/LocalTypes';
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

  // get user with profile image
  const getUserWithProfileImage = async (user_id: number) => {
    try {
      const profile_picture = await fetchData<ProfilePicture>(
        process.env.EXPO_PUBLIC_AUTH_API + '/users/profilepicture/' + user_id,
      );
      console.log('user profile image', profile_picture);
      return profile_picture;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  };

  // get users's dietary restrictions
  const getUserDietaryRestrictions = async (user_id: number) => {
    const {getAllDietTypes} = useDietTypes();
    try {
      // get the user with their dietary info
      // TODO: tän tyypin vois vaihtaa johonki...
      const userWithDietary = await fetchData<any>(
        process.env.EXPO_PUBLIC_AUTH_API + '/users/user/byuserid/' + user_id,
      );

      // return an empty array if no diets selected
      if (!userWithDietary?.dietary_restrictions) {
        return [];
      }

      const dietIds = Array.isArray(userWithDietary.dietary_restrictions)
        ? userWithDietary.dietary_restrictions.map(
            (diet: {dietary_restriction_id: number}) =>
              diet.dietary_restriction_id.toString(),
          )
        : [
            userWithDietary.dietary_restrictions.dietary_restriction_id.toString(),
          ];

      // fetch all the diets to convert the ids to diet names
      const allDiets = await getAllDietTypes();

      // map the diet ids to names
      const userDiets = dietIds
        .map((id: string) => {
          const diet = allDiets.find((d) => d.diet_type_id.toString() === id);
          return diet?.diet_type_name;
        })
        .filter(Boolean);
      return userDiets;
    } catch (error) {
      console.error('Error fetching dietary restrictions:', error);
      return [];
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
    filename:
      | UploadResponse
      | {data: {filename: null; media_type: null; filesize: null}},
    inputs: Record<string, string | string[] | number[] | null>,
    user_id: number,
  ) => {
    // update object for backend
    const update: any = {};

    // check if the fields have input and are meant to be updated
    if ('username' in inputs && inputs.username) {
      update.username = inputs.username;
    }

    if ('email' in inputs && inputs.email) {
      update.email = inputs.email;
    }

    if ('bio' in inputs) {
      update.bio = inputs.bio || '';
    }

    const dietaryRestrictions = Array.isArray(inputs.dietary_restrictions)
      ? inputs.dietary_restrictions
      : typeof inputs.dietary_restrictions === 'string' &&
          inputs.dietary_restrictions.length > 0
        ? inputs.dietary_restrictions.split(',').map((id) => Number(id))
        : [];

    if (dietaryRestrictions.length > 0) {
      update.dietary_info = dietaryRestrictions.map((id) => Number(id));
    }

    const options = {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    };

    try {
      // update the user details, the profile image update is a separate endpoint
      const userResponse = await fetchData<UpdateUserResponse>(
        process.env.EXPO_PUBLIC_AUTH_API + '/users/user/update',
        options,
      );

      // update the profile image if image uploaded
      console.log(filename.data?.filename);
      if (filename.data?.filename) {
        const picData = {
          filename: filename.data.filename,
          media_type: filename.data.media_type || 'image/jpeg',
          filesize: filename.data.filesize.toString(),
        };

        try {
          // check is the user already has a profile pic
          await fetchData<ProfilePicture>(
            process.env.EXPO_PUBLIC_AUTH_API +
              '/users/profilepicture/' +
              user_id,
          );

          // if user already has a profile pic use PUT
          const picOptions = {
            method: 'PUT',
            headers: {
              Authorization: 'Bearer ' + token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(picData),
          };
          await fetchData<ProfilePicture>(
            process.env.EXPO_PUBLIC_AUTH_API + '/users/profilepicture/change',
            picOptions,
          );
        } catch (error) {
          // if user doesn't have a profile pic yeat use POST
          const picOptions = {
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(picData),
          };

          await fetchData<ProfilePicture>(
            process.env.EXPO_PUBLIC_AUTH_API + '/users/profilepicture',
            picOptions,
          );
        }
      }
      return userResponse;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  };

  // change password
  const changePassword = async (
    current_password: string,
    new_password: string,
  ) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return new Error('User not logged in');
      }

      const options = {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: current_password,
          new_password: new_password,
        }),
      };

      return await fetchData<MessageResponse>(
        process.env.EXPO_PUBLIC_AUTH_API + '/auth/settings/change-password',
        options,
      );
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
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
    return await fetchData<UserWithDietaryInfo>(
      process.env.EXPO_PUBLIC_AUTH_API + '/users/user/byuserid/' + user_id,
    );
  };

  return {
    getUserByToken,
    postRegister,
    getUserWithProfileImage,
    getUserDietaryRestrictions,
    updateUser,
    changePassword,
    getUsernameAvailable,
    getEmailAvailable,
    getUserById,
  };
};

const useRecipes = (user_id?: number) => {
  const [recipeArray, setRecipeArray] = useState<RecipeWithOwner[]>([]);
  const [loading, setLoading] = useState(false);
  const {update} = useUpdateContext();
  const url = user_id ? '/recipes/byuser/userid/' + user_id : '/recipes';

  // Add update to the dependency array to trigger reload when likes change
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const recipes = await fetchData<RecipeWithAllFields[]>(
          `${process.env.EXPO_PUBLIC_MEDIA_API}${url}`,
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
                    owner.profile_picture_id,
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
              // parse the diet types and ingredients
              diet_types:
                typeof recipe.diet_types === 'string'
                  ? JSON.parse(recipe.diet_types)
                  : recipe.diet_types || [],
              ingredients:
                typeof recipe.ingredients === 'string'
                  ? JSON.parse(recipe.ingredients)
                  : recipe.ingredients || [],
            };
            return recipeItem;
          }),
        );

        recipeWithOwner.reverse();

        setRecipeArray(recipeWithOwner);
      } catch (error) {
        console.error('Error fetchRecipes: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [update, url]); // Add update and url to dependencies

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

    const dietaryInfo = Array.isArray(inputs.dietary_info)
      ? inputs.dietary_info
      : typeof inputs.dietary_info === 'string' &&
          inputs.dietary_info.length > 0
        ? inputs.dietary_info.split(',').map((id) => Number(id))
        : [];

    const recipe: PostRecipeData = {
      title: inputs.title as string,
      instructions: inputs.instructions as string,
      cooking_time:
        typeof inputs.cooking_time === 'number'
          ? inputs.cooking_time
          : Number(inputs.cooking_time),
      portions:
        typeof inputs.portions === 'number'
          ? inputs.portions
          : Number(inputs.portions),
      media_type: file.data.media_type,
      filename: file.data.filename,
      filesize: file.data.filesize,
      difficulty_level_id: Number(inputs.difficulty_level_id),
      ingredients: formattedIngredients,
      dietary_info: dietaryInfo.map((id) => Number(id)),
    };

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

  // update recipe
  const updateRecipe = async (
    token: string,
    recipe_id: number,
    updateData: EditRecipeInputs,
  ) => {
    try {
      const options = {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      };

      return await fetchData(
        process.env.EXPO_PUBLIC_MEDIA_API + '/recipes/' + recipe_id,
        options,
      );
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
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

  return {recipeArray, postRecipe, updateRecipe, deleteRecipe, loading};
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
    return JSON.parse(fileResult.body);
  };

  const postProfileImageFile = async (
    imageUri: string,
    token: string,
  ): Promise<UploadResponse> => {
    setLoading(true);
    const fileResult = await FileSystem.uploadAsync(
      process.env.EXPO_PUBLIC_UPLOAD_API + '/upload/profile',
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

    const response = JSON.parse(fileResult.body);

    return response;
  };

  return {postExpoFile, postProfileImageFile, loading};
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

const useComments = () => {
  const {getUserById} = useUser();

  // post a new comment with optional reference to another comment
  const postComment = async (
    comment_text: string,
    recipe_id: number,
    reference_comment_id: number | null, // null if no reference
    token: string,
  ) => {
    try {
      const options = {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: comment_text,
          recipe_id: recipe_id,
          reference_comment_id: reference_comment_id,
        }),
      };
      const response = await fetchData<MessageResponse>(
        process.env.EXPO_PUBLIC_MEDIA_API + '/comments',
        options,
      );
      return response;
    } catch (error) {
      console.error('Error posting comment:', error); // console log comment for removing it later
      throw new Error('Failed to post comment');
    }
  };

  // get all comments for a recipe
  const getCommentsByRecipeId = async (recipe_id: number) => {
    try {
      const comments = await fetchData<Comment[]>(
        process.env.EXPO_PUBLIC_MEDIA_API + '/comments/byrecipe/' + recipe_id,
      );

      // fetch usernames for each comment
      const commentsWithUsernames = await Promise.all(
        comments.map(async (comment) => {
          const user = await getUserById(comment.user_id);
          return {
            ...comment,
            username: user.username,
          }; // extract comment properties and add username
        }),
      );
      return commentsWithUsernames;
    } catch (error) {
      console.error('Error fetching comments:', error); // console log comment for removing it later
      throw new Error('Failed to fetch comments');
    }
  };

  // delete a comment (only for admins)
  const deleteComment = async (comment_id: number, token: string) => {
    try {
      const options = {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      };
      return await fetchData<MessageResponse>(
        process.env.EXPO_PUBLIC_MEDIA_API + '/comments/' + comment_id,
        options,
      );
    } catch (error) {
      console.error('Error deleting comment:', error); // console log comment for removing it later
      throw new Error('Failed to delete comment');
    }
  };

  return {
    postComment,
    getCommentsByRecipeId,
    deleteComment,
  };
};

// favorites
const useFavorites = () => {
  const {update, setUpdate} = useUpdateContext();

  // get all user's favorites to display then on favorites page
  const getAllFavorites = async () => {
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

      const favorites = await fetchData<RecipeWithAllFields[]>(
        `${process.env.EXPO_PUBLIC_MEDIA_API}/favorites/byuser`,
        options,
      );
      // return the favorites
      return favorites?.map((recipe) => ({
        ...recipe,
        // parse the diettypes and ingredients to an object array
        diet_types:
          typeof recipe.diet_types === 'string'
            ? JSON.parse(recipe.diet_types)
            : recipe.diet_types || [],
        ingredients:
          typeof recipe.ingredients === 'string'
            ? JSON.parse(recipe.ingredients)
            : recipe.ingredients || [],
      }));
    } catch (error) {
      return null;
    }
  };

  // check if user has already set the post as a favorite
  const checkFavorite = async (recipe_id: number) => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      return null;
    }

    try {
      const options = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await fetchData<{favorite: boolean}>(
        `${process.env.EXPO_PUBLIC_MEDIA_API}/favorites/byuser/${recipe_id}`,
        options,
      );
      return response.favorite ?? false;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return null;
    }
  };

  // add a recipe to favorites
  const addToFavorites = async (recipe_id: number) => {
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

      const added = await fetchData<MessageResponse>(
        `${process.env.EXPO_PUBLIC_MEDIA_API}/favorites`,
        options,
      );

      setUpdate(!update);
      return added;
    } catch (error) {
      console.error('Error adding favorite recipe:', error);
      return false;
    }
  };

  // remove recipe from favorites
  const removeFromFavorites = async (recipe_id: number) => {
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
        `${process.env.EXPO_PUBLIC_MEDIA_API}/favorites/byrecipe/${recipe_id}`,
        options,
      );

      setUpdate(!update);
      return true;
    } catch (error) {
      console.error('Error removing recipe from favorites:', error);
      return false;
    }
  };

  return {getAllFavorites, checkFavorite, addToFavorites, removeFromFavorites};
};

const useNotifications = () => {
  const {update, setUpdate} = useUpdateContext();
  const getAllNotificationsForUser = async (token: string) => {
    try {
      const options = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const notifications = await fetchData<Notification[]>(
        `${process.env.EXPO_PUBLIC_MEDIA_API}/notifications/user`,
        options,
      );
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return null;
    }
  };

  const markNotificationAsRead = async (notification_id: number, token: string) => {
    try {
      const options = {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      };
      const response = await fetchData<MessageResponse>(
        `${process.env.EXPO_PUBLIC_MEDIA_API}/notifications/user/${notification_id}/mark-read`,
        options,
      );
      setUpdate(!update);
      return response;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return null;
    }
  };

  const markAllNotificationsAsRead = async (token: string) => {
    try {
      const options = {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      };
      const response = await fetchData<MessageResponse>(
        `${process.env.EXPO_PUBLIC_MEDIA_API}/notifications/user/mark-read/all`,
        options,
      );
      setUpdate(!update);
      return response;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return null;
    }
  };

  const toggleNotificationsEnabled = async (token: string) => {
    try {
      const options = {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      };
      const response = await fetchData<MessageResponse>(
        `${process.env.EXPO_PUBLIC_MEDIA_API}/notifications/settings/toggle-enabled`,
        options,
      );
      setUpdate(!update);
      return response;
    } catch (error) {
      console.error('Error toggling notifications enabled:', error);
      return null;
    }
  };

  const checkNotificationsEnabled = async (user_id: number) => {
    try {
      const response = await fetchData<{enabled: boolean}>(
        `${process.env.EXPO_PUBLIC_MEDIA_API}/notifications/user/enabled/${user_id}`,
      );
      return response.enabled;
    } catch (error) {
      console.error('Error checking notifications enabled:', error);
      return null;
    }
  }

  // delete old notifications (older than 30 days)
  const deleteOldNotifications = async (token: string) => {
    try {
      const options = {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      };
      const response = await fetchData<MessageResponse>(
        `${process.env.EXPO_PUBLIC_MEDIA_API}/notifications/delete/old`,
        options,
      );
      setUpdate(!update);
      return response;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      return null;
    }
  };

  return {
    getAllNotificationsForUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    toggleNotificationsEnabled,
    checkNotificationsEnabled,
    deleteOldNotifications,
  }
};

export {
  useAuthentication,
  useUser,
  useRecipes,
  useFile,
  useDietTypes,
  useLikes,
  useComments,
  useFavorites,
  useNotifications
};

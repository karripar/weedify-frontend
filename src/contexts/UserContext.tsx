// UserContext.tsx
import React, {createContext, useState} from 'react';
import {
  Credentials,
  UserWithNoPassword,
  UserWithProfilePicture,
} from 'hybrid-types/DBTypes';
import {useAuthentication, useUser} from '../hooks/apiHooks';
import {AuthContextType} from '../types/LocalTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {UserResponse} from 'hybrid-types/MessageTypes';
import {Alert} from 'react-native';

const UserContext = createContext<AuthContextType | null>(null);

const UserProvider = ({children}: {children: React.ReactNode}) => {
  const {getUserByToken} = useUser();
  const {postLogin} = useAuthentication();
  const [user, setUser] = useState<UserWithProfilePicture | null>(null);

  const formatUserData = (
    userData: UserWithNoPassword,
  ): UserWithProfilePicture => {
    return {
      ...userData,
      profile_picture:
        'profilePicture' in userData
          ? (userData as any).profile_picture || ''
          : '',
    } as UserWithProfilePicture;
  };

  const handleLogin = async (credentials: Credentials) => {
    try {
      const loginResult = await postLogin(credentials);
      console.log('doLogin result', loginResult);
      if (loginResult) {
        await AsyncStorage.setItem('token', loginResult.token);

        setUser(formatUserData(loginResult.user));
      }
    } catch (e) {
      console.log((e as Error).message);
      Alert.alert('Login failed', (e as Error).message);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');

      setUser(null);
    } catch (e) {
      console.log((e as Error).message);
    }
  };

  // handleAutoLogin is used when the app is loaded to check if there is a valid token in local storage
  const handleAutoLogin = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return;
      }

      const userResponse = await getUserByToken(token);
      if (userResponse && userResponse.user) {
        setUser(formatUserData(userResponse.user));
      }
    } catch (e) {
      console.log((e as Error).message);
    }
  };

  return (
    <UserContext.Provider
      value={{user, handleLogin, handleLogout, handleAutoLogin}}
    >
      {children}
    </UserContext.Provider>
  );
};
export {UserProvider, UserContext};

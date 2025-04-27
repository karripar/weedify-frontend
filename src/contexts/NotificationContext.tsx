import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../hooks/apiHooks';

interface NotificationContextType {
  notificationCount: number;
  setNotificationCount: React.Dispatch<React.SetStateAction<number>>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const { getAllNotificationsForUser } = useNotifications(); // Move this inside the provider

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          return;
        }
        const notifications = await getAllNotificationsForUser(token);
        if (!notifications) {
          console.error('No notifications found');
          return;
        }
        setNotificationCount(notifications.length); // Update state after fetching
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, [getAllNotificationsForUser]); // Ensure that getAllNotificationsForUser is stable

  return (
    <NotificationContext.Provider value={{ notificationCount, setNotificationCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

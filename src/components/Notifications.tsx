import {useEffect, useRef, useState} from 'react';
import {useUserContext} from '../hooks/contextHooks';
import { useNotifications } from '../hooks/apiHooks';
import {
  Notification
} from 'hybrid-types/DBTypes';
import {formatDateToTimePassed} from '../lib/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {StyleSheet, TouchableOpacity, View, Animated} from 'react-native';
import {Text} from '@rneui/base';
import {HexColors} from '../utils/colors';

type NotificationsProps = {
  visible: boolean;
};

const Notifications: React.FC<NotificationsProps> = ({ visible }) => {
  const {user} = useUserContext();
  const {getAllNotificationsForUser, markAllNotificationsAsRead, markNotificationAsRead, checkNotificationsEnabled, toggleNotificationsEnabled} = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const slideAnimation = useRef(new Animated.Value(0)).current;

  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('No token found');
          setLoading(false);
          return;
        }
        const notifications = await getAllNotificationsForUser(token);
        if (!notifications) {
          setError('No notifications found');
          setLoading(false);
          return;
        }
        setNotifications(notifications);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch notifications');
        setLoading(false);
      }
    };

    if (visible && user?.user_id) {
      setLoading(true); // show loading spinner while fetching
      fetchNotifications();
    }

  }, [visible, user?.user_id]); // depends on user_id and visible prop


  const handleMarkAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('No token found');
        return;
      }
      await markAllNotificationsAsRead(token);
      setNotifications([]);
    } catch (error) {
      setError('Failed to mark all notifications as read');
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('No token found');
        return;
      }
      await markNotificationAsRead(notificationId, token);
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.notification_id !== notificationId)
      );
    } catch (error) {
      setError('Failed to mark notification as read');
    }
  };

  const handleToggleNotificationsEnabled = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setError('No token found');
        return;
      }
      await toggleNotificationsEnabled(token);
      setNotificationsEnabled((prevEnabled) => !prevEnabled);
    } catch (error) {
      setError('Failed to toggle notifications enabled status');
    }
  };

  const handleCheckNotificationsEnabled = async () => {
    try {
      const user_id = user?.user_id;
      if (!user_id) {
        setError('No user ID found');
        return;
      }
      const enabled = await checkNotificationsEnabled(user_id);
      setNotificationsEnabled(enabled? true : false);
    } catch (error) {
      setError('Failed to check notifications enabled status');
    }
  };

  useEffect(() => {
    if (visible) {
      handleCheckNotificationsEnabled();
    }
  }, [visible]);

  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }
  , [visible]);


  if (!visible) {
    return null; // Don't render anything if not visible
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <Animated.View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={handleToggleNotificationsEnabled}
      >
        <Text style={styles.toggleButtonText}>
          {notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
        </Text>
      </TouchableOpacity>
      {notifications.length === 0 ? (
        <Text style={styles.noNotificationsText}>No notifications</Text>
      ) : (
        <View style={styles.notificationsList}>
          {notifications.map((notification) => (
            <View key={notification.notification_id} style={styles.notificationItem}>
              <Text style={styles.notificationText}>{notification.notification_text}</Text>
              <Text style={styles.notificationTime}>
                {formatDateToTimePassed(notification.created_at)}
              </Text>
            </View>
          ))}
        </View>
      )}
      {notifications.length > 0 && (
        <TouchableOpacity
          style={styles.markAllAsReadButton}
          onPress={handleMarkAllAsRead}
        >
          <Text style={styles.markAllAsReadButtonText}>Mark All as Read</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: HexColors.white,
    height: '100%',
    justifyContent: 'center',
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: HexColors['green'],
    padding: 10,
    borderRadius: 5,
    marginBottom: 16,
  },
  toggleButtonText: {
    color: HexColors.white,
    textAlign: 'center',
  },
  noNotificationsText: {
    textAlign: 'center',
    fontSize: 18,
    color: HexColors['green'],
  },
  notificationsList: {
    marginBottom: 16,
  },
  notificationItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: HexColors['dark-green'],
    marginBottom: 10,
  },
  notificationText: {
    fontSize: 16,
    color: HexColors['darkest-green'],
  },
  notificationTime: {
    fontSize: 12,
    color: HexColors['green'],
  },
  markAsReadButton: {
    backgroundColor: HexColors['green'],
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
  },
  markAsReadButtonText: {
    color: HexColors.white,
    textAlign: 'center',
  },
  markAllAsReadButton: {
    backgroundColor: HexColors['green'],
    padding: 10,
    borderRadius: 5,
    marginTop: 16,
  },
  markAllAsReadButtonText: {
    color: HexColors.white,
    textAlign: 'center',
    fontSize: 16,
  },
  notificationEnabledText: {
    fontSize: 16,
    color: HexColors['almost-white'],
    marginBottom: 16,
  },
  notificationDisabledText: {
    fontSize: 16,
    color: HexColors['almost-white'],
    marginBottom: 16,
  },
  notificationEnabledButton: {
    backgroundColor: HexColors['green'],
    padding: 10,
    borderRadius: 5,
    marginBottom: 16,
  }});

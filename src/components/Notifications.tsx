import {useEffect, useRef, useState} from 'react';
import {useUserContext} from '../hooks/contextHooks';
import {useNotifications} from '../hooks/apiHooks';
import {Notification} from 'hybrid-types/DBTypes';
import {formatDateToTimePassed} from '../lib/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
  ScrollView,
  TouchableWithoutFeedback
} from 'react-native';
import {Text} from '@rneui/base';
import {HexColors} from '../utils/colors';

type NotificationsProps = {
  visible: boolean;
  onClose: () => void;
};

const Notifications: React.FC<NotificationsProps> = ({visible, onClose}) => {
  const {user} = useUserContext();
  const {
    getAllNotificationsForUser,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    checkNotificationsEnabled,
    toggleNotificationsEnabled,
  } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const [isMounted, setIsMounted] = useState(visible);

  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(false);

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
        prevNotifications.filter(
          (notification) => notification.notification_id !== notificationId,
        ),
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
      setNotificationsEnabled(enabled ? true : false);
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
    if (visible) {
      setIsMounted(true);
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // AFTER the animation is finished
        setIsMounted(false);
      });
    }
  }, [visible]);

  if (!isMounted) {
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
    <Animated.View
  pointerEvents={visible ? 'auto' : 'none'}
  style={[styles.overlay, {opacity: slideAnimation}]}
>
  <View style={styles.modal}>
    <Text style={styles.title}>Notifications</Text>

    {/* Close Button */}
    <TouchableOpacity
      style={styles.closeButton}
      onPress={() => {
        onClose();
        setIsMounted(false);
      }}
    >
      <Text style={styles.closeButtonText}>X</Text>
    </TouchableOpacity>

    {/* Notifications ScrollView */}
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={{paddingBottom: 20}}
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
    >
      {notifications.length === 0 ? (
        <Text style={styles.noNotificationsText}>No notifications</Text>
      ) : (
        notifications.map((notification) => (
          <View
            key={notification.notification_id}
            style={styles.notificationItem}
          >
            <Text style={styles.notificationText}>
              {notification.notification_text}
            </Text>
            <Text style={styles.notificationTime}>
              {formatDateToTimePassed(notification.created_at)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>

    {/* Mark All as Read Button */}
    {notifications.length > 0 && (
      <TouchableOpacity
        style={styles.markAllAsReadButton}
        onPress={handleMarkAllAsRead}
      >
        <Text style={styles.markAllAsReadButtonText}>Mark All as Read</Text>
      </TouchableOpacity>
    )}
  </View>
</Animated.View>

  );

};

export default Notifications;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  modal: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: HexColors['white'],
    borderRadius: 10,
    padding: 20,
    flexShrink: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    marginTop: 50,
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
    maxHeight: 350,
  },
  notificationItem: {
    backgroundColor: HexColors['almost-white'],
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 0,
  },
  notificationText: {
    fontSize: 16,
    color: HexColors['light-green'],
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
    borderRadius: 8,
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: HexColors['light-green'],
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: HexColors.white,
    fontSize: 16,
    padding: 3,
  },
  scrollArea: {
    flexGrow: 0,
    maxHeight: '70%',  // <<< MAKE SURE THE SCROLL AREA CAN GROW
  },
});

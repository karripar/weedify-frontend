import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import Profile from '../views/Profile';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {NavigatorType} from '../types/LocalTypes';
import Home from '../views/Home';
import Newpost from '../views/Newpost';
import Favorites from '../views/Favorites';
import {HexColors} from '../utils/colors';
import {useUserContext} from '../hooks/contextHooks';
import Login from '../views/Login';
import EditProfileForm from '../components/EditProfileForm';
import Single from '../views/Single';

const Tab = createBottomTabNavigator<NavigatorType>();
const Stack = createNativeStackNavigator<NavigatorType>();

const TabScreen = () => {
  const {user} = useUserContext();
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName = '';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Post') {
            iconName = focused ? 'add' : 'add-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Weedify') {
            iconName = focused ? 'log-in' : 'log-in-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: HexColors['dark-green'],
        tabBarInactiveTintColor: HexColors['dark-grey'],
        tabBarStyle: {
          backgroundColor: HexColors['light-purple'],
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} options={{headerShown: false}} />
      {user ? (
        <>
          <Tab.Screen
            name="Post"
            component={Newpost}
            options={{
              headerStyle: {backgroundColor: HexColors['medium-green']},
              headerTintColor: HexColors['light-purple'],
            }}
          />
          <Tab.Screen
            name="Favorites"
            component={Favorites}
            options={{
              headerStyle: {backgroundColor: HexColors['medium-green']},
              headerTintColor: HexColors['light-purple'],
            }}
          />
          <Tab.Screen
            name="Profile"
            component={Profile}
            options={{
              headerStyle: {backgroundColor: HexColors['medium-green']},
              headerTintColor: HexColors['light-purple'],
            }}
          />
        </>
      ) : (
        <Tab.Screen
          name="Weedify"
          component={Login}
          options={{headerShown: false}}
        />
      )}
    </Tab.Navigator>
  );
};

const StackScreen = () => {
  return (
    <Stack.Navigator>
      <>
        <Stack.Screen
          name="Back"
          component={TabScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Edit Profile"
          component={EditProfileForm}
          options={{
            headerStyle: {backgroundColor: HexColors['medium-green']},
            headerTintColor: HexColors['light-purple'],

          }}
        />
        <Stack.Screen
          name="Recipe"
          component={Single}
          options={{
            headerStyle: {backgroundColor: HexColors['medium-green']},
            headerTintColor: HexColors['light-purple'],

          }}
          />
      </>
    </Stack.Navigator>
  );
};

const Navigator = () => {
  return (
    <NavigationContainer>
      <StackScreen />
    </NavigationContainer>
  );
};

export default Navigator;

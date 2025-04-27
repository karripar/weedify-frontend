import {StatusBar} from 'expo-status-bar';
import Navigator from './navigators/Navigator';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {UserProvider} from './contexts/UserContext';
import {UpdateProvider} from './contexts/updateContext';
import FontPreload from './components/FontPreload';
import { NotificationProvider } from './contexts/NotificationContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <FontPreload>
        <UserProvider>
          <UpdateProvider>
            <NotificationProvider>
            <Navigator />
            </NotificationProvider>
          </UpdateProvider>
        </UserProvider>
        <StatusBar style="auto" />
      </FontPreload>
    </SafeAreaProvider>
  );
}

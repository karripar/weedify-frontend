import {StatusBar} from 'expo-status-bar';
import {StyleSheet, View} from 'react-native';
import Navigator from './navigators/Navigator';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {UserProvider} from './contexts/UserContext';
import {useFonts} from 'expo-font';

export default function App() {
  const [fontsLoaded] = useFonts({
    'KronaOne-Regular': require('../assets/fonts/Krona_One/KronaOne-Regular.ttf'),
    'InriaSans-Regular': require('../assets/fonts/Inria_Sans/InriaSans-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }
  return (
    <SafeAreaProvider>
      <UserProvider>
        <Navigator></Navigator>
      </UserProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

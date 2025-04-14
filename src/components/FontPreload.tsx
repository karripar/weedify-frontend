import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import * as Font from 'expo-font';

interface FontPreloadProps {
  children: React.ReactNode;
}

const FontPreload: React.FC<FontPreloadProps> = ({ children }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // Use system fonts for now to get the app running
          'KronaOne-Regular': require('system-font'),
          'InriaSans-Regular': require('system-font'),
        });
      } catch (error) {
        console.warn('Font loading error:', error);
      } finally {
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading fonts...</Text>
      </View>
    );
  }

  return <>{children}</>;
};

export default FontPreload;

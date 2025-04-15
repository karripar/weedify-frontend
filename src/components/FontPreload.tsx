import React, {useEffect, useState} from 'react';
import {View, Text} from 'react-native';
import * as Font from 'expo-font';

interface FontPreloadProps {
  children: React.ReactNode;
}

const FontPreload: React.FC<FontPreloadProps> = ({children}) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'KronaOne-Regular': require('../../assets/fonts/Krona_One/KronaOne-Regular.ttf'),
          'InriaSans-Regular': require('../../assets/fonts/Inria_Sans/InriaSans-Regular.ttf'),
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
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Loading fonts...</Text>
      </View>
    );
  }

  return <>{children}</>;
};

export default FontPreload;

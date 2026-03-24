/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TizzyGo from './src/navigations';
import { ThemeProvider } from './src/core/contexts/theme/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <TizzyGo />
      </NavigationContainer>
    </ThemeProvider>
  );
}
export default App;

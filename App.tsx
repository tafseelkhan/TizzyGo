/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import TizzyGo from './src/navigations';
import { ThemeProvider } from './src/core/contexts/theme/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <TizzyGo />
    </ThemeProvider>
  );
}
export default App;

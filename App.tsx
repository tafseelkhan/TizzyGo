/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import TizzyGo from './src/navigations';
import { ThemeProvider } from './src/core/contexts/theme/ThemeContext';
import { AuthProvider } from './src/core/contexts/auth/UserContext';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <TizzyGo />
      </ThemeProvider>
    </AuthProvider>
  );
}
export default App;

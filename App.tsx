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
import { ZeptPayPaymentProvider } from '@flixora/zeptpay-payment-react-native';

function App() {
  return (
    <ZeptPayPaymentProvider publicKey="pk-flixora_test_@zeptpay:tizzy-flixora-ecosystem_053bf0f4f1e59760a3f63fe3ebc28a1920f4b57c93c8e648">
      <AuthProvider>
        <ThemeProvider>
          <TizzyGo />
        </ThemeProvider>
      </AuthProvider>
    </ZeptPayPaymentProvider>
  );
}
export default App;

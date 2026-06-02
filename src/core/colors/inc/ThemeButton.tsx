// src/components/ThemeButton.tsx
import React, { useState, ReactNode } from 'react';
import { TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/theme/ThemeContext';

interface ThemeButtonProps {
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  children: ReactNode;
  disabled?: boolean;
}

export const ThemeButton: React.FC<ThemeButtonProps> = ({
  onPress,
  style,
  children,
  disabled = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const { isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        style,
        isPressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
      ]}
    >
      {children}
    </TouchableOpacity>
  );
};

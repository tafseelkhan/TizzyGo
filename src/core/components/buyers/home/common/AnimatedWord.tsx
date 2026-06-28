// components/AnimatedWord.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Animated, Text, Easing } from 'react-native';

interface AnimatedWordProps {
  word: string;
  isAnimating: boolean;
  onAnimationComplete: () => void;
  textStyle: any;
}

export const AnimatedWord: React.FC<AnimatedWordProps> = ({
  word,
  isAnimating,
  onAnimationComplete,
  textStyle,
}) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const [displayWord, setDisplayWord] = useState(word);
  const animationRef = useRef<any>(null);

  useEffect(() => {
    if (isAnimating) {
      animationRef.current = Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setDisplayWord(word);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start(() => onAnimationComplete());
      });
    }

    return () => {
      if (animationRef.current) animationRef.current.stop();
    };
  }, [isAnimating, word, opacity, onAnimationComplete]);

  useEffect(() => {
    if (!isAnimating) {
      setDisplayWord(word);
      opacity.setValue(1);
    }
  }, [word, isAnimating]);

  return (
    <Animated.View style={{ opacity }}>
      <Text style={textStyle}>{displayWord}</Text>
    </Animated.View>
  );
};

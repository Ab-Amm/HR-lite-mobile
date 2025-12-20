import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme/theme';

const AnimatedLogo = ({ size = 100 }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation for the outer ring
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="100" y2="100">
              <Stop offset="0" stopColor={colors.primary} stopOpacity="1" />
              <Stop offset="1" stopColor={colors.primaryLight} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          
          {/* Background Circle */}
          <Circle cx="50" cy="50" r="45" fill="url(#grad)" opacity="0.1" />
          
          {/* Stylized Person/User Icon */}
          <Path
            d="M50 25 C55.5 25 60 29.5 60 35 C60 40.5 55.5 45 50 45 C44.5 45 40 40.5 40 35 C40 29.5 44.5 25 50 25 Z"
            fill={colors.primary}
          />
          <Path
            d="M30 75 C30 61.7 40 55 50 55 C60 55 70 61.7 70 75"
            stroke={colors.primary}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Checkmark / Badge */}
          <Circle cx="70" cy="30" r="12" fill={colors.success} />
          <Path
            d="M65 30 L68 33 L75 26"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
      
      {/* Rotating Ring */}
      <Animated.View 
        style={{ 
          position: 'absolute', 
          width: size, 
          height: size, 
          transform: [{ rotate: spin }] 
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
           <Path
            d="M50 5 A45 45 0 0 1 95 50"
            stroke={colors.primaryLight}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />
          <Path
            d="M50 95 A45 45 0 0 1 5 50"
            stroke={colors.primaryLight}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

export default AnimatedLogo;
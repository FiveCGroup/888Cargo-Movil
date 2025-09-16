import React from 'react';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';

// Fondo personalizado para iOS con el color de marca
export default function TabBarBackground() {
  return (
    <View 
      style={[
        StyleSheet.absoluteFill, 
        { backgroundColor: '#17243f' }
      ]} 
    />
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}

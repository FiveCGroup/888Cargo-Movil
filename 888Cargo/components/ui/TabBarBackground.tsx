import React from 'react';
import { View, StyleSheet } from 'react-native';

// Fondo personalizado para la barra de tabs con el color de marca
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
  return 0;
}

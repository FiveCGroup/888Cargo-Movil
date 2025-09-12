import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Colors, FontSizes, Spacing } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

interface Logo888CargoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  style?: ViewStyle;
  logoStyle?: ImageStyle;
  textStyle?: TextStyle;
  layout?: 'horizontal' | 'vertical';
}

export default function Logo888Cargo({
  size = 'medium',
  showText = true,
  style,
  logoStyle,
  textStyle,
  layout = 'vertical'
}: Logo888CargoProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const sizeConfig = {
    small: {
      logoSize: 40,
      fontSize: FontSizes.base,
      spacing: Spacing.xs
    },
    medium: {
      logoSize: 60,
      fontSize: FontSizes.xl,
      spacing: Spacing.sm
    },
    large: {
      logoSize: 80,
      fontSize: FontSizes.xxl,
      spacing: Spacing.md
    }
  };

  const config = sizeConfig[size];

  const containerStyle = layout === 'horizontal' 
    ? styles.horizontalContainer 
    : styles.verticalContainer;

  return (
    <View style={[containerStyle, style]}>
      <Image
        source={require('../assets/images/888cargo-logo.png')}
        style={[
          styles.logo,
          {
            width: config.logoSize,
            height: config.logoSize,
          },
          logoStyle
        ]}
        resizeMode="contain"
      />
      {showText && (
        <Text
          style={[
            styles.logoText,
            {
              fontSize: config.fontSize,
              color: colors.primary,
              marginTop: layout === 'vertical' ? config.spacing : 0,
              marginLeft: layout === 'horizontal' ? config.spacing : 0,
            },
            textStyle
          ]}
        >
          888Cargo
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  verticalContainer: {
    alignItems: 'center',
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    borderRadius: 8,
  },
  logoText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

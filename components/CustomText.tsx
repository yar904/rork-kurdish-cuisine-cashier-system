import React from 'react';
import { Text as RNText, type TextProps, StyleSheet } from 'react-native';

export function Text({ style, ...props }: TextProps) {
  return <RNText style={[styles.defaultFont, style]} {...props} />;
}

const styles = StyleSheet.create({
  defaultFont: {
    fontFamily: 'NotoNaskhArabic-Regular',
  },
});

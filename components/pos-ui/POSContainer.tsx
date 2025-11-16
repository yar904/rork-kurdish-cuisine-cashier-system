import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

type POSContainerProps = {
  children: React.ReactNode;
};

export function POSContainer({ children }: POSContainerProps) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    ...Platform.select({
      web: {
        maxWidth: 2000,
        alignSelf: 'center' as const,
        width: '100%',
      },
    }),
  },
});

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { useOffline } from '@/contexts/OfflineContext';


export default function OfflineBanner() {
  const { isOnline, isSyncing, offlineQueue } = useOffline();
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (!isOnline || isSyncing) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, isSyncing, fadeAnim]);

  if (isOnline && !isSyncing) return null;

  return (
    <Animated.View 
      style={[
        styles.banner, 
        !isOnline ? styles.offline : styles.syncing,
        { opacity: fadeAnim }
      ]}
    >
      <View style={styles.content}>
        {!isOnline ? (
          <>
            <WifiOff size={16} color="#fff" />
            <Text style={styles.text}>
              Offline Mode {offlineQueue.length > 0 && `(${offlineQueue.length} pending)`}
            </Text>
          </>
        ) : (
          <>
            <RefreshCw size={16} color="#fff" />
            <Text style={styles.text}>
              Syncing {offlineQueue.length} items...
            </Text>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  offline: {
    backgroundColor: '#e74c3c',
  },
  syncing: {
    backgroundColor: '#f39c12',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});

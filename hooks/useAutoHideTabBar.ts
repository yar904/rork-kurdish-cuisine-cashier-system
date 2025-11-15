import { useRef, useCallback } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface UseAutoHideTabBarOptions {
  scrollThreshold?: number;
  animationDuration?: number;
  hideOffset?: number;
}

export function useAutoHideTabBar(options: UseAutoHideTabBarOptions = {}) {
  const {
    scrollThreshold = 1,
    hideOffset = 100,
  } = options;

  const lastScrollY = useRef(0);
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (Math.abs(scrollDelta) < scrollThreshold) return;

      if (scrollDelta > 0 && currentScrollY > 30) {
        Animated.spring(tabBarTranslateY, {
          toValue: hideOffset,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }).start();
      } else if (scrollDelta < 0) {
        Animated.spring(tabBarTranslateY, {
          toValue: 0,
          tension: 120,
          friction: 10,
          useNativeDriver: true,
        }).start();
      }

      lastScrollY.current = currentScrollY;
    },
    [tabBarTranslateY, scrollThreshold, hideOffset]
  );

  return {
    tabBarTranslateY,
    handleScroll,
  };
}

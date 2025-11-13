import { useRef, useCallback } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface UseAutoHideTabBarOptions {
  scrollThreshold?: number;
  animationDuration?: number;
  hideOffset?: number;
}

export function useAutoHideTabBar(options: UseAutoHideTabBarOptions = {}) {
  const {
    scrollThreshold = 5,
    animationDuration = 300,
    hideOffset = 100,
  } = options;

  const lastScrollY = useRef(0);
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const scrollDelta = currentScrollY - lastScrollY.current;

      if (Math.abs(scrollDelta) < scrollThreshold) return;

      if (scrollDelta > 0 && currentScrollY > 100) {
        Animated.timing(tabBarTranslateY, {
          toValue: hideOffset,
          duration: animationDuration,
          useNativeDriver: true,
        }).start();
      } else if (scrollDelta < 0) {
        Animated.timing(tabBarTranslateY, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        }).start();
      }

      lastScrollY.current = currentScrollY;
    },
    [tabBarTranslateY, scrollThreshold, animationDuration, hideOffset]
  );

  return {
    tabBarTranslateY,
    handleScroll,
  };
}

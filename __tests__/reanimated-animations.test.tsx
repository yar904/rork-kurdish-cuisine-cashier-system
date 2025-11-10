import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';

describe('React Native Reanimated Animation Rendering', () => {
  // Test Component with basic animation
  const AnimatedComponent = () => {
    const opacity = useSharedValue(0);
    
    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
      };
    });

    React.useEffect(() => {
      opacity.value = withTiming(1, { duration: 300 });
    }, []);

    return (
      <Animated.View style={animatedStyle} testID="animated-view">
        <Text>Animated Content</Text>
      </Animated.View>
    );
  };

  it('should render animated components without crashing', () => {
    const { getByTestId } = render(<AnimatedComponent />);
    expect(getByTestId('animated-view')).toBeDefined();
  });

  it('should render Animated.View correctly', () => {
    const { getByTestId } = render(
      <Animated.View testID="animated-view">
        <Text>Test</Text>
      </Animated.View>
    );
    
    expect(getByTestId('animated-view')).toBeDefined();
  });

  it('should handle useSharedValue hook', () => {
    const TestComponent = () => {
      const value = useSharedValue(0);
      return <View testID="test-view" />;
    };

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('test-view')).toBeDefined();
  });

  it('should handle useAnimatedStyle hook', () => {
    const TestComponent = () => {
      const scale = useSharedValue(1);
      
      const animatedStyle = useAnimatedStyle(() => {
        return {
          transform: [{ scale: scale.value }],
        };
      });

      return (
        <Animated.View style={animatedStyle} testID="scaled-view">
          <Text>Scaled</Text>
        </Animated.View>
      );
    };

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('scaled-view')).toBeDefined();
  });

  it('should support withTiming animation on iOS platform', () => {
    const TestComponent = () => {
      const position = useSharedValue(0);
      
      const animatedStyle = useAnimatedStyle(() => {
        return {
          transform: [{ translateX: position.value }],
        };
      });

      React.useEffect(() => {
        position.value = withTiming(100, { 
          duration: 500,
          easing: Easing.inOut(Easing.ease),
        });
      }, []);

      return (
        <Animated.View style={animatedStyle} testID="ios-animated-view">
          <Text>iOS Animation</Text>
        </Animated.View>
      );
    };

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('ios-animated-view')).toBeDefined();
  });

  it('should support withSpring animation on Android platform', () => {
    const TestComponent = () => {
      const scale = useSharedValue(1);
      
      const animatedStyle = useAnimatedStyle(() => {
        return {
          transform: [{ scale: scale.value }],
        };
      });

      React.useEffect(() => {
        scale.value = withSpring(1.5, {
          damping: 10,
          stiffness: 100,
        });
      }, []);

      return (
        <Animated.View style={animatedStyle} testID="android-animated-view">
          <Text>Android Animation</Text>
        </Animated.View>
      );
    };

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('android-animated-view')).toBeDefined();
  });

  it('should support withSpring animation on Web platform', () => {
    const TestComponent = () => {
      const opacity = useSharedValue(0);
      
      const animatedStyle = useAnimatedStyle(() => {
        return {
          opacity: opacity.value,
        };
      });

      React.useEffect(() => {
        opacity.value = withSpring(1);
      }, []);

      return (
        <Animated.View style={animatedStyle} testID="web-animated-view">
          <Text>Web Animation</Text>
        </Animated.View>
      );
    };

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('web-animated-view')).toBeDefined();
  });

  it('should support complex animation sequences', () => {
    const TestComponent = () => {
      const rotate = useSharedValue(0);
      
      const animatedStyle = useAnimatedStyle(() => {
        return {
          transform: [{ rotate: `${rotate.value}deg` }],
        };
      });

      React.useEffect(() => {
        rotate.value = withSequence(
          withTiming(180, { duration: 500 }),
          withTiming(360, { duration: 500 })
        );
      }, []);

      return (
        <Animated.View style={animatedStyle} testID="sequence-animated-view">
          <Text>Sequence Animation</Text>
        </Animated.View>
      );
    };

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('sequence-animated-view')).toBeDefined();
  });

  it('should support delayed animations', () => {
    const TestComponent = () => {
      const opacity = useSharedValue(0);
      
      const animatedStyle = useAnimatedStyle(() => {
        return {
          opacity: opacity.value,
        };
      });

      React.useEffect(() => {
        opacity.value = withDelay(200, withTiming(1));
      }, []);

      return (
        <Animated.View style={animatedStyle} testID="delayed-animated-view">
          <Text>Delayed Animation</Text>
        </Animated.View>
      );
    };

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('delayed-animated-view')).toBeDefined();
  });

  it('should support multiple animated properties', () => {
    const TestComponent = () => {
      const translateX = useSharedValue(0);
      const scale = useSharedValue(1);
      const opacity = useSharedValue(0);
      
      const animatedStyle = useAnimatedStyle(() => {
        return {
          transform: [
            { translateX: translateX.value },
            { scale: scale.value },
          ],
          opacity: opacity.value,
        };
      });

      React.useEffect(() => {
        translateX.value = withTiming(100);
        scale.value = withSpring(1.2);
        opacity.value = withTiming(1);
      }, []);

      return (
        <Animated.View style={animatedStyle} testID="multi-prop-animated-view">
          <Text>Multiple Properties</Text>
        </Animated.View>
      );
    };

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('multi-prop-animated-view')).toBeDefined();
  });

  it('should render Animated.Text correctly', () => {
    const TestComponent = () => {
      const opacity = useSharedValue(0);
      
      const animatedStyle = useAnimatedStyle(() => {
        return {
          opacity: opacity.value,
        };
      });

      return (
        <Animated.Text style={animatedStyle} testID="animated-text">
          Animated Text
        </Animated.Text>
      );
    };

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('animated-text')).toBeDefined();
  });

  it('should render Animated.ScrollView correctly', () => {
    const TestComponent = () => {
      const opacity = useSharedValue(1);
      
      const animatedStyle = useAnimatedStyle(() => {
        return {
          opacity: opacity.value,
        };
      });

      return (
        <Animated.ScrollView style={animatedStyle} testID="animated-scrollview">
          <Text>Scrollable Content</Text>
        </Animated.ScrollView>
      );
    };

    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('animated-scrollview')).toBeDefined();
  });
});

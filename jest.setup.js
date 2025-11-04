// Note: @testing-library/jest-native is deprecated in v12.4+
// Matchers are now built into @testing-library/react-native
import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Stack: {
    Screen: () => null,
  },
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaProvider: ({ children }) => children,
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  ChefHat: 'ChefHat',
  Clock: 'Clock',
  CheckCircle: 'CheckCircle',
  Bell: 'Bell',
  ArrowLeft: 'ArrowLeft',
  User: 'User',
  DollarSign: 'DollarSign',
  AlertCircle: 'AlertCircle',
  X: 'X',
  Search: 'Search',
  Globe: 'Globe',
  ShoppingCart: 'ShoppingCart',
  Plus: 'Plus',
  Minus: 'Minus',
  Send: 'Send',
  MessageCircle: 'MessageCircle',
  Star: 'Star',
  Utensils: 'Utensils',
}));

// Mock expo modules
jest.mock('expo-font');
jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(),
  preventAutoHideAsync: jest.fn(),
}));

// Mock Image component
jest.mock('react-native/Libraries/Image/Image', () => 'Image');

global.__reanimatedWorkletInit = jest.fn();

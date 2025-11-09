# React Native Reanimated Test Suite

This directory contains comprehensive unit tests for verifying the integration and functionality of `react-native-reanimated` in the application.

## Test Structure

### 1. Build Verification Tests (`reanimated-build.test.tsx`)
Tests to verify that the application builds successfully after adding react-native-reanimated:

- ✅ Import verification
- ✅ Core Reanimated exports validation
- ✅ Animated components availability
- ✅ Babel plugin configuration
- ✅ Package.json dependency verification
- ✅ TypeScript types availability
- ✅ Worklet support

### 2. Animation Rendering Tests (`reanimated-animations.test.tsx`)
Tests to verify that animations using react-native-reanimated render correctly on different platforms:

- ✅ Basic animation rendering (iOS, Android, Web)
- ✅ `useSharedValue` hook functionality
- ✅ `useAnimatedStyle` hook functionality
- ✅ `withTiming` animation support
- ✅ `withSpring` animation support
- ✅ `withDelay` animation support
- ✅ `withSequence` animation support
- ✅ Multiple animated properties
- ✅ Animated components (View, Text, ScrollView)

### 3. Component Functionality Tests

#### Order Tracking Component (`components/order-tracking.test.tsx`)
Tests for animations in the order tracking screen:

- ✅ Progress bar animation
- ✅ Pulse animation for current stage
- ✅ Animated.Value initialization
- ✅ Animation interpolation
- ✅ Multiple simultaneous animations
- ✅ Native driver usage

#### Menu Component (`components/menu.test.tsx`)
Tests for animations in the menu screen:

- ✅ Search container slide animation
- ✅ Category slider height animation
- ✅ FAB (Floating Action Button) entrance animation
- ✅ Scroll-based animations
- ✅ Spring animations with custom config
- ✅ Animation cleanup on unmount

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Only Reanimated Tests
```bash
npm run test:reanimated
```

## Test Configuration

- **Jest Config**: `jest.config.js`
- **Setup File**: `jest.setup.js`
- **Mock Files**: `__mocks__/react-native-reanimated.js`

## Key Features Tested

### Platform Support
- ✅ iOS animations
- ✅ Android animations
- ✅ Web animations

### Animation Types
- ✅ Timing animations (`withTiming`)
- ✅ Spring animations (`withSpring`)
- ✅ Delayed animations (`withDelay`)
- ✅ Sequential animations (`withSequence`)
- ✅ Looped animations

### Performance
- ✅ Native driver usage for transform animations
- ✅ Proper driver configuration for layout animations

### Reanimated Hooks
- ✅ `useSharedValue`
- ✅ `useAnimatedStyle`

### Animated Components
- ✅ `Animated.View`
- ✅ `Animated.Text`
- ✅ `Animated.ScrollView`

## Mocking Strategy

The test suite uses comprehensive mocking for:
- React Native Reanimated (using official mock)
- Expo Router
- Safe Area Context
- Icon libraries
- Storage
- Context providers

## Coverage Goals

The test suite aims to cover:
1. **Build verification**: Ensuring the library is properly installed and configured
2. **Animation rendering**: Verifying animations work across all platforms
3. **Component integration**: Testing real component usage of reanimated

## Troubleshooting

### Common Issues

1. **Mock not found**: Ensure `react-native-reanimated/mock` is available
2. **TypeScript errors**: Check that `@types/jest` is installed
3. **Import errors**: Verify all path aliases are configured in `jest.config.js`

### Debug Mode

To run tests with verbose output:
```bash
npm test -- --verbose
```

## Continuous Integration

These tests can be integrated into CI/CD pipelines:
```yaml
- name: Run Tests
  run: npm test
  
- name: Generate Coverage Report
  run: npm run test:coverage
```

## Contributing

When adding new reanimated features:
1. Add corresponding tests in the appropriate test file
2. Update this README with new test cases
3. Ensure all tests pass before committing
4. Maintain test coverage above 80%

## Related Files

- `babel.config.js` - Includes reanimated plugin configuration
- `package.json` - Contains reanimated dependency and test scripts
- `app/order-tracking.tsx` - Component using Animated API
- `app/menu.tsx` - Component using Animated API

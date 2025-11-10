# Testing Quick Start Guide

## 🚀 Quick Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run only reanimated tests
npm run test:reanimated

# Clear cache and run tests
npm test -- --clearCache
```

## 📋 What Was Added

### Test Files (54 test cases total)
- ✅ `__tests__/reanimated-build.test.tsx` - Build verification (9 tests)
- ✅ `__tests__/reanimated-animations.test.tsx` - Animation rendering (12 tests)
- ✅ `__tests__/components/order-tracking.test.tsx` - Order tracking (15 tests)
- ✅ `__tests__/components/menu.test.tsx` - Menu animations (18 tests)

### Configuration
- ✅ `jest.config.js` - Jest configuration
- ✅ `jest.setup.js` - Test environment setup
- ✅ `__mocks__/react-native-reanimated.js` - Reanimated mock

### Documentation
- ✅ `__tests__/README.md` - Detailed documentation
- ✅ `TEST_SUITE_SUMMARY.md` - Complete summary

## ✅ What's Tested

### 1. Build Verification
- Library installation and imports
- Babel plugin configuration
- TypeScript types
- No conflicting dependencies

### 2. Animation Rendering
- iOS, Android, and Web platform support
- All animation types (timing, spring, delay, sequence)
- Reanimated hooks (useSharedValue, useAnimatedStyle)
- Animated components (View, Text, ScrollView)

### 3. Component Functionality
- Order tracking progress animations
- Menu search slide animations
- Category slider scroll animations
- FAB entrance animations

## 🔧 Installation

Dependencies are already in `package.json`. Just run:

```bash
npm install
```

## 📊 Expected Output

When you run `npm test`, you should see:

```
PASS __tests__/reanimated-build.test.tsx
PASS __tests__/reanimated-animations.test.tsx
PASS __tests__/components/order-tracking.test.tsx
PASS __tests__/components/menu.test.tsx

Test Suites: 4 passed, 4 total
Tests:       54 passed, 54 total
```

## 🐛 Troubleshooting

### Tests won't run?
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm test -- --clearCache
```

### Import errors?
Make sure `babel.config.js` has:
```javascript
plugins: [
  'react-native-reanimated/plugin',
]
```

## 📚 More Information

- Full documentation: `__tests__/README.md`
- Complete summary: `TEST_SUITE_SUMMARY.md`
- Jest config: `jest.config.js`

## 🎯 Test Coverage

Run with coverage to see detailed metrics:
```bash
npm run test:coverage
```

This generates a coverage report showing:
- Lines covered
- Functions covered
- Branches covered
- Statements covered

## 💡 Tips

1. **During Development**: Use watch mode
   ```bash
   npm run test:watch
   ```

2. **Before Committing**: Run all tests
   ```bash
   npm test
   ```

3. **For CI/CD**: Use coverage
   ```bash
   npm run test:coverage
   ```

## ✨ Success Criteria

All tests passing means:
- ✅ React Native Reanimated is properly installed
- ✅ Animations work on all platforms (iOS, Android, Web)
- ✅ Your components using Reanimated are functioning correctly

---

**Need help?** Check the detailed documentation in `__tests__/README.md` or `TEST_SUITE_SUMMARY.md`

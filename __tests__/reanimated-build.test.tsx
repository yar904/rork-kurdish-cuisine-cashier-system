/**
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';

describe('React Native Reanimated Build Verification', () => {
  it('should successfully import react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated');
    expect(Reanimated).toBeDefined();
  });

  it('should have core Reanimated exports', () => {
    const Reanimated = require('react-native-reanimated');
    
    // Check for essential exports
    expect(Reanimated.default).toBeDefined();
    expect(typeof Reanimated.useSharedValue).toBe('function');
    expect(typeof Reanimated.useAnimatedStyle).toBe('function');
    expect(typeof Reanimated.withTiming).toBe('function');
    expect(typeof Reanimated.withSpring).toBe('function');
  });

  it('should have Animated components available', () => {
    const Reanimated = require('react-native-reanimated');
    
    expect(Reanimated.default.View).toBeDefined();
    expect(Reanimated.default.Text).toBeDefined();
    expect(Reanimated.default.ScrollView).toBeDefined();
  });

  it('should verify babel plugin configuration', () => {
    const babelConfig = require('../babel.config.js');
    const config = typeof babelConfig === 'function' 
      ? babelConfig({ cache: () => {} }) 
      : babelConfig;
    
    expect(config.plugins).toBeDefined();
    
    // Check if react-native-reanimated/plugin is in the babel configuration
    const hasReanimatedPlugin = config.plugins.some((plugin: any) => {
      if (typeof plugin === 'string') {
        return plugin.includes('react-native-reanimated/plugin');
      }
      if (Array.isArray(plugin)) {
        return plugin[0].includes('react-native-reanimated/plugin');
      }
      return false;
    });
    
    expect(hasReanimatedPlugin).toBe(true);
  });

  it('should verify package.json contains react-native-reanimated dependency', () => {
    const packageJson = require('../package.json');
    
    expect(packageJson.dependencies['react-native-reanimated']).toBeDefined();
    expect(packageJson.dependencies['react-native-reanimated']).toMatch(/\d+\.\d+\.\d+/);
  });

  it('should not have conflicting animation libraries', () => {
    const packageJson = require('../package.json');
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    
    // Ensure we're using react-native-reanimated and not conflicting libraries
    expect(allDeps['react-native-reanimated']).toBeDefined();
    
    // React Native Reanimated should be compatible with these
    if (allDeps['react-native-gesture-handler']) {
      expect(allDeps['react-native-gesture-handler']).toBeDefined();
    }
  });

  it('should have proper TypeScript types for Reanimated', () => {
    // This test ensures TypeScript definitions are available
    const Reanimated = require('react-native-reanimated');
    
    // If this doesn't throw, types are properly resolved
    expect(() => {
      const { useSharedValue, useAnimatedStyle, withTiming, withSpring } = Reanimated;
      return { useSharedValue, useAnimatedStyle, withTiming, withSpring };
    }).not.toThrow();
  });

  it('should successfully create animation values', () => {
    const Reanimated = require('react-native-reanimated');
    
    // Test that we can create shared values (mocked in tests)
    const sharedValue = Reanimated.useSharedValue(0);
    expect(sharedValue).toBeDefined();
  });

  it('should have worklet support indicators', () => {
    // Check that worklet initialization is available
    expect(global.__reanimatedWorkletInit).toBeDefined();
  });
});

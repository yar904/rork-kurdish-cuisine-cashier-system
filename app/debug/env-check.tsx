import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { getTrpcBaseUrl } from '@/lib/trpc';

export default function EnvCheckScreen() {
  const [testResults, setTestResults] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const envVars = {
    'EXPO_PUBLIC_SUPABASE_URL': process.env.EXPO_PUBLIC_SUPABASE_URL,
    'EXPO_PUBLIC_SUPABASE_ANON_KEY': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '***SET***' : undefined,
    'EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL': process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL,
    'EXPO_PUBLIC_TRPC_URL': process.env.EXPO_PUBLIC_TRPC_URL,
  };

  let trpcUrl = '';
  let trpcUrlError = '';
  try {
    trpcUrl = getTrpcBaseUrl();
  } catch (error: any) {
    trpcUrlError = error.message;
  }

  const testBackendConnection = async () => {
    setLoading(true);
    try {
      const healthUrl = `${process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL}/tapse-backend/health`;
      console.log('[EnvCheck] Testing:', healthUrl);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setTestResults({
        success: true,
        status: response.status,
        data,
      });
    } catch (error: any) {
      console.error('[EnvCheck] Error:', error);
      setTestResults({
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Environment Check', headerShown: true }} />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.title}>Environment Variables</Text>
          {Object.entries(envVars).map(([key, value]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.key}>{key}:</Text>
              <Text style={[styles.value, !value && styles.missing]}>
                {value || 'MISSING'}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Computed tRPC URL</Text>
          {trpcUrlError ? (
            <Text style={styles.error}>{trpcUrlError}</Text>
          ) : (
            <Text style={styles.value}>{trpcUrl}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Platform</Text>
          <Text style={styles.value}>{Platform.OS}</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={testBackendConnection}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Testing...' : 'Test Backend Connection'}
            </Text>
          </TouchableOpacity>
        </View>

        {testResults && (
          <View style={styles.section}>
            <Text style={styles.title}>Test Results</Text>
            {testResults.success ? (
              <View>
                <Text style={styles.success}>✅ Backend is reachable!</Text>
                <Text style={styles.value}>Status: {testResults.status}</Text>
                <Text style={styles.value}>
                  Response: {JSON.stringify(testResults.data, null, 2)}
                </Text>
              </View>
            ) : (
              <View>
                <Text style={styles.error}>❌ Backend connection failed</Text>
                <Text style={styles.error}>{testResults.error}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.title}>Quick Fix Guide</Text>
          <Text style={styles.help}>
            If you see MISSING variables:
            {'\n\n'}
            1. Create a .env file in your project root
            {'\n'}
            2. Copy contents from .env.example
            {'\n'}
            3. Fill in your Supabase values
            {'\n'}
            4. Restart your dev server (bun expo start)
            {'\n\n'}
            Required variables:
            {'\n'}
            - EXPO_PUBLIC_SUPABASE_URL
            {'\n'}
            - EXPO_PUBLIC_SUPABASE_ANON_KEY
            {'\n'}
            - EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6EEDD',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5C0000',
    marginBottom: 12,
  },
  row: {
    marginBottom: 8,
  },
  key: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3A3A3A',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: '#3A3A3A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  missing: {
    color: '#DC2626',
    fontWeight: '700',
  },
  error: {
    color: '#DC2626',
    fontSize: 14,
    marginTop: 4,
  },
  success: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#5C0000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  help: {
    fontSize: 14,
    color: '#3A3A3A',
    lineHeight: 20,
  },
});

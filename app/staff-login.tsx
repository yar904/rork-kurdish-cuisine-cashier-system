import React, { useState } from 'react';
import { Alert, Button, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'expo-router';

export default function StaffLoginScreen() {
  const { signIn, loading, session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signIn(email, password);
      Alert.alert('Welcome', 'You are logged in');
    } catch (error: any) {
      Alert.alert('Login failed', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12 }}>Staff Login</Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12 }}
      />
      <Button title={loading ? 'Signing in...' : 'Login'} onPress={handleLogin} />
      {session && (
        <View style={{ marginTop: 12 }}>
          <Text>Session active. Go to dashboard:</Text>
          <Link href="/(tabs)/cashier" style={{ color: 'blue', marginTop: 4 }}>
            Open POS Tabs
          </Link>
        </View>
      )}
    </ScrollView>
  );
}

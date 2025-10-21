import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, LogIn, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';

export default function StaffLoginScreen() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [dimensions, setDimensions] = React.useState(() => Dimensions.get('window'));

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const isTablet = dimensions.width >= 768;

  const handleLogin = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    setIsLoading(true);
    const result = await login(password);
    setIsLoading(false);

    if (result.success) {
      setPassword('');
      if (result.role === 'admin') {
        router.replace('/(tabs)/admin');
      } else {
        router.replace('/(tabs)/cashier');
      }
    } else {
      Alert.alert('Access Denied', result.error || 'Invalid password');
      setPassword('');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary, Colors.primaryDark]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={Colors.gold} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Lock size={48} color={Colors.gold} strokeWidth={2} />
            </View>
            <Text style={[styles.title, isTablet && styles.titleTablet]}>Staff Access</Text>
            <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>
              Enter your password to continue
            </Text>
          </View>

          <View style={[styles.formContainer, isTablet && styles.formContainerTablet]}>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={Colors.goldLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, isTablet && styles.inputTablet]}
                placeholder="Enter password"
                placeholderTextColor={Colors.textLight}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleLogin}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? [Colors.textLight, Colors.textLight] : [Colors.gold, Colors.goldDark]}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : (
                  <>
                    <LogIn size={20} color={Colors.primary} />
                    <Text style={[styles.loginButtonText, isTablet && styles.loginButtonTextTablet]}>
                      Sign In
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>Staff: Kitchen, Cashier, Waiter, Analytics</Text>
              <Text style={styles.infoText}>Admin: All permissions + Admin panel</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  title: {
    fontSize: 32,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.gold,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  titleTablet: {
    fontSize: 40,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: Colors.cream,
    textAlign: 'center',
    opacity: 0.8,
  },
  subtitleTablet: {
    fontSize: 18,
  },
  formContainer: {
    gap: 20,
  },
  formContainerTablet: {
    gap: 28,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: Colors.cream,
  },
  inputTablet: {
    height: 64,
    fontSize: 18,
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  loginButtonText: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.primary,
    letterSpacing: 1,
  },
  loginButtonTextTablet: {
    fontSize: 20,
  },
  infoContainer: {
    marginTop: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: Colors.cream,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 18,
  },
});

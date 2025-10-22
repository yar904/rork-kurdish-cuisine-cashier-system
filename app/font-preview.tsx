import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

const soraniSample = 'سڵاو بەخێربێن • خواردنی کوردی';
const englishSample = 'Bold Restaurant Menu • Welcome';

const systemFonts = [
  {
    name: 'System (Default Bold)',
    ios: 'System',
    android: 'sans-serif',
    web: 'system-ui',
    weight: '700' as const,
    description: 'Clean, modern, thick - best for Kurdish'
  },
  {
    name: 'System (Heavy)',
    ios: 'System',
    android: 'sans-serif',
    web: 'system-ui',
    weight: '900' as const,
    description: 'Extra thick - great for headers'
  },
  {
    name: 'System (Semibold)',
    ios: 'System',
    android: 'sans-serif',
    web: 'system-ui',
    weight: '600' as const,
    description: 'Medium thick - good balance'
  },
  {
    name: 'Roboto Bold',
    ios: 'Helvetica Neue',
    android: 'sans-serif-medium',
    web: 'Roboto, sans-serif',
    weight: '700' as const,
    description: 'Modern, geometric'
  },
  {
    name: 'Roboto Black',
    ios: 'Helvetica Neue',
    android: 'sans-serif-black',
    web: 'Roboto, sans-serif',
    weight: '900' as const,
    description: 'Very thick, impact'
  },
  {
    name: 'Noto Sans (Standard)',
    ios: 'System',
    android: 'notoserif',
    web: 'Noto Sans, sans-serif',
    weight: '700' as const,
    description: 'Google font with Kurdish support'
  },
  {
    name: 'Arial Bold',
    ios: 'Arial',
    android: 'sans-serif',
    web: 'Arial, sans-serif',
    weight: '700' as const,
    description: 'Classic, readable'
  },
  {
    name: 'Helvetica Bold',
    ios: 'Helvetica Neue',
    android: 'sans-serif',
    web: 'Helvetica, sans-serif',
    weight: '700' as const,
    description: 'Professional, clean'
  },
];

export default function FontPreviewScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Kurdish Sorani Fonts', headerShown: true }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.instruction}>
          Choose a font below. Each shows Sorani Kurdish + English.
        </Text>
        
        {systemFonts.map((font, index) => {
          const fontFamily = Platform.select({
            ios: font.ios,
            android: font.android,
            default: font.web,
          });
          
          return (
            <View key={index} style={styles.fontCard}>
              <Text style={styles.fontName}>{font.name}</Text>
              <Text style={styles.fontDesc}>{font.description}</Text>
              
              <View style={styles.sampleBox}>
                <Text style={[styles.soraniSample, { fontFamily, fontWeight: font.weight }]}>
                  {soraniSample}
                </Text>
                <Text style={[styles.englishSample, { fontFamily, fontWeight: font.weight }]}>
                  {englishSample}
                </Text>
              </View>
              
              <Text style={styles.technicalInfo}>
                iOS: {font.ios} • Android: {font.android} • Weight: {font.weight}
              </Text>
            </View>
          );
        })}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All these fonts support Sorani Kurdish script ✓
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  fontCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  fontName: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  fontDesc: {
    color: '#999',
    fontSize: 13,
    marginBottom: 12,
  },
  sampleBox: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  soraniSample: {
    color: '#fff',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 12,
  },
  englishSample: {
    color: '#ccc',
    fontSize: 20,
    textAlign: 'center',
  },
  technicalInfo: {
    color: '#666',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  footer: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600' as const,
  },
});

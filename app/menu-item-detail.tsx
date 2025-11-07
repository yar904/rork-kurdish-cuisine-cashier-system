import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react-native';

import { MENU_ITEMS } from '@/constants/menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/constants/currency';
import { useRestaurant } from '@/contexts/RestaurantContext';

export default function MenuItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { addItemToCurrentOrder } = useRestaurant();
  
  const [itemNotes, setItemNotes] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  const item = MENU_ITEMS.find(menuItem => menuItem.id === id);

  if (!item) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('noItemsFound')}</Text>
          <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{language === 'en' ? 'Go Back' : language === 'ku' ? 'گەڕانەوە' : 'العودة'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getItemName = (item: typeof MENU_ITEMS[0]) => {
    if (language === 'ar') return item.nameArabic;
    if (language === 'ku') return item.nameKurdish;
    return item.name;
  };

  const getItemDescription = (item: typeof MENU_ITEMS[0]) => {
    if (language === 'ar') return item.descriptionArabic;
    if (language === 'ku') return item.descriptionKurdish;
    return item.description;
  };

  const handleAddToCart = () => {
    addItemToCurrentOrder(item.id, itemQuantity, itemNotes || undefined);
    Alert.alert(t('success'), t('itemAddedToCart'), [
      {
        text: 'OK',
        onPress: () => router.back()
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {item.image && (
          <Image 
            source={{ uri: item.image }} 
            style={styles.itemImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.detailsContainer}>
          <Text style={styles.itemName}>{getItemName(item)}</Text>
          <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.itemDescription}>{getItemDescription(item)}</Text>

          <View style={styles.divider} />

          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>{t('quantity')}:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
              >
                <Minus size={20} color="#3d0101" />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{itemQuantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setItemQuantity(itemQuantity + 1)}
              >
                <Plus size={20} color="#3d0101" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>{t('specialRequirements')}:</Text>
            <TextInput
              style={styles.notesInput}
              placeholder={t('anySpecialRequirements')}
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={itemNotes}
              onChangeText={setItemNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddToCart}
        >
          <ShoppingCart size={20} color="#fff" />
          <Text style={styles.addButtonText}>
            {t('addToCart')} - {formatPrice(item.price * itemQuantity)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3d0101',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#3d0101',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  itemImage: {
    width: '100%',
    height: 350,
    backgroundColor: '#F9FAFB',
    ...Platform.select({
      web: {
        height: 400,
      },
    }),
  },
  detailsContainer: {
    padding: 24,
  },
  itemName: {
    fontSize: 28,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: '#E8C968',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  itemPrice: {
    fontSize: 26,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 16,
  },
  itemDescription: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    marginVertical: 24,
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontWeight: '600' as const,
    color: '#E8C968',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFDD0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3d0101',
  },
  quantityValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    minWidth: 40,
    textAlign: 'center' as const,
  },
  notesSection: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontWeight: '600' as const,
    color: '#E8C968',
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#3d0101',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#D4AF37',
    paddingVertical: 18,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  addButtonText: {
    color: '#3d0101',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    textAlign: 'center' as const,
  },
  backButtonError: {
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#3d0101',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});

import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ShoppingCart, Plus, Minus } from 'lucide-react-native';

import { MENU_ITEMS } from '@/constants/menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/constants/currency';
import { useRestaurant } from '@/contexts/RestaurantContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.92;
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT + MODAL_HEIGHT;

export default function MenuItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { addItemToCurrentOrder } = useRestaurant();
  
  const [itemNotes, setItemNotes] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: MAX_TRANSLATE_Y,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dy } = gestureState;
        return Math.abs(dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const { dy } = gestureState;
        if (dy > 0) {
          translateY.setValue(MAX_TRANSLATE_Y + dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;
        if (dy > 100 || vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            router.back();
          });
        } else {
          Animated.spring(translateY, {
            toValue: MAX_TRANSLATE_Y,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const item = MENU_ITEMS.find(menuItem => menuItem.id === id);

  if (!item) {
    return (
      <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
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

  const backgroundOpacity = translateY.interpolate({
    inputRange: [MAX_TRANSLATE_Y, 0],
    outputRange: [0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.modalOverlay}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#000',
            opacity: backgroundOpacity,
          },
        ]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: translateY }],
          },
        ]}
      >
        <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            Animated.timing(translateY, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start(() => {
              router.back();
            });
          }}
          activeOpacity={0.7}
        >
          <X size={26} color="#FFFFFF" strokeWidth={3} />
        </TouchableOpacity>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          bounces={true}
          scrollEventThrottle={16}
        >
          {item.image && (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: item.image }} 
                style={styles.itemImage}
                resizeMode="cover"
              />
            </View>
          )}
          
          <View style={styles.detailsContainer}>
            <Text style={styles.itemName}>{getItemName(item)}</Text>
            <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
            
            {getItemDescription(item) && (
              <Text style={styles.itemDescription}>{getItemDescription(item)}</Text>
            )}

            <View style={styles.divider} />

            <View style={styles.quantitySection}>
              <Text style={styles.sectionTitle}>{t('quantity')}</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  activeOpacity={0.7}
                >
                  <Minus size={20} color="#3d0101" strokeWidth={2.5} />
                </TouchableOpacity>
                <View style={styles.quantityValueContainer}>
                  <Text style={styles.quantityValue}>{itemQuantity}</Text>
                </View>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setItemQuantity(itemQuantity + 1)}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color="#3d0101" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>{t('specialRequirements')}</Text>
              <TextInput
                style={styles.notesInput}
                placeholder={t('anySpecialRequirements')}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={itemNotes}
                onChangeText={setItemNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <View style={styles.addButtonContent}>
              <ShoppingCart size={22} color="#3d0101" strokeWidth={2.5} />
              <Text style={styles.addButtonText}>
                {t('addToCart')}
              </Text>
            </View>
            <Text style={styles.addButtonPrice}>
              {formatPrice(item.price * itemQuantity)}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#3d0101',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: SCREEN_HEIGHT,
    maxHeight: SCREEN_HEIGHT,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.3)',
        maxWidth: 600,
        alignSelf: 'center' as const,
        width: '100%',
      },
    }),
  },
  dragHandleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#3d0101',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#2a1a1a',
    ...Platform.select({
      web: {
        height: 280,
      },
    }),
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: 24,
    paddingTop: 20,
  },
  itemName: {
    fontSize: 32,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700',
    color: '#E8C968',
    marginBottom: 8,
    letterSpacing: 0.5,
    lineHeight: 40,
  },
  itemPrice: {
    fontSize: 28,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 16,
  },
  itemDescription: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    marginVertical: 24,
  },
  quantitySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontWeight: '600',
    color: '#E8C968',
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFDD0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  quantityValueContainer: {
    minWidth: 60,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  notesSection: {
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    minHeight: 100,
    fontFamily: 'NotoNaskhArabic_400Regular',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#3d0101',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D4AF37',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButtonText: {
    color: '#3d0101',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
  addButtonPrice: {
    color: '#3d0101',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#3d0101',
  },
  errorText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    textAlign: 'center',
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
    fontWeight: '700',
  },
});

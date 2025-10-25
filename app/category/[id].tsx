import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Globe, ArrowLeft, ShoppingCart, Plus, Minus, X } from 'lucide-react-native';

import { MENU_ITEMS } from '@/constants/menu';
import { MenuCategory, MenuItem } from '@/types/restaurant';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/constants/i18n';
import { Colors } from '@/constants/colors';
import { formatPrice } from '@/constants/currency';
import { useRestaurant } from '@/contexts/RestaurantContext';



export default function CategoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, setLanguage, t, tc } = useLanguage();
  const { addItemToCurrentOrder } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemNotes, setItemNotes] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const { width } = useWindowDimensions();
  


  const category = id as MenuCategory;

  const filteredItems = MENU_ITEMS.filter((item) => {
    const matchesCategory = item.category === category;
    const matchesSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameKurdish.includes(searchQuery) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

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
    if (selectedItem) {
      addItemToCurrentOrder(selectedItem.id, itemQuantity, itemNotes || undefined);
      setSelectedItem(null);
      setItemNotes('');
      setItemQuantity(1);
      Alert.alert(t('success'), t('itemAddedToCart'));
    }
  };

  const renderMenuItem = (item: typeof MENU_ITEMS[0]) => {
    return (
      <View 
        key={item.id} 
        style={styles.menuItemCard}
      >
        <TouchableOpacity 
          style={{ flex: 1 }}
          activeOpacity={0.95}
          onPress={() => {
            setSelectedItem(item);
            setItemQuantity(1);
            setItemNotes('');
          }}
        >
          {item.image && (
            <View style={styles.imageContainer}>
              <View style={styles.goldCornerTopRight} />
              <Image 
                source={{ uri: item.image }} 
                style={styles.menuItemImage}
                resizeMode="cover"
              />
            </View>
          )}
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemName} numberOfLines={2}>
              {getItemName(item)}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.menuItemPrice}>{formatPrice(item.price)}</Text>
            </View>
            <View style={styles.goldCornerBottomLeft} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Modal
        visible={selectedItem !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedItem?.image && (
                <Image 
                  source={{ uri: selectedItem.image }} 
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}
              
              <View style={styles.modalBody}>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedItem(null)}
                  activeOpacity={0.8}
                >
                  <X size={22} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>

                <Text style={styles.modalItemName}>{selectedItem ? getItemName(selectedItem) : ''}</Text>
                <Text style={styles.modalItemPrice}>{selectedItem ? formatPrice(selectedItem.price) : ''}</Text>
                <Text style={styles.modalItemDescription}>{selectedItem ? getItemDescription(selectedItem) : ''}</Text>

                <View style={styles.modalDivider} />

                <View style={styles.quantitySelector}>
                  <Text style={styles.quantitySelectorLabel}>{t('quantity')}:</Text>
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

                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>{t('specialRequirements')}:</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder={t('anySpecialRequirements')}
                    placeholderTextColor="rgba(26, 26, 26, 0.4)"
                    value={itemNotes}
                    onChangeText={setItemNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity
                  style={styles.modalAddButton}
                  onPress={handleAddToCart}
                >
                  <ShoppingCart size={20} color="#fff" />
                  <Text style={styles.modalAddButtonText}>
                    {t('addToCart')} - {formatPrice((selectedItem?.price ?? 0) * itemQuantity)}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{tc(category)}</Text>
            <Text style={styles.headerSubtitle}>
              {filteredItems.length} {t('items')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowLanguageMenu(!showLanguageMenu)}
          >
            <Globe size={22} color="#FFFFFF" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {showLanguageMenu && (
          <View style={styles.languageMenu}>
            {(['en', 'ku', 'ar'] as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageOption,
                  language === lang && styles.languageOptionActive,
                ]}
                onPress={() => {
                  setLanguage(lang);
                  setShowLanguageMenu(false);
                }}
              >
                <Text style={[
                  styles.languageOptionText,
                  language === lang && styles.languageOptionTextActive,
                ]}>
                  {lang === 'en' ? 'English' : lang === 'ku' ? 'کوردی' : 'العربية'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.searchContainer}>
          <Search size={18} color="rgba(255, 255, 255, 0.7)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchMenu')}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.plaidPattern} />
        <View style={styles.citadelPattern}>
          <View style={styles.citadelSilhouette}>
            <Text style={styles.citadelText}>🏰</Text>
          </View>
        </View>
        <View style={styles.menuGrid}>
          {filteredItems.map(renderMenuItem)}
        </View>

        {filteredItems.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('noItemsFound')}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Image 
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zz04l0d1dzw9z6075ukb4' }}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.footerBrandName}>تەپسی سلێمانی</Text>
          <View style={styles.footerDivider} />
          
          <Text style={styles.footerSubtitle}>
            {language === 'en' ? 'Thank you for choosing Tapsi Sulaymaniyah' : language === 'ku' ? 'سوپاس بۆ هەڵبژاردنی تەپسی سلێمانی' : 'شكراً لاختياركم تابسي السليمانية'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D4C5A9',
    ...Platform.select({
      web: {
        maxWidth: 1920,
        alignSelf: 'center' as const,
        width: '100%',
        backgroundImage: `url('https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/upm1xqonvujbq14bwsvhc')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      },
    }),
  },
  header: {
    backgroundColor: '#3d0101',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'capitalize' as const,
    textAlign: 'center' as const,
    ...Platform.select({
      web: {
        fontSize: 26,
      },
    }),
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: 'rgba(212, 175, 55, 0.9)',
    letterSpacing: 0.5,
    textAlign: 'center' as const,
  },
  languageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageMenu: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  languageOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  languageOptionActive: {
    backgroundColor: '#F3F4F6',
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: '#6B7280',
  },
  languageOptionTextActive: {
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '400' as const,
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative' as const,
  },
  plaidPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    zIndex: 0,
  },
  citadelPattern: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    opacity: 0.12,
    zIndex: 1,
    overflow: 'hidden' as const,
  },
  citadelSilhouette: {
    position: 'absolute' as const,
    bottom: 0,
    left: '50%' as const,
    transform: [{ translateX: -75 }],
    width: 150,
    height: 150,
  },
  citadelText: {
    fontSize: 150,
    color: '#1A1A1A',
    opacity: 0.3,
    textAlign: 'center' as const,
  },
  contentContainer: {
    paddingBottom: 32,
    ...Platform.select({
      web: {
        paddingHorizontal: 0,
      },
    }),
  },
  menuGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
    justifyContent: 'space-between' as const,
    ...Platform.select({
      web: {
        maxWidth: 1600,
        alignSelf: 'center' as const,
        width: '100%',
        justifyContent: 'center' as const,
        gap: 20,
      },
    }),
  },
  menuItemCard: {
    width: '48%',
    minWidth: 160,
    backgroundColor: '#3d0101',
    borderRadius: 20,
    overflow: 'visible' as const,
    marginBottom: 16,
    borderWidth: 0,
    position: 'relative' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#8B5A2B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 5,
      },
      web: {
        width: '48%',
        minWidth: 180,
        maxWidth: 280,
        boxShadow: '0 6px 20px rgba(139, 90, 43, 0.12)',
      },
    }),
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  menuItemImage: {
    width: '100%',
    height: '100%',
  },
  menuItemContent: {
    padding: 0,
    position: 'relative' as const,
  },
  menuItemName: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    lineHeight: 20,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
    textAlign: 'center' as const,
    paddingHorizontal: 12,
  },
  menuItemDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    fontWeight: '400' as const,
    marginBottom: 12,
    textAlign: 'center' as const,
    paddingHorizontal: 12,
    ...Platform.select({
      web: {
        fontFamily: 'NotoNaskhArabic_400Regular',
      },
    }),
  },
  priceContainer: {
    marginBottom: 12,
    alignItems: 'center' as const,
  },
  menuItemPrice: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.3,
    textAlign: 'center' as const,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  footer: {
    padding: 48,
    alignItems: 'center',
    backgroundColor: '#3d0101',
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerLogo: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  footerBrandName: {
    fontSize: 26,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  footerSubtitle: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 16,
    textAlign: 'center' as const,
    lineHeight: 22,
  },

  footerDivider: {
    width: 60,
    height: 2,
    backgroundColor: '#D4AF37',
    marginBottom: 16,
    borderRadius: 1,
  },
  goldCornerTopRight: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 32,
    borderRightWidth: 32,
    borderTopColor: '#D4AF37',
    borderRightColor: 'transparent',
    zIndex: 5,
  },
  goldCornerBottomLeft: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
    borderBottomWidth: 32,
    borderLeftWidth: 32,
    borderBottomColor: '#D4AF37',
    borderLeftColor: 'transparent',
    zIndex: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    writingDirection: 'ltr' as const,
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: 'center' as const,
        width: '100%',
        marginBottom: 0,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        maxHeight: '85%',
        marginTop: 'auto' as const,
      },
    }),
  },
  modalImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F9FAFB',
  },
  modalBody: {
    padding: 24,
  },
  modalCloseButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3d0101',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#3d0101',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 3px 12px rgba(61, 1, 1, 0.4)',
      },
    }),
  },
  modalItemName: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'left' as const,
    ...Platform.select({
      web: {
        fontFamily: 'NotoNaskhArabic_400Regular',
      },
    }),
  },
  modalItemPrice: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#3d0101',
    marginBottom: 12,
    textAlign: 'left' as const,
  },
  modalItemDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'left' as const,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  quantitySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantitySelectorLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    textAlign: 'left' as const,
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
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    minWidth: 40,
    textAlign: 'center' as const,
  },
  notesContainer: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'left' as const,
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
    textAlignVertical: 'top' as const,
    textAlign: 'left' as const,
  },
  modalAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#3d0101',
    paddingVertical: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#3d0101',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalAddButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
});

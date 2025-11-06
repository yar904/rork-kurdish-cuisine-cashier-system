import React, { useState } from 'react';
import * as RN from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Globe, ArrowLeft, ShoppingCart, Plus, Minus, X } from 'lucide-react-native';

import { MENU_ITEMS } from '@/constants/menu';
import { MenuCategory, MenuItem } from '@/types/restaurant';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/constants/i18n';
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
      RN.Alert.alert(t('success'), t('itemAddedToCart'));
    }
  };

  const renderMenuItem = (item: typeof MENU_ITEMS[0]) => {
    return (
      <RN.View 
        key={item.id} 
        style={styles.menuItemCard}
      >
        <RN.TouchableOpacity 
          style={{ flex: 1 }}
          activeOpacity={0.95}
          onPress={() => {
            setSelectedItem(item);
            setItemQuantity(1);
            setItemNotes('');
          }}
        >
          {item.image && (
            <RN.View style={styles.imageContainer}>
              <RN.Image 
                source={{ uri: item.image }} 
                style={styles.menuItemImage}
                resizeMode="cover"
              />
            </RN.View>
          )}
          <RN.View style={styles.menuItemContent}>
            <RN.Text style={styles.menuItemName} numberOfLines={2}>
              {getItemName(item)}
            </RN.Text>
            <RN.View style={styles.priceContainer}>
              <RN.Text style={styles.menuItemPrice}>{formatPrice(item.price)}</RN.Text>
            </RN.View>
          </RN.View>
        </RN.TouchableOpacity>
      </RN.View>
    );
  };

  return (
    <RN.View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <RN.Modal
        visible={selectedItem !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedItem(null)}
      >
        <RN.View style={styles.modalOverlay}>
          <RN.View style={styles.modalContent}>
            <RN.ScrollView showsVerticalScrollIndicator={false}>
              {selectedItem?.image && (
                <RN.Image 
                  source={{ uri: selectedItem.image }} 
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}
              
              <RN.View style={styles.modalBody}>
                <RN.TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedItem(null)}
                  activeOpacity={0.8}
                >
                  <X size={22} color="#FFFFFF" strokeWidth={2.5} />
                </RN.TouchableOpacity>

                <RN.Text style={styles.modalItemName}>{selectedItem ? getItemName(selectedItem) : ''}</RN.Text>
                <RN.Text style={styles.modalItemPrice}>{selectedItem ? formatPrice(selectedItem.price) : ''}</RN.Text>
                <RN.Text style={styles.modalItemDescription}>{selectedItem ? getItemDescription(selectedItem) : ''}</RN.Text>

                <RN.View style={styles.modalDivider} />

                <RN.View style={styles.quantitySelector}>
                  <RN.Text style={styles.quantitySelectorLabel}>{t('quantity')}:</RN.Text>
                  <RN.View style={styles.quantityControls}>
                    <RN.TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    >
                      <Minus size={20} color="#3d0101" />
                    </RN.TouchableOpacity>
                    <RN.Text style={styles.quantityValue}>{itemQuantity}</RN.Text>
                    <RN.TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setItemQuantity(itemQuantity + 1)}
                    >
                      <Plus size={20} color="#3d0101" />
                    </RN.TouchableOpacity>
                  </RN.View>
                </RN.View>

                <RN.View style={styles.notesContainer}>
                  <RN.Text style={styles.notesLabel}>{t('specialRequirements')}:</RN.Text>
                  <RN.TextInput
                    style={styles.notesInput}
                    placeholder={t('anySpecialRequirements')}
                    placeholderTextColor="rgba(26, 26, 26, 0.4)"
                    value={itemNotes}
                    onChangeText={setItemNotes}
                    multiline
                    numberOfLines={3}
                  />
                </RN.View>

                <RN.TouchableOpacity
                  style={styles.modalAddButton}
                  onPress={handleAddToCart}
                >
                  <ShoppingCart size={20} color="#fff" />
                  <RN.Text style={styles.modalAddButtonText}>
                    {t('addToCart')} - {formatPrice((selectedItem?.price ?? 0) * itemQuantity)}
                  </RN.Text>
                </RN.TouchableOpacity>
              </RN.View>
            </RN.ScrollView>
          </RN.View>
        </RN.View>
      </RN.Modal>
      
      <RN.View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <RN.View style={styles.headerTop}>
          <RN.TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" strokeWidth={1.5} />
          </RN.TouchableOpacity>
          <RN.View style={styles.headerCenter}>
            <RN.Text style={styles.headerTitle}>{tc(category)}</RN.Text>
            <RN.Text style={styles.headerSubtitle}>
              {filteredItems.length} {t('items')}
            </RN.Text>
          </RN.View>
          <RN.TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowLanguageMenu(!showLanguageMenu)}
          >
            <Globe size={22} color="#FFFFFF" strokeWidth={1.5} />
          </RN.TouchableOpacity>
        </RN.View>

        {showLanguageMenu && (
          <RN.View style={styles.languageMenu}>
            {(['en', 'ku', 'ar'] as Language[]).map((lang) => (
              <RN.TouchableOpacity
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
                <RN.Text style={[
                  styles.languageOptionText,
                  language === lang && styles.languageOptionTextActive,
                ]}>
                  {lang === 'en' ? 'English' : lang === 'ku' ? 'کوردی' : 'العربية'}
                </RN.Text>
              </RN.TouchableOpacity>
            ))}
          </RN.View>
        )}

        <RN.View style={styles.searchContainer}>
          <Search size={18} color="rgba(255, 255, 255, 0.7)" style={styles.searchIcon} />
          <RN.TextInput
            style={styles.searchInput}
            placeholder={t('searchMenu')}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </RN.View>
      </RN.View>

      <RN.ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        bounces={false}
        overScrollMode="never"
      >
        <RN.View style={styles.menuGrid}>
          {filteredItems.map(renderMenuItem)}
        </RN.View>

        {filteredItems.length === 0 && (
          <RN.View style={styles.emptyState}>
            <RN.Text style={styles.emptyStateText}>{t('noItemsFound')}</RN.Text>
          </RN.View>
        )}

        <RN.View style={styles.footer}>
          <RN.Image 
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zz04l0d1dzw9z6075ukb4' }}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <RN.Text style={styles.footerBrandName}>تەپسی سلێمانی</RN.Text>
          <RN.View style={styles.footerDivider} />
          
          <RN.Text style={styles.footerSubtitle}>
            {language === 'en' ? 'Thank you for choosing Tapsi Sulaymaniyah' : language === 'ku' ? 'سوپاس بۆ هەڵبژاردنی تەپسی سلێمانی' : 'شكراً لاختياركم تابسي السليمانية'}
          </RN.Text>
        </RN.View>
      </RN.ScrollView>
    </RN.View>
  );
}

const styles = RN.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3d0101',
    position: 'relative' as const,
    ...RN.Platform.select({
      web: {
        width: '100%',
        backgroundImage: `url('https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/qb12yvk9zoc3zrfv2t956')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      },
    }),
  },
  header: {
    backgroundColor: '#3d0101',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    ...RN.Platform.select({
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
    ...RN.Platform.select({
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
    ...RN.Platform.select({
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
    display: 'none' as const,
  },
  citadelPattern: {
    display: 'none' as const,
  },
  citadelSilhouette: {
    display: 'none' as const,
  },
  citadelText: {
    display: 'none' as const,
  },
  contentContainer: {
    paddingBottom: 32,
    ...RN.Platform.select({
      web: {
        paddingHorizontal: 0,
      },
    }),
  },
  menuGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    paddingTop: 20,
    ...RN.Platform.select({
      web: {
        justifyContent: 'center' as const,
        gap: 20,
        paddingHorizontal: 32,
      },
    }),
  },
  menuItemCard: {
    width: '48%' as const,
    backgroundColor: '#3d0101',
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: '#D4AF37',
    marginBottom: 16,
    position: 'relative' as const,
    ...RN.Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        minWidth: 160,
        maxWidth: 280,
        boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)',
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: 130,
    backgroundColor: '#F9FAFB',
    borderRadius: 0,
    overflow: 'hidden' as const,
    marginBottom: 0,
    position: 'relative' as const,
    ...RN.Platform.select({
      web: {
        height: 150,
      },
    }),
  },
  menuItemImage: {
    width: '100%',
    height: '100%',
  },
  menuItemContent: {
    padding: 12,
    position: 'relative' as const,
  },
  menuItemName: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    lineHeight: 20,
    letterSpacing: 0.3,
    marginBottom: 8,
    textAlign: 'center' as const,
    ...RN.Platform.select({
      web: {
        fontSize: 17,
        lineHeight: 22,
      },
    }),
  },
  menuItemDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    fontWeight: '400' as const,
    marginBottom: 12,
    textAlign: 'center' as const,
    paddingHorizontal: 12,
    ...RN.Platform.select({
      web: {
        fontFamily: 'NotoNaskhArabic_400Regular',
      },
    }),
  },
  priceContainer: {
    alignItems: 'center' as const,
  },
  menuItemPrice: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.3,
    textAlign: 'center' as const,
    ...RN.Platform.select({
      web: {
        fontSize: 16,
      },
    }),
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
    ...RN.Platform.select({
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
    ...RN.Platform.select({
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
    ...RN.Platform.select({
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
    ...RN.Platform.select({
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

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
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ShoppingCart, Plus, Minus, Star } from 'lucide-react-native';

import { MENU_ITEMS } from '@/constants/menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { formatPrice } from '@/constants/currency';
import { trpc } from '@/lib/trpc';

const TABLET_BREAKPOINT = 768;

export default function ItemDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { addItemToCurrentOrder } = useRestaurant();
  const { width: windowWidth } = useWindowDimensions();
  
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  const isTablet = windowWidth >= TABLET_BREAKPOINT;

  const item = MENU_ITEMS.find(menuItem => menuItem.id === id);

  const ratingsStatsQuery = trpc.ratings.getAllStats.useQuery();
  const ratingsStats = ratingsStatsQuery.data || {};

  if (!item) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('noItemsFound')}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{t('backToMenu')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getItemName = () => {
    if (language === 'ar') return item.nameArabic;
    if (language === 'ku') return item.nameKurdish;
    return item.name;
  };

  const getItemDescription = () => {
    if (language === 'ar') return item.descriptionArabic;
    if (language === 'ku') return item.descriptionKurdish;
    return item.description;
  };

  const handleAddToCart = () => {
    addItemToCurrentOrder(item.id, itemQuantity, itemNotes || undefined);
    Alert.alert(t('success'), t('itemAddedToCart'));
    router.back();
  };

  const itemStats = ratingsStats[item.id];
  const hasRatings = itemStats && itemStats.totalRatings > 0;

  const similarItems = MENU_ITEMS.filter(
    menuItem => 
      menuItem.category === item.category && 
      menuItem.id !== item.id && 
      menuItem.available
  ).slice(0, 4);

  const renderMobileLayout = () => (
    <>
      {item.image && (
        <View style={styles.heroImageContainer}>
          <Image 
            source={{ uri: item.image }} 
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <TouchableOpacity
            style={[styles.backButtonOverlay, { top: insets.top + 12 }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.contentContainer}>
        <View style={styles.headerSection}>
          <Text style={styles.itemName}>{getItemName()}</Text>
          
          {hasRatings && (
            <View style={styles.ratingBadge}>
              <Star size={18} color="#D4AF37" fill="#D4AF37" />
              <Text style={styles.ratingText}>{itemStats.averageRating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({itemStats.totalRatings} {t('ratings')})</Text>
            </View>
          )}

          <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>{language === 'en' ? 'Description' : language === 'ku' ? 'وەسف' : 'الوصف'}</Text>
          <Text style={styles.itemDescription}>{getItemDescription()}</Text>
        </View>

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
            <Text style={styles.quantityValue}>{itemQuantity}</Text>
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
            placeholderTextColor="rgba(26, 26, 26, 0.4)"
            value={itemNotes}
            onChangeText={setItemNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {similarItems.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={styles.sectionTitle}>{language === 'en' ? 'Similar Items' : language === 'ku' ? 'شتی هاوشێوە' : 'عناصر مشابهة'}</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarItemsContainer}
            >
              {similarItems.map((similarItem) => (
                <TouchableOpacity
                  key={similarItem.id}
                  style={styles.similarItemCard}
                  onPress={() => router.push(`/item-detail?id=${similarItem.id}`)}
                  activeOpacity={0.8}
                >
                  {similarItem.image && (
                    <Image 
                      source={{ uri: similarItem.image }} 
                      style={styles.similarItemImage}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={styles.similarItemName} numberOfLines={2}>
                    {language === 'ar' ? similarItem.nameArabic : language === 'ku' ? similarItem.nameKurdish : similarItem.name}
                  </Text>
                  <Text style={styles.similarItemPrice}>{formatPrice(similarItem.price)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </>
  );

  const renderTabletLayout = () => (
    <View style={styles.tabletLayoutContainer}>
      <TouchableOpacity
        style={[styles.backButtonTablet, { top: insets.top + 16 }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
      </TouchableOpacity>

      <View style={styles.tabletContentWrapper}>
        <View style={styles.tabletLeftPane}>
          {item.image && (
            <Image 
              source={{ uri: item.image }} 
              style={styles.tabletHeroImage}
              resizeMode="cover"
            />
          )}
        </View>

        <ScrollView 
          style={styles.tabletRightPane}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tabletRightPaneContent}
        >
          <View style={styles.headerSection}>
            <Text style={styles.itemName}>{getItemName()}</Text>
            
            {hasRatings && (
              <View style={styles.ratingBadge}>
                <Star size={18} color="#D4AF37" fill="#D4AF37" />
                <Text style={styles.ratingText}>{itemStats.averageRating.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({itemStats.totalRatings} {t('ratings')})</Text>
              </View>
            )}

            <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>{language === 'en' ? 'Description' : language === 'ku' ? 'وەسف' : 'الوصف'}</Text>
            <Text style={styles.itemDescription}>{getItemDescription()}</Text>
          </View>

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
              <Text style={styles.quantityValue}>{itemQuantity}</Text>
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
              placeholderTextColor="rgba(26, 26, 26, 0.4)"
              value={itemNotes}
              onChangeText={setItemNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {similarItems.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.sectionTitle}>{language === 'en' ? 'Similar Items' : language === 'ku' ? 'شتی هاوشێوە' : 'عناصر مشابهة'}</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarItemsContainer}
              >
                {similarItems.map((similarItem) => (
                  <TouchableOpacity
                    key={similarItem.id}
                    style={styles.similarItemCard}
                    onPress={() => router.push(`/item-detail?id=${similarItem.id}`)}
                    activeOpacity={0.8}
                  >
                    {similarItem.image && (
                      <Image 
                        source={{ uri: similarItem.image }} 
                        style={styles.similarItemImage}
                        resizeMode="cover"
                      />
                    )}
                    <Text style={styles.similarItemName} numberOfLines={2}>
                      {language === 'ar' ? similarItem.nameArabic : language === 'ku' ? similarItem.nameKurdish : similarItem.name}
                    </Text>
                    <Text style={styles.similarItemPrice}>{formatPrice(similarItem.price)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Image
        source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/qb12yvk9zoc3zrfv2t956' }}
        style={[StyleSheet.absoluteFillObject, Platform.select({ web: { display: 'none' as const } })]}
        resizeMode="cover"
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {isTablet ? renderTabletLayout() : renderMobileLayout()}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <ShoppingCart size={22} color="#3d0101" strokeWidth={2.5} />
          <Text style={styles.addToCartText}>
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
    position: 'relative' as const,
    ...Platform.select({
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
  scrollView: {
    flex: 1,
  },
  heroImageContainer: {
    width: '100%',
    height: 360,
    position: 'relative' as const,
    backgroundColor: '#2a1a1a',
    ...Platform.select({
      web: {
        height: 420,
      },
    }),
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  backButtonOverlay: {
    position: 'absolute' as const,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(61, 1, 1, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    ...Platform.select({
      web: {
        maxWidth: 800,
        alignSelf: 'center' as const,
        width: '100%',
        paddingHorizontal: 32,
        paddingTop: 32,
      },
    }),
  },
  headerSection: {
    marginBottom: 20,
  },
  itemName: {
    fontSize: 28,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 36,
    ...Platform.select({
      web: {
        fontSize: 32,
        lineHeight: 40,
      },
    }),
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
    gap: 6,
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#D4AF37',
  },
  ratingCount: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  itemPrice: {
    fontSize: 26,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#3d0101',
    fontWeight: '700' as const,
    ...Platform.select({
      web: {
        fontSize: 30,
      },
    }),
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
  },
  descriptionSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#1A1A1A',
    marginBottom: 12,
    fontWeight: '600' as const,
  },
  itemDescription: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#6B7280',
    lineHeight: 26,
    ...Platform.select({
      web: {
        fontSize: 17,
        lineHeight: 28,
      },
    }),
  },
  quantitySection: {
    marginBottom: 24,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.2)',
      },
    }),
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    minWidth: 48,
    textAlign: 'center' as const,
  },
  notesSection: {
    marginBottom: 32,
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
    textAlignVertical: 'top' as const,
    fontFamily: 'NotoNaskhArabic_400Regular',
  },
  similarSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  similarItemsContainer: {
    paddingTop: 8,
    gap: 12,
  },
  similarItemCard: {
    width: 140,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        width: 160,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  similarItemImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#E5E7EB',
    ...Platform.select({
      web: {
        height: 120,
      },
    }),
  },
  similarItemName: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    color: '#1A1A1A',
    padding: 8,
    paddingBottom: 4,
    lineHeight: 18,
  },
  similarItemPrice: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#3d0101',
    paddingHorizontal: 8,
    paddingBottom: 8,
    fontWeight: '700' as const,
  },
  bottomBar: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(61, 1, 1, 0.97)',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: 'rgba(212, 175, 55, 0.6)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
      web: {
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
    }),
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8C968',
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
      web: {
        boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
      },
    }),
  },
  addToCartText: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#3d0101',
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
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#3d0101',
    fontWeight: '700' as const,
  },
  tabletLayoutContainer: {
    position: 'relative' as const,
  },
  backButtonTablet: {
    position: 'absolute' as const,
    left: 24,
    zIndex: 100,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(61, 1, 1, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  tabletContentWrapper: {
    flexDirection: 'row',
    minHeight: Dimensions.get('window').height - 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    margin: 24,
    overflow: 'hidden' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        maxWidth: 1200,
        alignSelf: 'center' as const,
        width: '100%',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  tabletLeftPane: {
    width: '45%',
    backgroundColor: '#F9FAFB',
  },
  tabletHeroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  tabletRightPane: {
    flex: 1,
  },
  tabletRightPaneContent: {
    padding: 32,
  },
});

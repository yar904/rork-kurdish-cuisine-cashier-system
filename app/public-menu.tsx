import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star, Globe } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { trpc } from '@/lib/trpc';
import { MENU_ITEMS } from '@/constants/menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/constants/currency';
import { Language } from '@/constants/i18n';

export default function PublicMenuScreen() {
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const ratingsStatsQuery = trpc.ratings.getAllStats.useQuery();
  const ratingsStats = ratingsStatsQuery.data || {};

  const categories = [
    { 
      id: 'all', 
      nameKu: 'هەموو', 
      nameEn: 'All', 
      nameAr: 'الكل',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop'
    },
    { 
      id: 'appetizers', 
      nameKu: 'دەستپێکەکان', 
      nameEn: 'Appetizers', 
      nameAr: 'مقبلات',
      image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop'
    },
    { 
      id: 'soups', 
      nameKu: 'سوپەکان', 
      nameEn: 'Soups', 
      nameAr: 'شوربات',
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop'
    },
    { 
      id: 'salads', 
      nameKu: 'زەڵاتە', 
      nameEn: 'Salads', 
      nameAr: 'سلطات',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop'
    },
    { 
      id: 'kebabs', 
      nameKu: 'کەبابەکان', 
      nameEn: 'Kebabs', 
      nameAr: 'كباب',
      image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop'
    },
    { 
      id: 'rice-dishes', 
      nameKu: 'خواردنی برنج', 
      nameEn: 'Rice Dishes', 
      nameAr: 'أطباق أرز',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop'
    },
    { 
      id: 'stews', 
      nameKu: 'خۆراک', 
      nameEn: 'Stews', 
      nameAr: 'يخنات',
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop'
    },
    { 
      id: 'seafood', 
      nameKu: 'ماسی', 
      nameEn: 'Seafood', 
      nameAr: 'مأكولات بحرية',
      image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400&h=300&fit=crop'
    },
    { 
      id: 'breads', 
      nameKu: 'نان', 
      nameEn: 'Breads', 
      nameAr: 'خبز',
      image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop'
    },
    { 
      id: 'desserts', 
      nameKu: 'خواردنی شیرین', 
      nameEn: 'Desserts', 
      nameAr: 'حلويات',
      image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=300&fit=crop'
    },
    { 
      id: 'hot-drinks', 
      nameKu: 'چا و قاوە', 
      nameEn: 'Tea & Coffee', 
      nameAr: 'شاي وقهوة',
      image: 'https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=400&h=300&fit=crop'
    },
    { 
      id: 'drinks', 
      nameKu: 'خواردنی سارد', 
      nameEn: 'Cold Drinks', 
      nameAr: 'مشروبات باردة',
      image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=300&fit=crop'
    },
    { 
      id: 'shisha', 
      nameKu: 'شیەشە', 
      nameEn: 'Shisha', 
      nameAr: 'شيشة',
      image: 'https://images.unsplash.com/photo-1580933073521-dc49ac0d4e6a?w=400&h=300&fit=crop'
    },
  ];

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

  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesCategory && item.available;
    });
  }, [selectedCategory]);

  const renderMenuItem = (item: typeof MENU_ITEMS[0]) => {
    const isPremium = item.price > 25000;
    const itemStats = ratingsStats[item.id];
    const hasRatings = itemStats && itemStats.totalRatings > 0;
    
    return (
      <View 
        key={item.id} 
        style={[styles.menuItemCardHorizontal, isPremium && styles.premiumCard]}
      >
        {item.image && (
          <View style={styles.imageContainerHorizontal}>
            <Image 
              source={{ uri: item.image }} 
              style={styles.menuItemImageHorizontal}
              resizeMode="cover"
            />
            {hasRatings && (
              <View style={styles.ratingBadgeOnImage}>
                <Star size={14} color="#D4AF37" fill="#D4AF37" />
                <Text style={styles.ratingTextOnImage}>{itemStats.averageRating.toFixed(1)}</Text>
              </View>
            )}
            {isPremium && (
              <View style={styles.premiumBadgeOnImage}>
                <Text style={styles.premiumBadgeOnImageText}>★</Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.menuItemContentHorizontal}>
          <Text style={styles.menuItemNameHorizontal} numberOfLines={2}>
            {getItemName(item)}
          </Text>
          
          <View style={styles.priceHighlight}>
            <Text style={styles.menuItemPriceHorizontal}>{formatPrice(item.price)}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (ratingsStatsQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pfi2xp2ednotg7b5lw52y' }}
      style={styles.container}
      resizeMode="cover"
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => setShowLanguageMenu(!showLanguageMenu)}
            activeOpacity={0.7}
          >
            <Globe size={24} color="#D4AF37" strokeWidth={2} />
          </TouchableOpacity>
          
          <View style={styles.headerLogoContainer}>
            <Image 
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zz04l0d1dzw9z6075ukb4' }}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.viewOnlyBadge}>
            <Text style={styles.viewOnlyBadgeText}>
              {language === 'en' ? 'Menu' : language === 'ku' ? 'لیست' : 'قائمة'}
            </Text>
          </View>
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
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    language === lang && styles.languageOptionTextActive,
                  ]}
                >
                  {lang === 'en' ? 'English' : lang === 'ku' ? 'کوردی' : 'العربية'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.categorySection}>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
          decelerationRate="fast"
        >
          {categories.map((category) => {
            const categoryName = language === 'ku' ? category.nameKu : language === 'ar' ? category.nameAr : category.nameEn;
            const isActive = selectedCategory === category.id;
            
            return (
              <TouchableOpacity
                key={category.id}
                activeOpacity={0.7}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedCategory(category.id);
                }}
              >
                <View style={[
                  styles.categoryCard,
                  isActive && styles.categoryCardActive,
                ]}>
                  {isActive && <View style={styles.activeIndicatorDot} />}
                  <Image
                    source={{ uri: category.image }}
                    style={styles.categoryImage}
                    resizeMode="cover"
                  />
                  <View style={styles.categoryOverlay} />
                  <View style={styles.categoryTextContainer}>
                    <Text style={[
                      styles.categoryText,
                      isActive && styles.categoryTextActive,
                    ]} numberOfLines={2}>
                      {categoryName}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.menuGrid}>
          {filteredItems.length > 0 ? (
            filteredItems.map(renderMenuItem)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {language === 'en' ? 'No items found' : language === 'ku' ? 'هیچ بڕگەیەک نەدۆزرایەوە' : 'لم يتم العثور على عناصر'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a0000',
  },
  header: {
    backgroundColor: 'rgba(26, 0, 0, 0.85)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  headerLogo: {
    width: 65,
    height: 65,
  },
  viewOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(61, 1, 1, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    minWidth: 60,
  },
  viewOnlyBadgeText: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#D4AF37',
    fontWeight: '700' as const,
  },
  languageMenu: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(61, 1, 1, 0.98)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    overflow: 'hidden' as const,
  },
  languageOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  languageOptionActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
  },
  languageOptionText: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center' as const,
  },
  languageOptionTextActive: {
    fontWeight: '700' as const,
    color: '#E8C968',
  },
  categorySection: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(212, 175, 55, 0.4)',
  },
  categoryScroll: {
    backgroundColor: 'transparent',
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 4,
  },
  categoryCard: {
    width: 110,
    height: 130,
    borderRadius: 14,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: '#1a0000',
    position: 'relative' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 3px 10px rgba(212, 175, 55, 0.25)',
      },
    }),
  },
  categoryCardActive: {
    borderWidth: 3,
    borderColor: '#D4AF37',
    transform: [{ scale: 1.05 }],
  },
  activeIndicatorDot: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D4AF37',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    position: 'absolute' as const,
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  categoryTextContainer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 0, 0, 0.95)',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderTopWidth: 2,
    borderTopColor: '#D4AF37',
  },
  categoryText: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#E8C968',
    textAlign: 'center' as const,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: Platform.select({ ios: 140, android: 130, default: 130 }),
    paddingHorizontal: 16,
  },
  menuGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
  },
  menuItemCardHorizontal: {
    width: '48%' as const,
    backgroundColor: 'rgba(26, 0, 0, 0.95)',
    borderRadius: 16,
    overflow: 'visible' as const,
    borderWidth: 2.5,
    borderColor: '#D4AF37',
    marginBottom: 0,
    position: 'relative' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        width: 'calc(50% - 6px)',
        minWidth: 180,
        maxWidth: 300,
        boxShadow: '0 6px 20px rgba(212, 175, 55, 0.4)',
      },
    }),
  },
  premiumCard: {
    borderWidth: 2,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 6px 24px rgba(212, 175, 55, 0.3), 0 0 0 2px rgba(212, 175, 55, 0.2)',
      },
    }),
  },
  imageContainerHorizontal: {
    width: '100%',
    height: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden' as const,
    marginBottom: 0,
    position: 'relative' as const,
    ...Platform.select({
      web: {
        height: 140,
      },
    }),
  },
  menuItemImageHorizontal: {
    width: '100%',
    height: '100%',
  },
  ratingBadgeOnImage: {
    position: 'absolute' as const,
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.6)',
  },
  ratingTextOnImage: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#D4AF37',
  },
  premiumBadgeOnImage: {
    position: 'absolute' as const,
    top: 6,
    left: 6,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8C968',
  },
  premiumBadgeOnImageText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#3d0101',
  },
  menuItemContentHorizontal: {
    padding: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  menuItemNameHorizontal: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    lineHeight: 22,
    letterSpacing: 0.3,
    marginBottom: 8,
    marginTop: 0,
    textAlign: 'center' as const,
    paddingHorizontal: 4,
    ...Platform.select({
      web: {
        fontSize: 18,
        lineHeight: 24,
      },
    }),
  },
  priceHighlight: {
    marginBottom: 0,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'center' as const,
    minWidth: '70%' as const,
  },
  menuItemPriceHorizontal: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.3,
    textAlign: 'center' as const,
    ...Platform.select({
      web: {
        fontSize: 17,
      },
    }),
  },
  emptyState: {
    flex: 1,
    width: '100%',
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: 'rgba(232, 201, 104, 0.9)',
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
});

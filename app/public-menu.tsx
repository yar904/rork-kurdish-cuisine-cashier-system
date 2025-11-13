import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { Star, Globe, Grid3x3, List } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { CATEGORY_NAMES, MENU_ITEMS } from '@/constants/menu';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function PublicMenuScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isGridView, setIsGridView] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const categoryRefs = useRef<Map<string, number>>(new Map());
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  
  const scrollY = useRef(0);
  const lastScrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const categoryTranslateY = useRef(new Animated.Value(0)).current;
  const categoryScrollViewRef = useRef<ScrollView>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const menuItemsOpacity = useRef(new Animated.Value(1)).current;
  const [categoryScales] = useState(new Map<string, Animated.Value>());
  const currentCategoryIndex = useRef(0);
  const categoryWidths = useRef<number[]>([]);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const menuQuery = trpc.menu.getAll.useQuery();
  const ratingsStatsQuery = trpc.ratings.getAllStats.useQuery();
  
  const menuData = menuQuery.data && menuQuery.data.length > 0 ? menuQuery.data : MENU_ITEMS;

  const categories = useMemo(() => {
    const cats = new Set(menuData?.map(item => item.category) || []);
    return ['all', ...Array.from(cats)];
  }, [menuData]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      appetizers: '🥗',
      soups: '🍲',
      salads: '🥙',
      kebabs: '🍖',
      'rice-dishes': '🍚',
      stews: '🍛',
      seafood: '🦞',
      breads: '🍞',
      desserts: '🍰',
      drinks: '🥤',
      shisha: '💨',
      'hot-drinks': '☕',
    };
    return icons[category] || '🍽️';
  };

  const scrollToCategory = (category: string) => {
    const yOffset = categoryRefs.current.get(category);
    if (yOffset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: yOffset - 20, animated: true });
    }
  };

  const filteredMenu = useMemo(() => {
    if (!menuData) return [];
    let items = menuData.filter(item => item.available);
    
    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return items;
  }, [menuData, selectedCategory, searchQuery]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - lastScrollY.current;
    
    if (Math.abs(scrollDelta) < 5) return;
    
    if (scrollDelta > 0 && currentScrollY > 100) {
      Animated.parallel([
        Animated.timing(headerTranslateY, {
          toValue: -150,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(categoryTranslateY, {
          toValue: -150,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(menuItemsOpacity, {
          toValue: 0.4,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (scrollDelta < 0) {
      Animated.parallel([
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(categoryTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(menuItemsOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    lastScrollY.current = currentScrollY;
    scrollY.current = currentScrollY;
  }, [headerTranslateY, categoryTranslateY, menuItemsOpacity]);

  useEffect(() => {
    categories.forEach(cat => {
      if (!categoryScales.has(cat)) {
        categoryScales.set(cat, new Animated.Value(1));
      }
    });
  }, [categories, categoryScales]);

  useEffect(() => {
    if (isUserScrolling) return;

    const scrollToNextCategory = () => {
      if (!categoryScrollViewRef.current || categories.length === 0) return;
      
      const prevIndex = currentCategoryIndex.current;
      const prevScale = categoryScales.get(categories[prevIndex]);
      if (prevScale) {
        Animated.timing(prevScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
      
      currentCategoryIndex.current = (currentCategoryIndex.current + 1) % categories.length;
      
      let scrollPosition = 0;
      if (categoryWidths.current.length > 0) {
        for (let i = 0; i < currentCategoryIndex.current && i < categoryWidths.current.length; i++) {
          scrollPosition += categoryWidths.current[i] + 12;
        }
      } else {
        scrollPosition = currentCategoryIndex.current * 130;
      }
      
      categoryScrollViewRef.current.scrollTo({ 
        x: scrollPosition, 
        animated: true 
      });
      
      const currentScale = categoryScales.get(categories[currentCategoryIndex.current]);
      if (currentScale) {
        Animated.sequence([
          Animated.timing(currentScale, {
            toValue: 1.15,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(currentScale, {
            toValue: 1.05,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    const interval = setInterval(scrollToNextCategory, 2500);
    autoScrollInterval.current = interval;

    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [categories, categoryScales, isUserScrolling]);

  if (menuQuery.isLoading) {
    console.log('[PublicMenu] Loading menu data...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  console.log('[PublicMenu] Rendering public menu screen');

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <Animated.View style={[styles.customHeader, { transform: [{ translateY: headerTranslateY }] }]}>
        <TouchableOpacity 
          style={styles.headerCornerButton}
          onPress={() => setLanguageModalVisible(true)}
          activeOpacity={0.7}
        >
          <Globe size={24} color={Colors.primary} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image 
            source={require('@/assets/images/icon.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Kurdish Cuisine</Text>
        </View>

        <View style={styles.headerCornerButton} />
      </Animated.View>

      <LanguageSwitcher
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />

      <Animated.View style={[styles.categoryFilterSection, { transform: [{ translateY: categoryTranslateY }] }]}>
        <View style={styles.categoryFilterHeader}>
          <Text style={styles.categoryFilterTitle}>Categories</Text>
          <TouchableOpacity 
            onPress={() => setIsGridView(!isGridView)}
            style={styles.viewToggleButton}
            activeOpacity={0.7}
          >
            {isGridView ? (
              <Grid3x3 size={20} color={Colors.gold} strokeWidth={2.5} />
            ) : (
              <List size={20} color={Colors.gold} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>
        <ScrollView
          ref={categoryScrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
          onTouchStart={() => {
            setIsUserScrolling(true);
            if (autoScrollInterval.current) {
              clearInterval(autoScrollInterval.current);
              autoScrollInterval.current = null;
            }
          }}
          onMomentumScrollEnd={() => {
            setTimeout(() => {
              setIsUserScrolling(false);
            }, 1000);
          }}
        >
          {categories.map((category) => {
            const scaleAnim = categoryScales.get(category) || new Animated.Value(1);
            if (!categoryScales.has(category)) {
              categoryScales.set(category, scaleAnim);
            }
            
            return (
              <Animated.View
                key={category}
                style={{
                  transform: [{ scale: scaleAnim }],
                }}
                onLayout={(event) => {
                  const { width } = event.nativeEvent.layout;
                  const index = categories.indexOf(category);
                  if (index !== -1) {
                    categoryWidths.current[index] = width;
                  }
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipActive
                  ]}
                  onPress={() => {
                    setSelectedCategory(category);
                    if (category !== 'all') {
                      scrollToCategory(category);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryChipIcon}>{getCategoryIcon(category)}</Text>
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.categoryChipTextActive
                  ]}>
                    {CATEGORY_NAMES[category] || category}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      </Animated.View>

      <ScrollView 
        ref={scrollViewRef} 
        style={styles.menuList} 
        contentContainerStyle={styles.menuListContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {filteredMenu.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No items available</Text>
            <Text style={styles.emptySubtitle}>Try selecting a different category</Text>
          </View>
        ) : (
          <>
            {categories.filter(cat => cat !== 'all').map((category) => {
              const categoryItems = filteredMenu.filter(item => item.category === category);
              if (categoryItems.length === 0) return null;
              
              return (
                <View 
                  key={category}
                  onLayout={(event) => {
                    const { y } = event.nativeEvent.layout;
                    categoryRefs.current.set(category, y);
                  }}
                >
                  <View style={styles.categorySection}>
                    <View style={styles.categorySectionHeader}>
                      <Text style={styles.categorySectionIcon}>{getCategoryIcon(category)}</Text>
                      <Text style={styles.categorySectionTitle}>
                        {CATEGORY_NAMES[category] || category}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={isGridView ? styles.menuItemsGrid : styles.menuItemsList}>
                    {categoryItems.map((item) => {
                      const itemStats = ratingsStatsQuery.data?.find(stat => stat.menuItemId === item.id);
                      const avgRating = itemStats?.averageRating || 0;
                      const totalRatings = itemStats?.totalRatings || 0;

                      return (
                        <Animated.View 
                          key={item.id} 
                          style={[
                            isGridView ? styles.menuItemGrid : styles.menuItem, 
                            { opacity: menuItemsOpacity }
                          ]}
                        >
                          {item.image && (
                            <View style={isGridView ? styles.imageContainerGrid : styles.imageContainer}>
                              <Image source={{ uri: item.image }} style={isGridView ? styles.menuImageGrid : styles.menuImage} />
                              {avgRating > 0 && (
                                <View style={styles.ratingBadge}>
                                  <Star size={12} color="#fff" fill="#fff" />
                                  <Text style={styles.ratingText}>{avgRating.toFixed(1)}</Text>
                                  <Text style={styles.ratingCount}>({totalRatings})</Text>
                                </View>
                              )}
                            </View>
                          )}
                          <View style={styles.menuInfo}>
                            <Text style={styles.menuName}>{item.name}</Text>
                            <Text style={styles.menuDescription} numberOfLines={2}>
                              {item.description}
                            </Text>
                            <View style={styles.priceContainer}>
                              <Text style={styles.menuPrice}>${item.price.toFixed(2)}</Text>
                            </View>
                          </View>
                        </Animated.View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
            
            {ratingsStatsQuery.data && ratingsStatsQuery.data.length > 0 && (
              <View style={styles.reviewsSection}>
                <Text style={styles.reviewsTitle}>⭐ Customer Reviews</Text>
                <View style={styles.overallRatingCard}>
                  <View style={styles.overallRatingNumber}>
                    <Text style={styles.overallRatingValue}>
                      {(ratingsStatsQuery.data.reduce((sum, s) => sum + s.averageRating, 0) / ratingsStatsQuery.data.length).toFixed(1)}
                    </Text>
                    <View style={styles.overallStars}>
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={20} 
                          color={Colors.gold}
                          fill={Colors.gold}
                        />
                      ))}
                    </View>
                    <Text style={styles.overallRatingCount}>
                      Based on {ratingsStatsQuery.data.reduce((sum, s) => sum + s.totalRatings, 0)} reviews
                    </Text>
                  </View>
                </View>
                <Text style={styles.reviewsSubtitle}>Scan the QR code at your table to order and leave a review!</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>📱 Scan QR code at your table to order</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCornerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  headerLogo: {
    width: 50,
    height: 50,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
  },
  categoryFilterSection: {
    backgroundColor: Colors.primary,
    paddingTop: 16,
    paddingBottom: 16,
  },
  categoryFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryFilterTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: -0.3,
  },
  viewToggleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  categoryScrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 0,
    marginHorizontal: 6,
  },
  categoryChipActive: {
    backgroundColor: Colors.gold,
    borderWidth: 0,
  },
  categoryChipIcon: {
    fontSize: 18,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.cream,
    letterSpacing: -0.2,
  },
  categoryChipTextActive: {
    color: Colors.primary,
  },
  categorySection: {
    marginTop: 4,
    marginBottom: 0,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
  categorySectionIcon: {
    fontSize: 28,
  },
  categorySectionTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  menuList: {
    flex: 1,
  },
  menuListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
  menuItemGrid: {
    width: '48%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 2.5,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 16,
  },
  menuItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  menuItemsList: {
    flexDirection: 'column',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  imageContainerGrid: {
    position: 'relative',
    marginBottom: 12,
  },
  menuImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  menuImageGrid: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
  },
  ratingCount: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  menuName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center' as const,
  },
  menuDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontWeight: '500' as const,
    lineHeight: 18,
    textAlign: 'center' as const,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  menuPrice: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: -0.8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.gold,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  reviewsSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
  reviewsTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.5,
    textAlign: 'center' as const,
  },
  reviewsSubtitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 16,
  },
  overallRatingCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  overallRatingNumber: {
    alignItems: 'center',
    gap: 8,
  },
  overallRatingValue: {
    fontSize: 56,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: -2,
  },
  overallStars: {
    flexDirection: 'row',
    gap: 4,
  },
  overallRatingCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: Colors.gold,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
});

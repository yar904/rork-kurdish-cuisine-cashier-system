import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Platform,
  Modal,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star, X, ShoppingCart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { trpc } from '@/lib/trpcClient';
import { MENU_ITEMS } from '@/constants/menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/constants/currency';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function PublicMenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { language, setLanguage } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<typeof MENU_ITEMS[0] | null>(null);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [cart, setCart] = useState<Array<{ item: typeof MENU_ITEMS[0], quantity: number }>>([]);
  const categoryScales = useRef(new Map<string, Animated.Value>()).current;
  const categoryScrollViewRef = useRef<ScrollView>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const currentCategoryIndex = useRef(0);
  const userScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const glowTranslateX = useRef(new Animated.Value(0)).current;

  const ratingsStatsQuery = trpc.ratings.getAllStats.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const ratingsStats = ratingsStatsQuery.data || {};

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

  const categories = useMemo(() => [
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
  ], []);

  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesCategory && item.available;
    });
  }, [selectedCategory]);

  const groupedItems = useMemo(() => {
    if (selectedCategory !== 'all') {
      return [{ category: selectedCategory, items: filteredItems }];
    }
    
    const grouped = new Map<string, typeof MENU_ITEMS>();
    filteredItems.forEach(item => {
      if (!grouped.has(item.category)) {
        grouped.set(item.category, []);
      }
      grouped.get(item.category)!.push(item);
    });
    
    return Array.from(grouped.entries()).map(([category, items]) => ({ category, items }));
  }, [filteredItems, selectedCategory]);

  const handleItemPress = (item: typeof MENU_ITEMS[0]) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedItem(item);
    setItemModalVisible(true);
  };

  const handleAddToCart = (item: typeof MENU_ITEMS[0], event: any) => {
    event.stopPropagation();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const existingItem = cart.find(c => c.item.id === item.id);
    if (existingItem) {
      setCart(cart.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { item, quantity: 1 }]);
    }
  };

  const handleShowReviews = (item: typeof MENU_ITEMS[0], event: any) => {
    event.stopPropagation();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedItem(item);
    setItemModalVisible(true);
  };

  const renderMenuItem = (item: typeof MENU_ITEMS[0]) => {
    const isPremium = item.price > 25000;
    const itemStats = ratingsStats[item.id];
    const hasRatings = itemStats && itemStats.totalRatings > 0;
    
    return (
      <TouchableOpacity 
        key={item.id}
        activeOpacity={0.8}
        onPress={() => handleItemPress(item)}
        style={[styles.menuItemCardHorizontal, isPremium && styles.premiumCard]}
      >
        {item.image && (
          <View style={styles.imageContainerHorizontal}>
            <Image 
              source={{ uri: item.image }} 
              style={styles.menuItemImageHorizontal}
              resizeMode="cover"
            />
            
            <View style={styles.actionButtons}>
              {hasRatings && (
                <TouchableOpacity
                  style={styles.circularButton}
                  onPress={(e) => handleShowReviews(item, e)}
                  activeOpacity={0.8}
                >
                  <Star size={16} color="#D4AF37" fill="#D4AF37" strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
            
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
      </TouchableOpacity>
    );
  };

  React.useEffect(() => {
    categories.forEach((cat, index) => {
      if (!categoryScales.has(cat.id)) {
        categoryScales.set(cat.id, new Animated.Value(index === 0 ? 1 : 0.75));
      }
    });
  }, [categories, categoryScales]);

  React.useEffect(() => {
    if (isUserScrolling) {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
        autoScrollInterval.current = null;
      }
      return;
    }

    const scrollToNextCategory = () => {
      if (!categoryScrollViewRef.current) return;
      
      const currentIndex = currentCategoryIndex.current;
      const nextIndex = (currentIndex + 1) % categories.length;
      
      const currentScale = categoryScales.get(categories[currentIndex].id);
      if (currentScale) {
        Animated.timing(currentScale, {
          toValue: 0.75,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
      
      const nextScale = categoryScales.get(categories[nextIndex].id);
      if (nextScale) {
        Animated.spring(nextScale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }).start();
      }
      
      const scrollPosition = nextIndex * 122;
      currentCategoryIndex.current = nextIndex;
      
      Animated.timing(glowTranslateX, {
        toValue: scrollPosition,
        duration: 400,
        useNativeDriver: true,
      }).start();
      
      categoryScrollViewRef.current.scrollTo({ 
        x: scrollPosition, 
        animated: true 
      });
    };

    autoScrollInterval.current = setInterval(scrollToNextCategory, 3500);

    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [categories, isUserScrolling, categoryScales, glowTranslateX]);

  return (
    <ImageBackground
      source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pfi2xp2ednotg7b5lw52y' }}
      style={styles.container}
      resizeMode="cover"
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerCornerButton}>
            <LanguageSwitcher />
          </View>
          
          <View style={styles.headerLogoContainer}>
            <Image 
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zz04l0d1dzw9z6075ukb4' }}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.viewOnlyBadge} />
        </View>
      </View>

      <View style={styles.categoryScrollSection}>
        <View style={styles.categoryContainer}>
          <Animated.View style={[
            styles.categoryHighlight,
            { transform: [{ translateX: glowTranslateX }] }
          ]} />
          <ScrollView 
            ref={categoryScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={[
              styles.categoryScrollContent,
              { paddingRight: screenWidth - 126 }
            ]}
            decelerationRate="fast"
            onTouchStart={() => {
              setIsUserScrolling(true);
              if (autoScrollInterval.current) {
                clearInterval(autoScrollInterval.current);
                autoScrollInterval.current = null;
              }
              if (userScrollTimeout.current) {
                clearTimeout(userScrollTimeout.current);
              }
            }}
            onMomentumScrollEnd={() => {
              if (userScrollTimeout.current) {
                clearTimeout(userScrollTimeout.current);
              }
              userScrollTimeout.current = setTimeout(() => {
                setIsUserScrolling(false);
              }, 3000);
            }}
          >
          {categories.map((category, index) => {
            const categoryName = language === 'ku' ? category.nameKu : language === 'ar' ? category.nameAr : category.nameEn;
            const isActive = selectedCategory === category.id;
            const isInGlow = !isUserScrolling && index === currentCategoryIndex.current;
            
            if (!categoryScales.has(category.id)) {
              categoryScales.set(category.id, new Animated.Value(0.75));
            }
            const scaleAnim = categoryScales.get(category.id)!;
            
            return (
              <TouchableOpacity
                key={category.id}
                activeOpacity={0.7}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedCategory(category.id);
                  setIsUserScrolling(true);
                  currentCategoryIndex.current = index;
                  
                  const scrollPosition = index * 122;
                  Animated.timing(glowTranslateX, {
                    toValue: scrollPosition,
                    duration: 400,
                    useNativeDriver: true,
                  }).start();
                  
                  if (userScrollTimeout.current) {
                    clearTimeout(userScrollTimeout.current);
                  }
                  userScrollTimeout.current = setTimeout(() => {
                    setIsUserScrolling(false);
                  }, 4000);
                }}
              >
                <Animated.View style={[
                  styles.categoryCard,
                  isActive && styles.categoryCardActive,
                  { transform: [{ scale: scaleAnim }] },
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
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {language === 'en' ? 'No items found' : language === 'ku' ? 'هیچ بڕگەیەک نەدۆزرایەوە' : 'لم يتم العثور على عناصر'}
            </Text>
          </View>
        ) : (
          <>
            {groupedItems.map(({ category, items }) => {
              const categoryInfo = categories.find(c => c.id === category);
              const categoryName = categoryInfo 
                ? (language === 'ku' ? categoryInfo.nameKu : language === 'ar' ? categoryInfo.nameAr : categoryInfo.nameEn)
                : category;
              
              return (
                <View key={category} style={styles.categorySection}>
                  <View style={styles.sectionHeaderContainer}>
                    <View style={styles.sectionHeaderLine} />
                    <Text style={styles.sectionHeaderText}>{categoryName}</Text>
                    <View style={styles.sectionHeaderLine} />
                  </View>
                  
                  <View style={styles.menuGrid}>
                    {items.map(renderMenuItem)}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <View style={styles.cartContainer}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => router.push('/(tabs)/cashier')}
          activeOpacity={0.8}
        >
          <ShoppingCart size={18} color="#fff" strokeWidth={2.5} />
          <Text style={styles.switchButtonText}>Staff</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.switchButton, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}
          onPress={() => router.push('/customer-order?table=1')}
          activeOpacity={0.8}
        >
          <Text style={styles.switchButtonText}>Order</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={itemModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setItemModalVisible(false)}
      >
        <View style={styles.itemModalOverlay}>
          <View style={styles.itemModalContent}>
            {selectedItem && (
              <>
                <TouchableOpacity
                  style={styles.itemModalCloseButton}
                  onPress={() => setItemModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <X size={24} color="#fff" strokeWidth={2.5} />
                </TouchableOpacity>

                {selectedItem.image && (
                  <Image
                    source={{ uri: selectedItem.image }}
                    style={styles.itemModalImage}
                    resizeMode="cover"
                  />
                )}

                <View style={styles.itemModalInfo}>
                  <Text style={styles.itemModalName}>{getItemName(selectedItem)}</Text>
                  <Text style={styles.itemModalDescription}>{getItemDescription(selectedItem)}</Text>
                  
                  {ratingsStats[selectedItem.id] && ratingsStats[selectedItem.id].totalRatings > 0 && (
                    <View style={styles.itemModalRating}>
                      <Star size={20} color="#D4AF37" fill="#D4AF37" />
                      <Text style={styles.itemModalRatingText}>
                        {ratingsStats[selectedItem.id].averageRating.toFixed(1)}
                      </Text>
                      <Text style={styles.itemModalRatingCount}>
                        ({ratingsStats[selectedItem.id].totalRatings} reviews)
                      </Text>
                    </View>
                  )}

                  <View style={styles.itemModalPriceContainer}>
                    <Text style={styles.itemModalPrice}>{formatPrice(selectedItem.price)}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    backgroundColor: 'rgba(58, 0, 16, 0.92)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(212, 175, 55, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 16px rgba(212, 175, 55, 0.2)',
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  headerCornerButton: {
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
    width: 80,
    height: 80,
  },
  viewOnlyBadge: {
    width: 40,
    height: 40,
  },
  viewOnlyBadgeText: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#D4AF37',
    fontWeight: '700' as const,
  },
  categoryScrollSection: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(212, 175, 55, 0.4)',
  },
  categoryContainer: {
    position: 'relative' as const,
  },
  categoryHighlight: {
    position: 'absolute' as const,
    top: 4,
    left: 16,
    width: 110,
    height: 130,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#D4AF37',
    zIndex: 1,
    pointerEvents: 'none' as const,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 32,
      },
      android: {
        elevation: 18,
      },
      web: {
        boxShadow: '0 0 50px rgba(212, 175, 55, 0.9), 0 0 100px rgba(212, 175, 55, 0.6), 0 0 150px rgba(212, 175, 55, 0.3), inset 0 0 40px rgba(212, 175, 55, 0.2)',
      },
    }),
  },
  categoryScroll: {
    backgroundColor: 'transparent',
  },
  categoryScrollContent: {
    paddingLeft: 16,
    gap: 12,
    paddingVertical: 4,
  },
  categoryCard: {
    width: 110,
    height: 130,
    borderRadius: 14,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    backgroundColor: '#1a0000',
    position: 'relative' as const,
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
      web: {
        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.2)',
      },
    }),
  },
  categoryCardActive: {
    borderWidth: 3,
    borderColor: '#D4AF37',
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
    borderRadius: 14,
    overflow: 'visible' as const,
    borderWidth: 2.5,
    borderColor: '#D4AF37',
    marginBottom: 0,
    position: 'relative' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
      web: {
        width: 'calc(50% - 6px)',
        minWidth: 160,
        maxWidth: 250,
        boxShadow: '0 0 20px rgba(212, 175, 55, 0.3), inset 0 0 15px rgba(212, 175, 55, 0.06)',
      },
    }),
  },
  premiumCard: {
    borderWidth: 2,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 0 28px rgba(212, 175, 55, 0.35), inset 0 0 20px rgba(212, 175, 55, 0.08)',
      },
    }),
  },
  imageContainerHorizontal: {
    width: '100%',
    height: 100,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden' as const,
    marginBottom: 0,
    position: 'relative' as const,
    ...Platform.select({
      web: {
        height: 110,
      },
    }),
  },
  menuItemImageHorizontal: {
    width: '100%',
    height: '100%',
  },
  actionButtons: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    flexDirection: 'row' as const,
    gap: 8,
    zIndex: 5,
  },
  circularButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 2px 12px rgba(212, 175, 55, 0.6)',
      },
    }),
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
    padding: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  menuItemNameHorizontal: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    lineHeight: 18,
    letterSpacing: 0.2,
    marginBottom: 6,
    marginTop: 0,
    textAlign: 'center' as const,
    paddingHorizontal: 2,
    ...Platform.select({
      web: {
        fontSize: 15,
        lineHeight: 20,
      },
    }),
  },
  priceHighlight: {
    marginBottom: 0,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(58, 0, 16, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'center' as const,
    minWidth: '65%' as const,
  },
  menuItemPriceHorizontal: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.2,
    textAlign: 'center' as const,
    ...Platform.select({
      web: {
        fontSize: 15,
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
  categorySection: {
    marginBottom: 32,
  },
  sectionHeaderContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#D4AF37',
    opacity: 0.6,
  },
  sectionHeaderText: {
    fontSize: 20,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    marginHorizontal: 16,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
    ...Platform.select({
      web: {
        fontSize: 22,
      },
    }),
  },

  itemModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  itemModalContent: {
    backgroundColor: '#1a0000',
    borderRadius: 24,
    overflow: 'hidden' as const,
    width: '90%' as const,
    maxWidth: 500,
    borderWidth: 3,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 32px rgba(212, 175, 55, 0.6)',
      },
    }),
  },
  itemModalCloseButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 0, 0, 0.95)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#D4AF37',
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
  itemModalImage: {
    width: '100%' as const,
    height: 250,
    backgroundColor: '#F9FAFB',
    ...Platform.select({
      web: {
        height: 300,
      },
    }),
  },
  itemModalInfo: {
    padding: 24,
  },
  itemModalName: {
    fontSize: 24,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    marginBottom: 12,
    lineHeight: 32,
    letterSpacing: 0.5,
  },
  itemModalDescription: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 24,
    marginBottom: 16,
  },
  itemModalRating: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  itemModalRatingText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#D4AF37',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
  itemModalRatingCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'NotoNaskhArabic_600SemiBold',
  },
  itemModalPriceContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  itemModalPrice: {
    fontSize: 28,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.5,
  },
  cartContainer: {
    position: 'absolute' as const,
    top: 100,
    right: 16,
    zIndex: 999,
    flexDirection: 'column' as const,
    gap: 8,
  },
  switchButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(26, 0, 0, 0.95)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 2px 12px rgba(212, 175, 55, 0.6)',
      },
    }),
  },
  switchButtonText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.2,
  },
  cartBadge: {
    position: 'absolute' as const,
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D4AF37',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#1a0000',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.8)',
      },
    }),
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#1a0000',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
});

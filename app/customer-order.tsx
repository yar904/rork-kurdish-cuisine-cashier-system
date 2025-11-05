import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  PanResponder,
  Pressable,
  LayoutAnimation,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TextInput,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ShoppingCart, Plus, Minus, Send, Star, Sparkles, TrendingUp, Check, ChevronUp, Flame, Leaf, Search, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';

type CartItem = {
  menuItem: {
    id: string;
    name: string;
    price: number;
    description: string;
    image: string | null;
    category: string;
  };
  quantity: number;
  notes?: string;
};

export default function CustomerOrderScreen() {
  const { table } = useLocalSearchParams<{ table: string }>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [imageLoadedMap, setImageLoadedMap] = useState<Record<string, boolean>>({});
  const cartBadgeScale = useRef(new Animated.Value(1)).current;
  const cartBarScale = useRef(new Animated.Value(1)).current;
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;
  const searchBarWidth = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const backgroundShift = useRef(new Animated.Value(0)).current;

  const menuQuery = trpc.menu.getAll.useQuery();

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: () => {
      Alert.alert(
        'Order Submitted!',
        'Your order has been sent to the kitchen. We\'ll bring it to your table soon!',
        [{ text: 'OK', onPress: () => setCart([]) }]
      );
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const categories = useMemo(() => {
    const cats = new Set(menuQuery.data?.map(item => item.category) || []);
    return ['all', ...Array.from(cats)];
  }, [menuQuery.data]);

  const filteredMenu = useMemo(() => {
    if (!menuQuery.data) return [];
    let items = menuQuery.data.filter(item => item.available);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    } else if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }
    
    return items;
  }, [menuQuery.data, selectedCategory, searchQuery]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  const getCartColor = () => {
    if (cartTotal === 0) return Colors.primary;
    if (cartTotal < 30000) return '#D4AF37';
    if (cartTotal < 50000) return '#C9A961';
    return '#8B4513';
  };

  useEffect(() => {
    if (cart.length > 0) {
      Animated.spring(cartBarScale, {
        toValue: 1.02,
        friction: 8,
        useNativeDriver: true,
      }).start(() => {
        Animated.spring(cartBarScale, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [cart.length]);

  useEffect(() => {
    Animated.timing(searchBarWidth, {
      toValue: searchFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [searchFocused]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && !recentSearches.includes(query.trim())) {
      setRecentSearches(prev => [query.trim(), ...prev].slice(0, 5));
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchFocused(false);
  };

  const handleRecentSearchPress = (search: string) => {
    setSearchQuery(search);
    setSearchFocused(false);
  };

  const removeRecentSearch = (search: string) => {
    setRecentSearches(prev => prev.filter(s => s !== search));
  };

  const handleImageLoad = (itemId: string) => {
    setImageLoadedMap(prev => ({ ...prev, [itemId]: true }));
  };

  const addToCart = (menuItem: CartItem['menuItem']) => {
    const existingItem = cart.find(item => item.menuItem.id === menuItem.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.menuItem.id === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { menuItem, quantity: 1 }]);
    }
    
    setSuccessAnimation(menuItem.id);
    setTimeout(() => setSuccessAnimation(null), 600);
    
    Animated.sequence([
      Animated.spring(cartBadgeScale, {
        toValue: 1.3,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(cartBadgeScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getItemInCart = (menuItemId: string) => {
    return cart.find(item => item.menuItem.id === menuItemId);
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.menuItem.id === menuItemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const toggleViewMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const toggleExpanded = (itemId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const getItemBadge = (item: any) => {
    if (item.id === '1' || item.id === '10') return 'new';
    if (item.id === '7' || item.id === '11') return 'popular';
    return null;
  };

  const getItemType = (item: any) => {
    if (item.id === '2' || item.id === '12') return 'premium';
    if (item.id === '3' || item.id === '13') return 'seasonal';
    if (!item.available) return 'sold-out';
    return 'standard';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      appetizers: 'rgba(255, 193, 7, 0.1)',
      mains: 'rgba(244, 67, 54, 0.1)',
      desserts: 'rgba(233, 30, 99, 0.1)',
      drinks: 'rgba(33, 150, 243, 0.1)',
      all: 'transparent',
    };
    return colors[category.toLowerCase()] || colors.all;
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollY = contentOffset.y;
    const scrollHeight = contentSize.height - layoutMeasurement.height;
    
    const progress = scrollHeight > 0 ? scrollY / scrollHeight : 0;
    setScrollProgress(progress);
    
    Animated.timing(backgroundShift, {
      toValue: scrollY * 0.3,
      duration: 0,
      useNativeDriver: true,
    }).start();
    
    const shouldShow = scrollY > 400;
    if (shouldShow !== showScrollTop) {
      setShowScrollTop(shouldShow);
      Animated.timing(scrollTopOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    
    const categoryHeight = 300;
    const sectionIndex = Math.floor(scrollY / categoryHeight);
    if (sectionIndex >= 0 && sectionIndex < categories.length) {
      setCurrentSection(categories[sectionIndex]);
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSubmitOrder = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before submitting');
      return;
    }

    if (!table) {
      Alert.alert('Error', 'Table number not found');
      return;
    }

    createOrderMutation.mutate({
      tableNumber: parseInt(table),
      items: cart.map(item => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        notes: item.notes,
      })),
      total: cartTotal,
    });
  };

  if (menuQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.backgroundPattern,
          {
            transform: [{ translateY: backgroundShift }],
            backgroundColor: getCategoryColor(selectedCategory),
          },
        ]}
      />
      <View style={styles.backgroundMesh} />
      <Stack.Screen
        options={{
          title: `Table ${table} - Order`,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />

      <View style={styles.headerContainer}>
        <View style={styles.searchContainer}>
          <Animated.View style={[
            styles.searchBar,
            {
              width: searchBarWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['85%', '100%'],
              }),
            },
          ]}>
            <Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search menu..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <X size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>

        {searchFocused && recentSearches.length > 0 && !searchQuery && (
          <View style={styles.recentSearches}>
            <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.recentSearchesScroll}
            >
              {recentSearches.map((search, index) => (
                <View key={index} style={styles.recentSearchChip}>
                  <TouchableOpacity
                    style={styles.recentSearchButton}
                    onPress={() => handleRecentSearchPress(search)}
                  >
                    <Text style={styles.recentSearchText}>{search}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeRecentButton}
                    onPress={() => removeRecentSearch(search)}
                  >
                    <X size={12} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {!searchQuery && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {searchQuery && (
          <View style={styles.categoryFilterChips}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsContent}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedCategory === 'all' && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategory('all')}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedCategory === 'all' && styles.filterChipTextActive,
                ]}>All</Text>
              </TouchableOpacity>
              {categories.filter(c => c !== 'all').map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterChip,
                    selectedCategory === category && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedCategory === category && styles.filterChipTextActive,
                  ]}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.viewToggleContainer}>
          <Pressable
            style={styles.viewToggle}
            onPress={toggleViewMode}
          >
            <View style={styles.viewTogglePill}>
              <Text style={[
                styles.viewToggleText,
                viewMode === 'grid' && styles.viewToggleTextActive,
              ]}>Grid</Text>
              <Text style={[
                styles.viewToggleText,
                viewMode === 'list' && styles.viewToggleTextActive,
              ]}>List</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.scrollProgressContainer}>
        <View style={[styles.scrollProgressBar, { width: `${scrollProgress * 100}%` }]} />
      </View>

      {showScrollTop && currentSection !== 'all' && (
        <View style={styles.sectionMarker}>
          <Text style={styles.sectionMarkerText}>{currentSection}</Text>
        </View>
      )}

      <ScrollView 
        ref={scrollRef}
        style={styles.menuList} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {viewMode === 'grid' ? (
          <View style={styles.gridContainer}>
            {filteredMenu.map((item) => (
              <GridMenuItem
                key={item.id}
                item={item}
                badge={getItemBadge(item)}
                itemType={getItemType(item)}
                onAddToCart={addToCart}
                showSuccess={successAnimation === item.id}
                searchQuery={searchQuery}
                imageLoaded={imageLoadedMap[item.id]}
                onImageLoad={() => handleImageLoad(item.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredMenu.map((item) => (
              <ListMenuItem
                key={item.id}
                item={item}
                badge={getItemBadge(item)}
                itemType={getItemType(item)}
                onAddToCart={addToCart}
                itemInCart={getItemInCart(item.id)}
                onUpdateQuantity={updateQuantity}
                isExpanded={expandedItem === item.id}
                onToggleExpanded={() => toggleExpanded(item.id)}
                searchQuery={searchQuery}
                imageLoaded={imageLoadedMap[item.id]}
                onImageLoad={() => handleImageLoad(item.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {showScrollTop && (
        <Animated.View style={[styles.scrollTopFab, { opacity: scrollTopOpacity }]}>
          <TouchableOpacity
            style={styles.scrollTopButton}
            onPress={scrollToTop}
            activeOpacity={0.8}
          >
            <ChevronUp size={24} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {cart.length > 0 && (
        <Animated.View 
          style={[
            styles.cartFooter,
            { 
              backgroundColor: getCartColor(),
              transform: [{ scale: cartBarScale }]
            }
          ]}
        >
          <View style={styles.cartSummary}>
            <View style={styles.cartHeader}>
              <View style={styles.cartIconContainer}>
                <ShoppingCart size={20} color="#fff" />
                <Animated.View style={[
                  styles.cartBadge,
                  { transform: [{ scale: cartBadgeScale }] }
                ]}>
                  <Text style={styles.cartBadgeText}>{cart.length}</Text>
                </Animated.View>
              </View>
              <Text style={styles.cartTitle}>{cart.length} items</Text>
              <Text style={styles.cartTotal}>${cartTotal.toFixed(2)}</Text>
            </View>

            <ScrollView
              style={styles.cartItems}
              showsVerticalScrollIndicator={false}
            >
              {cart.map((item) => (
                <View key={item.menuItem.id} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.menuItem.name}</Text>
                    <Text style={styles.cartItemPrice}>
                      ${(item.menuItem.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.menuItem.id, -1)}
                    >
                      <Minus size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.menuItem.id, 1)}
                    >
                      <Plus size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitOrder}
            disabled={createOrderMutation.isPending}
          >
            {createOrderMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Send size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Order</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

function GridMenuItem({
  item,
  badge,
  itemType,
  onAddToCart,
  showSuccess,
  searchQuery,
  imageLoaded,
  onImageLoad,
}: {
  item: any;
  badge: 'new' | 'popular' | null;
  itemType: 'premium' | 'seasonal' | 'sold-out' | 'standard';
  onAddToCart: (item: any) => void;
  showSuccess: boolean;
  searchQuery: string;
  imageLoaded?: boolean;
  onImageLoad: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particleAnimations = useRef(
    Array.from({ length: 8 }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (itemType === 'premium') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [itemType]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
    
    rippleOpacity.setValue(0.6);
    rippleScale.setValue(0);
    Animated.parallel([
      Animated.timing(rippleScale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (showSuccess) {
      successOpacity.setValue(1);
      successScale.setValue(0);
      
      Animated.sequence([
        Animated.spring(successScale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(successOpacity, {
          toValue: 0,
          duration: 200,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const particleAnims = particleAnimations.map((anim, index) => {
        const angle = (index / 8) * Math.PI * 2;
        const distance = 40;
        anim.translateX.setValue(0);
        anim.translateY.setValue(0);
        anim.opacity.setValue(1);
        
        return Animated.parallel([
          Animated.timing(anim.translateX, {
            toValue: Math.cos(angle) * distance,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: Math.sin(angle) * distance,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.parallel(particleAnims).start();
    }
  }, [showSuccess]);

  const fakeRating = parseFloat((4 + Math.random()).toFixed(1));
  const isPremium = itemType === 'premium' as const;
  const isSeasonal = itemType === 'seasonal' as const;
  const isSoldOut = itemType === 'sold-out' as const;

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(212, 175, 55, 0)', 'rgba(212, 175, 55, 0.8)'],
  });

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        if (!isSoldOut) {
          onAddToCart({
            id: item.id,
            name: item.name,
            price: item.price,
            description: item.description,
            image: item.image,
            category: item.category,
          });
        }
      }}
      style={styles.gridCard}
      disabled={isSoldOut}
    >
      <Animated.View style={[
        styles.gridCardInner,
        { transform: [{ scale: scaleAnim }] },
        isPremium && { borderColor: glowColor, borderWidth: 2 },
        isSoldOut && styles.soldOutCard,
      ]}>
        <Animated.View
          style={[
            styles.rippleEffect,
            {
              transform: [{ scale: rippleScale }],
              opacity: rippleOpacity,
            },
          ]}
        />
        
        <Animated.View
          style={[
            styles.successCheckmark,
            {
              transform: [{ scale: successScale }],
              opacity: successOpacity,
            },
          ]}
        >
          <Check size={32} color="#fff" strokeWidth={3} />
        </Animated.View>

        {particleAnimations.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                transform: [
                  { translateX: anim.translateX },
                  { translateY: anim.translateY },
                ],
                opacity: anim.opacity,
              },
            ]}
          />
        ))}
        {badge && !isSoldOut && (
          <View style={[
            styles.badge,
            badge === 'new' ? styles.badgeNew : styles.badgePopular,
          ]}>
            {badge === 'new' ? (
              <Sparkles size={12} color="#fff" />
            ) : (
              <Flame size={12} color="#fff" />
            )}
            <Text style={styles.badgeText}>{badge.toUpperCase()}</Text>
          </View>
        )}

        {isSeasonal && !isSoldOut && (
          <View style={styles.seasonalCorner}>
            <Leaf size={16} color="#4CAF50" />
          </View>
        )}

        {isSoldOut && (
          <View style={styles.soldOutBanner}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        )}

        <View style={styles.gridImageContainer}>
          {!imageLoaded && (
            <View style={styles.skeletonImage}>
              <View style={styles.shimmer} />
            </View>
          )}
          {item.image && (
            <Image
              source={{ uri: item.image }}
              style={[
                styles.gridImage,
                isSoldOut && styles.soldOutImage,
                !imageLoaded && styles.imageHidden,
              ]}
              onLoad={onImageLoad}
              fadeDuration={300}
            />
          )}
          <View style={styles.gradientOverlay} />
        </View>

        <View style={styles.gridContent}>
          <View style={styles.gridHeader}>
            <HighlightedText
              text={item.name}
              query={searchQuery}
              style={styles.gridName}
              numberOfLines={1}
            />
            {fakeRating >= 4.5 && (
              <View style={styles.ratingContainer}>
                <Star size={12} color="#FFD700" fill="#FFD700" />
                <Text style={styles.ratingText}>{fakeRating}</Text>
              </View>
            )}
          </View>
          <HighlightedText
            text={item.description}
            query={searchQuery}
            style={styles.gridDescription}
            numberOfLines={2}
          />
          <View style={styles.gridFooter}>
            <View style={styles.priceBadge}>
              <Text style={styles.gridPrice}>${(item.price / 1000).toFixed(0)}</Text>
            </View>
            <View style={styles.addIconContainer}>
              <Plus size={18} color="#fff" />
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function ListMenuItem({
  item,
  badge,
  itemType,
  onAddToCart,
  itemInCart,
  onUpdateQuantity,
  isExpanded,
  onToggleExpanded,
  searchQuery,
  imageLoaded,
  onImageLoad,
}: {
  item: any;
  badge: 'new' | 'popular' | null;
  itemType: 'premium' | 'seasonal' | 'sold-out' | 'standard';
  onAddToCart: (item: any) => void;
  itemInCart?: { quantity: number };
  onUpdateQuantity: (id: string, delta: number) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  searchQuery: string;
  imageLoaded?: boolean;
  onImageLoad: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const isPremium = itemType === 'premium' as const;
  const isSeasonal = itemType === 'seasonal' as const;
  const isSoldOut = itemType === 'sold-out' as const;

  useEffect(() => {
    if (itemType === 'premium') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [itemType]);

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(212, 175, 55, 0)', 'rgba(212, 175, 55, 0.8)'],
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0 && !isSoldOut) {
          translateX.setValue(Math.max(gestureState.dx, -80));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50 && !isSoldOut) {
          onAddToCart({
            id: item.id,
            name: item.name,
            price: item.price,
            description: item.description,
            image: item.image,
            category: item.category,
          });
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const fakeRating = parseFloat((4 + Math.random()).toFixed(1));

  return (
    <View style={styles.listItemWrapper}>
      <View style={styles.swipeActionContainer}>
        <View style={styles.swipeAction}>
          <ShoppingCart size={20} color="#fff" />
          <Text style={styles.swipeActionText}>Add to Cart</Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.listItem,
          { transform: [{ translateX }] },
          isPremium && { borderColor: glowColor, borderWidth: 2 },
          isSoldOut && styles.soldOutCard,
        ]}
        {...panResponder.panHandlers}
      >
        {badge && !isSoldOut && (
          <View style={[
            styles.badgeList,
            badge === 'new' ? styles.badgeNew : styles.badgePopular,
          ]}>
            {badge === 'new' ? (
              <Sparkles size={10} color="#fff" />
            ) : (
              <Flame size={10} color="#fff" />
            )}
            <Text style={styles.badgeTextSmall}>{badge.toUpperCase()}</Text>
          </View>
        )}

        {isSeasonal && !isSoldOut && (
          <View style={styles.seasonalCornerList}>
            <Leaf size={14} color="#4CAF50" />
          </View>
        )}

        {isSoldOut && (
          <View style={styles.soldOutBanner}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        )}

        <Pressable onPress={onToggleExpanded} style={styles.listContent}>
          <View style={styles.listImageContainer}>
            {!imageLoaded && (
              <View style={styles.skeletonImageList}>
                <View style={styles.shimmer} />
              </View>
            )}
            {item.image && (
              <Image
                source={{ uri: item.image }}
                style={[
                  styles.listImage,
                  isSoldOut && styles.soldOutImage,
                  !imageLoaded && styles.imageHidden,
                ]}
                onLoad={onImageLoad}
                fadeDuration={300}
              />
            )}
          </View>

          <View style={styles.listInfo}>
            <View style={styles.listHeader}>
              <HighlightedText
                text={item.name}
                query={searchQuery}
                style={styles.listName}
                numberOfLines={1}
              />
              {fakeRating >= 4.5 && (
                <View style={styles.ratingContainer}>
                  <Star size={12} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.ratingText}>{fakeRating}</Text>
                </View>
              )}
            </View>
            <HighlightedText
              text={item.description}
              query={searchQuery}
              style={styles.listDescription}
              numberOfLines={isExpanded ? undefined : 2}
            />
            <View style={styles.listFooter}>
              <Text style={styles.listPrice}>${(item.price / 1000).toFixed(0)}</Text>
              {itemInCart ? (
                <View style={styles.quantityControlsInline}>
                  <TouchableOpacity
                    style={styles.quantityButtonInline}
                    onPress={() => onUpdateQuantity(item.id, -1)}
                  >
                    <Minus size={14} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.quantityInline}>{itemInCart.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButtonInline}
                    onPress={() => onUpdateQuantity(item.id, 1)}
                  >
                    <Plus size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addButtonList}
                  onPress={() => onAddToCart({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    description: item.description,
                    image: item.image,
                    category: item.category,
                  })}
                >
                  <Plus size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function HighlightedText({
  text,
  query,
  style,
  numberOfLines,
}: {
  text: string;
  query: string;
  style: any;
  numberOfLines?: number;
}) {
  if (!query.trim()) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <Text key={index} style={styles.highlightedText}>{part}</Text>
        ) : (
          <Text key={index}>{part}</Text>
        )
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
    position: 'relative' as const,
  },
  backgroundPattern: {
    position: 'absolute' as const,
    top: -100,
    left: 0,
    right: 0,
    height: 600,
    opacity: 0.3,
    zIndex: 0,
  },
  backgroundMesh: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    zIndex: 0,
    ...Platform.select({
      web: {
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(61, 1, 1, 0.2) 0%, transparent 50%)',
      },
      default: {},
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
  },
  headerContainer: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {},
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  clearButton: {
    padding: 4,
  },
  recentSearches: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  recentSearchesTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  recentSearchesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  recentSearchChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentSearchButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recentSearchText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  removeRecentButton: {
    padding: 6,
    paddingLeft: 0,
    paddingRight: 8,
  },
  categoryFilterChips: {
    paddingBottom: 8,
  },
  filterChipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.backgroundGray,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'capitalize' as const,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  highlightedText: {
    backgroundColor: '#FFD70050',
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  skeletonImage: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.backgroundGray,
    overflow: 'hidden' as const,
  },
  skeletonImageList: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 10,
    overflow: 'hidden' as const,
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.border,
    ...Platform.select({
      web: {
        animation: 'shimmer 1.5s infinite',
        backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
        backgroundSize: '200% 100%',
      },
      default: {},
    }),
  },
  imageHidden: {
    opacity: 0,
  },
  categoriesScroll: {
    backgroundColor: Colors.background,
  },
  categoriesContent: {
    padding: 16,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.backgroundGray,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'capitalize' as const,
    letterSpacing: 0.3,
  },
  categoryTextActive: {
    color: '#fff',
  },
  viewToggleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  viewToggle: {
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden' as const,
    backgroundColor: 'rgba(0,0,0,0.03)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {},
    }),
  },
  viewTogglePill: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 20,
    padding: 3,
    gap: 4,
  },
  viewToggleText: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    borderRadius: 16,
  },
  viewToggleTextActive: {
    backgroundColor: Colors.primary,
    color: '#fff',
  },
  menuList: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 16,
    padding: 20,
  },
  listContainer: {
    padding: 20,
  },
  gridCard: {
    width: '48%',
  },
  gridCardInner: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {},
    }),
  },
  badge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  badgeNew: {
    backgroundColor: '#FF6B6B',
  },
  badgePopular: {
    backgroundColor: '#4ECDC4',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800' as const,
  },
  badgeList: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 10,
  },
  badgeTextSmall: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800' as const,
  },
  gridImageContainer: {
    width: '100%',
    height: 140,
    position: 'relative' as const,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
      },
      default: {},
    }),
  },
  gridContent: {
    padding: 14,
  },
  gridHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  gridName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ratingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    marginLeft: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  gridDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 19,
    letterSpacing: 0.2,
  },
  gridFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {},
    }),
  },
  gridPrice: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.3,
  },
  addIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  listItemWrapper: {
    marginBottom: 16,
    position: 'relative' as const,
  },
  swipeActionContainer: {
    position: 'absolute' as const,
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  swipeAction: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: '100%',
    width: '100%',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  swipeActionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  listItem: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: Colors.border,
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
      web: {},
    }),
  },
  listContent: {
    flexDirection: 'row' as const,
    padding: 12,
  },
  listImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden' as const,
    marginRight: 12,
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listInfo: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  listName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  listDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 21,
    letterSpacing: 0.2,
  },
  listFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  listPrice: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  addButtonList: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  quantityControlsInline: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quantityButtonInline: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  quantityInline: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.text,
    minWidth: 20,
    textAlign: 'center' as const,
  },
  cartFooter: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {},
    }),
  },
  cartSummary: {
    marginBottom: 12,
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cartIconContainer: {
    position: 'relative' as const,
  },
  cartBadge: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800' as const,
  },
  cartTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#fff',
  },
  cartTotal: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  cartItems: {
    maxHeight: 150,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 2,
  },
  cartItemPrice: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600' as const,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#fff',
    minWidth: 24,
    textAlign: 'center' as const,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  rippleEffect: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: 200,
    height: 200,
    marginLeft: -100,
    marginTop: -100,
    borderRadius: 100,
    backgroundColor: Colors.primary,
    zIndex: 1,
  },
  successCheckmark: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: 60,
    height: 60,
    marginLeft: -30,
    marginTop: -30,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {},
    }),
  },
  particle: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    zIndex: 5,
  },
  scrollProgressContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.05)',
    zIndex: 100,
  },
  scrollProgressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      web: {
        boxShadow: '0 0 8px rgba(178,34,34,0.5)',
      },
      default: {},
    }),
  },
  sectionMarker: {
    position: 'absolute' as const,
    top: 60,
    left: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 99,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {},
    }),
  },
  sectionMarkerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
    textTransform: 'capitalize' as const,
    letterSpacing: 0.5,
  },
  scrollTopFab: {
    position: 'absolute' as const,
    right: 20,
    bottom: 100,
    zIndex: 100,
  },
  scrollTopButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {},
    }),
  },
  soldOutCard: {
    opacity: 0.5,
  },
  soldOutImage: {
    opacity: 0.3,
  },
  soldOutBanner: {
    position: 'absolute' as const,
    top: 60,
    left: -30,
    right: -30,
    backgroundColor: '#000',
    paddingVertical: 8,
    transform: [{ rotate: '-45deg' }],
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
      web: {},
    }),
  },
  soldOutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800' as const,
    textAlign: 'center' as const,
    letterSpacing: 2,
  },
  seasonalCorner: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: 48,
    height: 48,
    backgroundColor: '#E8F5E9',
    borderBottomRightRadius: 48,
    justifyContent: 'flex-start' as const,
    alignItems: 'flex-start' as const,
    paddingTop: 8,
    paddingLeft: 8,
    zIndex: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {},
    }),
  },
  seasonalCornerList: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    backgroundColor: '#E8F5E9',
    borderBottomLeftRadius: 40,
    justifyContent: 'flex-start' as const,
    alignItems: 'flex-end' as const,
    paddingTop: 6,
    paddingRight: 6,
    zIndex: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: -2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {},
    }),
  },
});

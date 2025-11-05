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
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ShoppingCart, Plus, Minus, Send, Star, Sparkles, TrendingUp, Check, ChevronUp } from 'lucide-react-native';
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
  const cartBadgeScale = useRef(new Animated.Value(1)).current;
  const cartBarScale = useRef(new Animated.Value(1)).current;
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

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
    if (selectedCategory === 'all') return menuQuery.data.filter(item => item.available);
    return menuQuery.data.filter(item => item.category === selectedCategory && item.available);
  }, [menuQuery.data, selectedCategory]);

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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollY = contentOffset.y;
    const scrollHeight = contentSize.height - layoutMeasurement.height;
    
    const progress = scrollHeight > 0 ? scrollY / scrollHeight : 0;
    setScrollProgress(progress);
    
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
                onAddToCart={addToCart}
                showSuccess={successAnimation === item.id}
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
                onAddToCart={addToCart}
                itemInCart={getItemInCart(item.id)}
                onUpdateQuantity={updateQuantity}
                isExpanded={expandedItem === item.id}
                onToggleExpanded={() => toggleExpanded(item.id)}
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
  onAddToCart,
  showSuccess,
}: {
  item: any;
  badge: 'new' | 'popular' | null;
  onAddToCart: (item: any) => void;
  showSuccess: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const particleAnimations = useRef(
    Array.from({ length: 8 }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

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

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onAddToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        image: item.image,
        category: item.category,
      })}
      style={styles.gridCard}
    >
      <Animated.View style={[styles.gridCardInner, { transform: [{ scale: scaleAnim }] }]}>
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
        {badge && (
          <View style={[
            styles.badge,
            badge === 'new' ? styles.badgeNew : styles.badgePopular,
          ]}>
            {badge === 'new' ? (
              <Sparkles size={12} color="#fff" />
            ) : (
              <TrendingUp size={12} color="#fff" />
            )}
            <Text style={styles.badgeText}>{badge.toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.gridImageContainer}>
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.gridImage} />
          )}
          <View style={styles.gradientOverlay} />
        </View>

        <View style={styles.gridContent}>
          <View style={styles.gridHeader}>
            <Text style={styles.gridName} numberOfLines={1}>{item.name}</Text>
            {fakeRating >= 4.5 && (
              <View style={styles.ratingContainer}>
                <Star size={12} color="#FFD700" fill="#FFD700" />
                <Text style={styles.ratingText}>{fakeRating}</Text>
              </View>
            )}
          </View>
          <Text style={styles.gridDescription} numberOfLines={2}>
            {item.description}
          </Text>
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
  onAddToCart,
  itemInCart,
  onUpdateQuantity,
  isExpanded,
  onToggleExpanded,
}: {
  item: any;
  badge: 'new' | 'popular' | null;
  onAddToCart: (item: any) => void;
  itemInCart?: { quantity: number };
  onUpdateQuantity: (id: string, delta: number) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -80));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
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
        style={[styles.listItem, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {badge && (
          <View style={[
            styles.badgeList,
            badge === 'new' ? styles.badgeNew : styles.badgePopular,
          ]}>
            {badge === 'new' ? (
              <Sparkles size={10} color="#fff" />
            ) : (
              <TrendingUp size={10} color="#fff" />
            )}
            <Text style={styles.badgeTextSmall}>{badge.toUpperCase()}</Text>
          </View>
        )}

        <Pressable onPress={onToggleExpanded} style={styles.listContent}>
          <View style={styles.listImageContainer}>
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.listImage} />
            )}
          </View>

          <View style={styles.listInfo}>
            <View style={styles.listHeader}>
              <Text style={styles.listName} numberOfLines={1}>{item.name}</Text>
              {fakeRating >= 4.5 && (
                <View style={styles.ratingContainer}>
                  <Star size={12} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.ratingText}>{fakeRating}</Text>
                </View>
              )}
            </View>
            <Text
              style={styles.listDescription}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {item.description}
            </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
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
});

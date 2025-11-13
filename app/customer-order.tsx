import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Plus, Minus, Send, Star, Bell, ChevronRight, Globe, Utensils, Receipt, X, ChefHat, Grid3x3, List } from 'lucide-react-native';
import Svg, { Defs, Pattern, Rect, Path, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { CATEGORY_NAMES, MENU_ITEMS } from '@/constants/menu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useNotifications } from '@/contexts/NotificationContext';

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

type Review = {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  menuItemId: string;
};

export default function CustomerOrderScreen() {
  const { table } = useLocalSearchParams<{ table: string }>();
  const { notifyServiceRequest } = useNotifications();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const isCustomerMode = !!table;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isGridView, setIsGridView] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addAnimations] = useState(new Map<string, Animated.Value>());
  const scrollViewRef = useRef<ScrollView>(null);
  const categoryRefs = useRef<Map<string, number>>(new Map());
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  
  const scrollY = useRef(0);
  const lastScrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const categoryTranslateY = useRef(new Animated.Value(0)).current;
  const bottomBarTranslateY = useRef(new Animated.Value(0)).current;
  const categoryScrollViewRef = useRef<ScrollView>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const menuItemsOpacity = useRef(new Animated.Value(1)).current;
  const [categoryScales] = useState(new Map<string, Animated.Value>());
  const currentCategoryIndex = useRef(0);
  const userScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const itemScrollViewRef = useRef<ScrollView>(null);
  const [itemScales] = useState(new Map<string, Animated.Value>());
  const currentItemIndex = useRef(0);
  const itemAutoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const [isUserScrollingItems, setIsUserScrollingItems] = useState(false);
  const itemUserScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [buttonScales] = useState({
    reviews: new Animated.Value(1),
    waiter: new Animated.Value(1),
    order: new Animated.Value(1),
    bill: new Animated.Value(1),
  });

  const [requestStatus, setRequestStatus] = useState<{
    type: 'waiter' | 'bill' | null;
    message: string;
    visible: boolean;
  }>({ type: null, message: '', visible: false });
  const statusOpacity = useRef(new Animated.Value(0)).current;

  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const chefFloatY = useRef(new Animated.Value(0)).current;
  const chefHatFloat = useRef(new Animated.Value(0)).current;
  const sparkleScale1 = useRef(new Animated.Value(1)).current;
  const sparkleScale2 = useRef(new Animated.Value(1)).current;
  const sparkleScale3 = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const plateRotate = useRef(new Animated.Value(0)).current;

  const menuQuery = trpc.menu.getAll.useQuery();
  
  const menuData = menuQuery.data?.length > 0 ? menuQuery.data : MENU_ITEMS;
  
  const ratingsStatsQuery = trpc.ratings.getAllStats.useQuery();

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

  const createServiceRequestMutation = trpc.serviceRequests.create.useMutation({
    onSuccess: (data, variables) => {
      const requestType = variables.requestType;
      if (data && table) {
        notifyServiceRequest(parseInt(table), requestType);
        
        if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Service Request! 🔔', {
            body: `Table ${table} needs ${requestType}`,
            icon: '/assets/images/icon.png',
          });
        }
      }
      
      const message = requestType === 'bill' 
        ? '✅ Bill request sent! Staff will bring your bill shortly.'
        : requestType === 'assistance'
        ? '✅ Assistance requested! Staff will help you shortly.'
        : '✅ Waiter called! Someone will assist you shortly.';
      
      setRequestStatus({
        type: requestType as 'waiter' | 'bill',
        message,
        visible: true,
      });
      
      Animated.sequence([
        Animated.timing(statusOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(statusOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setRequestStatus({ type: null, message: '', visible: false });
      });
    },
    onError: (error) => {
      setRequestStatus({
        type: null,
        message: '❌ Failed to send request. Please try again.',
        visible: true,
      });
      
      Animated.sequence([
        Animated.timing(statusOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(statusOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setRequestStatus({ type: null, message: '', visible: false });
      });
    },
  });

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

  const getCategoryImage = (category: string) => {
    const images: Record<string, string> = {
      appetizers: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop',
      soups: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
      salads: 'https://images.unsplash.com/photo-1512621776951-5a09ec56c8f7?w=400&h=300&fit=crop',
      kebabs: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop',
      'rice-dishes': 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=400&h=300&fit=crop',
      stews: 'https://images.unsplash.com/photo-1543352632-5a4b7d4c7b5a?w=400&h=300&fit=crop',
      seafood: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&h=300&fit=crop',
      breads: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
      desserts: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
      drinks: 'https://images.unsplash.com/photo-1514933651356-89db8e11e23f?w=400&h=300&fit=crop',
      shisha: 'https://images.unsplash.com/photo-1534422298391-304a23b3c7e6?w=400&h=300&fit=crop',
      'hot-drinks': 'https://images.unsplash.com/photo-1543007630-9710e4a00a1c?w=400&h=300&fit=crop',
    };
    return images[category] || 'https://images.unsplash.com/photo-1546069901-120a39972937?w=400&h=300&fit=crop';
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

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  const addToCart = (menuItem: CartItem['menuItem']) => {
    const existingItem = cart.find(item => item.menuItem.id === menuItem.id);
    
    if (!addAnimations.has(menuItem.id)) {
      addAnimations.set(menuItem.id, new Animated.Value(1));
    }
    const scaleAnim = addAnimations.get(menuItem.id)!;
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.menuItem.id === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { menuItem, quantity: 1 }]);
    }
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
        Animated.timing(bottomBarTranslateY, {
          toValue: 100,
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
        Animated.timing(bottomBarTranslateY, {
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
  }, [headerTranslateY, categoryTranslateY, bottomBarTranslateY, menuItemsOpacity]);

  const animateButton = (button: keyof typeof buttonScales) => {
    Animated.sequence([
      Animated.timing(buttonScales[button], {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScales[button], {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCallWaiter = () => {
    animateButton('waiter');
    if (!table) {
      Alert.alert('Error', 'Table number not found');
      return;
    }

    setRequestStatus({ type: 'waiter', message: '', visible: false });

    createServiceRequestMutation.mutate({
      tableNumber: parseInt(table),
      requestType: 'waiter',
      messageText: 'Customer requesting assistance',
    });
  };

  const handleRequestBill = () => {
    animateButton('bill');
    if (!table) {
      Alert.alert('Error', 'Table number not found');
      return;
    }

    setRequestStatus({ type: 'bill', message: '', visible: false });

    createServiceRequestMutation.mutate({
      tableNumber: parseInt(table),
      requestType: 'bill',
      messageText: 'Customer requesting bill',
    });
  };

  const handleViewOrder = () => {
    animateButton('order');
    setOrderModalVisible(true);
  };

  const handleReviews = () => {
    animateButton('reviews');
    Alert.alert('Reviews', 'Customer reviews coming soon!');
  };

  useEffect(() => {
    categories.forEach((cat, index) => {
      if (!categoryScales.has(cat)) {
        categoryScales.set(cat, new Animated.Value(index === 0 ? 1 : 0.75));
      }
    });
    
    filteredMenu.forEach(item => {
      if (!itemScales.has(item.id)) {
        itemScales.set(item.id, new Animated.Value(1));
      }
    });
  }, [categories, categoryScales, filteredMenu, itemScales]);

  useEffect(() => {
    if (isUserScrolling) {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
        autoScrollInterval.current = null;
      }
      return;
    }

    const scrollToNextCategory = () => {
      if (!categoryScrollViewRef.current) return;
      
      const prevIndex = currentCategoryIndex.current;
      const prevScale = categoryScales.get(categories[prevIndex]);
      if (prevScale) {
        Animated.timing(prevScale, {
          toValue: 0.75,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
      
      currentCategoryIndex.current = (currentCategoryIndex.current + 1) % categories.length;
      const scrollPosition = currentCategoryIndex.current * 140;
      
      categoryScrollViewRef.current.scrollTo({ 
        x: scrollPosition, 
        animated: true 
      });
      
      const currentScale = categoryScales.get(categories[currentCategoryIndex.current]);
      if (currentScale) {
        Animated.spring(currentScale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }).start();
      }
    };

    autoScrollInterval.current = setInterval(scrollToNextCategory, 2500);

    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [categories, categoryScales, isUserScrolling]);

  useEffect(() => {
    if (orderModalVisible && cart.length === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(chefFloatY, {
            toValue: -15,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(chefFloatY, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(chefHatFloat, {
            toValue: -8,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(chefHatFloat, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleScale1, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleScale1, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(sparkleScale2, {
            toValue: 1.4,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleScale2, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(sparkleScale3, {
            toValue: 1.2,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleScale3, {
            toValue: 1,
            duration: 1100,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(plateRotate, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      chefFloatY.stopAnimation();
      chefHatFloat.stopAnimation();
      sparkleScale1.stopAnimation();
      sparkleScale2.stopAnimation();
      sparkleScale3.stopAnimation();
      pulseScale.stopAnimation();
      plateRotate.stopAnimation();
    }
  }, [orderModalVisible, cart.length, chefFloatY, chefHatFloat, sparkleScale1, sparkleScale2, sparkleScale3, pulseScale, plateRotate]);

  if (menuQuery.isLoading) {
    console.log('[CustomerOrder] Loading menu data...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!table) {
    console.log('[CustomerOrder] No table number provided');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No table number provided</Text>
        <Text style={styles.errorSubtext}>Please scan the QR code on your table</Text>
      </View>
    );
  }

  console.log('[CustomerOrder] Rendering customer order screen for table:', table);

  return (
    <View style={styles.container}>
      <KurdishCarpetBackground />

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
        </View>

        <View style={styles.headerCornerButton}>
          <View style={styles.tableIndicator}>
            <Utensils size={16} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.tableNumber}>{table}</Text>
          </View>
        </View>
      </Animated.View>

      <LanguageSwitcher
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />

      <Animated.View style={[styles.categoryFilterSection, { transform: [{ translateY: categoryTranslateY }] }]}>
        <ScrollView
          ref={categoryScrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((category, index) => {
            const categoryItems = menuData?.filter(item => item.category === category) || [];
            const displayImage = categoryItems[0]?.image || getCategoryImage(category);
            
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryCard,
                  selectedCategory === category && styles.categoryCardActive
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  if (category !== 'all') {
                    scrollToCategory(category);
                  }
                }}
                activeOpacity={0.7}
              >
                {category !== 'all' && (
                  <Image 
                    source={{ uri: displayImage }} 
                    style={styles.categoryCardImage}
                  />
                )}
                {category === 'all' && (
                  <View style={styles.categoryCardImagePlaceholder}>
                    <Text style={styles.categoryCardImagePlaceholderIcon}>🍽️</Text>
                  </View>
                )}
                {selectedCategory === category && (
                  <View style={styles.categoryCardOverlay} />
                )}
                <View style={styles.categoryCardLabel}>
                  <Text style={[
                    styles.categoryCardText,
                    selectedCategory === category && styles.categoryCardTextActive
                  ]}>
                    {CATEGORY_NAMES[category] || category}
                  </Text>
                </View>
              </TouchableOpacity>
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
                
                const scaleAnim = addAnimations.get(item.id) || new Animated.Value(1);
                if (!addAnimations.has(item.id)) {
                  addAnimations.set(item.id, scaleAnim);
                }

                      return (
                        <Animated.View 
                          key={item.id} 
                          style={[
                            isGridView ? styles.menuItemGrid : styles.menuItem, 
                            { transform: [{ scale: scaleAnim }], opacity: menuItemsOpacity }
                          ]}
                        >
                        {item.image && (
                          <View style={isGridView ? styles.imageContainerGrid : styles.imageContainer}>
                            <Image source={{ uri: item.image }} style={isGridView ? styles.menuImageGrid : styles.menuImage} />
                            <View style={styles.itemActions}>
                              <TouchableOpacity
                                style={styles.favoriteButton}
                                onPress={() => Alert.alert('Favorites', 'Add to favorites!')}
                                activeOpacity={0.7}
                              >
                                <Star size={20} color={Colors.gold} strokeWidth={2.5} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.addButtonOverlay}
                                onPress={() => addToCart({
                                  id: item.id,
                                  name: item.name,
                                  price: item.price,
                                  description: item.description,
                                  image: item.image,
                                  category: item.category,
                                })}
                                activeOpacity={0.7}
                              >
                                <Plus size={20} color="#fff" strokeWidth={2.5} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                        <View style={styles.menuInfo}>
                          <Text style={styles.menuName}>{item.name}</Text>
                          <Text style={styles.menuPrice}>{item.price.toLocaleString()} IQD</Text>
                        </View>
                        </Animated.View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
            

          </>
        )}
      </ScrollView>

      <Animated.View style={[styles.bottomActionsBar, { transform: [{ translateY: bottomBarTranslateY }] }]}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleReviews}
          activeOpacity={1}
        >
          <Animated.View style={[styles.actionButtonInner, { transform: [{ scale: buttonScales.reviews }] }]}>
            <Star size={24} color={Colors.gold} strokeWidth={2.5} />
            <Text style={styles.actionButtonText}>Reviews</Text>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleCallWaiter}
          activeOpacity={1}
          disabled={createServiceRequestMutation.isPending}
        >
          <Animated.View style={[styles.actionButtonInner, { transform: [{ scale: buttonScales.waiter }] }]}>
            {createServiceRequestMutation.isPending && requestStatus.type === 'waiter' ? (
              <ActivityIndicator size="small" color={Colors.cream} />
            ) : (
              <>
                <ChefHat size={24} color={Colors.cream} strokeWidth={2.5} />
                <Text style={[styles.actionButtonText, styles.actionButtonTextLight]}>Call{"\n"}Waiter</Text>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.actionButtonHighlight]}
          onPress={handleViewOrder}
          activeOpacity={1}
        >
          <Animated.View style={[styles.actionButtonInner, { transform: [{ scale: buttonScales.order }] }]}>
            <View style={styles.plateIcon}>
              <Text style={styles.plateIconText}>🍽</Text>
            </View>
            <Text style={[styles.actionButtonText, styles.actionButtonTextDark]}>My Order</Text>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleRequestBill}
          activeOpacity={1}
          disabled={createServiceRequestMutation.isPending}
        >
          <Animated.View style={[styles.actionButtonInner, { transform: [{ scale: buttonScales.bill }] }]}>
            {createServiceRequestMutation.isPending && requestStatus.type === 'bill' ? (
              <ActivityIndicator size="small" color={Colors.cream} />
            ) : (
              <>
                <Receipt size={24} color={Colors.cream} strokeWidth={2.5} />
                <Text style={[styles.actionButtonText, styles.actionButtonTextLight]}>Request{"\n"}Bill</Text>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={orderModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View style={styles.orderModalOverlay}>
          <View style={styles.orderModalContent}>
            <View style={styles.orderModalHeader}>
              <Text style={styles.orderModalTitle}>Your Order</Text>
              <TouchableOpacity
                style={styles.orderModalCloseButton}
                onPress={() => setOrderModalVisible(false)}
              >
                <X size={24} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyOrderState}>
                <Animated.View style={[styles.chefAnimationContainer, { transform: [{ translateY: chefFloatY }] }]}>
                  <Animated.View style={[styles.glowPulse, { transform: [{ scale: pulseScale }] }]} />
                  
                  <View style={styles.chefCharacterNew}>
                    <Animated.View style={[styles.chefHatWrapper, { transform: [{ translateY: chefHatFloat }] }]}>
                      <Text style={styles.chefHatEmoji}>👨‍🍳</Text>
                    </Animated.View>
                    
                    <View style={styles.chefBodyWrapper}>
                      <View style={styles.chefBodyCircle}>
                        <View style={styles.chefFaceNew}>
                          <View style={styles.chefEyesNew}>
                            <View style={styles.chefEyeNew} />
                            <View style={styles.chefEyeNew} />
                          </View>
                          <View style={styles.chefMouthNew} />
                        </View>
                      </View>
                    </View>
                  </View>
                </Animated.View>

                <Animated.View style={[styles.floatingPlateNew, { 
                  transform: [{ 
                    rotate: plateRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }] 
                }]}>
                  <Text style={styles.plateEmojiNew}>🍽️</Text>
                </Animated.View>

                <View style={styles.emptyOrderTextContainer}>
                  <Text style={styles.emptyOrderTitleNew}>Waiting for Your Order</Text>
                  <Text style={styles.emptyOrderSubtitleNew}>
                    Our chef is ready to cook something amazing!
                  </Text>
                </View>

                <View style={styles.sparklesContainerNew}>
                  <Animated.View style={{ transform: [{ scale: sparkleScale1 }] }}>
                    <Text style={styles.sparkleNew}>✨</Text>
                  </Animated.View>
                  <Animated.View style={{ transform: [{ scale: sparkleScale2 }] }}>
                    <Text style={styles.sparkleNew}>⭐</Text>
                  </Animated.View>
                  <Animated.View style={{ transform: [{ scale: sparkleScale3 }] }}>
                    <Text style={styles.sparkleNew}>✨</Text>
                  </Animated.View>
                </View>
              </View>
            ) : (
              <>
                <ScrollView style={styles.orderModalItems}>
                  {cart.map((item) => (
                    <View key={item.menuItem.id} style={styles.orderModalItem}>
                      <View style={styles.orderModalItemInfo}>
                        <Text style={styles.orderModalItemName}>{item.menuItem.name}</Text>
                        <Text style={styles.orderModalItemPrice}>
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

                <View style={styles.orderModalFooter}>
                  <View style={styles.orderModalTotal}>
                    <Text style={styles.orderModalTotalLabel}>Total:</Text>
                    <Text style={styles.orderModalTotalValue}>${cartTotal.toFixed(2)} IQD</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.orderModalSubmitButton}
                    onPress={() => {
                      handleSubmitOrder();
                      setOrderModalVisible(false);
                    }}
                    disabled={createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Send size={20} color="#fff" strokeWidth={2.5} />
                        <Text style={styles.orderModalSubmitText}>Submit Order</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {requestStatus.visible && (
        <Animated.View 
          style={[
            styles.statusToast,
            { opacity: statusOpacity }
          ]}
        >
          <Text style={styles.statusToastText}>{requestStatus.message}</Text>
        </Animated.View>
      )}

      {cart.length > 0 && (
        <View style={styles.cartFooter}>
          <View style={styles.cartSummary}>
            <View style={styles.cartHeader}>
              <View style={styles.cartIconBadge}>
                <Image 
                  source={require('@/assets/images/icon.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
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
        </View>
      )}
    </View>
  );
}

const KurdishCarpetBackground = () => (
  <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
    <Defs>
      <Pattern
        id="carpet-pattern"
        patternUnits="userSpaceOnUse"
        width="120"
        height="120"
      >
        <Rect width="120" height="120" fill="#5C1C1C" />
        <G opacity="0.3">
          <Path
            d="M60,20 L70,40 L60,60 L50,40 Z"
            fill="#D4AF37"
            stroke="#8B6914"
            strokeWidth="1"
          />
          <Path
            d="M20,60 L40,70 L60,60 L40,50 Z"
            fill="#C41E3A"
            stroke="#8B0000"
            strokeWidth="1"
          />
          <Path
            d="M100,60 L80,70 L60,60 L80,50 Z"
            fill="#C41E3A"
            stroke="#8B0000"
            strokeWidth="1"
          />
          <Path
            d="M60,100 L70,80 L60,60 L50,80 Z"
            fill="#D4AF37"
            stroke="#8B6914"
            strokeWidth="1"
          />
          <Path
            d="M30,30 Q35,25 40,30 T50,30"
            stroke="#FFD700"
            strokeWidth="1.5"
            fill="none"
          />
          <Path
            d="M70,90 Q75,85 80,90 T90,90"
            stroke="#FFD700"
            strokeWidth="1.5"
            fill="none"
          />
        </G>
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#carpet-pattern)" />
  </Svg>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5C1C1C',
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
  },
  headerLogo: {
    width: 50,
    height: 50,
  },
  tableIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
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
    borderBottomWidth: 2,
    borderBottomColor: Colors.gold,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    width: 130,
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.gold,
    backgroundColor: Colors.cardBackground,
  },
  categoryCardActive: {
    borderWidth: 3,
    borderColor: Colors.goldLight,
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  categoryCardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCardImagePlaceholderIcon: {
    fontSize: 48,
  },
  categoryCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  categoryCardLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(61, 1, 1, 0.85)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  categoryCardText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.cream,
    letterSpacing: -0.2,
    textAlign: 'center' as const,
  },
  categoryCardTextActive: {
    color: Colors.gold,
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
    backgroundColor: 'transparent',
  },
  menuListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 220,
    backgroundColor: 'transparent',
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
    backgroundColor: '#2D0909',
    borderRadius: 20,
    padding: 0,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden' as const,
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
    width: '100%',
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
    height: 120,
    borderRadius: 0,
    borderWidth: 0,
  },
  itemActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(61, 1, 1, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  addButtonOverlay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(61, 1, 1, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.gold,
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
    padding: 12,
    gap: 4,
  },
  menuName: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: -0.3,
    lineHeight: 19,
    textAlign: 'center' as const,
  },
  menuPrice: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: -0.3,
    textAlign: 'center' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },

  bottomActionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 7,
    paddingBottom: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
    gap: 5,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonHighlight: {
    backgroundColor: Colors.gold,
    borderColor: Colors.goldDark,
  },
  actionButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.cream,
    textAlign: 'center' as const,
    letterSpacing: -0.2,
    lineHeight: 14,
  },
  plateIcon: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plateIconText: {
    fontSize: 24,
  },
  actionButtonTextLight: {
    color: Colors.cream,
  },
  actionButtonTextDark: {
    color: Colors.primary,
  },
  cartFooter: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    maxHeight: 320,
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
  cartTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  cartTotal: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
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
    borderTopColor: Colors.border,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  cartItemPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center' as const,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
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
  },
  reviewCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  reviewUserName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  reviewComment: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    lineHeight: 20,
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
    marginBottom: 16,
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
  leaveReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  leaveReviewText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  cartIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 24,
    height: 24,
  },
  emptyLogo: {
    width: 60,
    height: 60,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: 32,
  },
  orderModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  orderModalContent: {
    backgroundColor: '#1A0505',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    overflow: 'hidden',
    borderTopWidth: 3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.gold,
  },
  orderModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.gold,
  },
  orderModalTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.gold,
    letterSpacing: -0.3,
  },
  orderModalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  emptyOrderState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    minHeight: 500,
    backgroundColor: Colors.primary,
  },
  chefAnimationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  glowPulse: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  chefCharacterNew: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  chefHatWrapper: {
    marginBottom: -25,
    zIndex: 3,
  },
  chefHatEmoji: {
    fontSize: 80,
  },
  chefBodyWrapper: {
    alignItems: 'center',
  },
  chefBodyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(254, 232, 200, 0.98)',
    borderWidth: 3,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  chefFaceNew: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chefEyesNew: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 10,
  },
  chefEyeNew: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: '#2D0000',
  },
  chefMouthNew: {
    width: 36,
    height: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: '#2D0000',
    backgroundColor: 'transparent',
  },
  floatingPlateNew: {
    position: 'absolute',
    top: 140,
    right: 20,
  },
  plateEmojiNew: {
    fontSize: 48,
  },
  emptyOrderTextContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyOrderTitleNew: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.gold,
    marginBottom: 12,
    textAlign: 'center' as const,
    letterSpacing: -0.8,
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  emptyOrderSubtitleNew: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center' as const,
    lineHeight: 22,
    maxWidth: 280,
  },
  sparklesContainerNew: {
    flexDirection: 'row',
    gap: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleNew: {
    fontSize: 28,
  },
  orderModalItems: {
    maxHeight: 350,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.primary,
  },
  orderModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
  },
  orderModalItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderModalItemName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  orderModalItemPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.gold,
  },
  orderModalFooter: {
    padding: 20,
    backgroundColor: Colors.primary,
    borderTopWidth: 2,
    borderTopColor: Colors.gold,
  },
  orderModalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  orderModalTotalLabel: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.cream,
    letterSpacing: -0.2,
  },
  orderModalTotalValue: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: -0.8,
  },
  orderModalSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  orderModalSubmitText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  statusToast: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: Colors.gold,
    zIndex: 1000,
  },
  statusToastText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
});

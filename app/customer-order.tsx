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
  const categoryScrollViewRef = useRef<ScrollView>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const menuItemsOpacity = useRef(new Animated.Value(1)).current;
  
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
  const chefAnimScale = useRef(new Animated.Value(1)).current;
  const chefAnimRotate = useRef(new Animated.Value(0)).current;
  const plateAnimY = useRef(new Animated.Value(0)).current;

  const menuQuery = trpc.menu.getAll.useQuery();
  
  const menuData = menuQuery.data && menuQuery.data.length > 0 ? menuQuery.data : MENU_ITEMS;
  
  const mockReviews: Review[] = [
    { id: '1', userName: 'Ahmed K.', rating: 5, comment: 'Absolutely delicious! The best kebab I\'ve ever had.', date: '2024-01-15', menuItemId: '7' },
    { id: '2', userName: 'Sara M.', rating: 4, comment: 'Great biryani, very flavorful and aromatic.', date: '2024-01-14', menuItemId: '11' },
    { id: '3', userName: 'Omar H.', rating: 5, comment: 'The dolma is just like my grandmother used to make!', date: '2024-01-13', menuItemId: '1' },
    { id: '4', userName: 'Layla S.', rating: 5, comment: 'Best kunafa in town, perfectly sweet and crispy.', date: '2024-01-12', menuItemId: '22' },
    { id: '5', userName: 'Khalid R.', rating: 4, comment: 'Mixed grill was excellent, generous portions.', date: '2024-01-11', menuItemId: '10' },
  ];

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
    const imageIds: Record<string, string> = {
      appetizers: '1546069901-120a39972937',
      soups: '1547592166-23ac45744acd',
      salads: '1512621776951-5a09ec56c8f7',
      kebabs: '1529692236671-f1f6cf9683ba',
      'rice-dishes': '1516714435131-44d6b64dc6a2',
      stews: '1543352632-5a4b7d4c7b5a',
      seafood: '1559847844-5315695dadae',
      breads: '1509440159596-0249088772ff',
      desserts: '1551024506-0bccd828d307',
      drinks: '1514933651356-89db8e11e23f',
      shisha: '1534422298391-304a23b3c7e6',
      'hot-drinks': '1543007630-9710e4a00a1c',
    };
    return imageIds[category] || '1546069901-120a39972937';
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
    let currentIndex = 0;
    const scrollToNextCategory = () => {
      if (!categoryScrollViewRef.current) return;
      
      currentIndex = (currentIndex + 1) % categories.length;
      const scrollPosition = currentIndex * 140;
      
      categoryScrollViewRef.current.scrollTo({ 
        x: scrollPosition, 
        animated: true 
      });
    };

    autoScrollInterval.current = setInterval(scrollToNextCategory, 2500);

    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [categories.length]);

  useEffect(() => {
    if (orderModalVisible && cart.length === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(chefAnimScale, {
              toValue: 1.08,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(chefAnimRotate, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(chefAnimScale, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(chefAnimRotate, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(plateAnimY, {
            toValue: -12,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(plateAnimY, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      chefAnimScale.stopAnimation();
      chefAnimRotate.stopAnimation();
      plateAnimY.stopAnimation();
    }
  }, [orderModalVisible, cart.length, chefAnimScale, chefAnimRotate, plateAnimY]);

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
            if (autoScrollInterval.current) {
              clearInterval(autoScrollInterval.current);
            }
          }}
          onMomentumScrollEnd={() => {
            let currentIndex = 0;
            const scrollToNextCategory = () => {
              if (!categoryScrollViewRef.current) return;
              currentIndex = (currentIndex + 1) % categories.length;
              const scrollPosition = currentIndex * 140;
              categoryScrollViewRef.current.scrollTo({ 
                x: scrollPosition, 
                animated: true 
              });
            };
            autoScrollInterval.current = setInterval(scrollToNextCategory, 2500);
          }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
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
          ))}
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
                const itemReviews = mockReviews.filter(r => r.menuItemId === item.id);
                const avgRating = itemReviews.length > 0 
                  ? itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length 
                  : 0;
                
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
                            {avgRating > 0 && (
                              <View style={styles.ratingBadge}>
                                <Star size={12} color="#fff" fill="#fff" />
                                <Text style={styles.ratingText}>{avgRating.toFixed(1)}</Text>
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
                            <TouchableOpacity
                              style={styles.addButton}
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
                        </Animated.View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
            
            {mockReviews.length > 0 && (
              <View style={styles.reviewsSection}>
                <Text style={styles.reviewsTitle}>Customer Reviews</Text>
                {mockReviews.slice(0, 3).map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewUserInfo}>
                        <View style={styles.reviewAvatar}>
                          <Text style={styles.reviewAvatarText}>{review.userName[0]}</Text>
                        </View>
                        <View>
                          <Text style={styles.reviewUserName}>{review.userName}</Text>
                          <View style={styles.reviewStars}>
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={14} 
                                color={i < review.rating ? Colors.gold : Colors.border}
                                fill={i < review.rating ? Colors.gold : 'transparent'}
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                      <Text style={styles.reviewDate}>
                        {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.bottomActionsBar}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleReviews}
          activeOpacity={1}
        >
          <Animated.View style={[styles.actionButtonInner, { transform: [{ scale: buttonScales.reviews }] }]}>
            <Star size={20} color={Colors.gold} strokeWidth={2.5} />
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
                <Bell size={20} color={Colors.cream} strokeWidth={2.5} />
                <Text style={[styles.actionButtonText, styles.actionButtonTextLight]}>Call Waiter</Text>
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
            <Utensils size={20} color={Colors.primary} strokeWidth={2.5} />
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
                <Receipt size={20} color={Colors.cream} strokeWidth={2.5} />
                <Text style={[styles.actionButtonText, styles.actionButtonTextLight]}>Request Bill</Text>
              </>
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>

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
                <View style={styles.circularGlowBackground}>
                  <View style={[styles.circularGlowRing, styles.glowRing1]} />
                  <View style={[styles.circularGlowRing, styles.glowRing2]} />
                  <View style={[styles.circularGlowRing, styles.glowRing3]} />
                </View>

                <Animated.View
                  style={[
                    styles.chefCharacter,
                    {
                      transform: [
                        { scale: chefAnimScale },
                        {
                          rotate: chefAnimRotate.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '5deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.chefHead}>
                    <View style={styles.chefHat}>
                      <ChefHat size={80} color={Colors.gold} strokeWidth={1.5} />
                    </View>
                    <View style={styles.chefFace}>
                      <View style={styles.chefEyesContainer}>
                        <View style={styles.chefEye}>
                          <View style={styles.chefPupil} />
                        </View>
                        <View style={styles.chefEye}>
                          <View style={styles.chefPupil} />
                        </View>
                      </View>
                      <View style={styles.chefSmile} />
                    </View>
                  </View>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.floatingPlate,
                    { transform: [{ translateY: plateAnimY }] },
                  ]}
                >
                  <Text style={styles.plateEmoji}>🍽️</Text>
                </Animated.View>

                <Text style={styles.emptyOrderTitle}>Waiting on your order!</Text>
                <Text style={styles.emptyOrderSubtitle}>
                  Browse our delicious menu and start adding items
                </Text>

                <View style={styles.sparklesContainer}>
                  <Text style={styles.sparkle}>✨</Text>
                  <Text style={styles.sparkle}>✨</Text>
                  <Text style={styles.sparkle}>✨</Text>
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
    paddingBottom: 220,
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
    padding: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
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
    marginBottom: 8,
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
  menuInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  menuName: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  menuDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  menuPrice: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomActionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 10,
    paddingBottom: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
    gap: 6,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
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
    fontWeight: '700' as const,
    color: Colors.cream,
    textAlign: 'center' as const,
    letterSpacing: -0.2,
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  orderModalContent: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  orderModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  orderModalTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: -0.5,
  },
  orderModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyOrderState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    minHeight: 500,
  },
  circularGlowBackground: {
    position: 'absolute',
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    top: 80,
  },
  circularGlowRing: {
    position: 'absolute',
    borderRadius: 200,
    borderWidth: 1.5,
  },
  glowRing1: {
    width: 280,
    height: 280,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  glowRing2: {
    width: 220,
    height: 220,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  glowRing3: {
    width: 160,
    height: 160,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  chefCharacter: {
    alignItems: 'center',
    zIndex: 2,
    marginBottom: 40,
  },
  chefHead: {
    alignItems: 'center',
  },
  chefHat: {
    marginBottom: -12,
  },
  chefFace: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FEE8C8',
    borderWidth: 3,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chefEyesContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 8,
  },
  chefEye: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chefPupil: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3D0101',
  },
  chefSmile: {
    width: 30,
    height: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: '#3D0101',
    backgroundColor: 'transparent',
  },
  floatingPlate: {
    position: 'absolute',
    bottom: 140,
    right: 40,
  },
  plateEmoji: {
    fontSize: 48,
  },
  emptyOrderTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.gold,
    marginBottom: 12,
    textAlign: 'center' as const,
    letterSpacing: -0.5,
  },
  emptyOrderSubtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 32,
  },
  sparklesContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  sparkle: {
    fontSize: 24,
  },
  orderModalItems: {
    maxHeight: 400,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  orderModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  orderModalItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  orderModalItemName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  orderModalItemPrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.gold,
  },
  orderModalFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  orderModalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  orderModalTotalLabel: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  orderModalTotalValue: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: Colors.gold,
    letterSpacing: -0.5,
  },
  orderModalSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.gold,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  orderModalSubmitText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.primary,
    letterSpacing: 0.5,
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

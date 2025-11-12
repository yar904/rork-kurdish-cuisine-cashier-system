import React, { useState, useRef, useEffect } from 'react';
import { ImageBackground } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Globe, UtensilsCrossed, Plus, Minus, X, Send, Star, Utensils, ArrowLeft, Search, ChefHat, Menu as MenuIcon, Utensils as UtensilsIcon, Receipt } from 'lucide-react-native';
import Svg, { Path, Circle, Ellipse, Defs, Pattern, Rect, G } from 'react-native-svg';

import { MENU_ITEMS } from '@/constants/menu';
import { MenuCategory, MenuItem } from '@/types/restaurant';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/constants/i18n';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useTables } from '@/contexts/TableContext';
import { formatPrice } from '@/constants/currency';

import { trpc } from '@/lib/trpc';

export default function PublicMenuScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { language, setLanguage, t, tc } = useLanguage();
  const { addItemToCurrentOrder, currentOrder, submitOrder, updateItemQuantity: updateCartQuantity, removeItemFromCurrentOrder, calculateTotal, selectedTable, setSelectedTable } = useRestaurant();
  const { tables } = useTables();
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalNotes, setModalNotes] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);


  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingItem, setRatingItem] = useState<MenuItem | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const contentScrollRef = useRef<ScrollView>(null);
  const categoryScrollRef = useRef<ScrollView>(null);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const categoryScrollX = useRef(new Animated.Value(0)).current;
  const fabSlideAnimation = useRef(new Animated.Value(0)).current;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showWaiterToast, setShowWaiterToast] = useState(false);
  const waiterToastOpacity = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (params.table) {
      const tableNum = parseInt(params.table as string);
      if (!isNaN(tableNum) && tableNum !== selectedTable) {
        setSelectedTable(tableNum);
        console.log(`Auto-detected table ${tableNum} from QR code scan`);
      }
    }
  }, [params.table, setSelectedTable, selectedTable]);

  useEffect(() => {
    Animated.spring(fabSlideAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [fabSlideAnimation]);

  const handleCategoryPress = (categoryId: string, index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setSelectedCategory(categoryId);
    
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollTo({
        x: index * 148 - 20,
        y: 0,
        animated: true,
      });
    }

    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web' && categories.length > 0) {
      scrollIntervalRef.current = setInterval(() => {
        setCurrentCategoryIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % categories.length;
          if (categoryScrollRef.current) {
            categoryScrollRef.current.scrollTo({
              x: nextIndex * 148,
              y: 0,
              animated: true,
            });
          }
          return nextIndex;
        });
      }, 3500);

      return () => {
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
        }
      };
    }
  }, []);

  const handleOpenItemModal = (item: MenuItem) => {
    setSelectedItem(item);
    setModalQuantity(1);
    setModalNotes('');
  };

  const handleCloseItemModal = () => {
    setSelectedItem(null);
    setModalQuantity(1);
    setModalNotes('');
  };

  const handleAddToCartFromModal = () => {
    if (selectedItem) {
      addItemToCurrentOrder(selectedItem.id, modalQuantity, modalNotes || undefined);
      Alert.alert(t('success'), t('itemAddedToCart'));
      handleCloseItemModal();
    }
  };

  const updateModalQuantity = (delta: number) => {
    setModalQuantity(prev => Math.max(1, prev + delta));
  };

  const handleSubmitOrder = () => {
    if (currentOrder.length === 0) {
      Alert.alert(t('emptyCart'), t('pleaseAddItems'));
      return;
    }

    if (!selectedTable) {
      Alert.alert(t('selectTable'), t('pleaseSelectTableFirst'));
      return;
    }

    Alert.alert(
      t('submitOrder'),
      `${t('submitOrderConfirm')} ${selectedTable}?\n${t('total')}: ${formatPrice(calculateTotal(currentOrder))}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('submit'),
          style: 'default',
          onPress: async () => {
            const result = await submitOrder();
            setShowCart(false);
            if (result?.orderId) {
              router.push({
                pathname: '/order-tracking',
                params: {
                  orderId: result.orderId,
                  tableNumber: selectedTable?.toString() || '',
                  total: calculateTotal(currentOrder).toString(),
                },
              });
            } else {
              Alert.alert(
                t('success'),
                t('orderSubmittedSuccess'),
                [{ text: 'OK', style: 'default' }]
              );
            }
          },
        },
      ]
    );
  };

  const cartItemCount = currentOrder.reduce((sum, item) => sum + item.quantity, 0);

  const ratingsStatsQuery = trpc.ratings.getAllStats.useQuery();
  const ratingsStats = ratingsStatsQuery.data || {};

  const itemRatingsQuery = trpc.ratings.getByMenuItem.useQuery(
    { menuItemId: selectedItem?.id || '' },
    { enabled: !!selectedItem?.id }
  );

  const createRatingMutation = trpc.ratings.create.useMutation({
    onSuccess: () => {
      Alert.alert(t('success'), t('ratingSubmitted'));
      setShowRatingModal(false);
      setRatingItem(null);
      setUserRating(0);
      setRatingComment('');
      ratingsStatsQuery.refetch();
      if (selectedItem?.id) {
        itemRatingsQuery.refetch();
      }
    },
    onError: () => {
      Alert.alert(t('error'), t('failedToSubmitRequest'));
    },
  });

  const handleSubmitRating = () => {
    if (!ratingItem || !selectedTable) {
      Alert.alert(t('error'), t('pleaseSelectTableFirst'));
      return;
    }

    if (userRating === 0) {
      Alert.alert(t('error'), 'Please select a rating');
      return;
    }

    createRatingMutation.mutate({
      menuItemId: ratingItem.id,
      tableNumber: selectedTable,
      rating: userRating,
      comment: ratingComment || undefined,
    });
  };

  const createServiceRequestMutation = trpc.serviceRequests.create.useMutation({
    onSuccess: () => {
      setShowWaiterToast(true);
      Animated.sequence([
        Animated.timing(waiterToastOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(waiterToastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowWaiterToast(false));
    },
    onError: () => {
      Alert.alert(t('error'), t('failedToSubmitRequest'));
    },
  });

  const handleCallWaiter = () => {
    if (!selectedTable) {
      Alert.alert(t('error'), t('pleaseSelectTableFirst'));
      return;
    }

    createServiceRequestMutation.mutate({
      tableNumber: selectedTable,
      requestType: 'waiter',
      message: 'Customer requesting assistance',
    });
  };

  const handleRequestBill = () => {
    if (!selectedTable) {
      Alert.alert(t('error'), t('pleaseSelectTableFirst'));
      return;
    }

    createServiceRequestMutation.mutate({
      tableNumber: selectedTable,
      requestType: 'bill',
      message: 'Customer requesting bill',
    });
  };

  const handleScrollToCategories = () => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const availableCategories = categories.filter((category) => {
    const categoryItems = MENU_ITEMS.filter(item => item.category === category.id && item.available);
    return categoryItems.length > 0;
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

  const renderMenuItem = (item: typeof MENU_ITEMS[0]) => {
    const isPremium = item.price > 25000;
    const itemStats = ratingsStats[item.id];
    const hasRatings = itemStats && itemStats.totalRatings > 0;
    
    return (
      <View 
        key={item.id} 
        style={[styles.menuItemCardHorizontal, isPremium && styles.premiumCard]}
      >
        <TouchableOpacity
          style={styles.menuItemTouchable}
          activeOpacity={0.95}
          onPress={() => handleOpenItemModal(item as MenuItem)}
        >
          <View style={styles.menuItemContentHorizontal}>
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
              </View>
            )}
            
            <Text style={styles.menuItemNameHorizontal} numberOfLines={2}>
              {getItemName(item)}
            </Text>
            
            <View style={styles.priceHighlight}>
              <Text style={styles.menuItemPriceHorizontal}>{formatPrice(item.price)}</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.rateButtonOnCard}
          onPress={(e: any) => {
            setRatingItem(item);
            setUserRating(0);
            setRatingComment('');
            setShowRatingModal(true);
          }}
          activeOpacity={0.7}
        >
          <Star size={18} color="#D4AF37" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    );
  };

  const filteredItems = MENU_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      getItemName(item).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getItemDescription(item).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

  const renderAllCategories = () => {
    return availableCategories.map((category) => {
      if (category.id === 'all') return null;
      
      const categoryItems = filteredItems.filter((item) => item.category === category.id);

      if (categoryItems.length === 0) return null;

      const categoryName = language === 'ku' ? category.nameKu : language === 'ar' ? category.nameAr : category.nameEn;

      return (
        <View key={category.id} style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <View style={styles.categoryTitleContainer}>
              <View style={styles.categoryDecorLeft} />
              <Text style={styles.categoryTitle}>{categoryName}</Text>
              <View style={styles.categoryDecorRight} />
            </View>
          </View>
          <View style={styles.categoryItemsGrid}>
            {categoryItems.map(renderMenuItem)}
          </View>
        </View>
      );
    });
  };

  return (
    <ImageBackground
      source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pfi2xp2ednotg7b5lw52y' }}
      style={styles.container}
      resizeMode="cover"
    >

      <Stack.Screen options={{ headerShown: false }} />



      <Modal
        visible={showCart}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCart(false)}
      >
        <View style={[styles.cartContainer, { paddingTop: insets.top }]}>
          <View style={styles.cartHeader}>
            <TouchableOpacity onPress={() => setShowCart(false)}>
              <X size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.cartTitle}>{t('yourOrder')}</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.cartItems}>
            {currentOrder.length === 0 ? (
              <View style={styles.emptyCart}>
                <View style={styles.emptyCartIconContainer}>
                  <View style={styles.emptyCartIconInner}>
                    <Svg width="140" height="140" viewBox="0 0 200 200" fill="none">
                      <Circle cx="100" cy="100" r="70" fill="#2A0A0A" opacity="0.4" />
                      <Circle cx="100" cy="100" r="65" stroke="#D4AF37" strokeWidth="1.5" opacity="0.5" />
                      
                      <Path
                        d="M 100 55 L 75 65 L 75 75 Q 75 100 85 105 L 85 140"
                        stroke="#D4AF37"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      
                      <Path
                        d="M 100 55 L 125 65 L 125 75 Q 125 100 115 105 L 115 140"
                        stroke="#D4AF37"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      
                      <Path
                        d="M 70 140 Q 100 150 130 140"
                        stroke="#D4AF37"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                      />
                      
                      <Ellipse
                        cx="100"
                        cy="115"
                        rx="32"
                        ry="28"
                        fill="none"
                        stroke="#D4AF37"
                        strokeWidth="2.5"
                      />
                      
                      <Circle cx="92" cy="108" r="3" fill="#D4AF37" />
                      <Circle cx="108" cy="108" r="3" fill="#D4AF37" />
                      
                      <Path
                        d="M 88 122 Q 100 128 112 122"
                        stroke="#D4AF37"
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="none"
                      />
                      
                      <Path
                        d="M 70 55 L 65 50 Q 60 45 60 40 Q 60 35 65 32 L 135 32 Q 140 35 140 40 Q 140 45 135 50 L 130 55 Z"
                        fill="#D4AF37"
                        opacity="0.7"
                      />
                      <Ellipse
                        cx="100"
                        cy="55"
                        rx="35"
                        ry="12"
                        fill="#D4AF37"
                        opacity="0.5"
                      />
                      <Circle cx="100" cy="40" r="4" fill="#FFFDD0" />
                    </Svg>
                  </View>
                </View>
                <Text style={styles.emptyCartText}>{t('noItemsInOrder')}</Text>
                <Text style={styles.emptyCartSubtext}>
                  {language === 'en' ? 'Start adding items to your order' : language === 'ku' ? 'دەست بکە بە زیادکردنی بڕگەکان بۆ داواکاریت' : 'ابدأ بإضافة العناصر إلى طلبك'}
                </Text>
              </View>
            ) : (
              currentOrder.map((item, index) => (
                <View key={index} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{getItemName(item.menuItem)}</Text>
                    {item.notes && (
                      <Text style={styles.cartItemNotes}>{t('note')}: {item.notes}</Text>
                    )}
                    <Text style={styles.cartItemPrice}>
                      {formatPrice(item.menuItem.price)} × {item.quantity} = {formatPrice(item.menuItem.price * item.quantity)}
                    </Text>
                  </View>
                  <View style={styles.cartItemControls}>
                    <TouchableOpacity
                      style={styles.cartQuantityButton}
                      onPress={() => updateCartQuantity(index, item.quantity - 1)}
                    >
                      <Minus size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.cartQuantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.cartQuantityButton}
                      onPress={() => updateCartQuantity(index, item.quantity + 1)}
                    >
                      <Plus size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cartDeleteButton}
                      onPress={() => removeItemFromCurrentOrder(index)}
                    >
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.cartFooter}>
            {selectedTable && (
              <View style={styles.tableInfo}>
                <Text style={styles.tableInfoText}>{t('table')}: {selectedTable}</Text>
              </View>
            )}
            {!selectedTable && (
              <View style={styles.selectTableButton}>
                <Text style={styles.selectTableButtonText}>{t('pleaseScannQRCode')}</Text>
              </View>
            )}
            <View style={styles.cartTotal}>
              <Text style={styles.cartTotalLabel}>{t('total')}:</Text>
              <Text style={styles.cartTotalAmount}>{formatPrice(calculateTotal(currentOrder))}</Text>
            </View>
            <TouchableOpacity
              style={[styles.cartSubmitButton, currentOrder.length === 0 && styles.cartSubmitButtonDisabled]}
              onPress={handleSubmitOrder}
              disabled={currentOrder.length === 0}
            >
              <Send size={20} color="#fff" />
              <Text style={styles.cartSubmitButtonText}>{t('submitOrder')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>







      <Modal
        visible={!!selectedItem}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseItemModal}
      >
        <View style={styles.itemModalOverlay}>
          <View style={styles.itemModalContent}>
            <TouchableOpacity 
              style={styles.itemModalCloseButton}
              onPress={handleCloseItemModal}
              activeOpacity={0.8}
            >
              <X size={20} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>

            {selectedItem && (
              <>
                {selectedItem.image && (
                  <Image 
                    source={{ uri: selectedItem.image }} 
                    style={styles.itemModalImage}
                    resizeMode="cover"
                  />
                )}
                
                <View style={styles.itemModalBody}>
                  <Text style={styles.itemModalTitle}>
                    {getItemName(selectedItem)}
                  </Text>
                  
                  <Text style={styles.itemModalDescription} numberOfLines={2}>
                    {getItemDescription(selectedItem)}
                  </Text>

                  {itemRatingsQuery.data && itemRatingsQuery.data.totalRatings > 0 && (
                    <View style={styles.modalReviewsSection}>
                      <View style={styles.modalReviewsHeader}>
                        <Star size={16} color="#D4AF37" fill="#D4AF37" />
                        <Text style={styles.modalReviewsRating}>
                          {itemRatingsQuery.data.averageRating.toFixed(1)}
                        </Text>
                        <Text style={styles.modalReviewsCount}>
                          ({itemRatingsQuery.data.totalRatings} {language === 'en' ? 'reviews' : language === 'ku' ? 'هەڵسەنگاندن' : 'تقييم'})
                        </Text>
                      </View>

                      <ScrollView 
                        style={styles.modalReviewsList}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                      >
                        {itemRatingsQuery.data.ratings.map((review: any) => (
                          <View key={review.id} style={styles.modalReviewCard}>
                            <View style={styles.modalReviewStars}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={14}
                                  color="#D4AF37"
                                  fill={star <= review.rating ? '#D4AF37' : 'transparent'}
                                  strokeWidth={1.5}
                                />
                              ))}
                              <Text style={styles.modalReviewDate}>
                                {new Date(review.created_at).toLocaleDateString(language === 'en' ? 'en-US' : language === 'ku' ? 'ku-IQ' : 'ar-IQ', { month: 'short', day: 'numeric' })}
                              </Text>
                            </View>
                            {review.comment && (
                              <Text style={styles.modalReviewComment}>
                                {review.comment}
                              </Text>
                            )}
                          </View>
                        ))}
                      </ScrollView>

                      <TouchableOpacity
                        style={styles.modalRateThisDishButton}
                        onPress={() => {
                          setRatingItem(selectedItem);
                          setUserRating(0);
                          setRatingComment('');
                          setShowRatingModal(true);
                          handleCloseItemModal();
                        }}
                        activeOpacity={0.7}
                      >
                        <Star size={16} color="#D4AF37" strokeWidth={2} />
                        <Text style={styles.modalRateThisDishButtonText}>
                          {language === 'en' ? 'Rate this dish' : language === 'ku' ? 'هەڵسەنگاندنی ئەم خواردنە' : 'قيم هذا الطبق'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.itemModalQuantitySection}>
                    <Text style={styles.itemModalQuantityLabel}>{t('quantity')}:</Text>
                    <View style={styles.itemModalQuantityControls}>
                      <TouchableOpacity
                        style={styles.itemModalQuantityButton}
                        onPress={() => updateModalQuantity(-1)}
                      >
                        <Minus size={18} color="#3d0101" strokeWidth={3} />
                      </TouchableOpacity>
                      <Text style={styles.itemModalQuantityValue}>{modalQuantity}</Text>
                      <TouchableOpacity
                        style={styles.itemModalQuantityButton}
                        onPress={() => updateModalQuantity(1)}
                      >
                        <Plus size={18} color="#3d0101" strokeWidth={3} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TextInput
                    style={styles.itemModalNotesInput}
                    placeholder={t('anySpecialRequirements')}
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={modalNotes}
                    onChangeText={setModalNotes}
                    multiline
                    numberOfLines={2}
                  />

                  <TouchableOpacity
                    style={styles.itemModalAddButton}
                    onPress={handleAddToCartFromModal}
                  >
                    <Utensils size={20} color="#3d0101" strokeWidth={2.5} />
                    <Text style={styles.itemModalAddButtonText}>
                      {t('addToCart')} - {formatPrice(selectedItem.price * modalQuantity)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowRatingModal(false)}
              activeOpacity={0.8}
            >
              <X size={22} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>

            <Text style={styles.ratingModalTitle}>
              {ratingItem ? t('rateThisDish') : (language === 'en' ? 'All Reviews' : language === 'ku' ? 'هەموو هەڵسەنگاندنەکان' : 'جميع التقييمات')}
            </Text>
            {ratingItem && (
              <Text style={styles.ratingModalItemName}>{getItemName(ratingItem)}</Text>
            )}
            
            {!ratingItem && (
              <ScrollView style={styles.reviewsList} showsVerticalScrollIndicator={false}>
                {Object.entries(ratingsStats).map(([itemId, stats]) => {
                  const menuItem = MENU_ITEMS.find(item => item.id === itemId);
                  if (!menuItem || stats.totalRatings === 0) return null;
                  
                  return (
                    <TouchableOpacity
                      key={itemId}
                      style={styles.reviewItem}
                      onPress={() => {
                        setRatingItem(menuItem);
                        setUserRating(0);
                        setRatingComment('');
                      }}
                    >
                      <View style={styles.reviewItemHeader}>
                        <Text style={styles.reviewItemName} numberOfLines={1}>{getItemName(menuItem)}</Text>
                        <View style={styles.reviewItemRating}>
                          <Star size={16} color="#D4AF37" fill="#D4AF37" />
                          <Text style={styles.reviewItemRatingText}>{stats.averageRating.toFixed(1)}</Text>
                        </View>
                      </View>
                      <Text style={styles.reviewItemCount}>
                        {stats.totalRatings} {language === 'en' ? 'reviews' : language === 'ku' ? 'هەڵسەنگاندن' : 'تقييم'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                
                {Object.keys(ratingsStats).length === 0 && (
                  <View style={styles.noReviewsContainer}>
                    <Star size={48} color="rgba(212, 175, 55, 0.3)" />
                    <Text style={styles.noReviewsText}>
                      {language === 'en' ? 'No reviews yet' : language === 'ku' ? 'هێشتا هەڵسەنگاندن نییە' : 'لا توجد تقييمات بعد'}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            {ratingItem && (
              <View style={styles.starRatingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setUserRating(star)}
                  style={styles.starButton}
                >
                  <Star
                    size={40}
                    color="#D4AF37"
                    fill={star <= userRating ? "#D4AF37" : "transparent"}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              ))}
              </View>
            )}

            {ratingItem && <Text style={styles.ratingModalLabel}>{t('addReview')}</Text>}
            {ratingItem && (
              <>
                <TextInput
                  style={styles.ratingInput}
                  placeholder={t('reviewOptional')}
                  placeholderTextColor="rgba(26, 26, 26, 0.4)"
                  value={ratingComment}
                  onChangeText={setRatingComment}
                  multiline
                  numberOfLines={4}
                />

                <TouchableOpacity
                  style={[styles.submitRatingButton, (userRating === 0 || createRatingMutation.isPending) && styles.submitRatingButtonDisabled]}
                  onPress={handleSubmitRating}
                  disabled={userRating === 0 || createRatingMutation.isPending}
                >
                  <Star size={20} color="#fff" fill="#fff" />
                  <Text style={styles.submitRatingButtonText}>
                    {createRatingMutation.isPending ? t('submitting') : t('submitRating')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      
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
          
          <View style={styles.headerTableBadge}>
            <UtensilsIcon size={18} color="#D4AF37" strokeWidth={2} />
            {selectedTable && (
              <Text style={styles.headerTableBadgeText}>{selectedTable}</Text>
            )}
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


      <Animated.ScrollView 
        ref={categoryScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryImageScrollContainer}
        contentContainerStyle={styles.categoryImageScrollContent}
        pagingEnabled={false}
        snapToInterval={Platform.OS !== 'web' ? 148 : undefined}
        snapToAlignment="center"
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: categoryScrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {categories.map((category, index) => {
          const categoryName = language === 'ku' ? category.nameKu : language === 'ar' ? category.nameAr : category.nameEn;
          const isActive = selectedCategory === category.id;
          
          const inputRange = [
            (index - 1) * 148,
            index * 148,
            (index + 1) * 148,
          ];
          
          const scale = categoryScrollX.interpolate({
            inputRange,
            outputRange: [0.92, 1.05, 0.92],
            extrapolate: 'clamp',
          });
          
          const opacity = categoryScrollX.interpolate({
            inputRange,
            outputRange: [0.7, 1, 0.7],
            extrapolate: 'clamp',
          });
          
          return (
            <TouchableOpacity
              key={category.id}
              activeOpacity={0.85}
              onPress={() => handleCategoryPress(category.id, index)}
            >
              <Animated.View
                style={[
                  styles.categoryImageCard,
                  isActive && styles.categoryImageCardActive,
                  {
                    transform: [{ scale }],
                    opacity,
                  },
                ]}
              >
                <Image
                  source={{ uri: category.image }}
                  style={styles.categoryImage}
                  resizeMode="cover"
                />
                <View style={styles.categoryImageOverlay} />
                {isActive && (
                  <View style={styles.activeCategoryIndicator}>
                    <View style={styles.activeCategoryPulse} />
                  </View>
                )}
                <View style={styles.categoryImageTextContainer}>
                  <Text style={[
                    styles.categoryImageText,
                    isActive && styles.categoryImageTextActive,
                  ]}>
                    {categoryName}
                  </Text>
                </View>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </Animated.ScrollView>

      {showWaiterToast && (
        <Animated.View 
          style={[
            styles.waiterToast,
            {
              opacity: waiterToastOpacity,
              transform: [
                {
                  translateY: waiterToastOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ChefHat size={20} color="#D4AF37" strokeWidth={2} />
          <Text style={styles.waiterToastText}>
            {language === 'en' 
              ? (createServiceRequestMutation.variables?.requestType === 'bill' 
                ? 'Bill request sent 💳' 
                : 'Waiter has been notified 🍷')
              : language === 'ku' 
              ? (createServiceRequestMutation.variables?.requestType === 'bill'
                ? 'داواکاری حیساب نێردرا 💳'
                : 'گارسۆن ئاگادار کرایەوە 🍷')
              : (createServiceRequestMutation.variables?.requestType === 'bill'
                ? 'تم إرسال طلب الفاتورة 💳'
                : 'تم إعلام النادل 🍷')}
          </Text>
        </Animated.View>
      )}

      <ScrollView 
        ref={contentScrollRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.citadelPattern}>
          <View style={styles.citadelSilhouette}>
            <Text style={styles.citadelText}>🏰</Text>
          </View>
        </View>
        
        <View style={styles.menuSections}>
          {renderAllCategories()}
        </View>

        {availableCategories.length === 0 && (
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
          <Text style={styles.footerTitle}>تەپسی سلێمانی</Text>
          <View style={styles.footerDivider} />
          
          <Text style={styles.footerText}>
            {language === 'en' ? 'Thank you for dining with us' : language === 'ku' ? 'سوپاس بۆ خواردنتان لەگەڵمان' : 'شكراً لتناولكم الطعام معنا'}
          </Text>
        </View>
      </ScrollView>

      <Animated.View
        style={[
          styles.floatingMenu,
          {
            transform: [
              {
                translateY: fabSlideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
            opacity: fabSlideAnimation,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.open('https://www.google.com/search?q=Tapsi+Sulaymaniyah+reviews', '_blank');
            } else {
              Alert.alert(
                language === 'en' ? 'Google Reviews' : language === 'ku' ? 'هەڵسەنگاندنی گووگڵ' : 'مراجعات جوجل',
                language === 'en' ? 'Please visit our Google page to leave a review' : language === 'ku' ? 'تکایە سەردانی پەڕەی گووگڵمان بکە بۆ هێشتنەوەی هەڵسەنگاندن' : 'يرجى زيارة صفحتنا على جوجل لترك تقييم'
              );
            }
          }}
          activeOpacity={0.7}
        >
          <Animated.View style={styles.fabIconContainer}>
            <Star size={22} color="#FFFFFF" strokeWidth={2} />
          </Animated.View>
          <Text style={styles.fabLabel}>
            {language === 'en' ? 'Reviews' : language === 'ku' ? 'هەڵسەنگاندن' : 'التقييمات'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleCallWaiter}
          activeOpacity={0.7}
        >
          <Animated.View style={styles.fabIconContainer}>
            <ChefHat size={22} color="#FFFFFF" strokeWidth={2} />
          </Animated.View>
          <Text style={styles.fabLabel}>
            {language === 'en' ? 'Call Waiter' : language === 'ku' ? 'بانگهێشتی گارسۆن' : 'اتصل بالنادل'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fabButton, styles.fabButtonPrimary]}
          onPress={() => setShowCart(true)}
          activeOpacity={0.7}
        >
          <Animated.View style={styles.fabIconContainer}>
            <UtensilsCrossed size={22} color="#3d0101" strokeWidth={2} />
            {cartItemCount > 0 && (
              <View style={styles.fabCartBadge}>
                <Text style={styles.fabCartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </Animated.View>
          <Text style={[styles.fabLabel, styles.fabLabelPrimary]}>
            {language === 'en' ? 'My Order' : language === 'ku' ? 'داواکاریم' : 'طلبي'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleRequestBill}
          activeOpacity={0.7}
        >
          <Animated.View style={styles.fabIconContainer}>
            <Receipt size={22} color="#FFFFFF" strokeWidth={2} />
          </Animated.View>
          <Text style={styles.fabLabel}>
            {language === 'en' ? 'Request Bill' : language === 'ku' ? 'داواکردنی حیساب' : 'طلب الفاتورة'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0000',
    position: 'relative' as const,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    backgroundColor: 'transparent',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(61, 1, 1, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    minWidth: 60,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
      },
    }),
  },
  headerTableBadgeText: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#D4AF37',
    fontWeight: '700' as const,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
  headerLogoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  headerLogo: {
    width: 65,
    height: 65,
    ...Platform.select({
      web: {
        width: 75,
        height: 75,
      },
    }),
  },
  headerSecondBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(61, 1, 1, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    gap: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 3px 12px rgba(212, 175, 55, 0.3)',
      },
    }),
  },
  headerSecondBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  headerSecondBarDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  headerTableNumber: {
    fontSize: 13,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#D4AF37',
    marginLeft: 4,
    fontWeight: '700' as const,
  },
  menuButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(61, 1, 1, 0.7)',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
  },
  menuButton: {
    flex: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.95)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 70,
    borderWidth: 2,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 3px 12px rgba(212, 175, 55, 0.4)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
  menuButtonIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' as const,
    borderWidth: 1.5,
    borderColor: 'rgba(61, 1, 1, 0.2)',
  },
  menuButtonBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  menuButtonBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700' as const,
  },
  menuButtonText: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 10,
    color: '#3d0101',
    textAlign: 'center' as const,
    letterSpacing: 0.3,
    fontWeight: '700' as const,
    lineHeight: 14,
  },
  categoryScrollContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    marginRight: 4,
  },
  categoryChipActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  categoryChipText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  categoryChipTextActive: {
    fontWeight: '700' as const,
    color: '#3d0101',
  },
  categoryImageScrollContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    paddingBottom: 18,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    marginTop: 0,
    marginBottom: 12,
  },
  categoryImageScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  categoryImageCard: {
    width: 130,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    position: 'relative' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      },
    }),
  },
  categoryImageCardActive: {
    borderWidth: 3,
    borderColor: '#D4AF37',
    transform: [{ scale: 1.05 }],
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 6px 20px rgba(212, 175, 55, 0.6)',
      },
    }),
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  categoryImageTextContainer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(61, 1, 1, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 2,
    borderTopColor: '#D4AF37',
  },
  categoryImageText: {
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#E8C968',
    textAlign: 'center' as const,
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  categoryImageTextActive: {
    color: '#FFFFFF',
    textShadowColor: '#D4AF37',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  activeCategoryIndicator: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D4AF37',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 2px 12px rgba(212, 175, 55, 0.8), 0 0 20px rgba(212, 175, 55, 0.6)',
      },
    }),
  },
  activeCategoryPulse: {
    position: 'absolute' as const,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D4AF37',
    opacity: 0.4,
  },
  waiterToast: {
    position: 'absolute' as const,
    top: Platform.select({ ios: 120, android: 110, default: 115 }),
    left: 20,
    right: 20,
    backgroundColor: 'rgba(45, 0, 0, 0.95)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1000,
    borderWidth: 2,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 4px 16px rgba(212, 175, 55, 0.5)',
      },
    }),
  },
  waiterToastText: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    flex: 1,
  },


  cartBadge: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
    backgroundColor: '#D4AF37',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#3d0101',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: 'rgba(61, 1, 1, 0.98)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    overflow: 'hidden' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      },
    }),
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 44,
  },
  closeSearchButton: {
    padding: 4,
    marginLeft: 8,
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
  categorySliderContainer: {
    backgroundColor: 'rgba(61, 1, 1, 0.4)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
    overflow: 'hidden' as const,
    position: 'relative' as const,
    paddingBottom: 16,
    paddingTop: 10,
    ...Platform.select({
      web: {
        paddingBottom: 22,
        paddingTop: 14,
      },
    }),
  },
  categorySliderTitle: {
    fontSize: 22,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#E8C968',
    marginTop: 6,
    marginLeft: 20,
    marginBottom: 4,
    letterSpacing: 0.5,
    textAlign: 'left' as const,
    textTransform: 'capitalize' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    ...Platform.select({
      web: {
        fontSize: 24,
        marginTop: 8,
        marginBottom: 5,
      },
    }),
  },
  luxuryAccent: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    marginLeft: 0,
    marginBottom: 0,
    borderRadius: 0,
    display: 'none' as const,
    ...Platform.select({
      web: {
        width: 0,
        height: 0,
        marginBottom: 0,
      },
    }),
  },
  categorySlider: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
    ...Platform.select({
      web: {
        paddingHorizontal: 32,
        gap: 12,
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        justifyContent: 'center' as const,
      },
    }),
  },
  categoryCard: {
    width: 75,
    height: 85,
    backgroundColor: '#3d0101',
    borderRadius: 12,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        width: 100,
        height: 110,
        boxShadow: '0 4px 20px rgba(212, 175, 55, 0.5), 0 0 0 2px rgba(212, 175, 55, 0.7)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer',
      },
    }),
  },
  categoryCardImageContainer: {
    width: '100%',
    height: 55,
    position: 'relative' as const,
    backgroundColor: '#2a1a1a',
    ...Platform.select({
      web: {
        height: 65,
      },
    }),
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
  },
  categoryCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },

  categoryCardFooter: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    backgroundColor: '#2a1a1a',
    width: '100%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#D4AF37',
    ...Platform.select({
      web: {
        paddingVertical: 6,
        paddingHorizontal: 5,
        height: 35,
      },
    }),
  },
  categoryCardTitle: {
    fontSize: 9,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    textAlign: 'center' as const,
    letterSpacing: 0.2,
    lineHeight: 12,
    ...Platform.select({
      web: {
        fontSize: 11,
        lineHeight: 14,
        letterSpacing: 0.3,
      },
    }),
  },
  topNavCartBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  topNavCartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700' as const,
  },
  menuSections: {
    paddingTop: 6,
    paddingBottom: 18,
  },
  categorySection: {
    marginBottom: 24,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(26, 0, 0, 0.92)',
    borderRadius: 20,
    paddingVertical: 18,
    marginHorizontal: 12,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.6)',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 6px 20px rgba(212, 175, 55, 0.4)',
      },
    }),
  },
  categoryHeader: {
    paddingHorizontal: 0,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  categoryDecorLeft: {
    width: 6,
    height: 28,
    backgroundColor: '#D4AF37',
    borderRadius: 2,
    marginRight: 12,
  },
  categoryDecorRight: {
    flex: 1,
    height: 2,
    backgroundColor: '#D4AF37',
    marginLeft: 16,
    borderRadius: 1,
    opacity: 0.6,
  },
  categoryTitle: {
    fontSize: 28,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#E8C968',
    letterSpacing: 0.5,
    textTransform: 'capitalize' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  categoryCount: {
    fontSize: 12,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    color: '#3d0101',
    opacity: 0.7,
  },
  categoryItemsScroll: {
    paddingHorizontal: 20,
    gap: 20,
    ...Platform.select({
      web: {
        flexWrap: 'wrap' as const,
        flexDirection: 'row' as const,
        justifyContent: 'center' as const,
      },
    }),
  },
  categoryItemsGrid: {
    paddingHorizontal: 0,
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    paddingTop: 6,
    rowGap: 12,
    columnGap: 12,
    ...Platform.select({
      web: {
        justifyContent: 'center' as const,
        rowGap: 18,
        columnGap: 18,
      },
    }),
  },

  content: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative' as const,
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
    paddingTop: 18,
    paddingBottom: Platform.select({ ios: 140, android: 130, default: 130 }),
    paddingHorizontal: 12,
    gap: 24,
    ...Platform.select({
      web: {
        paddingHorizontal: 12,
        maxWidth: 1600,
        alignSelf: 'center' as const,
        width: '100%',
      },
    }),
  },
  menuItemCardHorizontal: {
    width: '47.5%' as const,
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
        shadowOpacity: 0.5,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
      web: {
        width: '31%',
        minWidth: 160,
        maxWidth: 220,
        boxShadow: '0 6px 24px rgba(212, 175, 55, 0.5)',
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
  menuItemDescriptionHorizontal: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: '400' as const,
    marginBottom: 12,
    textAlign: 'center' as const,
    ...Platform.select({
      web: {
        fontFamily: 'NotoNaskhArabic_400Regular',
      },
    }),
  },
  premiumBadge: {
    backgroundColor: '#D4AF37',
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  premiumBadgeText: {
    color: '#3d0101',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3d0101',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#3d0101',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addToCartButtonPremium: {
    backgroundColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  addToCartButtonText: {
    color: '#3d0101',
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
    ...Platform.select({
      web: {
        fontFamily: 'NotoNaskhArabic_600SemiBold',
      },
    }),
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
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  modalItemPrice: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#3d0101',
    marginBottom: 12,
  },
  modalItemDescription: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
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
    marginBottom: 12,
    marginTop: 8,
  },
  quantitySelectorLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#E8C968',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFDD0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3d0101',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    minWidth: 35,
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
  },
  notesInput: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    minHeight: 60,
    textAlignVertical: 'top' as const,
    marginBottom: 12,
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
  cartContainer: {
    flex: 1,
    backgroundColor: '#3d0101',
    position: 'relative' as const,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  cartItems: {
    flex: 1,
    padding: 20,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    marginTop: 60,
  },
  emptyCartText: {
    fontSize: 20,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: 'rgba(232, 201, 104, 0.9)',
    marginTop: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  emptyCartIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(61, 1, 1, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 32px rgba(212, 175, 55, 0.4)',
      },
    }),
  },
  emptyCartIconInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartSubtext: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 12,
    textAlign: 'center' as const,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  cartItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cartItemInfo: {
    marginBottom: 12,
  },
  cartItemName: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cartItemNotes: {
    fontSize: 14,
    color: '#D4AF37',
    marginBottom: 6,
    fontStyle: 'italic' as const,
  },
  cartItemPrice: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartQuantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartQuantityText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    minWidth: 30,
    textAlign: 'center' as const,
  },
  cartDeleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 77, 77, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto' as const,
  },
  cartFooter: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  tableInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tableInfoText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  tableInfoChange: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600' as const,
  },
  selectTableButton: {
    backgroundColor: '#D4AF37',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectTableButtonText: {
    color: '#3d0101',
    fontSize: 16,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  cartTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTotalLabel: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  cartTotalAmount: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#D4AF37',
  },
  cartSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 12,
  },
  cartSubmitButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cartSubmitButtonText: {
    color: '#3d0101',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  tableSelectorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
    ...Platform.select({
      web: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      },
    }),
  },
  tableSelectorContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    width: '100%',
    maxHeight: '85%',
    ...Platform.select({
      web: {
        borderRadius: 24,
        maxWidth: 600,
        maxHeight: '80%',
      },
    }),
  },
  tableSelectorHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  tableSelectorTitle: {
    fontSize: 26,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#3d0101',
    marginBottom: 8,
    textAlign: 'center' as const,
    letterSpacing: -0.5,
  },
  tableSelectorSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center' as const,
  },
  tableGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 16,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  tableCard: {
    width: 90,
    height: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  tableCardSelected: {
    borderColor: '#3d0101',
    borderWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#3d0101',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(61, 1, 1, 0.3)',
      },
    }),
  },
  tableCardDisabled: {
    opacity: 0.4,
    borderColor: '#D1D5DB',
  },
  tableCardInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  tableCardInnerSelected: {
    backgroundColor: '#3d0101',
  },
  tableCardInfo: {
    alignItems: 'center',
    marginTop: 4,
  },
  tableCardNumber: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    lineHeight: 38,
  },
  tableCardNumberSelected: {
    color: '#FFFFFF',
  },
  tableCardCapacity: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  tableCardCapacitySelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tableCardStatus: {
    fontSize: 9,
    color: '#EF4444',
    fontWeight: '600' as const,
    marginTop: 2,
  },
  tableSelectorClose: {
    backgroundColor: '#3d0101',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#3d0101',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tableSelectorCloseText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    letterSpacing: 0.5,
  },
  tableSelectorFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  tableSelectorFooterText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500' as const,
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
    padding: 32,
    paddingBottom: 24,
    alignItems: 'center',
    backgroundColor: '#3d0101',
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerLogo: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  footerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  footerText: {
    fontSize: 15,
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
  footerTextSecondary: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start' as const,
    gap: 4,
  },
  ratingBadgeCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'center' as const,
    gap: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
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
  ratingText: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: '#D4AF37',
  },
  ratingCount: {
    fontSize: 12,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  menuItemActions: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  rateButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  ratingModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    maxHeight: '80%',
    ...Platform.select({
      web: {
        maxWidth: 500,
        alignSelf: 'center' as const,
        width: '100%',
        marginBottom: 0,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        maxHeight: '75%',
        marginTop: 'auto' as const,
      },
    }),
  },
  ratingModalTitle: {
    fontSize: 24,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#3d0101',
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  ratingModalItemName: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#6B7280',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  starRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  starButton: {
    padding: 4,
  },
  ratingModalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  ratingInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
    textAlignVertical: 'top' as const,
    marginBottom: 24,
  },
  submitRatingButton: {
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
  submitRatingButtonDisabled: {
    backgroundColor: 'rgba(61, 1, 1, 0.4)',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  submitRatingButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  menuItemTouchable: {
    flex: 1,
  },
  rateButtonOnCard: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
    }),
  },
  goldCornerTopRight: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 24,
    borderRightWidth: 24,
    borderTopColor: '#D4AF37',
    borderRightColor: 'transparent',
    zIndex: 5,
    ...Platform.select({
      web: {
        borderTopWidth: 28,
        borderRightWidth: 28,
      },
    }),
  },
  goldCornerBottomLeft: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
    borderBottomWidth: 24,
    borderLeftWidth: 24,
    borderBottomColor: '#D4AF37',
    borderLeftColor: 'transparent',
    zIndex: 5,
    ...Platform.select({
      web: {
        borderBottomWidth: 28,
        borderLeftWidth: 28,
      },
    }),
  },
  reviewsList: {
    maxHeight: 400,
    marginVertical: 12,
  },
  reviewItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewItemName: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  reviewItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewItemRatingText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#D4AF37',
  },
  reviewItemCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noReviewsText: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center' as const,
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#3d0101',
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#3d0101',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  searchModalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchModalTitle: {
    fontSize: 20,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center' as const,
    marginHorizontal: 12,
  },
  searchModalSearchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchModalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 50,
  },
  searchModalInputIcon: {
    marginRight: 12,
  },
  searchModalInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '400' as const,
  },
  searchModalClearButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchModalResults: {
    flex: 1,
  },
  searchModalContent: {
    paddingVertical: 8,
  },
  searchModalEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 120,
  },
  searchCategorySection: {
    marginBottom: 24,
  },
  searchCategoryHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  searchCategoryDecorLeft: {
    width: 4,
    height: 20,
    backgroundColor: '#D4AF37',
    borderRadius: 2,
    marginRight: 10,
  },
  searchCategoryDecorRight: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    marginLeft: 12,
    borderRadius: 1,
  },
  searchCategoryTitle: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  searchModalEmptyText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 16,
    textAlign: 'center' as const,
  },
  searchResultsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchResultItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchResultItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchResultItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  searchResultItemName: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 24,
  },
  searchResultItemPrice: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#D4AF37',
    fontWeight: '700' as const,
  },
  searchResultRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  searchResultRatingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#D4AF37',
  },
  floatingMenu: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 0, 0, 0.97)',
    paddingVertical: 16,
    paddingHorizontal: 12,
    paddingBottom: Platform.select({ ios: 24, android: 20, default: 20 }),
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 2,
    borderTopColor: 'rgba(212, 175, 55, 0.6)',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 24,
      },
      web: {
        boxShadow: '0 -8px 40px rgba(212, 175, 55, 0.5), 0 0 60px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
      },
    }),
  },
  fabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    minHeight: 64,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(212, 175, 55, 0.6)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      web: {
        minHeight: 70,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        cursor: 'pointer',
      },
    }),
  },
  fabButtonPrimary: {
    backgroundColor: 'rgba(212, 175, 55, 0.98)',
    borderColor: '#D4AF37',
    borderWidth: 2.5,
    transform: [{ scale: 1 }],
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.7,
        shadowRadius: 14,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 6px 28px rgba(212, 175, 55, 0.7), 0 0 40px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
      },
    }),
  },
  fabIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
    position: 'relative' as const,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  fabLabel: {
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    letterSpacing: 0.3,
    lineHeight: 14,
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    paddingHorizontal: 2,
  },
  fabLabelPrimary: {
    color: '#3d0101',
    fontWeight: '700' as const,
  },
  fabCartBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  fabCartBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  itemModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      },
    }),
  },
  itemModalContent: {
    backgroundColor: '#2d0000',
    borderRadius: 28,
    overflow: 'hidden' as const,
    borderWidth: 3,
    borderColor: '#D4AF37',
    marginHorizontal: 16,
    alignSelf: 'center' as const,
    width: '92%',
    maxWidth: 480,
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.8,
        shadowRadius: 24,
      },
      android: {
        elevation: 24,
      },
      web: {
        maxWidth: 440,
        boxShadow: '0 8px 48px rgba(212, 175, 55, 0.8), 0 0 60px rgba(212, 175, 55, 0.4)',
      },
    }),
  },
  itemModalCloseButton: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderWidth: 2,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  itemModalImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#1a0000',
    ...Platform.select({
      web: {
        height: 240,
      },
    }),
  },
  itemModalBody: {
    padding: 20,
    gap: 16,
  },
  itemModalTitle: {
    fontSize: 24,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#E8C968',
    textAlign: 'center' as const,
    letterSpacing: 0.3,
    lineHeight: 32,
    textShadowColor: 'rgba(212, 175, 55, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  itemModalDescription: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    textAlign: 'center' as const,
    paddingHorizontal: 4,
  },
  itemModalQuantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  itemModalQuantityLabel: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    color: 'rgba(232, 201, 104, 0.9)',
    letterSpacing: 0.2,
  },
  itemModalQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  itemModalQuantityButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFDD0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  itemModalQuantityValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    minWidth: 40,
    textAlign: 'center' as const,
  },
  itemModalNotesInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    minHeight: 70,
    maxHeight: 70,
    textAlignVertical: 'top' as const,
    fontFamily: 'NotoNaskhArabic_400Regular',
  },
  itemModalAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#D4AF37',
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E8C968',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  itemModalAddButtonText: {
    color: '#3d0101',
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  itemModalScrollView: {
    flex: 1,
  },
  modalReviewsSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  modalReviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.25)',
  },
  modalReviewsRating: {
    fontSize: 20,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#D4AF37',
    fontWeight: '700' as const,
  },
  modalReviewsCount: {
    fontSize: 13,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  modalReviewsList: {
    maxHeight: 140,
    marginBottom: 12,
  },
  modalReviewCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  modalReviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },
  modalReviewDate: {
    fontSize: 11,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 8,
  },
  modalReviewComment: {
    fontSize: 13,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 18,
  },
  modalRateThisDishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.5)',
  },
  modalRateThisDishButtonText: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    color: '#D4AF37',
    fontWeight: '600' as const,
  },
  modalReviewsLink: {
    fontSize: 13,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    color: '#D4AF37',
    textAlign: 'center' as const,
  },
  itemModalRateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    marginTop: 8,
  },
  itemModalRateButtonText: {
    color: '#D4AF37',
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
});

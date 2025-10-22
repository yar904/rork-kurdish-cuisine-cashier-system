import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  NativeScrollEvent,
  NativeSyntheticEvent,
  Modal,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Globe, ShoppingCart, Plus, Minus, X, Send, MessageCircle, Star, Utensils, ArrowLeft } from 'lucide-react-native';
import { MENU_ITEMS } from '@/constants/menu';
import { MenuCategory, MenuItem } from '@/types/restaurant';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/constants/i18n';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useTables } from '@/contexts/TableContext';
import { Colors } from '@/constants/colors';
import { formatPrice } from '@/constants/currency';
import AIChatbot from '@/components/AIChatbot';
import { trpc } from '@/lib/trpc';

export default function PublicMenuScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { language, setLanguage, t, tc } = useLanguage();
  const { addItemToCurrentOrder, currentOrder, submitOrder, updateItemQuantity, removeItemFromCurrentOrder, calculateTotal, selectedTable, setSelectedTable } = useRestaurant();
  const { tables } = useTables();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchSlideAnim = useRef(new Animated.Value(0)).current;
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemNotes, setItemNotes] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingItem, setRatingItem] = useState<MenuItem | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const { width } = useWindowDimensions();

  const contentScrollRef = useRef<ScrollView>(null);
  const categoryScrollRef = useRef<ScrollView>(null);
  const autoScrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const categorySlideHeight = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('down');
  const currentSlideIndex = useRef(0);

  useEffect(() => {
    if (!selectedTable && !params.table) {
      setShowTableSelector(true);
    } else if (params.table) {
      const tableNum = parseInt(params.table as string);
      if (!isNaN(tableNum)) {
        setSelectedTable(tableNum);
      }
    }
  }, [params.table, setSelectedTable, selectedTable]);

  const handleAddToCart = () => {
    if (selectedItem) {
      addItemToCurrentOrder(selectedItem.id, itemQuantity, itemNotes || undefined);
      setSelectedItem(null);
      setItemNotes('');
      setItemQuantity(1);
      Alert.alert(t('success'), t('itemAddedToCart'));
    }
  };

  const handleSubmitOrder = () => {
    if (currentOrder.length === 0) {
      Alert.alert(t('emptyCart'), t('pleaseAddItems'));
      return;
    }

    if (!selectedTable) {
      Alert.alert(t('selectTable'), t('pleaseSelectTableFirst'));
      setShowTableSelector(true);
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

  const createRatingMutation = trpc.ratings.create.useMutation({
    onSuccess: () => {
      Alert.alert(t('success'), t('ratingSubmitted'));
      setShowRatingModal(false);
      setRatingItem(null);
      setUserRating(0);
      setRatingComment('');
      ratingsStatsQuery.refetch();
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

  const categories: MenuCategory[] = [
    'appetizers',
    'soups',
    'salads',
    'kebabs',
    'rice-dishes',
    'stews',
    'seafood',
    'breads',
    'desserts',
    'drinks',
    'shisha',
    'hot-drinks',
  ];

  const availableCategories = categories.filter((category) => {
    const categoryItems = MENU_ITEMS.filter(item => item.category === category && item.available);
    return categoryItems.length > 0;
  });

  const startAutoScroll = useCallback(() => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
    
    const interval = setInterval(() => {
      const nextIndex = (currentSlideIndex.current + 1) % availableCategories.length;
      const cardWidth = 140;
      const gap = 12;
      const scrollPosition = nextIndex * (cardWidth + gap);
      
      categoryScrollRef.current?.scrollTo({
        x: scrollPosition,
        animated: true,
      });
      
      currentSlideIndex.current = nextIndex;
    }, 3000);
    
    autoScrollInterval.current = interval;
  }, [availableCategories.length]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [startAutoScroll]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    if (currentScrollY > lastScrollY.current && currentScrollY > 10) {
      if (scrollDirection.current !== 'down') {
        scrollDirection.current = 'down';
        Animated.timing(categorySlideHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    } else if (currentScrollY < lastScrollY.current) {
      if (scrollDirection.current !== 'up') {
        scrollDirection.current = 'up';
        Animated.timing(categorySlideHeight, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    }
    
    lastScrollY.current = currentScrollY;
  };

  const filteredCategories = categories.filter((category) => {
    if (searchQuery === '') return true;
    const categoryName = tc(category).toLowerCase();
    const categoryItems = MENU_ITEMS.filter(item => item.category === category);
    const hasMatchingItems = categoryItems.some(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameKurdish.includes(searchQuery) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return categoryName.includes(searchQuery.toLowerCase()) || hasMatchingItems;
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
          onPress={() => {
            setSelectedItem(item);
            setItemQuantity(1);
            setItemNotes('');
          }}
        >
          <View style={styles.menuItemContentHorizontal}>
            {item.image && (
              <View style={styles.imageContainerHorizontal}>
                <Image 
                  source={{ uri: item.image }} 
                  style={styles.menuItemImageHorizontal}
                  resizeMode="cover"
                />
              </View>
            )}
            
            <Text style={styles.menuItemNameHorizontal} numberOfLines={2}>
              {getItemName(item)}
            </Text>
            
            <View style={styles.priceHighlight}>
              <Text style={styles.menuItemPriceHorizontal}>{formatPrice(item.price)}</Text>
            </View>
            
            {hasRatings && (
              <View style={styles.ratingBadgeCentered}>
                <Star size={16} color="#D4AF37" fill="#D4AF37" />
                <Text style={styles.ratingText}>{itemStats.averageRating.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({itemStats.totalRatings})</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.rateButtonOnCard}
          onPress={(e) => {
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

  const renderCategorySection = (category: MenuCategory) => {
    const categoryItems = MENU_ITEMS.filter((item) => {
      const matchesCategory = item.category === category;
      const matchesSearch =
        searchQuery === '' ||
        getItemName(item).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getItemDescription(item).toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && item.available;
    });

    if (categoryItems.length === 0) return null;

    return (
      <View key={category} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryTitleContainer}>
            <View style={styles.categoryDecorLeft} />
            <Text style={styles.categoryTitle}>{tc(category)}</Text>
            <View style={styles.categoryDecorRight} />
          </View>
        </View>
        <View style={styles.categoryItemsGrid}>
          {categoryItems.map(renderMenuItem)}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Modal
        visible={selectedItem !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedItem?.image && (
                <Image 
                  source={{ uri: selectedItem.image }} 
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}
              
              <View style={styles.modalBody}>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedItem(null)}
                >
                  <X size={24} color="#1A1A1A" />
                </TouchableOpacity>

                <Text style={styles.modalItemName}>{selectedItem ? getItemName(selectedItem) : ''}</Text>
                <Text style={styles.modalItemPrice}>{selectedItem ? formatPrice(selectedItem.price) : ''}</Text>
                <Text style={styles.modalItemDescription}>{selectedItem ? getItemDescription(selectedItem) : ''}</Text>

                <View style={styles.modalDivider} />

                <View style={styles.quantitySelector}>
                  <Text style={styles.quantitySelectorLabel}>{t('quantity')}:</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    >
                      <Minus size={20} color="#3d0101" />
                    </TouchableOpacity>
                    <Text style={styles.quantityValue}>{itemQuantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setItemQuantity(itemQuantity + 1)}
                    >
                      <Plus size={20} color="#3d0101" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>{t('specialRequirements')}:</Text>
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

                <TouchableOpacity
                  style={styles.modalAddButton}
                  onPress={handleAddToCart}
                >
                  <ShoppingCart size={20} color="#fff" />
                  <Text style={styles.modalAddButtonText}>
                    {t('addToCart')} - {formatPrice((selectedItem?.price ?? 0) * itemQuantity)}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
                <ShoppingCart size={64} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.emptyCartText}>{t('noItemsInOrder')}</Text>
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
                      onPress={() => updateItemQuantity(index, item.quantity - 1)}
                    >
                      <Minus size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.cartQuantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.cartQuantityButton}
                      onPress={() => updateItemQuantity(index, item.quantity + 1)}
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
              <TouchableOpacity 
                style={styles.tableInfo}
                onPress={() => setShowTableSelector(true)}
              >
                <Text style={styles.tableInfoText}>{t('table')}: {selectedTable}</Text>
                <Text style={styles.tableInfoChange}>{t('change')}</Text>
              </TouchableOpacity>
            )}
            {!selectedTable && (
              <TouchableOpacity 
                style={styles.selectTableButton}
                onPress={() => setShowTableSelector(true)}
              >
                <Text style={styles.selectTableButtonText}>{t('selectTable')}</Text>
              </TouchableOpacity>
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
        visible={showTableSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (selectedTable) {
            setShowTableSelector(false);
          }
        }}
      >
        <View style={styles.tableSelectorOverlay}>
          <View style={styles.tableSelectorContent}>
            <View style={styles.tableSelectorHeader}>
              <Text style={styles.tableSelectorTitle}>{t('selectYourTable')}</Text>
              <Text style={styles.tableSelectorSubtitle}>{t('chooseTableDescription')}</Text>
            </View>
            
            <ScrollView 
              contentContainerStyle={styles.tableGrid}
              showsVerticalScrollIndicator={false}
            >
              {tables.map(table => {
                const isSelected = selectedTable === table.number;
                const isAvailable = table.status === 'available' || table.status === 'occupied';
                
                return (
                  <TouchableOpacity
                    key={table.number}
                    style={[
                      styles.tableCard,
                      isSelected && styles.tableCardSelected,
                      !isAvailable && styles.tableCardDisabled,
                    ]}
                    onPress={() => {
                      setSelectedTable(table.number);
                      setShowTableSelector(false);
                    }}
                    disabled={!isAvailable}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.tableCardInner, isSelected && styles.tableCardInnerSelected]}>
                      <Text style={[styles.tableCardNumber, isSelected && styles.tableCardNumberSelected]}>
                        {table.number}
                      </Text>
                      <View style={styles.tableCardInfo}>
                        <Text style={[styles.tableCardCapacity, isSelected && styles.tableCardCapacitySelected]}>
                          {table.capacity} {t('seats')}
                        </Text>
                        {!isAvailable && (
                          <Text style={styles.tableCardStatus}>{t('notAvailable')}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            {selectedTable && (
              <TouchableOpacity
                style={styles.tableSelectorClose}
                onPress={() => setShowTableSelector(false)}
              >
                <Text style={styles.tableSelectorCloseText}>{t('close')}</Text>
              </TouchableOpacity>
            )}
            
            {!selectedTable && (
              <View style={styles.tableSelectorFooter}>
                <Text style={styles.tableSelectorFooterText}>{t('tapTableToSelect')}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAIAssistant}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAIAssistant(false)}
      >
        <AIChatbot visible={showAIAssistant} onClose={() => setShowAIAssistant(false)} />
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
            >
              <X size={24} color="#1A1A1A" />
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
      
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/landing')}
          >
            <ArrowLeft size={20} color="#FFFFFF" strokeWidth={1.5} />
          </TouchableOpacity>
          <Image 
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zz04l0d1dzw9z6075ukb4' }}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowLanguageMenu(!showLanguageMenu)}
          >
            <Globe size={22} color="#FFFFFF" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.iconRow}>
          <TouchableOpacity
            style={styles.iconItem}
            onPress={() => setShowAIAssistant(true)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <MessageCircle size={22} color="#D4AF37" strokeWidth={1.8} />
            </View>
            <Text style={styles.iconLabel}>
              {language === 'en' ? 'AI Chat' : language === 'ku' ? 'وتووێژی AI' : 'دردشة AI'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.iconItem}
            onPress={() => setShowCart(true)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Utensils size={22} color="#D4AF37" strokeWidth={1.8} />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.iconLabel}>
              {language === 'en' ? 'My Order' : language === 'ku' ? 'داواکاریم' : 'طلبي'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.iconItem}
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
            <View style={styles.iconCircle}>
              <Star size={22} color="#D4AF37" strokeWidth={1.8} />
            </View>
            <Text style={styles.iconLabel}>
              {language === 'en' ? 'Reviews' : language === 'ku' ? 'هەڵسەنگاندن' : 'التقييمات'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.iconItem}
            onPress={() => {
              const toValue = showSearch ? 0 : 1;
              setShowSearch(!showSearch);
              Animated.spring(searchSlideAnim, {
                toValue,
                useNativeDriver: true,
                damping: 15,
                stiffness: 120,
              }).start();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Search size={22} color="#D4AF37" strokeWidth={1.8} />
            </View>
            <Text style={styles.iconLabel}>
              {language === 'en' ? 'Search' : language === 'ku' ? 'گەڕان' : 'بحث'}
            </Text>
          </TouchableOpacity>
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
              >
                <Text style={[
                  styles.languageOptionText,
                  language === lang && styles.languageOptionTextActive,
                ]}>
                  {lang === 'en' ? 'English' : lang === 'ku' ? 'کوردی' : 'العربية'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {showSearch && (
        <Animated.View
          style={[
            styles.searchContainer,
            {
              transform: [
                {
                  translateY: searchSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-60, 0],
                  }),
                },
              ],
              opacity: searchSlideAnim,
            },
          ]}
        >
          <Search size={18} color="rgba(255, 255, 255, 0.7)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchMenu')}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setShowSearch(false);
              Animated.spring(searchSlideAnim, {
                toValue: 0,
                useNativeDriver: true,
              }).start();
            }}
            style={styles.closeSearchButton}
          >
            <X size={18} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <Animated.View style={[
        styles.categorySliderContainer,
        {
          height: categorySlideHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 160],
          }),
          opacity: categorySlideHeight,
        },
      ]}>
        <Text style={styles.categorySliderTitle}>{t('exploreCategories')}</Text>
        <View style={styles.luxuryAccent} />
        <ScrollView 
          ref={categoryScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categorySlider}
          onScrollBeginDrag={() => {
            if (autoScrollInterval.current) {
              clearInterval(autoScrollInterval.current);
            }
          }}
          onScrollEndDrag={startAutoScroll}
        >
          {availableCategories.map((category) => {
            const categoryItems = MENU_ITEMS.filter(item => item.category === category && item.available);
            
            return (
              <TouchableOpacity
                key={category}
                style={styles.categoryCard}
                activeOpacity={0.9}
                onPress={() => {
                  if (autoScrollInterval.current) {
                    clearInterval(autoScrollInterval.current);
                  }
                  router.push(`/category/${category}`);
                }}
              >
                <View style={styles.categoryCardImageContainer}>
                  {categoryItems[0]?.image && (
                    <Image 
                      source={{ uri: categoryItems[0].image }} 
                      style={styles.categoryCardImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.categoryCardOverlay} />
                </View>
                <View style={styles.categoryCardFooter}>
                  <Text style={styles.categoryCardTitle}>{tc(category)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      <ScrollView 
        ref={contentScrollRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.plaidPattern} />
        <View style={styles.citadelPattern}>
          <View style={styles.citadelSilhouette}>
            <Text style={styles.citadelText}>🏰</Text>
          </View>
        </View>
        <View style={styles.menuSections}>
          {filteredCategories.map(renderCategorySection)}
        </View>

        {filteredCategories.length === 0 && (
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
          <Text style={styles.footerText}>{t('thankYou')}</Text>
          <View style={styles.footerDivider} />
          <Text style={styles.footerTextSecondary}>سوپاس بۆ سەردانیکردنتان</Text>
          <Text style={styles.footerTextSecondary}>شكراً لزيارتكم</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D4C5A9',
    position: 'relative' as const,
    ...Platform.select({
      web: {
        maxWidth: 1920,
        alignSelf: 'center' as const,
        width: '100%',
        backgroundImage: `url('https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/upm1xqonvujbq14bwsvhc')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      },
    }),
  },
  header: {
    backgroundColor: '#3d0101',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    ...Platform.select({
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
    paddingVertical: 10,
  },
  headerLogo: {
    width: 56,
    height: 56,
    ...Platform.select({
      web: {
        width: 72,
        height: 72,
      },
    }),
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  iconItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    position: 'relative' as const,
  },
  iconLabel: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center' as const,
    letterSpacing: 0.3,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden' as const,
    ...Platform.select({
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
    backgroundColor: '#D4C5A9',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61, 1, 1, 0.2)',
    overflow: 'hidden' as const,
    position: 'relative' as const,
    ...Platform.select({
      web: {
        backgroundImage: `url('https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/upm1xqonvujbq14bwsvhc')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      },
    }),
  },
  categorySliderTitle: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#3d0101',
    marginTop: 16,
    marginLeft: 20,
    marginBottom: 4,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  luxuryAccent: {
    width: 40,
    height: 2,
    backgroundColor: '#A0753D',
    marginLeft: 20,
    marginBottom: 12,
    borderRadius: 1,
  },
  categorySlider: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  categoryCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: 'rgba(139, 90, 43, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5A2B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 6px 16px rgba(139, 90, 43, 0.25)',
      },
    }),
  },
  categoryCardImageContainer: {
    width: '100%',
    height: 90,
    position: 'relative' as const,
    backgroundColor: '#F9FAFB',
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
  },
  categoryCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(61, 1, 1, 0.1)',
  },

  categoryCardFooter: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(61, 1, 1, 0.9)',
    width: '100%',
  },
  categoryCardTitle: {
    fontSize: 13,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    textAlign: 'center' as const,
    letterSpacing: 0.5,
  },
  menuSections: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  categorySection: {
    marginBottom: 40,
  },
  categoryHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryDecorLeft: {
    width: 4,
    height: 28,
    backgroundColor: '#3d0101',
    borderRadius: 2,
    marginRight: 12,
  },
  categoryDecorRight: {
    flex: 1,
    height: 2,
    backgroundColor: '#A0753D',
    marginLeft: 16,
    borderRadius: 1,
    opacity: 0.8,
  },
  categoryTitle: {
    fontSize: 28,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#3d0101',
    letterSpacing: 0.5,
    textTransform: 'capitalize' as const,
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
    paddingHorizontal: 16,
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    justifyContent: 'space-between' as const,
    ...Platform.select({
      web: {
        justifyContent: 'center' as const,
      },
    }),
  },

  content: {
    flex: 1,
    backgroundColor: '#D4C5A9',
    position: 'relative' as const,
    ...Platform.select({
      web: {
        backgroundImage: `url('https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/upm1xqonvujbq14bwsvhc')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      },
    }),
  },
  baobabPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    zIndex: 0,
  },
  baobabTree: {
    position: 'absolute' as const,
    width: 220,
    height: 280,
    opacity: 0.15,
    transform: [{ rotate: '0deg' }],
  },
  plaidPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    zIndex: 0,
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
    paddingBottom: 32,
    ...Platform.select({
      web: {
        paddingHorizontal: 0,
        maxWidth: 1600,
        alignSelf: 'center' as const,
        width: '100%',
      },
    }),
  },
  menuItemCardHorizontal: {
    width: '48%' as const,
    backgroundColor: '#3d0101',
    borderRadius: 20,
    overflow: 'hidden' as const,
    borderWidth: 0,
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#8B5A2B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 5,
      },
      web: {
        maxWidth: 420,
        boxShadow: '0 6px 20px rgba(139, 90, 43, 0.12)',
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
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 0,
    overflow: 'hidden' as const,
    marginBottom: 0,
  },
  menuItemImageHorizontal: {
    width: '100%',
    height: '100%',
  },
  menuItemContentHorizontal: {
    padding: 0,
  },
  menuItemNameHorizontal: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '800' as const,
    color: '#E8C968',
    lineHeight: 20,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
    textAlign: 'center' as const,
    paddingHorizontal: 12,
  },
  priceHighlight: {
    marginBottom: 12,
    alignItems: 'center' as const,
  },
  menuItemPriceHorizontal: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.3,
    textAlign: 'center' as const,
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
    ...Platform.select({
      web: {
        fontFamily: 'NotoNaskhArabic_400Regular',
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
    top: 24,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
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
    marginBottom: 20,
  },
  quantitySelectorLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
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
    paddingVertical: 60,
  },
  emptyCartText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 16,
    fontWeight: '500' as const,
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
    height: 100,
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
    padding: 48,
    alignItems: 'center',
    backgroundColor: '#3d0101',
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerLogo: {
    width: 140,
    height: 140,
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
    marginBottom: 16,
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
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center' as const,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#D4AF37',
  },
  ratingCount: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
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
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
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
});

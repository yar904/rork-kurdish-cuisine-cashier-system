import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, Clock, ChefHat, Bell, ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors } from '@/constants/colors';

type OrderStatusType = 'new' | 'preparing' | 'ready' | 'served';

interface OrderStage {
  id: OrderStatusType;
  title: string;
  estimatedMinutes: number;
}

export default function OrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { t, language } = useLanguage();
  const [currentStatus, setCurrentStatus] = useState<OrderStatusType>('new');
  const [progress] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  const orderId = params.orderId as string || 'N/A';
  const tableNumber = params.tableNumber as string || 'N/A';
  const total = params.total as string || '0';

  const stages: OrderStage[] = [
    {
      id: 'new',
      title: t('orderReceived') || 'Order Received',
      estimatedMinutes: 2,
    },
    {
      id: 'preparing',
      title: t('preparing') || 'Preparing',
      estimatedMinutes: 15,
    },
    {
      id: 'ready',
      title: t('ready') || 'Ready',
      estimatedMinutes: 3,
    },
    {
      id: 'served',
      title: t('served') || 'Served',
      estimatedMinutes: 0,
    },
  ];

  const currentStageIndex = stages.findIndex(s => s.id === currentStatus);
  const totalEstimatedTime = stages
    .slice(currentStageIndex)
    .reduce((acc, stage) => acc + stage.estimatedMinutes, 0);

  const animatePulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    animatePulse();
  }, [animatePulse]);

  useEffect(() => {
    const progressValue = currentStageIndex / (stages.length - 1);
    Animated.timing(progress, {
      toValue: progressValue,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [currentStatus, currentStageIndex, progress, stages.length]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const renderStage = (stage: OrderStage, index: number) => {
    const isCompleted = index < currentStageIndex;
    const isCurrent = index === currentStageIndex;
    const isPending = index > currentStageIndex;

    return (
      <View key={stage.id} style={styles.stageContainer}>
        <View style={styles.stageIconContainer}>
          <Animated.View
            style={[
              styles.stageIconCircle,
              isCompleted && styles.stageIconCompleted,
              isCurrent && [
                styles.stageIconCurrent,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ],
              isPending && styles.stageIconPending,
            ]}
          >
            {isCompleted ? (
              <CheckCircle size={32} color="#fff" strokeWidth={2.5} />
            ) : isCurrent ? (
              <Clock size={32} color="#fff" strokeWidth={2.5} />
            ) : (
              <View style={styles.stageDot} />
            )}
          </Animated.View>
          {index < stages.length - 1 && (
            <View style={styles.stageConnector}>
              <View
                style={[
                  styles.stageConnectorLine,
                  isCompleted && styles.stageConnectorCompleted,
                ]}
              />
            </View>
          )}
        </View>

        <View style={styles.stageContent}>
          <Text
            style={[
              styles.stageTitle,
              (isCompleted || isCurrent) && styles.stageTitleActive,
            ]}
          >
            {stage.title}
          </Text>
          {isCurrent && stage.estimatedMinutes > 0 && (
            <View style={styles.estimatedTimeContainer}>
              <Clock size={14} color={Colors.gold} />
              <Text style={styles.estimatedTimeText}>
                ~{stage.estimatedMinutes} {t('minutes') || 'min'}
              </Text>
            </View>
          )}
          {isCompleted && (
            <Text style={styles.completedText}>✓ {t('completed') || 'Completed'}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('orderTracking') || 'Order Tracking'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.orderInfoCard}>
          <View style={styles.orderInfoHeader}>
            <View>
              <Text style={styles.orderInfoLabel}>{t('orderNumber') || 'Order Number'}</Text>
              <Text style={styles.orderInfoValue}>#{orderId.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View style={styles.orderInfoDivider} />
            <View>
              <Text style={styles.orderInfoLabel}>{t('table') || 'Table'}</Text>
              <Text style={styles.orderInfoValue}>{tableNumber}</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Bell size={24} color={Colors.gold} />
            <Text style={styles.progressTitle}>
              {currentStatus === 'served'
                ? t('orderComplete') || 'Order Complete!'
                : t('orderInProgress') || 'Order in Progress'}
            </Text>
          </View>

          {currentStatus !== 'served' && (
            <View style={styles.estimatedTimeCard}>
              <ChefHat size={28} color="#3d0101" />
              <View style={styles.estimatedTimeInfo}>
                <Text style={styles.estimatedTimeLabel}>
                  {t('estimatedTime') || 'Estimated Time'}
                </Text>
                <Text style={styles.estimatedTimeValue}>
                  {totalEstimatedTime} {t('minutes') || 'minutes'}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressWidth,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressPercentage}>
              {Math.round((currentStageIndex / (stages.length - 1)) * 100)}%
            </Text>
          </View>
        </View>

        <View style={styles.stagesCard}>
          <Text style={styles.stagesTitle}>{t('orderProgress') || 'Order Progress'}</Text>
          {stages.map((stage, index) => renderStage(stage, index))}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📱</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>{t('stayUpdated') || 'Stay Updated'}</Text>
              <Text style={styles.infoDescription}>
                {t('stayUpdatedDesc') || 'We\'ll notify you when your order status changes.'}
              </Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🔔</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>{t('notifyWaiter') || 'Need Assistance?'}</Text>
              <Text style={styles.infoDescription}>
                {t('notifyWaiterDesc') || 'Press the call button to get help from our staff.'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.backToMenuButton}
          onPress={() => router.push('/menu')}
        >
          <Text style={styles.backToMenuButtonText}>
            {t('backToMenu') || 'Back to Menu'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDD0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#3d0101',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  orderInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
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
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  orderInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  orderInfoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600' as const,
    marginBottom: 4,
    textAlign: 'center' as const,
  },
  orderInfoValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#3d0101',
    textAlign: 'center' as const,
  },
  orderInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.gold,
    ...Platform.select({
      ios: {
        shadowColor: Colors.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(212, 175, 55, 0.2)',
      },
    }),
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  estimatedTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFDD0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(61, 1, 1, 0.1)',
  },
  estimatedTimeInfo: {
    flex: 1,
  },
  estimatedTimeLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  estimatedTimeValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#3d0101',
    letterSpacing: -0.5,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#3d0101',
    minWidth: 45,
    textAlign: 'right' as const,
  },
  stagesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
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
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  stagesTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 24,
  },
  stageContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stageIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  stageIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  stageIconCompleted: {
    backgroundColor: '#10B981',
  },
  stageIconCurrent: {
    backgroundColor: Colors.gold,
  },
  stageIconPending: {
    backgroundColor: '#F3F4F6',
  },
  stageDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
  },
  stageConnector: {
    width: 2,
    flex: 1,
    marginTop: 8,
    alignItems: 'center',
  },
  stageConnectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    minHeight: 40,
  },
  stageConnectorCompleted: {
    backgroundColor: '#10B981',
  },
  stageContent: {
    flex: 1,
    paddingTop: 16,
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  stageTitleActive: {
    color: '#1A1A1A',
    fontWeight: '700' as const,
  },
  estimatedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  estimatedTimeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.gold,
  },
  completedText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600' as const,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
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
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  infoItem: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
  },
  infoIcon: {
    fontSize: 32,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  backToMenuButton: {
    backgroundColor: '#3d0101',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  backToMenuButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
});

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Vibration, RefreshControl, ActivityIndicator, ImageBackground } from 'react-native';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';
import { AlertCircle, Bell, CheckCircle, Clock, ArrowLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { supabase } from '@/lib/supabase';

type ServiceRequest = {
  id: string;
  tableNumber: number;
  requestType: 'waiter' | 'bill' | 'wrong-order';
  status: 'pending' | 'in-progress' | 'resolved';
  message?: string;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
};

export default function ServiceRequestsAdminScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'resolved'>('all');
  const lastSeenIds = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data, isLoading, refetch } = trpc.serviceRequests.getAll.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const updateStatusMutation = trpc.serviceRequests.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const pendingCount = useMemo(() => (data ?? []).filter(r => r.status === 'pending').length, [data]);

  useEffect(() => {
    const channel = supabase
      .channel('service_requests_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_service_requests' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const id = (payload.new as any)?.id;
            if (id && !lastSeenIds.current.has(id)) {
              lastSeenIds.current.add(id);

              if (typeof window !== 'undefined' && audioRef.current) {
                try {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play();
                } catch (e) {
                  console.log('Audio play failed:', e);
                }
              }

              if (Platform.OS === 'ios' || Platform.OS === 'android') {
                Vibration.vibrate(300);
              }
            }
          }
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data;
    return data.filter(r => r.status === filter);
  }, [data, filter]);

  const handleUpdateStatus = (requestId: string, status: ServiceRequest['status']) => {
    updateStatusMutation.mutate({
      requestId,
      status,
      resolvedBy: status === 'resolved' ? 'Admin' : undefined,
    });
  };

  const getStatusColor = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'pending':
        return Colors.error;
      case 'in-progress':
        return Colors.warning;
      case 'resolved':
        return Colors.success;
      default:
        return Colors.textLight;
    }
  };

  const getRequestTypeLabel = (type: ServiceRequest['requestType']) => {
    switch (type) {
      case 'waiter':
        return 'Call Waiter';
      case 'bill':
        return 'Request Bill';
      case 'wrong-order':
        return 'Wrong Order';
      default:
        return type;
    }
  };

  const getRequestTypeIcon = (type: ServiceRequest['requestType']) => {
    switch (type) {
      case 'waiter':
        return Bell;
      case 'bill':
        return CheckCircle;
      case 'wrong-order':
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/juf3yljg9vndbtlpfh59p' }}
      style={styles.container}
      resizeMode="cover"
    >
      <Stack.Screen
        options={{
          title: 'Service Requests',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              {pendingCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{pendingCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      {typeof window !== 'undefined' && (
        <audio
          ref={(el) => (audioRef.current = el)}
          src="data:audio/wav;base64,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" 
          preload="auto"
        />
      )}

      <View style={styles.filterContainer}>
        {(['all', 'pending', 'in-progress', 'resolved'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterButtonText, filter === f && styles.filterButtonTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
            </Text>
            {f === 'pending' && pendingCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
      >
        {isLoading && !data ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredData.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={64} color={Colors.success} />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all'
                ? 'No service requests at the moment'
                : `No ${filter.replace('-', ' ')} requests`}
            </Text>
          </View>
        ) : (
          filteredData.map((request) => {
            const RequestIcon = getRequestTypeIcon(request.requestType);
            return (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestHeaderLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: `${getStatusColor(request.status)}20` }]}>
                      <RequestIcon size={24} color={getStatusColor(request.status)} />
                    </View>
                    <View>
                      <Text style={styles.tableText}>Table {request.tableNumber}</Text>
                      <Text style={styles.requestTypeText}>{getRequestTypeLabel(request.requestType)}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
                  </View>
                </View>

                {request.message && (
                  <Text style={styles.messageText}>{request.message}</Text>
                )}

                <View style={styles.timeContainer}>
                  <Clock size={14} color={Colors.textSecondary} />
                  <Text style={styles.timeText}>
                    {new Date(request.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {request.resolvedAt && (
                    <>
                      <Text style={styles.timeSeparator}>•</Text>
                      <Text style={styles.timeText}>
                        Resolved {new Date(request.resolvedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </>
                  )}
                </View>

                {request.status !== 'resolved' && (
                  <View style={styles.actionsContainer}>
                    {request.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonProgress]}
                        onPress={() => handleUpdateStatus(request.id, 'in-progress')}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Text style={styles.actionButtonText}>Start</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonResolve]}
                      onPress={() => handleUpdateStatus(request.id, 'resolved')}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Resolve</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerRight: {
    marginRight: 16,
  },
  headerBadge: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '700' as const,
  },
  filterBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  requestCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
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
    }),
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  requestTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  timeSeparator: {
    fontSize: 13,
    color: Colors.textLight,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonProgress: {
    backgroundColor: Colors.warning,
  },
  actionButtonResolve: {
    backgroundColor: Colors.success,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
});

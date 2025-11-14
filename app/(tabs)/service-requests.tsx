import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Bell, Check, X, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { useRealtime } from '@/contexts/RealtimeContext';
import { formatDistanceToNow } from 'date-fns';

export default function ServiceRequestsScreen() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');
  
  const serviceRequestsQuery = trpc.serviceRequests.getAll.useQuery({
    status: filter === 'all' ? 'all' : filter,
  }, {
    refetchInterval: 3000,
  });

  const updateStatusMutation = trpc.serviceRequests.updateStatus.useMutation({
    onSuccess: () => {
      serviceRequestsQuery.refetch();
    },
  });

  const { subscribeToServiceRequests } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribeToServiceRequests(() => {
      console.log('[ServiceRequests] Real-time update received');
      serviceRequestsQuery.refetch();
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeToServiceRequests, serviceRequestsQuery]);

  const handleResolve = (requestId: string) => {
    updateStatusMutation.mutate({
      requestId,
      status: 'resolved',
      resolvedBy: 'Staff',
    });
  };

  const handleMarkInProgress = (requestId: string) => {
    updateStatusMutation.mutate({
      requestId,
      status: 'in-progress',
    });
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'waiter':
        return Colors.primary;
      case 'bill':
        return Colors.gold;
      case 'assistance':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getRequestTypeIcon = (type: string) => {
    return '🔔';
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'داواکاریە خزمەتگوزارییەکان / Service Requests',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }}
      />

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterButtonText, filter === 'pending' && styles.filterButtonTextActive]}>
            چاوەڕوان / Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            هەموو / All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'resolved' && styles.filterButtonActive]}
          onPress={() => setFilter('resolved')}
        >
          <Text style={[styles.filterButtonText, filter === 'resolved' && styles.filterButtonTextActive]}>
            چارەسەرکراوە / Resolved
          </Text>
        </TouchableOpacity>
      </View>

      {serviceRequestsQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>باردەکرێت... / Loading service requests...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={serviceRequestsQuery.isRefetching}
              onRefresh={() => serviceRequestsQuery.refetch()}
              tintColor={Colors.primary}
            />
          }
        >
          {serviceRequestsQuery.data && serviceRequestsQuery.data.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={64} color={Colors.textLight} />
              <Text style={styles.emptyStateText}>هیچ داواکارییەک نییە / No service requests</Text>
              <Text style={styles.emptyStateSubtext}>هەموو داواکارییەکان چارەسەرکراون / All requests have been handled</Text>
            </View>
          ) : (
            serviceRequestsQuery.data?.map((request: any) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestHeaderLeft}>
                    <View
                      style={[
                        styles.requestTypeIndicator,
                        { backgroundColor: getRequestTypeColor(request.request_type) },
                      ]}
                    >
                      <Text style={styles.requestTypeIcon}>
                        {getRequestTypeIcon(request.request_type)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.requestTable}>میز / Table {request.table_number}</Text>
                      <Text style={styles.requestType}>{request.request_type === 'waiter' ? 'پێشخزمەتکار / Waiter' : request.request_type === 'bill' ? 'حیساب / Bill' : request.request_type}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      request.status === 'pending' && styles.statusBadgePending,
                      request.status === 'in-progress' && styles.statusBadgeInProgress,
                      request.status === 'resolved' && styles.statusBadgeResolved,
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{request.status}</Text>
                  </View>
                </View>

                {request.message && (
                  <Text style={styles.requestMessage}>{request.message}</Text>
                )}

                <View style={styles.requestFooter}>
                  <View style={styles.requestTime}>
                    <Clock size={14} color={Colors.textSecondary} />
                    <Text style={styles.requestTimeText}>
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </Text>
                  </View>

                  {request.status === 'pending' && (
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.inProgressButton]}
                        onPress={() => handleMarkInProgress(request.id)}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Clock size={16} color="#fff" />
                            <Text style={styles.actionButtonText}>بەردەوامە / In Progress</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.resolveButton]}
                        onPress={() => handleResolve(request.id)}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Check size={16} color="#fff" />
                            <Text style={styles.actionButtonText}>چارەسەرکردن / Resolve</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {request.status === 'in-progress' && (
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.resolveButton]}
                        onPress={() => handleResolve(request.id)}
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Check size={16} color="#fff" />
                            <Text style={styles.actionButtonText}>چارەسەرکردن / Resolve</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {request.resolved_by && request.resolved_at && (
                  <Text style={styles.resolvedInfo}>
                    چارەسەرکراوە لەلایەن / Resolved by {request.resolved_by} • {formatDistanceToNow(new Date(request.resolved_at), { addSuffix: true })}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  filterBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.backgroundGray,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  requestCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestTypeIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestTypeIcon: {
    fontSize: 24,
  },
  requestTable: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  requestType: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusBadgePending: {
    backgroundColor: Colors.error + '20',
  },
  statusBadgeInProgress: {
    backgroundColor: Colors.gold + '20',
  },
  statusBadgeResolved: {
    backgroundColor: Colors.success + '20',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
    textTransform: 'capitalize',
  },
  requestMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestTimeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  inProgressButton: {
    backgroundColor: Colors.gold,
  },
  resolveButton: {
    backgroundColor: Colors.success,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  resolvedInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

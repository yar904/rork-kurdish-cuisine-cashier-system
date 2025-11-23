import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from '@/components/CustomText';
import { Stack } from 'expo-router';
import { Bell, Table, CheckCircle2, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { TableGrid } from '@/components/tables/TableGrid';
import { TableDetailsModal } from '@/components/tables/TableDetailsModal';

export default function WaiterDashboard() {
  const insets = useSafeAreaInsets();
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedTableStatus, setSelectedTableStatus] = useState<string>('available');

  const requestsQuery = trpc.waiter.getRequests.useQuery(undefined, { refetchInterval: 3000 });
  const tablesQuery = trpc.tables.getAll.useQuery(undefined, { refetchInterval: 4000 });
  const orderQuery = trpc.orders.getByTable.useQuery(
    { tableNumber: selectedTable! },
    { enabled: selectedTable !== null, refetchInterval: 3000 }
  );

  const completeRequestMutation = trpc.waiter.completeRequest.useMutation({
    onSuccess: () => {
      requestsQuery.refetch();
      setCompletingId(null);
    },
    onError: () => {
      setCompletingId(null);
    },
  });

  const updateTableStatusMutation = trpc.tables.updateStatus.useMutation({
    onSuccess: () => {
      tablesQuery.refetch();
    },
  });

  const updateItemQtyMutation = trpc.orders.updateItemQty.useMutation({
    onSuccess: () => {
      orderQuery.refetch();
    },
  });

  const handleCompleteRequest = async (requestId: string) => {
    setCompletingId(requestId);
    await completeRequestMutation.mutateAsync({ requestId });
  };

  const handleTablePress = (tableNumber: number) => {
    const table = tablesQuery.data?.find((t: any) => t.number === tableNumber);
    setSelectedTable(tableNumber);
    setSelectedTableStatus(table?.status || 'available');
  };

  const handleCloseModal = () => {
    setSelectedTable(null);
  };

  const handleUpdateStatus = async (status: string) => {
    if (selectedTable) {
      await updateTableStatusMutation.mutateAsync({
        tableNumber: selectedTable,
        status,
      });
      setSelectedTableStatus(status);
    }
  };

  const handleUpdateItemQty = async (itemId: string, quantity: number) => {
    await updateItemQtyMutation.mutateAsync({ itemId, quantity });
  };

  const handleRemoveItem = async (itemId: string) => {
    await updateItemQtyMutation.mutateAsync({ itemId, quantity: 0 });
  };

  const handleRefreshOrder = () => {
    orderQuery.refetch();
    tablesQuery.refetch();
  };

  const getTimeSince = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    return `${minutes}m ago`;
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'waiter': return 'Call Waiter';
      case 'bill': return 'Request Bill';
      case 'wrong-order': return 'Wrong Order';
      default: return type;
    }
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'waiter': return '#3B82F6';
      case 'bill': return '#10B981';
      case 'wrong-order': return '#EF4444';
      default: return '#8E8E93';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'Manager',
          headerStyle: { backgroundColor: '#5C0000' },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={requestsQuery.isRefetching}
            onRefresh={() => {
              requestsQuery.refetch();
              tablesQuery.refetch();
            }}
            tintColor="#5C0000"
          />
        }
      >
        <View style={styles.header}>
          <Bell size={32} color="#5C0000" />
          <Text style={styles.headerTitle}>Manager Dashboard</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Service Requests</Text>
            <View style={[styles.badge, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.badgeText}>{requestsQuery.data?.length || 0}</Text>
            </View>
          </View>

          {requestsQuery.isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#5C0000" />
            </View>
          )}

          {!requestsQuery.isLoading && requestsQuery.data?.length === 0 && (
            <View style={styles.emptySection}>
              <CheckCircle2 size={48} color="#10B981" />
              <Text style={styles.emptyText}>All requests handled!</Text>
            </View>
          )}

          {requestsQuery.data && requestsQuery.data.length > 0 && (
            <View style={styles.requestsContainer}>
              {requestsQuery.data.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View>
                      <Text style={styles.tableNumber}>Table {request.tableNumber}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: getRequestTypeColor(request.requestType) + '20' }]}>
                        <Text style={[styles.typeText, { color: getRequestTypeColor(request.requestType) }]}>
                          {getRequestTypeLabel(request.requestType)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.requestTime}>
                      <Clock size={16} color="#8E8E93" />
                      <Text style={styles.timeText}>{getTimeSince(request.createdAt)}</Text>
                    </View>
                  </View>

                  {request.message && (
                    <Text style={styles.requestMessage}>{request.message}</Text>
                  )}

                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleCompleteRequest(request.id)}
                    disabled={completingId === request.id}
                    activeOpacity={0.8}
                  >
                    {completingId === request.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <CheckCircle2 size={16} color="#FFFFFF" />
                        <Text style={styles.completeButtonText}>Mark as Served</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tables Overview</Text>
          </View>

          <TableGrid
            tables={tablesQuery.data?.map((t: any) => ({
              table_number: t.number,
              status: t.status,
              order_total: t.current_order_id ? 0 : null,
              created_at: t.updated_at,
            })) || []}
            isLoading={tablesQuery.isLoading}
            isRefreshing={tablesQuery.isRefetching}
            onRefresh={() => tablesQuery.refetch()}
            onTablePress={handleTablePress}
          />
        </View>
      </ScrollView>

      <TableDetailsModal
        visible={selectedTable !== null}
        onClose={handleCloseModal}
        tableNumber={selectedTable || 0}
        tableStatus={selectedTableStatus}
        order={orderQuery.data}
        isLoading={orderQuery.isLoading}
        onUpdateStatus={handleUpdateStatus}
        onUpdateItemQty={handleUpdateItemQty}
        onRemoveItem={handleRemoveItem}
        onRefreshOrder={handleRefreshOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6EEDD',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginTop: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptySection: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  requestsContainer: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tableNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  requestTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  requestMessage: {
    fontSize: 14,
    color: '#3A3A3A',
    marginBottom: 12,
    fontStyle: 'italic' as const,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Vibration,
  RefreshControl,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
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
    onSuccess: () => refetch(),
  });

  const pendingCount = useMemo(() => (data ?? []).filter(r => r.status === 'pending').length, [data]);

  // ✅ Realtime listener (Supabase)
  useEffect(() => {
    const channel = supabase
      .channel('service_requests_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_service_requests' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const id = (payload.new as any)?.id;
          if (id && !lastSeenIds.current.has(id)) {
            lastSeenIds.current.add(id);

            if (typeof window !== 'undefined' && audioRef.current) {
              try {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
              } catch {}
            }

            if (Platform.OS !== 'web') Vibration.vibrate(250);
          }
        }
        refetch();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [refetch]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return filter === 'all' ? data : data.filter(r => r.status === filter);
  }, [data, filter]);

  const handleUpdateStatus = (requestId: string, status: ServiceRequest['status']) => {
    updateStatusMutation.mutate({
      requestId,
      status,
      resolvedBy: status === 'resolved' ? 'Admin' : undefined,
    });
  };

  const getStatusColor = (status: ServiceRequest['status']) =>
    status === 'pending'
      ? Colors.error
      : status === 'in-progress'
      ? Colors.warning
      : Colors.success;

  const getRequestTypeLabel = (type: ServiceRequest['requestType']) =>
    type === 'waiter' ? 'Call Waiter' : type === 'bill' ? 'Request Bill' : 'Wrong Order';

  const getRequestTypeIcon = (type: ServiceRequest['requestType']) =>
    type === 'waiter' ? Bell : type === 'bill' ? CheckCircle : AlertCircle;

  return (
    <ImageBackground
      source={require('@/assets/patterns/citadelPattern.png')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* ✅ Header */}
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

      {/* ✅ Audio Alert */}
      {typeof window !== 'undefined' && (
        <audio
          ref={(el) => (audioRef.current = el)}
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBh..."
          preload="auto"
        />
      )}

      {/* ✅ Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'in-progress', 'resolved'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
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

      {/* ✅ Main List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
      >
        {isLoading && !data ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredData.length === 0 ? (
          <View style={styles.empty}>
            <CheckCircle size={64} color={Colors.success} />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' ? 'No service requests right now' : `No ${filter.replace('-', ' ')} requests`}
            </Text>
          </View>
        ) : (
          filteredData.map((req) => {
            const Icon = getRequestTypeIcon(req.requestType);
            return (
              <View key={req.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.left}>
                    <View style={[styles.iconBox, { backgroundColor: `${getStatusColor(req.status)}20` }]}>
                      <Icon size={22} color={getStatusColor(req.status)} />
                    </View>
                    <View>
                      <Text style={styles.table}>Table {req.tableNumber}</Text>
                      <Text style={styles.type}>{getRequestTypeLabel(req.requestType)}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(req.status) }]}>
                    <Text style={styles.statusText}>{req.status.toUpperCase()}</Text>
                  </View>
                </View>

                {req.message && <Text style={styles.message}>{req.message}</Text>}

                <View style={styles.time}>
                  <Clock size={14} color={Colors.textSecondary} />
                  <Text style={styles.timeText}>
                    {new Date(req.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {req.status !== 'resolved' && (
                  <View style={styles.actions}>
                    {req.status === 'pending' && (
                      <TouchableOpacity
                        style={[styles.btn, styles.btnProgress]}
                        onPress={() => handleUpdateStatus(req.id, 'in-progress')}
                      >
                        <Text style={styles.btnText}>Start</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.btn, styles.btnResolve]}
                      onPress={() => handleUpdateStatus(req.id, 'resolved')}
                    >
                      <CheckCircle size={16} color="#fff" />
                      <Text style={styles.btnText}>Resolve</Text>
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
  container: { flex: 1, backgroundColor: '#1A0B0B' },
  backButton: { padding: 8, marginLeft: 8 },
  headerRight: { marginRight: 16 },
  headerBadge: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#2B1616',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    borderBottomColor: '#3A1E1E',
    borderBottomWidth: 1,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#3A1E1E',
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterButtonActive: { backgroundColor: Colors.primary },
  filterButtonText: { color: '#E8E8E8', fontSize: 13, fontWeight: '600' },
  filterButtonTextActive: { color: '#fff', fontWeight: '700' },
  filterBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    paddingHorizontal: 5,
    marginLeft: 6,
  },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  empty: { flex: 1, alignItems: 'center', paddingVertical: 100 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 16 },
  emptySubtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: '#2B1616',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3A1E1E',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 },
    }),
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  table: { fontSize: 17, fontWeight: '700', color: '#FFF3D8' },
  type: { fontSize: 13, color: '#E1D1A6' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  message: { fontSize: 14, color: '#E8E8E8', marginBottom: 10, lineHeight: 20 },
  time: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { color: Colors.textSecondary, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  btnProgress: { backgroundColor: Colors.warning },
  btnResolve: { backgroundColor: Colors.success },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
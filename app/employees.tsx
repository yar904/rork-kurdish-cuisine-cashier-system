import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Users, Plus, Clock, Calendar, TrendingUp, Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';

export default function EmployeesScreen() {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    hourlyRate: '',
  });

  const employeesQuery = trpc.employees.getAll.useQuery();
  const createMutation = trpc.employees.create.useMutation({
    onSuccess: () => {
      employeesQuery.refetch();
      setShowAddModal(false);
      setNewEmployee({ name: '', role: '', phone: '', email: '', hourlyRate: '' });
      Alert.alert('Success', 'Employee added successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const deleteMutation = trpc.employees.delete.useMutation({
    onSuccess: () => {
      employeesQuery.refetch();
      Alert.alert('Success', 'Employee deleted successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.role || !newEmployee.hourlyRate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    createMutation.mutate({
      name: newEmployee.name,
      role: newEmployee.role,
      phone: newEmployee.phone,
      email: newEmployee.email,
      hourlyRate: parseFloat(newEmployee.hourlyRate),
    });
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate({ id }) },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (employeesQuery.isLoading) {
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
          title: 'Employee Management',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Employees</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Employee</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Users size={20} color={Colors.primary} />
            <Text style={styles.statValue}>{employeesQuery.data?.length || 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={20} color="#10b981" />
            <Text style={styles.statValue}>
              {employeesQuery.data?.filter(e => e.status === 'active').length || 0}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {employeesQuery.data?.map((employee) => (
          <View key={employee.id} style={styles.employeeCard}>
            <View style={styles.employeeHeader}>
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{employee.name}</Text>
                <Text style={styles.employeeRole}>{employee.role}</Text>
                <View style={styles.statusBadge}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(employee.status) },
                    ]}
                  />
                  <Text style={styles.statusText}>{employee.status}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDeleteEmployee(employee.id, employee.name)}
                >
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.employeeDetails}>
              {employee.phone && (
                <Text style={styles.detailText}>📱 {employee.phone}</Text>
              )}
              {employee.email && (
                <Text style={styles.detailText}>📧 {employee.email}</Text>
              )}
              <Text style={styles.detailText}>
                💰 ${employee.hourly_rate}/hour
              </Text>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push({ pathname: '/clock-in-out', params: { employeeId: employee.id, name: employee.name }})}
              >
                <Clock size={16} color={Colors.primary} />
                <Text style={styles.quickActionText}>Clock In/Out</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push({ pathname: '/employee-shifts', params: { employeeId: employee.id, name: employee.name }})}
              >
                <Calendar size={16} color={Colors.primary} />
                <Text style={styles.quickActionText}>Shifts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => router.push({ pathname: '/employee-metrics', params: { employeeId: employee.id, name: employee.name }})}
              >
                <TrendingUp size={16} color={Colors.primary} />
                <Text style={styles.quickActionText}>Metrics</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Employee</Text>

            <TextInput
              style={styles.input}
              placeholder="Name *"
              value={newEmployee.name}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Role *"
              value={newEmployee.role}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, role: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={newEmployee.phone}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, phone: text })}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={newEmployee.email}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Hourly Rate *"
              value={newEmployee.hourlyRate}
              onChangeText={(text) => setNewEmployee({ ...newEmployee, hourlyRate: text })}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddEmployee}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Add Employee</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    backgroundColor: Colors.background,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '600' as const,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  employeeCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  employeeRole: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600' as const,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'capitalize' as const,
    fontWeight: '600' as const,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  employeeDetails: {
    gap: 6,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.backgroundGray,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: Colors.cardBackground,
    color: Colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.backgroundGray,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});

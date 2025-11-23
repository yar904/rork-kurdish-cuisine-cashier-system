import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Modal } from 'react-native';
import { Text } from '@/components/CustomText';
import { QrCode, X, Download } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';

interface TableQRProps {
  onBack: () => void;
}

export function TableQRManagement({ onBack }: TableQRProps) {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const tablesQuery = trpc.tables.getAll.useQuery();

  const generateQRUrl = (tableNumber: number) => {
    if (Platform.OS === 'web') {
      return `${window.location.origin}/qr/${tableNumber}`;
    }
    return `https://yourapp.com/qr/${tableNumber}`;
  };

  const getQRCodeDataURL = (text: string) => {
    if (Platform.OS === 'web') {
      return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
  };

  const handleDownload = (tableNumber: number) => {
    const url = generateQRUrl(tableNumber);
    const qrUrl = getQRCodeDataURL(url);
    
    if (Platform.OS === 'web') {
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = `table-${tableNumber}-qr.png`;
      link.click();
    } else {
      console.log('Download QR for table:', tableNumber);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <X size={24} color="#3A3A3A" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Table QR Codes</Text>
          <Text style={styles.headerSubtitle}>Generate QR codes for customer ordering</Text>
        </View>
      </View>

      {tablesQuery.isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5C0000" />
        </View>
      )}

      {!tablesQuery.isLoading && tablesQuery.data && (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.grid}>
            {tablesQuery.data.map((table: any) => (
              <View key={table.number} style={styles.tableCard}>
                <View style={styles.qrContainer}>
                  <QrCode size={120} color="#5C0000" strokeWidth={1.5} />
                  <View style={styles.qrOverlay}>
                    <Text style={styles.tableNumber}>{table.number}</Text>
                  </View>
                </View>

                <Text style={styles.tableName}>Table {table.number}</Text>
                <Text style={styles.tableUrl}>{generateQRUrl(table.number)}</Text>

                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => handleDownload(table.number)}
                  activeOpacity={0.8}
                >
                  <Download size={16} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Download QR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={() => setSelectedTable(table.number)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.previewButtonText}>Preview</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={selectedTable !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedTable(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedTable(null)}
            >
              <X size={24} color="#3A3A3A" />
            </TouchableOpacity>

            {selectedTable && (
              <>
                <Text style={styles.modalTitle}>Table {selectedTable} QR Code</Text>
                <View style={styles.qrPreview}>
                  <img
                    src={getQRCodeDataURL(generateQRUrl(selectedTable))}
                    alt={`QR Code for Table ${selectedTable}`}
                    style={{ width: 300, height: 300 }}
                  />
                </View>
                <Text style={styles.modalUrl}>{generateQRUrl(selectedTable)}</Text>
                <TouchableOpacity
                  style={styles.modalDownloadButton}
                  onPress={() => {
                    handleDownload(selectedTable);
                    setSelectedTable(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Download size={20} color="#FFFFFF" />
                  <Text style={styles.modalDownloadText}>Download QR Code</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6EEDD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F6EEDD',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  tableCard: {
    flex: 1,
    minWidth: 200,
    maxWidth: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
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
  qrContainer: {
    position: 'relative',
    padding: 16,
    backgroundColor: '#F6EEDD',
    borderRadius: 12,
  },
  qrOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableNumber: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#5C0000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tableName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  tableUrl: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#5C0000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  previewButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5C0000',
    width: '100%',
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#5C0000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 20,
    maxWidth: 500,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
      },
    }),
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F6EEDD',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  qrPreview: {
    padding: 20,
    backgroundColor: '#F6EEDD',
    borderRadius: 12,
  },
  modalUrl: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  modalDownloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#5C0000',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  modalDownloadText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});

import { Platform, Share, Alert } from 'react-native';
import { Order } from '@/types/restaurant';
import { formatPrice } from '@/constants/currency';

export type PrinterType = 'thermal' | 'document' | 'share';

export interface PrinterConfig {
  type: PrinterType;
  width?: number;
  encoding?: string;
}

export interface ReceiptData {
  order: Order;
  restaurantName: string;
  address?: string;
  phone?: string;
  taxId?: string;
}

export interface ReportData {
  title: string;
  period: string;
  dateRange: string;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    paidRevenue?: number;
    paidOrders?: number;
  };
  items?: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  categories?: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  peakHours?: Array<{
    label: string;
    revenue: number;
  }>;
}

export class PrinterService {
  private config: PrinterConfig;

  constructor(config: PrinterConfig = { type: 'share' }) {
    this.config = config;
  }

  async printReceipt(data: ReceiptData): Promise<void> {
    const content = this.generateReceiptContent(data);
    return this.print(content, `Receipt-${data.order.id}`);
  }

  async printKitchenTicket(data: ReceiptData): Promise<void> {
    const content = this.generateKitchenTicketContent(data);
    return this.print(content, `Kitchen-${data.order.id}`);
  }

  async printReport(data: ReportData): Promise<void> {
    const content = this.generateReportContent(data);
    return this.print(content, `Report-${data.period}`);
  }

  private async print(content: string, filename: string): Promise<void> {
    switch (this.config.type) {
      case 'thermal':
        return this.printThermal(content, filename);
      case 'document':
        return this.printDocument(content, filename);
      case 'share':
      default:
        return this.printViaShare(content, filename);
    }
  }

  private async printThermal(content: string, filename: string): Promise<void> {
    if (Platform.OS === 'web') {
      Alert.alert('Web Platform', 'Thermal printing requires WebUSB or WebBluetooth API. Using share instead.');
      return this.printViaShare(content, filename);
    }

    console.log('Thermal print:', content);
    Alert.alert(
      'Thermal Printer',
      'Connect to your thermal printer via Bluetooth or USB. Print content has been logged.',
      [
        {
          text: 'Share Instead',
          onPress: () => this.printViaShare(content, filename),
        },
        { text: 'OK' },
      ]
    );
  }

  private async printDocument(content: string, filename: string): Promise<void> {
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${filename}</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  white-space: pre-wrap;
                  padding: 20px;
                  font-size: 12px;
                }
                @media print {
                  body { padding: 0; }
                }
              </style>
            </head>
            <body>${content}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
      return;
    }

    return this.printViaShare(content, filename);
  }

  private async printViaShare(content: string, filename: string): Promise<void> {
    try {
      await Share.share({
        message: content,
        title: filename,
      });
    } catch (error) {
      console.error('Print/Share error:', error);
      Alert.alert('Error', 'Failed to share print content');
    }
  }

  private generateReceiptContent(data: ReceiptData): string {
    const { order, restaurantName, address, phone, taxId } = data;
    const width = this.config.width || 42;
    
    let receipt = '';
    
    receipt += this.center(restaurantName.toUpperCase(), width) + '\n';
    if (address) receipt += this.center(address, width) + '\n';
    if (phone) receipt += this.center(`Tel: ${phone}`, width) + '\n';
    if (taxId) receipt += this.center(`Tax ID: ${taxId}`, width) + '\n';
    receipt += this.line('=', width) + '\n';
    
    receipt += `Date: ${new Date(order.createdAt).toLocaleString()}\n`;
    receipt += `Order: ${order.id}\n`;
    receipt += `Table: ${order.tableNumber}\n`;
    if (order.waiterName) receipt += `Waiter: ${order.waiterName}\n`;
    receipt += this.line('-', width) + '\n';
    
    receipt += this.formatLine('Item', 'Qty', 'Price', width) + '\n';
    receipt += this.line('-', width) + '\n';
    
    order.items.forEach(item => {
      const name = this.truncate(item.menuItem.name, 20);
      const qty = `x${item.quantity}`;
      const price = formatPrice(item.menuItem.price * item.quantity);
      
      receipt += this.formatLine(name, qty, price, width) + '\n';
      
      if (item.notes) {
        receipt += `  Note: ${item.notes}\n`;
      }
    });
    
    receipt += this.line('-', width) + '\n';
    receipt += this.formatLine('TOTAL', '', formatPrice(order.total), width, true) + '\n';
    
    if (order.splitInfo) {
      receipt += '\n';
      receipt += `Split: ${order.splitInfo.totalPeople} people\n`;
      receipt += `Per person: ${formatPrice(order.splitInfo.amountPerPerson)}\n`;
    }
    
    receipt += this.line('=', width) + '\n';
    receipt += this.center('Thank you!', width) + '\n';
    receipt += this.center('Please come again', width) + '\n';
    receipt += '\n\n\n';
    
    return receipt;
  }

  private generateKitchenTicketContent(data: ReceiptData): string {
    const { order } = data;
    const width = this.config.width || 42;
    
    let ticket = '';
    
    ticket += this.line('=', width) + '\n';
    ticket += this.center('KITCHEN ORDER', width) + '\n';
    ticket += this.line('=', width) + '\n';
    
    ticket += `Order: ${order.id}\n`;
    ticket += `Table: ${order.tableNumber}\n`;
    ticket += `Time: ${new Date(order.createdAt).toLocaleTimeString()}\n`;
    if (order.waiterName) ticket += `Waiter: ${order.waiterName}\n`;
    
    ticket += this.line('=', width) + '\n';
    
    order.items.forEach(item => {
      ticket += `\n[${item.quantity}x] ${item.menuItem.name}\n`;
      ticket += `     ${item.menuItem.nameKurdish}\n`;
      
      if (item.notes) {
        ticket += `     ** ${item.notes} **\n`;
      }
    });
    
    ticket += '\n' + this.line('=', width) + '\n';
    ticket += '\n\n\n';
    
    return ticket;
  }

  private generateReportContent(data: ReportData): string {
    const width = this.config.width || 60;
    
    let report = '';
    
    report += this.line('=', width) + '\n';
    report += this.center(data.title.toUpperCase(), width) + '\n';
    report += this.line('=', width) + '\n';
    report += '\n';
    
    report += `Period: ${data.period}\n`;
    report += `${data.dateRange}\n`;
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += '\n';
    
    report += this.line('-', width) + '\n';
    report += this.center('SUMMARY', width) + '\n';
    report += this.line('-', width) + '\n';
    report += `Total Revenue:       ${formatPrice(data.summary.totalRevenue)}\n`;
    report += `Total Orders:        ${data.summary.totalOrders}\n`;
    report += `Avg Order Value:     ${formatPrice(data.summary.averageOrderValue)}\n`;
    
    if (data.summary.paidRevenue !== undefined) {
      report += `Paid Revenue:        ${formatPrice(data.summary.paidRevenue)}\n`;
      report += `Paid Orders:         ${data.summary.paidOrders || 0}\n`;
    }
    
    if (data.items && data.items.length > 0) {
      report += '\n';
      report += this.line('-', width) + '\n';
      report += this.center('TOP SELLING ITEMS', width) + '\n';
      report += this.line('-', width) + '\n';
      
      data.items.forEach((item, index) => {
        report += `${index + 1}. ${item.name}\n`;
        report += `   Qty: ${item.quantity}  Revenue: ${formatPrice(item.revenue)}\n`;
      });
    }
    
    if (data.categories && data.categories.length > 0) {
      report += '\n';
      report += this.line('-', width) + '\n';
      report += this.center('CATEGORY BREAKDOWN', width) + '\n';
      report += this.line('-', width) + '\n';
      
      data.categories.forEach(cat => {
        report += `${cat.category}\n`;
        report += `  ${formatPrice(cat.revenue)} (${cat.percentage}%)\n`;
      });
    }
    
    if (data.peakHours && data.peakHours.length > 0) {
      report += '\n';
      report += this.line('-', width) + '\n';
      report += this.center('PEAK HOURS', width) + '\n';
      report += this.line('-', width) + '\n';
      
      data.peakHours.forEach(peak => {
        report += `${peak.label}: ${formatPrice(peak.revenue)}\n`;
      });
    }
    
    report += '\n';
    report += this.line('=', width) + '\n';
    report += '\n\n\n';
    
    return report;
  }

  private line(char: string, width: number): string {
    return char.repeat(width);
  }

  private center(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private formatLine(col1: string, col2: string, col3: string, width: number, bold: boolean = false): string {
    const col1Width = 20;
    const col2Width = 6;
    const col3Width = width - col1Width - col2Width - 2;
    
    const formatted = 
      this.padRight(col1, col1Width) + ' ' +
      this.padRight(col2, col2Width) + ' ' +
      this.padLeft(col3, col3Width);
    
    return bold ? formatted.toUpperCase() : formatted;
  }

  private padRight(text: string, width: number): string {
    return text.length >= width 
      ? text.substring(0, width)
      : text + ' '.repeat(width - text.length);
  }

  private padLeft(text: string, width: number): string {
    return text.length >= width
      ? text.substring(0, width)
      : ' '.repeat(width - text.length) + text;
  }
}

export const printerService = new PrinterService({ type: 'share' });

export const printOrderReceipt = (order: Order, restaurantInfo: {
  name: string;
  address?: string;
  phone?: string;
  taxId?: string;
}) => {
  return printerService.printReceipt({
    order,
    restaurantName: restaurantInfo.name,
    address: restaurantInfo.address,
    phone: restaurantInfo.phone,
    taxId: restaurantInfo.taxId,
  });
};

export const printKitchenTicket = (order: Order, restaurantName: string) => {
  return printerService.printKitchenTicket({
    order,
    restaurantName,
  });
};

export const printDailyReport = (reportData: ReportData) => {
  return printerService.printReport(reportData);
};

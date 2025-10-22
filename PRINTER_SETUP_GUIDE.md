# Printer Setup Guide for Restaurant System

This guide explains how to set up printing for receipts and reports in your restaurant management system.

## Overview

The system supports multiple printing methods:

1. **Share/Export** (Default) - Works on all platforms
2. **Web Printing** - Browser-based printing for documents
3. **Thermal Printing** - For receipt printers (requires additional setup)

## Current Implementation

### Features

- **Receipt Printing**: Print customer receipts with order details, totals, and restaurant info
- **Kitchen Tickets**: Print kitchen orders with item quantities and special notes
- **Report Printing**: Print daily, weekly, monthly sales reports
- **Multi-format Support**: PDF, CSV, and text formats

### Printing Locations

1. **Cashier Screen**: After submitting an order, you can print:
   - Customer receipt
   - Kitchen ticket

2. **Kitchen Screen**: Print button on each order card for kitchen tickets

3. **Reports Screen**: Print button for sales reports (with CSV and PDF export options)

## Setup Options

### Option 1: Share/Export (Current - No Setup Required)

The system uses React Native's Share API to export print content. This works on all platforms:

- **Mobile**: Opens share sheet to send via messaging apps, email, or save to files
- **Web**: Downloads as text file or shows share dialog

**Advantages**:
- Works immediately, no setup required
- Cross-platform compatible
- Can be printed from any device

### Option 2: Web Browser Printing

For web-based use, the system automatically uses `window.print()` in document mode:

1. Open the app in a web browser
2. Click Print on any receipt or report
3. Use browser's print dialog to:
   - Print to connected printer
   - Save as PDF
   - Configure print settings

**Configuration in code**:
```typescript
const printerService = new PrinterService({ 
  type: 'document' 
});
```

### Option 3: Thermal Receipt Printers (ESC/POS)

For proper thermal printer integration, you need to add native printer packages:

#### Android Setup

1. **Install React Native Bluetooth/USB packages**:
   ```bash
   # For Bluetooth printers
   expo install expo-bluetooth
   
   # Or for USB printers on Android
   npm install react-native-usb-serialport
   ```

2. **Update printer service** (lib/printer.ts):
   ```typescript
   // Import your printer package
   import ThermalPrinter from 'react-native-thermal-printer';
   
   private async printThermal(content: string, filename: string): Promise<void> {
     try {
       await ThermalPrinter.printText(content);
     } catch (error) {
       Alert.alert('Printer Error', 'Failed to print');
     }
   }
   ```

3. **Configure in app**:
   ```typescript
   const printerService = new PrinterService({ 
     type: 'thermal',
     width: 48  // Thermal printer width in characters
   });
   ```

#### iOS Setup

iOS requires thermal printers that support AirPrint or specific SDKs:

1. **For AirPrint-compatible printers**: Use `document` mode (works automatically)

2. **For specific printer brands** (Epson, Star, etc.):
   ```bash
   # Example for Star printers
   npm install react-native-star-prnt
   ```

#### Popular Thermal Printer Packages

Choose based on your hardware:

- **Star Micronics**: `react-native-star-prnt`
- **Epson**: `react-native-esc-pos-printer`
- **Generic ESC/POS**: `react-native-thermal-printer`
- **Bluetooth**: `react-native-thermal-receipt-printer-image-qr-code`

## Printer Configuration

### Restaurant Information

Update restaurant details in the print functions:

**In Cashier screen** (app/(tabs)/cashier.tsx):
```typescript
await printOrderReceipt(order, {
  name: 'Your Restaurant Name',
  address: 'Your Full Address',
  phone: '+964 XXX XXX XXXX',
  taxId: 'YOUR-TAX-ID',
});
```

### Receipt Width

Adjust receipt width for your printer in lib/printer.ts:

```typescript
const printerService = new PrinterService({ 
  type: 'thermal',
  width: 42  // Standard thermal printer
  // width: 48  // Wide thermal printer
  // width: 32  // Small thermal printer
});
```

## Testing Printing

### Test on Web
1. Open app in web browser
2. Create a test order
3. Submit order and click "Print Receipt"
4. Browser print dialog should appear

### Test on Mobile
1. Build and install app on device
2. Create a test order
3. Submit and select print option
4. Share sheet should appear with export options

## Recommended Printers for Restaurants

### Budget Option ($50-$100)
- **Generic 58mm/80mm ESC/POS printers**
- Bluetooth or USB connection
- Works with generic packages

### Professional Option ($200-$500)
- **Star Micronics TSP143III** - USB/Bluetooth, reliable
- **Epson TM-T88VI** - Industry standard, very fast
- **Star Micronics mPOP** - Combined cash drawer and printer

### Setup Considerations

1. **Connection Type**:
   - **Bluetooth**: More flexible, no cables, but requires pairing
   - **USB**: More reliable, faster, but needs cable
   - **Network/WiFi**: Best for multiple devices, easiest to integrate

2. **Paper Width**:
   - 58mm: Compact, good for receipts
   - 80mm: Standard, easier to read, more info

3. **Integration**:
   - AirPrint (iOS): No extra code needed
   - ESC/POS (Android): Requires package installation
   - Network printing: Works on both platforms easily

## Manual Printing Workflow

If automatic printing is not set up, staff can:

1. Submit order as usual
2. Click "Print Receipt" or "Print Kitchen"
3. Share content via:
   - WhatsApp to printer station
   - Email to office
   - Save to files and print later
   - Send to another device with printer access

## Network Printer Setup (Recommended for Multi-Device)

For restaurants with multiple iPads/tablets:

1. **Get a network-connected receipt printer**
   - Star Micronics with CloudPRNT
   - Epson with ePOS
   - Generic printer with print server

2. **Connect printer to WiFi**

3. **Install network printing package**:
   ```bash
   npm install react-native-network-printer
   ```

4. **Configure in app**:
   ```typescript
   import { NetworkPrinter } from 'react-native-network-printer';
   
   NetworkPrinter.printText('192.168.1.100', 9100, content);
   ```

## Support

The current implementation provides a solid foundation. For production use with actual thermal printers:

1. Identify your printer model
2. Install appropriate package from npm
3. Update `lib/printer.ts` with printer-specific code
4. Test thoroughly with your equipment

## Future Enhancements

Potential improvements:

- Auto-detect available printers
- Remember printer selection
- Print queue management
- Print preview before sending
- Reprint old orders
- Custom receipt templates
- QR codes for order tracking
- Logo/image printing

---

**Note**: The current system uses share/export which works universally. For automatic printing to thermal printers, additional native packages and hardware-specific setup is required.

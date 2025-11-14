# Financial Reports System - Complete Guide

## Overview
The POS now includes comprehensive financial reporting with profit margin tracking, cost analysis, and employee performance metrics. This enables restaurant owners to track profitability, identify best-selling items, and make data-driven business decisions.

## What's Been Added

### 1. Database Changes ✅
**Added cost tracking column to menu_items table**

- New `cost` column stores the purchase/ingredient cost of each menu item
- Enables automatic profit margin calculations
- Default cost set to 30% of selling price (update with actual costs)

**Migration SQL**: Run `backend/DATABASE_MIGRATION_COST_TRACKING.sql` on your Supabase database

```sql
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Update existing items with estimated cost
UPDATE menu_items 
SET cost = price * 0.3 
WHERE cost = 0 OR cost IS NULL;
```

### 2. Backend API Endpoints ✅

#### Financial Report Endpoint
**`/api/trpc/reports.financial`**

Returns comprehensive financial data:
- **Revenue Metrics**: Total revenue, paid revenue, average order value
- **Cost Analysis**: Total costs (ingredients + labor), gross profit, net profit
- **Profit Margins**: Overall margin percentage, per-item margins, category margins
- **Top Performers**: Most profitable items (by profit amount)
- **Best Margins**: Items with highest profit percentage
- **Category Breakdown**: Performance by menu category
- **Daily Trends**: Day-by-day financial performance
- **Labor Costs**: Employee hours worked and wages paid

**Example Response:**
```typescript
{
  period: { startDate, endDate },
  summary: {
    totalRevenue: 1250000,      // Total sales
    totalCost: 375000,           // Ingredient costs
    totalProfit: 875000,         // Gross profit (revenue - cost)
    netProfit: 675000,           // Net profit (gross - labor)
    overallMargin: 70.0,         // Profit margin %
    totalOrders: 45,
    averageOrderValue: 27777,
    laborCost: 200000            // Employee wages
  },
  topProfitableItems: [
    {
      id: '1',
      name: 'Kabab Teka',
      quantity: 25,
      revenue: 625000,
      cost: 187500,
      profit: 437500,
      margin: 70.0                // 70% profit margin
    }
  ],
  topMarginItems: [...],         // Best margin % (min 3 orders)
  categoryBreakdown: [
    {
      category: 'Kebabs',
      revenue: 550000,
      cost: 165000,
      profit: 385000,
      margin: 70.0
    }
  ],
  dailyFinancials: [
    {
      date: '2025-01-14',
      revenue: 250000,
      cost: 75000,
      profit: 175000,
      orders: 10,
      margin: 70.0
    }
  ]
}
```

#### Employee Performance Endpoint
**`/api/trpc/reports.employeePerformance`**

Tracks staff performance:
- **Waiter Performance**: Orders handled, revenue generated, average order value
- **Employee Hours**: Total hours worked per employee
- **Shift Statistics**: Number of shifts, total earnings
- **Labor Cost Summary**: Total wages paid during period

### 3. Reports Dashboard UI ✅

Enhanced `/reports` screen with:

**Financial Summary Cards:**
- Total Revenue
- Total Cost  
- Gross Profit
- Profit Margin %
- Total Orders
- Net Profit (after labor costs)

**Top Profitable Items List:**
- Shows items ranked by profit amount
- Displays quantity sold, profit, and margin %

**Category Performance:**
- Visual progress bars showing margin %
- Color-coded: Green (>50%), Yellow (>30%), Red (<30%)
- Profit amount and margin for each category

**Top Performing Waiters:**
- Revenue generated per waiter
- Number of orders handled
- Average order value

**Daily Profit Trend Chart:**
- Visual bar chart showing daily profits
- Green bars for profit, red for loss
- Helps identify patterns and trends

**Export Options:**
- Print Report: Thermal printer support
- CSV Export: Share as spreadsheet
- PDF Export: Share as formatted text report

## How to Use

### Step 1: Update Database
Run the migration SQL on your Supabase database:

```sql
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2) DEFAULT 0 NOT NULL;

UPDATE menu_items 
SET cost = price * 0.3 
WHERE cost = 0 OR cost IS NULL;
```

### Step 2: Set Actual Costs
Go to Admin → Menu Management and update the cost for each menu item:

1. Click on a menu item
2. Enter the actual ingredient/purchase cost
3. The system will automatically calculate profit margins

**Example:**
- Kabab Teka sells for 25,000 IQD
- Ingredients cost 7,500 IQD
- Profit: 17,500 IQD (70% margin)

### Step 3: View Reports
Navigate to the Reports tab:

1. **Select Period**: Today, Yesterday, This Week, This Month, This Year
2. **View Metrics**: Revenue, costs, profits, margins
3. **Analyze Performance**: See which items are most profitable
4. **Track Employees**: Monitor waiter performance
5. **Export Data**: Share reports with accountants or management

### Step 4: Make Data-Driven Decisions

**Increase Profitability:**
- Focus marketing on high-margin items
- Consider raising prices on low-margin items
- Negotiate better ingredient prices for high-cost items

**Optimize Menu:**
- Remove items with low profit and low sales
- Promote items with high profit margins
- Bundle low-margin items with high-margin ones

**Control Costs:**
- Monitor labor costs vs. revenue
- Adjust staffing during slow periods
- Track ingredient costs and find cheaper suppliers

## Financial Report Calculations

### Profit Margin Formula
```
Margin % = (Profit / Revenue) × 100
```

**Example:**
- Item sells for 20,000 IQD (revenue)
- Costs 6,000 IQD to make (cost)
- Profit = 20,000 - 6,000 = 14,000 IQD
- Margin = (14,000 / 20,000) × 100 = 70%

### Net Profit Formula
```
Net Profit = Total Revenue - Total Costs - Labor Costs
```

**Example:**
- Revenue: 1,250,000 IQD
- Ingredient Costs: 375,000 IQD
- Labor Costs: 200,000 IQD
- Net Profit: 1,250,000 - 375,000 - 200,000 = 675,000 IQD

## CSV Export Format

When you export to CSV, you'll get:

```csv
Tapse Restaurant - Financial Report
Period: This Month
01/01/2025 - 01/14/2025

Financial Summary
Total Revenue,1,250,000 IQD
Total Cost,375,000 IQD
Gross Profit,875,000 IQD
Labor Cost,200,000 IQD
Net Profit,675,000 IQD
Profit Margin,70.00%
Total Orders,45
Average Order,27,777 IQD

Top Profitable Items
Item,Quantity,Revenue,Cost,Profit,Margin
Kabab Teka,25,625,000 IQD,187,500 IQD,437,500 IQD,70.0%
Palaw,20,320,000 IQD,96,000 IQD,224,000 IQD,70.0%

Category Performance
Category,Revenue,Cost,Profit,Margin
Kebabs,550,000 IQD,165,000 IQD,385,000 IQD,70.0%
Rice Dishes,320,000 IQD,96,000 IQD,224,000 IQD,70.0%
```

## Best Practices

### 1. Keep Costs Updated
- Review ingredient costs monthly
- Update menu item costs when supplier prices change
- Account for all ingredients (spices, garnishes, etc.)

### 2. Monitor Daily
- Check reports daily to spot trends
- Identify which days are most profitable
- Adjust staffing based on daily patterns

### 3. Weekly Analysis
- Compare week-over-week performance
- Identify best-selling vs. most profitable items
- Review employee performance metrics

### 4. Monthly Review
- Calculate total profitability
- Share reports with accountant
- Make strategic menu decisions

### 5. Price Optimization
- Target 60-70% profit margins on food
- Higher margins (80%+) on drinks
- Lower margins acceptable on popular items that drive traffic

## Troubleshooting

### "No data available"
- Check that you have orders in the selected date range
- Ensure menu items have cost values set
- Verify Supabase connection is working

### Profit margins seem wrong
- Double-check menu item costs are accurate
- Ensure costs include all ingredients
- Verify prices are entered correctly

### Labor costs not showing
- Check that employees are clocking in/out
- Verify hourly rates are set for all employees
- Ensure clock records exist for the period

## Next Steps

Future enhancements could include:

1. **Tax Tracking**: Add tax calculations to reports
2. **Waste Tracking**: Monitor ingredient waste
3. **Supplier Management**: Track purchase orders
4. **Predictive Analytics**: Forecast future profits
5. **Budget Planning**: Set profit targets and track progress

## Support

For issues or questions:
1. Check this guide first
2. Review the backend console logs
3. Verify database migrations ran successfully
4. Contact support with specific error messages

---

**System is now fully capable of:**
✅ Tracking revenue and costs
✅ Calculating profit margins
✅ Monitoring employee performance
✅ Generating financial reports
✅ Exporting data (CSV/PDF)
✅ Daily/Weekly/Monthly analysis
✅ Real-time financial insights

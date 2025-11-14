import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { supabase } from "@/backend/lib/supabase";

export const reportsEmployeePerformanceProcedure = publicProcedure
  .input(
    z.object({
      startDate: z.string(),
      endDate: z.string(),
    })
  )
  .query(async ({ input }) => {
    const { startDate, endDate } = input;

    console.log('[Employee Performance] Generating report for:', { startDate, endDate });

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .not('waiter_name', 'is', null);

    if (ordersError) {
      console.error('[Employee Performance] Error fetching orders:', ordersError);
      throw new Error('Failed to fetch orders');
    }

    const { data: clockRecords, error: clockError } = await supabase
      .from('clock_records')
      .select('*, employees!inner(name, role, hourly_rate)')
      .gte('clock_in', startDate)
      .lte('clock_in', endDate);

    if (clockError) {
      console.error('[Employee Performance] Error fetching clock records:', clockError);
      throw new Error('Failed to fetch employee data');
    }

    const waiterPerformance: Record<string, {
      name: string;
      totalOrders: number;
      totalRevenue: number;
      averageOrderValue: number;
      paidOrders: number;
    }> = {};

    orders.forEach(order => {
      const waiterName = order.waiter_name;
      if (!waiterName) return;

      if (!waiterPerformance[waiterName]) {
        waiterPerformance[waiterName] = {
          name: waiterName,
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          paidOrders: 0,
        };
      }

      waiterPerformance[waiterName].totalOrders += 1;
      waiterPerformance[waiterName].totalRevenue += order.total;
      
      if (order.status === 'paid') {
        waiterPerformance[waiterName].paidOrders += 1;
      }
    });

    Object.values(waiterPerformance).forEach(waiter => {
      waiter.averageOrderValue = 
        waiter.totalOrders > 0 ? waiter.totalRevenue / waiter.totalOrders : 0;
    });

    const employeeHours: Record<string, {
      name: string;
      role: string;
      totalHours: number;
      totalShifts: number;
      hourlyRate: number;
      totalEarnings: number;
    }> = {};

    clockRecords?.forEach(record => {
      if (!record.clock_out) return;

      const employee = (record as any).employees;
      if (!employee) return;

      const employeeId = record.employee_id;

      if (!employeeHours[employeeId]) {
        employeeHours[employeeId] = {
          name: employee.name,
          role: employee.role,
          totalHours: 0,
          totalShifts: 0,
          hourlyRate: employee.hourly_rate || 0,
          totalEarnings: 0,
        };
      }

      const clockIn = new Date(record.clock_in);
      const clockOut = new Date(record.clock_out);
      const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      const breakHours = (record.break_minutes || 0) / 60;
      const paidHours = hoursWorked - breakHours;

      employeeHours[employeeId].totalHours += paidHours;
      employeeHours[employeeId].totalShifts += 1;
      employeeHours[employeeId].totalEarnings += paidHours * (employee.hourly_rate || 0);
    });

    const topWaiters = Object.values(waiterPerformance)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    const employeeStats = Object.entries(employeeHours)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalHours - a.totalHours);

    const totalLaborCost = Object.values(employeeHours)
      .reduce((sum, emp) => sum + emp.totalEarnings, 0);

    console.log('[Employee Performance] Generated successfully');

    return {
      period: { startDate, endDate },
      waiterPerformance: topWaiters,
      employeeHours: employeeStats,
      summary: {
        totalLaborCost,
        totalEmployees: employeeStats.length,
        averageHoursPerEmployee: 
          employeeStats.length > 0
            ? employeeStats.reduce((sum, e) => sum + e.totalHours, 0) / employeeStats.length
            : 0,
      },
    };
  });

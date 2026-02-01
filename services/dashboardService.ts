import { apiFetch } from './api';

export interface DashboardStats {
  totalRepairs: number;
  pendingRepairs: number;
  inProgressRepairs: number;
  completedRepairs: number;
  totalUsers: number;
  totalLoans: number;
  completionRate: number;
}

export interface ChartData {
  month: string;
  repairs: number;
}

export interface RecentActivity {
  id: number;
  ticketCode: string;
  title: string;
  status: string;
  createdAt: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    console.log('Fetching tickets, users, and loans...');
    
    // Fetch concurrently but handle individual failures for non-critical stats
    const [ticketsResponse, usersResponse, loansResponse] = await Promise.all([
      apiFetch('/api/repairs').catch(err => {
        console.error('Failed to fetch repairs:', err);
        return [];
      }),
      apiFetch('/users').catch(err => {
        console.error('Failed to fetch users (possibly 403):', err);
        return [];
      }),
      apiFetch('/api/loans').catch(err => {
        console.error('Failed to fetch loans:', err);
        return [];
      }),
    ]);

    // Extract tickets array - could be direct array or wrapped in object
    let tickets = [];
    if (Array.isArray(ticketsResponse)) {
      tickets = ticketsResponse;
    } else if (ticketsResponse && Array.isArray(ticketsResponse.data)) {
      tickets = ticketsResponse.data;
    }

    // Extract users array - could be direct array or wrapped in object
    let users = [];
    if (Array.isArray(usersResponse)) {
      users = usersResponse;
    } else if (usersResponse && Array.isArray(usersResponse.data)) {
      users = usersResponse.data;
    } else if (usersResponse && Array.isArray(usersResponse.users)) {
       // Users controller might return { users: [], meta: ... }
       users = usersResponse.users;
    }

    // Extract loans array - could be direct array or wrapped in object
    let loans = [];
    if (Array.isArray(loansResponse)) {
      loans = loansResponse;
    } else if (loansResponse && Array.isArray(loansResponse.data)) {
      loans = loansResponse.data;
    }

    const totalRepairs = tickets.length;
    // Update status filtering for RepairTicketStatus
    const pendingRepairs = tickets.filter((t: any) => t.status === 'PENDING').length;
    // Include WAITING_PARTS in inProgress if desired, or separate
    const inProgressRepairs = tickets.filter((t: any) => ['IN_PROGRESS', 'WAITING_PARTS'].includes(t.status)).length;
    const completedRepairs = tickets.filter((t: any) => t.status === 'COMPLETED').length;
    const totalUsers = users.length;
    const totalLoans = loans.length;
    const completionRate = totalRepairs > 0 
      ? Math.round((completedRepairs / totalRepairs) * 100 * 10) / 10 
      : 0;

    const result = {
      totalRepairs,
      pendingRepairs,
      inProgressRepairs,
      completedRepairs,
      totalUsers,
      totalLoans,
      completionRate,
    };

    return result;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

export async function getMonthlyRepairData(): Promise<ChartData[]> {
  try {
    // Use /api/repairs instead of /api/tickets
    const ticketsResponse = await apiFetch('/api/repairs').catch(() => []);
    
    let ticketArray = [];
    if (Array.isArray(ticketsResponse)) {
      ticketArray = ticketsResponse;
    } else if (ticketsResponse && Array.isArray(ticketsResponse.data)) {
      ticketArray = ticketsResponse.data;
    }

    // Get current date and calculate 8 months back
    const monthData: { [key: string]: number } = {};
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
    ];

    // Initialize last 8 months with 0
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthIndex = date.getMonth();
      monthData[thaiMonths[monthIndex]] = 0;
    }

    // Count tickets by month
    ticketArray.forEach((ticket: any) => {
      if (ticket.createdAt) {
        const createdDate = new Date(ticket.createdAt);
        const monthIndex = createdDate.getMonth();
        const monthName = thaiMonths[monthIndex];
        if (monthData[monthName] !== undefined) {
             monthData[monthName] = (monthData[monthName] || 0) + 1;
        }
      }
    });

    return Object.entries(monthData).map(([month, repairs]) => ({
      month,
      repairs,
    }));
  } catch (error) {
    console.error('Error fetching monthly repair data:', error);
    throw error;
  }
}

export async function getRecentActivities(limit: number = 5): Promise<RecentActivity[]> {
  try {
     // Use /api/repairs instead of /api/tickets
    const ticketsResponse = await apiFetch('/api/repairs').catch(() => []);
    
    let ticketArray = [];
    if (Array.isArray(ticketsResponse)) {
      ticketArray = ticketsResponse;
    } else if (ticketsResponse && Array.isArray(ticketsResponse.data)) {
      ticketArray = ticketsResponse.data;
    }

    // Sort by creation date (most recent first) and limit
    const recentTickets = ticketArray
      .sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, limit)
      .map((ticket: any) => ({
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        title: ticket.problemTitle || ticket.title || '-', // Map problemTitle
        status: ticket.status,
        createdAt: ticket.createdAt,
      }));

    return recentTickets;
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw error;
  }
}

export async function getStatusDistribution(): Promise<{ completed: number; inProgress: number; pending: number }> {
  try {
    const stats = await getDashboardStats();
    const total = stats.totalRepairs || 1;

    return {
      completed: Math.round((stats.completedRepairs / total) * 100 * 10) / 10,
      inProgress: Math.round((stats.inProgressRepairs / total) * 100 * 10) / 10,
      pending: Math.round((stats.pendingRepairs / total) * 100 * 10) / 10,
    };
  } catch (error) {
    console.error('Error fetching status distribution:', error);
    throw error;
  }
}
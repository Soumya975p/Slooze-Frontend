import { gql } from 'graphql-tag';

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalEarnings
      totalSales
      totalRevenue
      subscriptions
      recentSales {
        name
        email
        amount
      }
      monthlySalesData {
        month
        value
      }
      weeklyOverviewData {
        day
        revenue
        expenses
      }
    }
  }
`;

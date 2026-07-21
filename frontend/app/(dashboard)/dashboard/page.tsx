'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Apple, TrendingUp, Trash2, Clock, Bell } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/common/StatCard';
import apiClient from '@/services/api';

interface InventorySummary {
  totalItems: number;
  expiringCount: number;
  expiredCount: number;
  freshCount: number;
}

interface DashboardNotification {
  id: number;
  title: string;
  message: string;
  createdAt: string;
}

interface Activity {
  id: number;
  action: string;
  entityType: string;
  details?: string;
  createdAt: string;
}

interface DashboardData {
  summary: InventorySummary;
  notifications: DashboardNotification[];
  activities: Activity[];
  mealOverview?: {
    todayMeals: Array<{ id: number; foodName: string; mealType: string; day: string; status?: string }>;
    upcomingMeals: Array<{ id: number; foodName: string; mealType: string; day: string; status?: string }>;
  };
}

interface UserProfile {
  fullName: string;
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [dashboardResponse, profileResponse] = await Promise.allSettled([
          apiClient.get('/dashboard'),
          apiClient.get('/auth/me'),
        ]);

        if (dashboardResponse.status === 'fulfilled') {
          setDashboard(dashboardResponse.value.data.data);
        } else {
          console.error('Failed to fetch dashboard:', dashboardResponse.reason);
        }

        if (profileResponse.status === 'fulfilled') {
          setUser(profileResponse.value.data.data);
        } else {
          console.error('Failed to fetch profile:', profileResponse.reason);
        }
      } catch (error) {
        console.error('Failed to fetch inventory summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
    window.addEventListener('focus', fetchDashboard);

    return () => {
      window.removeEventListener('focus', fetchDashboard);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={loading ? 'Dashboard' : `Welcome, ${user?.fullName || 'there'}`}
        description="Welcome back! Here&apos;s your food waste overview."
      />

      <main className="flex-1 p-6 overflow-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Apple}
            title="Total Food Items"
            value={loading ? '...' : dashboard?.summary.totalItems || 0}
            description="In your inventory"
          />
          
          <StatCard
            icon={Clock}
            title="Expiring Soon"
            value={loading ? '...' : dashboard?.summary.expiringCount || 0}
            description="Next 7 days"
            trend={{ value: -15, label: 'vs last week' }}
          />
          
          <StatCard
            icon={Trash2}
            title="Expired"
            value={loading ? '...' : dashboard?.summary.expiredCount || 0}
            description="Need attention"
            trend={{ value: 5, label: 'vs last week' }}
          />
          
          <StatCard
            icon={TrendingUp}
            title="Waste Reduction"
            value={loading ? '...' : `${dashboard?.summary.totalItems ? Math.round((dashboard.summary.freshCount / dashboard.summary.totalItems) * 100) : 0}%`}
            description="This month"
            trend={{ value: 8, label: 'improvement' }}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/inventory?action=add"
                className="block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-center font-medium"
              >
                Add Food Item
              </Link>
              <Link
                href="/inventory"
                className="block px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors text-center font-medium"
              >
                Donate Surplus Food
              </Link>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Notifications</h2>
            <div className="space-y-3">
              {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : dashboard?.notifications.length ? dashboard.notifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 rounded bg-muted p-3">
                  <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No notifications yet.</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Today's Meals</h2>
            <div className="space-y-3">
              {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : dashboard?.mealOverview?.todayMeals?.length ? dashboard.mealOverview.todayMeals.map((meal) => (
                <div key={meal.id} className="rounded-lg border border-border bg-muted p-3">
                  <p className="text-sm font-medium text-foreground">{meal.foodName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{meal.day} · {meal.mealType}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No meals scheduled for today.</p>}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Upcoming Meals</h2>
            <div className="space-y-3">
              {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : dashboard?.mealOverview?.upcomingMeals?.length ? dashboard.mealOverview.upcomingMeals.slice(0, 5).map((meal) => (
                <div key={meal.id} className="rounded-lg border border-border bg-muted p-3">
                  <p className="text-sm font-medium text-foreground">{meal.foodName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{meal.day} · {meal.mealType}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No upcoming meals yet.</p>}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : dashboard?.activities.length ? dashboard.activities.map((activity, index) => (
              <div key={activity.id} className={`flex items-center justify-between ${index < dashboard.activities.length - 1 ? 'border-b border-border pb-4' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-foreground">{activity.action}{activity.details ? `: ${activity.details}` : ''}</p>
                  <p className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</p>
                </div>
                <span className="rounded bg-primary/10 px-2 py-1 text-xs capitalize text-primary">{activity.entityType}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">No activity yet.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

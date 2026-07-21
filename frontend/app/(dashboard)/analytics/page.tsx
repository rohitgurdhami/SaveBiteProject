'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/common/StatCard';
import { TrendingUp, Apple, Gift, Trash2, ArrowLeft } from 'lucide-react';
import apiClient from '@/services/api';

interface InventorySummary {
  totalItems: number;
  expiringCount: number;
  expiredCount: number;
  freshCount: number;
}

interface AnalyticsData {
  categoryDistribution: Array<{ name: string; value: number }>;
  statusDistribution: Array<{ name: string; value: number }>;
  weeklyActivity: Array<{ name: string; added: number; donated: number; expired: number }>;
}

interface DashboardData {
  summary: InventorySummary;
  analytics?: AnalyticsData;
}

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899'];

export default function AnalyticsPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await apiClient.get('/dashboard');
        setDashboard(response.data.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const categoryData = dashboard?.analytics?.categoryDistribution ?? [];
  const weeklyData = dashboard?.analytics?.weeklyActivity ?? [];

  const totalAdded = useMemo(
    () => weeklyData.reduce((sum, item) => sum + item.added, 0),
    [weeklyData]
  );
  const totalDonated = useMemo(
    () => weeklyData.reduce((sum, item) => sum + item.donated, 0),
    [weeklyData]
  );
  const totalExpired = useMemo(
    () => weeklyData.reduce((sum, item) => sum + item.expired, 0),
    [weeklyData]
  );

  const topCategory = useMemo(() => {
    if (!categoryData.length) return 'No items yet';
    return [...categoryData].sort((a, b) => b.value - a.value)[0]?.name ?? 'No items yet';
  }, [categoryData]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Analytics"
        description="Track your real inventory data and food impact"
      />

      <main className="flex-1 p-6 overflow-auto space-y-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Apple}
            title="Total Food Items"
            value={loading ? '...' : dashboard?.summary.totalItems || 0}
            description="Added by this account"
          />
          <StatCard
            icon={Gift}
            title="Fresh Items"
            value={loading ? '...' : dashboard?.summary.freshCount || 0}
            description="Currently usable"
          />
          <StatCard
            icon={Trash2}
            title="Expired"
            value={loading ? '...' : dashboard?.summary.expiredCount || 0}
            description="Need attention"
          />
          <StatCard
            icon={TrendingUp}
            title="Added / Donated / Expired"
            value={loading ? '...' : `${totalAdded}/${totalDonated}/${totalExpired}`}
            description="This week"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Weekly Food Activity</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }} />
                <Legend />
                <Bar dataKey="added" fill="#10b981" name="Items Added" />
                <Bar dataKey="donated" fill="#06b6d4" name="Items Donated" />
                <Bar dataKey="expired" fill="#ef4444" name="Items Expired" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">By Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium text-foreground mb-2">Most Added Category</h3>
              <p className="text-muted-foreground">{topCategory}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium text-foreground mb-2">Fresh Ratio</h3>
              <p className="text-muted-foreground">
                {dashboard?.summary.totalItems
                  ? `${Math.round((dashboard.summary.freshCount / dashboard.summary.totalItems) * 100)}% fresh`
                  : 'No items yet'}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium text-foreground mb-2">Inventory Focus</h3>
              <p className="text-muted-foreground">Based on the signed-in user&apos;s actual food items</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

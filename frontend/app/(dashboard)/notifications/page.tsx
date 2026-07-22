'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, AlertTriangle, Check, Trash2, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import apiClient from '@/services/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/notifications?page=${page}&pageSize=${pageSize}`);
      setNotifications(response.data.data ?? []);
      setTotal(response.data.pagination?.total ?? 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const handleMarkRead = async (notificationId: number, isRead: boolean) => {
    try {
      if (!isRead) {
        await apiClient.patch(`/notifications/${notificationId}/read`);
      }
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification:', error);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      expiry_alert: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      donation_request: <Bell className="h-5 w-5 text-blue-500" />,
      donation_accepted: <Check className="h-5 w-5 text-green-500" />,
      donation_rejected: <AlertTriangle className="h-5 w-5 text-red-500" />,
      meal_reminder: <Bell className="h-5 w-5 text-purple-500" />,
    };
    return icons[type] || <Bell className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Notifications"
        description="Stay updated with all your SaveBite notifications"
      />

      <main className="flex-1 p-6 overflow-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 border border-border rounded-lg flex items-start justify-between gap-4 ${
                  notification.isRead ? 'bg-background' : 'bg-primary/5'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{notification.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkRead(notification.id, notification.isRead)}
                      className="p-2 hover:bg-muted rounded transition-colors"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="p-2 hover:bg-muted rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= total}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

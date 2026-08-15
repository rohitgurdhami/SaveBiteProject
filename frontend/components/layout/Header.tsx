'use client';

import { Bell, Settings } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import apiClient from '@/services/api';

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    apiClient
      .get('/notifications?page=1&pageSize=1')
      .then((response) => {
        if (isMounted) {
          setNotificationCount(response.data.pagination?.total ?? 0);
        }
      })
      .catch(() => {
        if (isMounted) {
          setNotificationCount(0);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="border-b border-border bg-background">
      <div className="flex items-center justify-between p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        
        <div className="flex items-center gap-4">
          <Link
            href="/notifications"
            className="p-2 hover:bg-muted rounded-lg transition-colors relative"
            aria-label={`Notifications${notificationCount ? `, ${notificationCount} total` : ''}`}
          >
            <Bell className="h-6 w-6 text-foreground" />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold leading-none text-white">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </Link>
          
          <Link
            href="/profile"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Settings className="h-6 w-6 text-foreground" />
          </Link>
        </div>
      </div>
    </header>
  );
}

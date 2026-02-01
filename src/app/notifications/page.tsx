'use client';

import { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCircle, Circle, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  status: 'UNREAD' | 'READ';
  ticketId?: number;
  actionUrl?: string;
  createdAt: string;
}

const typeLabels = {
  TICKET_CREATED: { label: 'งานใหม่', color: 'bg-blue-100 text-blue-700' },
  TICKET_ASSIGNED: { label: 'มอบหมายงาน', color: 'bg-orange-100 text-orange-700' },
  TICKET_UPDATED: { label: 'อัปเดตงาน', color: 'bg-purple-100 text-purple-700' },
  TICKET_COMPLETED: { label: 'งานเสร็จ', color: 'bg-green-100 text-green-700' },
  TICKET_REJECTED: { label: 'ปฏิเสธงาน', color: 'bg-red-100 text-red-700' },
  COMMENT_ADDED: { label: 'ความเห็น', color: 'bg-yellow-100 text-yellow-700' },
  STATUS_CHANGED: { label: 'เปลี่ยนสถานะ', color: 'bg-indigo-100 text-indigo-700' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, status: 'READ' } : n
          )
        );
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        const deleted = notifications.find((n) => n.id === id);
        if (deleted?.status === 'UNREAD') {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, status: 'READ' }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return n.status === 'UNREAD';
    if (filter === 'read') return n.status === 'READ';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={32} className="text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">การแจ้งเตือน</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-600">
                    คุณมีการแจ้งเตือนที่ยังไม่ได้อ่าน {unreadCount} รายการ
                  </p>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                ทำเครื่องหมายว่าอ่านแล้วทั้งหมด
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg shadow-md p-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ทั้งหมด ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ยังไม่อ่าน ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'read'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            อ่านแล้ว ({notifications.filter((n) => n.status === 'READ').length})
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const typeLabel = typeLabels[notification.type as keyof typeof typeLabels] || {
                label: 'อื่นๆ',
                color: 'bg-gray-100 text-gray-700',
              };

              return (
                <div
                  key={notification.id}
                  className={`rounded-lg border-l-4 p-4 flex items-start justify-between transition-all ${
                    notification.status === 'UNREAD'
                      ? 'bg-blue-50 border-l-blue-600 shadow-md'
                      : 'bg-white border-l-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {notification.status === 'UNREAD' ? (
                        <Circle size={20} className="text-blue-600 fill-blue-600" />
                      ) : (
                        <CheckCircle size={20} className="text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{notification.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${typeLabel.color}`}>
                          {typeLabel.label}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString('th-TH')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {notification.actionUrl && (
                      <Link
                        href={notification.actionUrl}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
                      >
                        ดู
                      </Link>
                    )}
                    {notification.status === 'UNREAD' && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        title="ทำเครื่องหมายว่าอ่านแล้ว"
                      >
                        <CheckCircle size={20} className="text-blue-600" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      title="ลบ"
                    >
                      <Trash2 size={20} className="text-red-600" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-lg p-12 text-center">
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">
                {filter === 'all' && 'ไม่มีการแจ้งเตือน'}
                {filter === 'unread' && 'ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน'}
                {filter === 'read' && 'ไม่มีการแจ้งเตือนที่อ่านแล้ว'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

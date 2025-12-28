import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { addNotification, fetchUnreadCount } from '../store/slices/notificationSlice';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useNotifications = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch initial unread count
    dispatch(fetchUnreadCount());

    // Establish SSE connection
    const connectSSE = () => {
      try {
        const eventSource = new EventSource(`${API_URL}/notifications/stream`, {
          withCredentials: true
        });

        eventSource.onopen = () => {
          console.log('✅ SSE connection established');
        };

        eventSource.onmessage = (event) => {
          try {
            const notification = JSON.parse(event.data);

            // Add to Redux store
            dispatch(addNotification(notification));

            // Show toast notification
            toast(notification.title, {
              duration: 4000,
              icon: getNotificationIcon(notification.type),
              style: {
                background: '#fff',
                color: '#333',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }
            });
          } catch (error) {
            console.error('Error parsing notification:', error);
          }
        };

        eventSource.onerror = () => {
          console.warn('SSE connection error, reconnecting...');
          eventSource.close();

          // Reconnect after 5 seconds
          setTimeout(() => {
            if (user) {
              connectSSE();
            }
          }, 5000);
        };

        eventSourceRef.current = eventSource;
      } catch (error) {
        console.error('Failed to establish SSE connection:', error);
      }
    };

    connectSSE();

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [user, dispatch]);
};

// Helper function to get icon based on notification type
const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'order_status':
      return '📦';
    case 'points_earned':
      return '🎁';
    case 'flash_sale':
      return '⚡';
    case 'promotion':
      return '🎉';
    case 'system':
      return '🔔';
    default:
      return '📬';
  }
};

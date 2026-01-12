import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../store/slices/notificationSlice';
import { FaBell, FaTimes, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import './NotificationBell.scss';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { items, unreadCount, loading } = useSelector((state: RootState) => state.notifications);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && items.length === 0) {
      dispatch(fetchNotifications());
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      dispatch(markAsRead(notification.id));
    }

    if (notification.data?.url) {
      navigate(notification.data.url);
    }

    setIsOpen(false);
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    dispatch(deleteNotification(notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_status': return '📦';
      case 'points_earned': return '🎁';
      case 'flash_sale': return '⚡';
      case 'promotion': return '🎉';
      case 'system': return '🔔';
      default: return '📬';
    }
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="notification-bell__trigger"
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown__header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && (
              <button
                className="notification-dropdown__mark-all"
                onClick={handleMarkAllRead}
                title="Đánh dấu tất cả đã đọc"
              >
                <FaCheckDouble />
              </button>
            )}
          </div>

          <div className="notification-dropdown__list">
            {loading && items.length === 0 ? (
              <div className="notification-dropdown__loading">Đang tải...</div>
            ) : items.length === 0 ? (
              <div className="notification-dropdown__empty">
                Không có thông báo mới
              </div>
            ) : (
              items.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'notification-item--unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-item__icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-item__content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-item__time">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="notification-item__actions">
                    {!notification.read && (
                      <button
                        className="notification-item__mark-read"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(markAsRead(notification.id));
                        }}
                        title="Đánh dấu đã đọc"
                      >
                        <FaCheck />
                      </button>
                    )}
                    <button
                      className="notification-item__delete"
                      onClick={(e) => handleDelete(e, notification.id)}
                      title="Xóa"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 10 && (
            <div className="notification-dropdown__footer">
              <button onClick={() => { navigate('/notifications'); setIsOpen(false); }}>
                Xem tất cả
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Star, X, Sparkles } from 'lucide-react';
import type { Badge, Milestone } from '../api/client';

interface AchievementNotification {
  id: string;
  type: 'badge' | 'milestone';
  title: string;
  description: string;
  icon: string;
  color: string;
  xpReward?: number;
  timestamp: number;
}

interface AchievementNotificationsProps {
  notifications: AchievementNotification[];
  onDismiss: (id: string) => void;
}

export const AchievementNotifications: React.FC<AchievementNotificationsProps> = ({
  notifications,
  onDismiss
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    notifications.forEach(notification => {
      if (!visibleNotifications.has(notification.id)) {
        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
          onDismiss(notification.id);
        }, 5000);

        return () => clearTimeout(timer);
      }
    });

    setVisibleNotifications(new Set(notifications.map(n => n.id)));
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[300] space-y-3 max-w-sm">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl shadow-2xl border border-indigo-400/30 transform transition-all duration-500 animate-in slide-in-from-right"
          style={{
            animationDelay: `${index * 100}ms`,
            zIndex: 300 - index
          }}
        >
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="text-3xl animate-bounce">{notification.icon}</div>
              <div className="absolute -top-1 -right-1">
                <Sparkles size={16} className="text-yellow-300 animate-pulse" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-white flex items-center gap-2">
                  {notification.type === 'badge' ? (
                    <Award size={16} />
                  ) : (
                    <Trophy size={16} />
                  )}
                  {notification.title}
                </h4>
                <button
                  onClick={() => onDismiss(notification.id)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              
              <p className="text-sm text-white/90 mb-2">{notification.description}</p>
              
              {notification.xpReward && (
                <div className="flex items-center gap-1 text-xs bg-yellow-500/20 px-2 py-1 rounded-full border border-yellow-400/30">
                  <Star size={12} className="text-yellow-300" />
                  <span className="text-yellow-300">+{notification.xpReward} XP</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress bar for auto-dismiss */}
          <div className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-xl overflow-hidden">
            <div 
              className="h-full bg-white/80 transition-all duration-5000 ease-linear"
              style={{
                animation: 'shrink 5s linear forwards'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Hook for managing achievement notifications
export const useAchievementNotifications = () => {
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);

  const addNotification = (
    type: 'badge' | 'milestone',
    item: Badge | Milestone,
    xpReward?: number
  ) => {
    const notification: AchievementNotification = {
      id: `${type}-${item.id}-${Date.now()}`,
      type,
      title: 'name' in item ? item.name : item.title,
      description: item.description,
      icon: item.icon,
      color: item.color,
      xpReward,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, notification]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    notifications,
    addNotification,
    dismissNotification
  };
};

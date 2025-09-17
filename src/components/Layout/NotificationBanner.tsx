import React, { useState, useEffect } from 'react';
import { Bell, X, RefreshCw } from 'lucide-react';

interface NotificationBannerProps {
  hasNewData: boolean;
  onRefresh: () => void;
  onDismiss: () => void;
}

export default function NotificationBanner({
  hasNewData,
  onRefresh,
  onDismiss
}: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [notification, setNotification] = useState<string>('');

  useEffect(() => {
    if (hasNewData) {
      setIsVisible(true);
      setNotification('Novos agendamentos foram realizados!');
    }
  }, [hasNewData]);

  useEffect(() => {
    // Escutar eventos de novos agendamentos
    const handleNewAppointment = (event: CustomEvent) => {
      setNotification(event.detail.message);
      setIsVisible(true);
    };

    window.addEventListener('newAppointment', handleNewAppointment as EventListener);

    return () => {
      window.removeEventListener('newAppointment', handleNewAppointment as EventListener);
    };
  }, []);

  const handleRefresh = () => {
    onRefresh();
    setIsVisible(false);
    onDismiss();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm">
      <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg border border-blue-700 animate-slide-in">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Bell className="w-5 h-5 text-blue-200 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{notification}</p>
            <p className="text-xs text-blue-200 mt-1">
              Clique em "Atualizar" para ver as mudanças
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-blue-200 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex space-x-2 mt-3">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-1 bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-xs transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Atualizar</span>
          </button>
          <button
            onClick={handleDismiss}
            className="text-blue-200 hover:text-white px-3 py-1 rounded text-xs transition-colors"
          >
            Dispensar
          </button>
        </div>
      </div>
    </div>
  );
}
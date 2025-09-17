import { useState, useEffect, useCallback } from 'react';

interface UseRealTimeUpdatesProps {
  data: any[];
  updateInterval?: number; // em milissegundos
  onDataChange?: (newData: any[]) => void;
}

export function useRealTimeUpdates({
  data,
  updateInterval = 5000, // 5 segundos por padrão
  onDataChange
}: UseRealTimeUpdatesProps) {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isPolling, setIsPolling] = useState(true);
  const [hasNewData, setHasNewData] = useState(false);

  // Função para verificar se há novos dados
  const checkForUpdates = useCallback(() => {
    // Simular verificação de novos dados
    // Em um sistema real, isso faria uma requisição para o servidor
    const storedData = localStorage.getItem('appointments');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        
        // Verificar se há mudanças nos dados
        if (JSON.stringify(parsedData) !== JSON.stringify(data)) {
          setHasNewData(true);
          setLastUpdate(Date.now());
          
          if (onDataChange) {
            onDataChange(parsedData);
          }
          
          // Mostrar notificação de novo agendamento
          if (parsedData.length > data.length) {
            showNewAppointmentNotification();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
      }
    }
  }, [data, onDataChange]);

  // Função para mostrar notificação
  const showNewAppointmentNotification = () => {
    // Verificar se o navegador suporta notificações
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Novo Agendamento!', {
          body: 'Um novo agendamento foi realizado.',
          icon: '/favicon.ico',
          tag: 'new-appointment'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Novo Agendamento!', {
              body: 'Um novo agendamento foi realizado.',
              icon: '/favicon.ico',
              tag: 'new-appointment'
            });
          }
        });
      }
    }

    // Notificação visual no sistema
    const event = new CustomEvent('newAppointment', {
      detail: { message: 'Novo agendamento realizado!' }
    });
    window.dispatchEvent(event);
  };

  // Configurar polling
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(checkForUpdates, updateInterval);

    return () => clearInterval(interval);
  }, [checkForUpdates, updateInterval, isPolling]);

  // Função para pausar/retomar polling
  const togglePolling = () => {
    setIsPolling(!isPolling);
  };

  // Função para forçar atualização
  const forceUpdate = () => {
    checkForUpdates();
  };

  // Função para marcar como visualizado
  const markAsViewed = () => {
    setHasNewData(false);
  };

  return {
    lastUpdate,
    isPolling,
    hasNewData,
    togglePolling,
    forceUpdate,
    markAsViewed
  };
}
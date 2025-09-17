import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface RealTimeIndicatorProps {
  isPolling: boolean;
  lastUpdate: number;
  onTogglePolling: () => void;
  onForceUpdate: () => void;
}

export default function RealTimeIndicator({
  isPolling,
  lastUpdate,
  onTogglePolling,
  onForceUpdate
}: RealTimeIndicatorProps) {
  const formatLastUpdate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}min atrás`;
    } else {
      return `${seconds}s atrás`;
    }
  };

  return (
    <div className="flex items-center space-x-3 text-sm">
      <div className="flex items-center space-x-2">
        {isPolling ? (
          <div className="flex items-center space-x-1 text-green-600">
            <Wifi className="w-4 h-4" />
            <span className="text-xs">Tempo Real</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        ) : (
          <div className="flex items-center space-x-1 text-gray-500">
            <WifiOff className="w-4 h-4" />
            <span className="text-xs">Pausado</span>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500">
        Última atualização: {formatLastUpdate(lastUpdate)}
      </div>

      <div className="flex space-x-1">
        <button
          onClick={onTogglePolling}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            isPolling 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
          title={isPolling ? 'Pausar atualizações' : 'Retomar atualizações'}
        >
          {isPolling ? 'Pausar' : 'Retomar'}
        </button>
        
        <button
          onClick={onForceUpdate}
          className="px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs transition-colors flex items-center space-x-1"
          title="Forçar atualização"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Atualizar</span>
        </button>
      </div>
    </div>
  );
}
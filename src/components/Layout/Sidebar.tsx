import React from 'react';
import { 
  Calendar, 
  Users, 
  UserCheck, 
  Building2, 
  BarChart3,
  Clock,
  FileText,
  Shield,
  Palette
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  userRole: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ userRole, activeTab, onTabChange, isOpen = true, onClose }: SidebarProps) {
  const getMenuItems = () => {
    const baseItems = [
      { id: 'calendar', label: 'Calendário', icon: Calendar }
    ];

    switch (userRole) {
      case 'admin':
        return [
          ...baseItems,
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'providers', label: 'Prestadores', icon: UserCheck },
          { id: 'companies', label: 'Empresas', icon: Building2 },
          { id: 'services', label: 'Serviços', icon: FileText },
          { id: 'admins', label: 'Administradores', icon: Shield },
          { id: 'reports', label: 'Relatórios', icon: BarChart3 },
          { id: 'logo-customization', label: 'Personalizar Logo', icon: Palette }
        ];
      case 'provider':
        return [
          { id: 'my-schedule', label: 'Minha Agenda', icon: Clock },
          { id: 'calendar', label: 'Calendário', icon: Calendar }
        ];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-sm border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (onClose) onClose(); // Fechar sidebar no mobile após seleção
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
        </nav>
      </aside>
    </>
  );
}
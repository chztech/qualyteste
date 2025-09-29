import React from 'react';
import { User, LogOut, Bell, Menu } from 'lucide-react';
import { User as UserType } from '../../types';
import BrandLogo from './BrandLogo';

interface HeaderProps {
  currentUser: UserType;
  onLogout: () => void;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export default function Header({ currentUser, onLogout, onMenuToggle, showMenuButton = false }: HeaderProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'provider': return 'bg-green-100 text-green-800';
      case 'client': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'provider': return 'Prestador';
      case 'client': return 'Cliente';
      default: return 'Usuário';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            {showMenuButton && (
              <button
                onClick={onMenuToggle}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <BrandLogo 
              size="header" 
              showText={true} 
              useCustomization={true}
              context="login"
              className="flex-shrink-0"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(currentUser.role)} hidden sm:inline-flex`}>
                  {getRoleLabel(currentUser.role)}
                </span>
                <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
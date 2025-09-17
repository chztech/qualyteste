import React, { useState } from 'react';
import { Plus, Edit2, Trash2, User, Shield, Phone, Mail, Key, Lock, AlertTriangle, X } from 'lucide-react';
import { User as UserType } from '../../types';

interface AdminManagementProps {
  admins: UserType[];
  onAddAdmin: (admin: Omit<UserType, 'id' | 'createdAt'>) => void;
  onUpdateAdmin: (id: string, admin: Partial<UserType>) => void;
  onDeleteAdmin: (id: string) => void;
  currentUserId: string;
}

export default function AdminManagement({
  admins,
  onAddAdmin,
  onUpdateAdmin,
  onDeleteAdmin,
  currentUserId
}: AdminManagementProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<UserType | null>(null);
  const [selectedAdminForPassword, setSelectedAdminForPassword] = useState<UserType | null>(null);
  const [selectedAdminForDelete, setSelectedAdminForDelete] = useState<UserType | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAdmin) {
      onUpdateAdmin(editingAdmin.id, formData);
      alert('Administrador atualizado com sucesso!');
    } else {
      const password = generatePassword();
      onAddAdmin({
        ...formData,
        role: 'admin'
      });
      alert(`Administrador cadastrado com sucesso!\n\nDados de acesso:\nEmail: ${formData.email}\nSenha: ${password}\n\nAnote estes dados para fornecer ao novo administrador.`);
    }
    
    resetForm();
  };

  const handlePasswordChange = () => {
    if (!selectedAdminForPassword || !newPassword) {
      alert('Por favor, digite uma nova senha.');
      return;
    }

    // Simular alteração de senha
    alert(`Senha alterada com sucesso para ${selectedAdminForPassword.name}!\n\nNova senha: ${newPassword}\n\nAnote esta senha para fornecer ao administrador.`);
    
    setIsPasswordModalOpen(false);
    setSelectedAdminForPassword(null);
    setNewPassword('');
  };

  const handleDeleteConfirm = () => {
    if (!selectedAdminForDelete) return;

    if (selectedAdminForDelete.id === currentUserId) {
      alert('❌ Erro: Você não pode excluir sua própria conta de administrador!');
      setIsDeleteModalOpen(false);
      setSelectedAdminForDelete(null);
      return;
    }

    onDeleteAdmin(selectedAdminForDelete.id);
    alert(`Administrador ${selectedAdminForDelete.name} foi removido do sistema.`);
    
    setIsDeleteModalOpen(false);
    setSelectedAdminForDelete(null);
  };

  const openPasswordModal = (admin: UserType) => {
    setSelectedAdminForPassword(admin);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  const openDeleteModal = (admin: UserType) => {
    setSelectedAdminForDelete(admin);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: ''
    });
    setEditingAdmin(null);
    setIsFormOpen(false);
  };

  const handleEdit = (admin: UserType) => {
    setFormData({
      name: admin.name,
      email: admin.email,
      phone: admin.phone
    });
    setEditingAdmin(admin);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Administradores</h2>
          <p className="text-gray-600 mt-1">Gerencie os administradores do sistema</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Administrador</span>
        </button>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-blue-900">Informações Importantes</h3>
        </div>
        <ul className="mt-2 text-sm text-blue-800 space-y-1">
          <li>• Administradores têm acesso total ao sistema</li>
          <li>• Senhas são geradas automaticamente para novos administradores</li>
          <li>• Você não pode excluir sua própria conta de administrador</li>
          <li>• Mantenha sempre pelo menos um administrador ativo no sistema</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map((admin) => (
          <div key={admin.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  admin.id === currentUserId ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <Shield className={`w-6 h-6 ${
                    admin.id === currentUserId ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <span>{admin.name}</span>
                    {admin.id === currentUserId && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Você
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">{admin.email}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => openPasswordModal(admin)}
                  className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Alterar Senha"
                >
                  <Lock className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(admin)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openDeleteModal(admin)}
                  className={`p-2 rounded-lg transition-colors ${
                    admin.id === currentUserId
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title={admin.id === currentUserId ? 'Não é possível excluir sua própria conta' : 'Excluir'}
                  disabled={admin.id === currentUserId}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{admin.phone}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Administrador do Sistema</span>
              </div>

              <div className="text-xs text-gray-500">
                Cadastrado em: {new Date(admin.createdAt).toLocaleDateString('pt-BR')}
              </div>

              {admin.id === currentUserId && (
                <div className="bg-green-50 p-2 rounded text-xs text-green-800">
                  ✓ Esta é sua conta atual
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {admins.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum administrador encontrado</h3>
          <p className="text-gray-600">Adicione o primeiro administrador do sistema</p>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAdmin ? 'Editar Administrador' : 'Novo Administrador'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome do administrador"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de Acesso
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@empresa.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este email será usado para login no sistema
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              {!editingAdmin && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Key className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800">
                      <strong>Importante:</strong> Uma senha será gerada automaticamente. 
                      Anote os dados de acesso que serão exibidos após o cadastro.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {editingAdmin ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {isPasswordModalOpen && selectedAdminForPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Lock className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Alterar Senha - {selectedAdminForPassword.name}
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nova Senha
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Digite a nova senha"
                  required
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setNewPassword(generatePassword())}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Key className="w-4 h-4" />
                  <span>Gerar Senha Segura</span>
                </button>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Importante:</strong> Anote a nova senha e forneça ao administrador. 
                  Por segurança, a senha não será exibida novamente.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setSelectedAdminForPassword(null);
                    setNewPassword('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                >
                  Alterar Senha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedAdminForDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Excluir Administrador
                </h3>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
                <p className="text-red-800 font-medium mb-2">
                  ⚠️ Você está prestes a excluir este administrador:
                </p>
                <div className="text-sm text-red-700 space-y-1">
                  <div><strong>Nome:</strong> {selectedAdminForDelete.name}</div>
                  <div><strong>Email:</strong> {selectedAdminForDelete.email}</div>
                  <div><strong>Telefone:</strong> {selectedAdminForDelete.phone}</div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">
                <strong>⚠️ ATENÇÃO:</strong> Esta ação não pode ser desfeita. O administrador perderá 
                permanentemente o acesso ao sistema.
              </p>

              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-yellow-800 text-sm">
                  <strong>Recomendação:</strong> Certifique-se de que há outros administradores 
                  ativos no sistema antes de prosseguir.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedAdminForDelete(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Excluir Administrador
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
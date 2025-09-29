import React, { useState } from 'react';
import { Plus, Edit2, Trash2, User, Clock, MapPin, Phone, Mail, Key, Lock } from 'lucide-react';
import { Provider } from '../../types';

interface ProviderManagementProps {
  providers: Provider[];
  onAddProvider: (provider: Omit<Provider, 'id'>, options?: { password?: string }) => void | Promise<void>;
  onUpdateProvider: (id: string, provider: Partial<Provider>) => void | Promise<void>;
  onDeleteProvider: (id: string) => void | Promise<void>;
  onChangeProviderPassword: (providerId: string, password: string) => void | Promise<void>;
}

export default function ProviderManagement({
  providers,
  onAddProvider,
  onUpdateProvider,
  onDeleteProvider
}: ProviderManagementProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [selectedProviderForPassword, setSelectedProviderForPassword] = useState<Provider | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: [] as string[],
    workingHours: {
      start: '06:00',
      end: '00:00',
      days: [1, 2, 3, 4, 5]
    }
  });

  const specialtyOptions = [
    'Massagem Relaxante',
    'Massagem Desportiva',
    'Quick Massage',
    'Massagem Terapêutica',
    'Reflexologia',
    'Shiatsu',
    'Drenagem Linfática',
    'Massagem Modeladora'
  ];

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
    
    if (editingProvider) {
      onUpdateProvider(editingProvider.id, {
        ...formData,
        breaks: editingProvider.breaks
      });
    } else {
      const password = generatePassword();
      onAddProvider({
        ...formData,
        breaks: []
      });
      alert(`Prestador cadastrado com sucesso!\n\nDados de acesso:\nEmail: ${formData.email}\nSenha: ${password}\n\nAnote estes dados para fornecer ao prestador.`);
    }
    
    resetForm();
  };

  const handlePasswordChange = async () => {
    if (!selectedProviderForPassword || !newPassword) {
      alert('Por favor, digite uma nova senha.');
      return;
    }

    try {
      await onChangeProviderPassword(selectedProviderForPassword.id, newPassword);
      alert(`Senha alterada com sucesso para ${selectedProviderForPassword.name}!`);
    } catch (error) {
      console.error('Erro ao alterar senha do prestador:', error);
      alert('Não foi possível alterar a senha. Tente novamente.');
    } finally {
      setIsPasswordModalOpen(false);
      setSelectedProviderForPassword(null);
      setNewPassword('');
    }
  };

  const openPasswordModal = (provider: Provider) => {
    setSelectedProviderForPassword(provider);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialties: [],
      workingHours: {
        start: '06:00',
        end: '00:00',
        days: [1, 2, 3, 4, 5]
      }
    });
    setEditingProvider(null);
    setIsFormOpen(false);
  };

  const handleEdit = (provider: Provider) => {
    setFormData({
      name: provider.name,
      email: provider.email,
      phone: provider.phone,
      specialties: provider.specialties,
      workingHours: provider.workingHours
    });
    setEditingProvider(provider);
    setIsFormOpen(true);
  };

  const getDayNames = (days: number[]) => {
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days.map(day => dayNames[day]).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Prestadores</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Prestador</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                  <p className="text-sm text-gray-600">{provider.email}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => openPasswordModal(provider)}
                  className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Alterar Senha"
                >
                  <Lock className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(provider)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteProvider(provider.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{provider.phone}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {provider.workingHours.start} - {provider.workingHours.end}
                </span>
              </div>

              <div className="flex items-start space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>{getDayNames(provider.workingHours.days)}</span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Especialidades:</p>
                <div className="flex flex-wrap gap-1">
                  {provider.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProvider ? 'Editar Prestador' : 'Novo Prestador'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidades
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {specialtyOptions.map((specialty) => (
                    <label key={specialty} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.specialties.includes(specialty)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              specialties: [...formData.specialties, specialty]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              specialties: formData.specialties.filter(s => s !== specialty)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário de Início
                  </label>
                  <input
                    type="time"
                    value={formData.workingHours.start}
                    onChange={(e) => setFormData({
                      ...formData,
                      workingHours: { ...formData.workingHours, start: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário de Fim
                  </label>
                  <input
                    type="time"
                    value={formData.workingHours.end}
                    onChange={(e) => setFormData({
                      ...formData,
                      workingHours: { ...formData.workingHours, end: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias de Trabalho
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                    <label key={day} className="flex flex-col items-center space-y-1">
                      <input
                        type="checkbox"
                        checked={formData.workingHours.days.includes(index)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              workingHours: {
                                ...formData.workingHours,
                                days: [...formData.workingHours.days, index]
                              }
                            });
                          } else {
                            setFormData({
                              ...formData,
                              workingHours: {
                                ...formData.workingHours,
                                days: formData.workingHours.days.filter(d => d !== index)
                              }
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              {!editingProvider && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Key className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800">
                      <strong>Importante:</strong> Uma senha será gerada automaticamente para o prestador. 
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
                  {editingProvider ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {isPasswordModalOpen && selectedProviderForPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Lock className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Alterar Senha - {selectedProviderForPassword.name}
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
                  <strong>Importante:</strong> Anote a nova senha e forneça ao prestador. 
                  Por segurança, a senha não será exibida novamente.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setSelectedProviderForPassword(null);
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
    </div>
  );
}
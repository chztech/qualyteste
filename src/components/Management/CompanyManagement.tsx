import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Building2,
  Phone,
  MapPin,
  Users,
  UserPlus,
  Mail,
  Lock,
} from "lucide-react";
import { Company, Employee } from "../../types";

interface CompanyManagementProps {
  companies: Company[];
  onAddCompany: (
    company: Omit<Company, "id">,
    options?: { password?: string }
  ) => void | Promise<void>;
  onUpdateCompany: (
    id: string,
    company: Partial<Company>
  ) => void | Promise<void>;
  onDeleteCompany: (id: string) => void | Promise<void>;
}

export default function CompanyManagement({
  companies,
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
}: CompanyManagementProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedCompanyForPassword, setSelectedCompanyForPassword] =
    useState<Company | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    employees: [] as Employee[],
  });

  const [employeeData, setEmployeeData] = useState({
    name: "",
    phone: "",
    department: "",
  });

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCompany) {
      await onUpdateCompany(editingCompany.id, formData);
    } else {
      const password = generatePassword();
      await onAddCompany(formData, { password });
      alert(
        `Empresa cadastrada com sucesso!\n\nDados de acesso:\nEmail: ${formData.email}\nSenha: ${password}\n\nAnote estes dados para fornecer à empresa.`
      );
    }

    resetForm();
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCompany) {
      const newEmployee: Employee = {
        id: Date.now().toString(),
        ...employeeData,
        companyId: selectedCompany.id,
      };

      const updatedEmployees = [...selectedCompany.employees, newEmployee];
      await onUpdateCompany(selectedCompany.id, {
        employees: updatedEmployees,
      });

      setSelectedCompany({
        ...selectedCompany,
        employees: updatedEmployees,
      });
    }

    setEmployeeData({ name: "", phone: "", department: "" });
    setIsEmployeeFormOpen(false);
  };
  //ALTERÇÃO DE SENHA
  const handlePasswordChange = async () => {
    if (!selectedCompanyForPassword || !newPassword) {
      alert("Por favor, digite uma nova senha.");
      return;
    }

    try {
      await onUpdateCompany(selectedCompanyForPassword.id, {});
      await apiService.updateUser(selectedCompanyForPassword.id, {
        password: newPassword,
      });
      await loadInitialData(currentUser?.role);
      alert(
        `Senha alterada com sucesso para ${selectedCompanyForPassword.name}!`
      );
    } catch (error) {
      console.error("Erro ao alterar senha da empresa:", error);
      alert("Não foi possível alterar a senha. Tente novamente.");
    } finally {
      setIsPasswordModalOpen(false);
      setSelectedCompanyForPassword(null);
      setNewPassword("");
    }
  };

  const openPasswordModal = (company: Company) => {
    setSelectedCompanyForPassword(company);
    setNewPassword("");
    setIsPasswordModalOpen(true);
  };

  const handleRemoveEmployee = async (
    companyId: string,
    employeeId: string
  ) => {
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      const updatedEmployees = company.employees.filter(
        (emp) => emp.id !== employeeId
      );
      await onUpdateCompany(companyId, { employees: updatedEmployees });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      employees: [],
    });
    setEditingCompany(null);
    setIsFormOpen(false);
  };

  const handleEdit = (company: Company) => {
    setFormData({
      name: company.name,
      address: company.address,
      phone: company.phone,
      email: company.email || "",
      employees: company.employees,
    });
    setEditingCompany(company);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Empresas</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Empresa</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {company.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {company.employees.length} colaboradores
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => openPasswordModal(company)}
                  className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Alterar Senha"
                >
                  <Lock className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedCompany(company);
                    setIsEmployeeFormOpen(true);
                  }}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Adicionar Colaborador"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(company)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteCompany(company.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {company.email && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{company.email}</span>
                </div>
              )}

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{company.phone}</span>
              </div>

              <div className="flex items-start space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>{company.address}</span>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Colaboradores:
                  </span>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {company.employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {employee.department}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleRemoveEmployee(company.id, employee.id)
                        }
                        className="text-red-600 hover:text-red-800 text-xs"
                        title="Remover Colaborador"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {company.employees.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      Nenhum colaborador cadastrado
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Company Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCompany ? "Editar Empresa" : "Nova Empresa"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contato@empresa.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este email será usado para login da empresa no sistema
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              {!editingCompany && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Importante:</strong> Uma senha será gerada
                    automaticamente para a empresa. Anote os dados de acesso que
                    serão exibidos após o cadastro.
                  </p>
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
                  {editingCompany ? "Atualizar" : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Form Modal */}
      {isEmployeeFormOpen && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Adicionar Colaborador - {selectedCompany.name}
              </h3>
            </div>

            <form onSubmit={handleEmployeeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Colaborador
                </label>
                <input
                  type="text"
                  value={employeeData.name}
                  onChange={(e) =>
                    setEmployeeData({ ...employeeData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={employeeData.phone}
                  onChange={(e) =>
                    setEmployeeData({ ...employeeData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Setor/Cargo
                </label>
                <input
                  type="text"
                  value={employeeData.department}
                  onChange={(e) =>
                    setEmployeeData({
                      ...employeeData,
                      department: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Desenvolvimento, RH, Vendas"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEmployeeFormOpen(false);
                    setEmployeeData({ name: "", phone: "", department: "" });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {isPasswordModalOpen && selectedCompanyForPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Lock className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Alterar Senha - {selectedCompanyForPassword.name}
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
                  <Lock className="w-4 h-4" />
                  <span>Gerar Senha Segura</span>
                </button>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Importante:</strong> Anote a nova senha e forneça à
                  empresa. Por segurança, a senha não será exibida novamente.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setSelectedCompanyForPassword(null);
                    setNewPassword("");
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

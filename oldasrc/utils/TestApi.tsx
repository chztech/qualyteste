// src/Utils/TestApi.tsx
import React, { useState } from 'react';
import { User, Company, Provider, Appointment, Service } from '../types';

interface TestApiProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  providers: Provider[];
  setProviders: React.Dispatch<React.SetStateAction<Provider[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  services: Service[];
}

const TestApi: React.FC<TestApiProps> = ({
  users, setUsers,
  companies, setCompanies,
  providers, setProviders,
  appointments, setAppointments,
  services
}) => {
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [msg, ...prev]);

  const handleTest = () => {
    addLog(`📌 Total usuários: ${users.length}`);
    addLog(`🏢 Total empresas: ${companies.length}`);
    addLog(`🧑‍💼 Total prestadores: ${providers.length}`);
    addLog(`📅 Total agendamentos: ${appointments.length}`);
    addLog(`🛠️ Total serviços: ${services.length}`);
  };

  const handleAddDummyUser = () => {
    const id = Date.now().toString();
    const newUser: User = {
      id,
      name: `Usuário Teste ${id}`,
      email: `teste${id}@email.com`,
      phone: '000000000',
      role: 'admin',
      createdAt: new Date(),
    };
    setUsers(prev => [...prev, newUser]);
    addLog(`✅ Usuário criado: ${newUser.name}`);
  };

  const handleAddDummyCompany = () => {
    const id = Date.now().toString();
    const newCompany: Company = {
      id,
      name: `Empresa Teste ${id}`,
      address: 'Endereço Teste',
      phone: '00000000',
      email: `empresa${id}@teste.com`,
      employees: [],
      createdAt: new Date()
    };
    setCompanies(prev => [...prev, newCompany]);
    addLog(`✅ Empresa criada: ${newCompany.name}`);
  };

  const handleAddDummyProvider = () => {
    if (!companies[0]) return addLog('❌ Crie ao menos uma empresa antes de adicionar prestadores.');
    const id = Date.now().toString();
    const newProvider: Provider = {
      id,
      name: `Prestador Teste ${id}`,
      email: `provider${id}@teste.com`,
      phone: '00000000',
      companyId: companies[0].id,
      createdAt: new Date()
    };
    setProviders(prev => [...prev, newProvider]);
    addLog(`✅ Prestador criado: ${newProvider.name}`);
  };

  const handleAddDummyAppointment = () => {
    if (!companies[0] || !providers[0] || !services[0]) return addLog('❌ Dados insuficientes para criar agendamento.');
    const id = Date.now().toString();
    const newAppointment: Appointment = {
      id,
      clientId: companies[0].id,
      providerId: providers[0].id,
      companyId: companies[0].id,
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '11:00',
      duration: 60,
      service: services[0].name,
      status: 'scheduled',
      notes: 'Agendamento teste via TestApi',
      createdAt: new Date()
    };
    setAppointments(prev => [...prev, newAppointment]);
    addLog(`✅ Agendamento criado: ${newAppointment.service} às ${newAppointment.startTime}`);
  };

  return (
    <div className="p-4 bg-white rounded shadow space-y-4 max-w-md">
      <h3 className="font-bold text-lg">🧪 TestApi - Painel de Testes</h3>

      <div className="flex flex-wrap gap-2">
        <button onClick={handleTest} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Verificar Dados</button>
        <button onClick={handleAddDummyUser} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Adicionar Usuário</button>
        <button onClick={handleAddDummyCompany} className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">Adicionar Empresa</button>
        <button onClick={handleAddDummyProvider} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Adicionar Prestador</button>
        <button onClick={handleAddDummyAppointment} className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700">Criar Agendamento</button>
      </div>

      <div className="mt-2 max-h-64 overflow-auto bg-gray-50 p-2 rounded border">
        {log.map((entry, index) => (
          <div key={index} className="text-sm">{entry}</div>
        ))}
      </div>
    </div>
  );
};

export default TestApi;

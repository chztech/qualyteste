import React from 'react';
import { apiService } from './services/apiService';
import { mockUsers, mockCompanies, mockProviders, mockAppointments, mockServices } from './data/mockData';

const TestApi = () => {
  const handleSendJson = async () => {
    try {
      const payload = {
        users: mockUsers,
        companies: mockCompanies,
        providers: mockProviders,
        appointments: mockAppointments,
        services: mockServices
      };

      const response = await apiService.request('/sync', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.success) {
        alert('✅ Dados enviados com sucesso!');
        console.log('Resposta do backend:', response.data);
      } else {
        alert(`❌ Erro ao enviar dados: ${response.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('❌ Falha na requisição');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <button
        onClick={handleSendJson}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer'
        }}
      >
        Enviar JSON
      </button>
    </div>
  );
};

export default TestApi;

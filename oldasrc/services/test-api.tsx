import React, { useState } from 'react';
import { apiService } from './services/appService'; // caminho do seu ApiService

const TestApi = () => {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    try {
      // Teste: criar usuário fictício
      const result = await apiService.createUser({
        name: 'Teste API',
        email: `teste${Date.now()}@email.com`,
        password: '123456',
        role: 'client'
      });

      if (!result.success) {
        setError(result.error || 'Erro desconhecido');
        setResponse(null);
      } else {
        setResponse(result.data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão');
      setResponse(null);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Teste de Envio de JSON para a API</h2>
      <button onClick={handleTest}>Enviar JSON</button>

      {response && (
        <div style={{ marginTop: '10px', color: 'green' }}>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '10px', color: 'red' }}>
          <pre>{error}</pre>
        </div>
      )}
    </div>
  );
};

export default TestApi;

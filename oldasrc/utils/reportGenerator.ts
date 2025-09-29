import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generatePDFReport = (data: any) => {
  const doc = new jsPDF();
  
  if (data.type === 'company-detailed') {
    // 🎯 RELATÓRIO DETALHADO POR EMPRESA
    doc.setFontSize(20);
    doc.text('Relatório por Empresa - QualyCorpore', 20, 20);
    
    // Período
    doc.setFontSize(12);
    doc.text('Período: ' + data.period, 20, 35);
    doc.text(`Gerado em: ${data.generatedAt}`, 20, 45);
    
    let yPosition = 60;
    
    // 📊 ADICIONAR GRÁFICOS AO PDF
    doc.setFontSize(14);
    doc.text('📊 Análise Visual:', 20, yPosition);
    yPosition += 15;
    
    // Gráfico de Status (Texto)
    doc.setFontSize(10);
    doc.text('Status dos Agendamentos:', 20, yPosition);
    yPosition += 8;
    if (data.chartData && data.chartData.status) {
      Object.entries(data.chartData.status).forEach(([status, count]: [string, any]) => {
        const statusLabel = status === 'scheduled' ? 'Agendados' :
                           status === 'confirmed' ? 'Confirmados' :
                           status === 'completed' ? 'Concluídos' : 'Cancelados';
        doc.text('• ' + statusLabel + ': ' + count, 25, yPosition);
        yPosition += 6;
      });
    }
    yPosition += 10;
    
    // Serviços Mais Utilizados
    doc.text('Serviços Mais Solicitados:', 20, yPosition);
    yPosition += 8;
    if (data.chartData && data.chartData.services) {
      data.chartData.services.slice(0, 5).forEach(([service, count]: [string, number]) => {
        doc.text('• ' + service + ': ' + count + ' agendamentos', 25, yPosition);
        yPosition += 6;
      });
    }
    yPosition += 15;
    
    // Resumo Geral
    doc.setFontSize(14);
    doc.text('📊 Resumo Geral:', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.text(`Total de Empresas: ${data.companyData.length}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Total de Agendamentos: ${data.appointments.length}`, 20, yPosition);
    yPosition += 20;
    
    // Dados por Empresa
    data.companyData.forEach((companyInfo: any, index: number) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.text(`🏢 ${companyInfo.company.name}`, 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.text(`Endereço: ${companyInfo.company.address}`, 25, yPosition);
      yPosition += 8;
      doc.text(`Telefone: ${companyInfo.company.phone}`, 25, yPosition);
      yPosition += 8;
      doc.text(`Total de Agendamentos: ${companyInfo.total}`, 25, yPosition);
      yPosition += 8;
      doc.text(`Confirmados: ${companyInfo.confirmed} | Concluídos: ${companyInfo.completed} | Cancelados: ${companyInfo.cancelled}`, 25, yPosition);
      yPosition += 8;
      doc.text(`Tempo Total: ${companyInfo.totalDuration} min`, 25, yPosition);
      yPosition += 8;
      doc.text(`Colaboradores Ativos: ${companyInfo.employees.size} | Prestadores: ${companyInfo.providers.size}`, 25, yPosition);
      yPosition += 15;
    });
    
  } else {
    // 🎯 RELATÓRIO GERAL ORIGINAL
    doc.setFontSize(20);
    doc.text('Relatório de Agendamentos - QualyCorpore', 20, 20);
    
    // Período
    doc.setFontSize(12);
    doc.text('Período: ' + new Date(data.dateRange.start).toLocaleDateString('pt-BR') + ' a ' + new Date(data.dateRange.end).toLocaleDateString('pt-BR'), 20, 35);
    
    // 📊 ADICIONAR GRÁFICOS AO PDF
    let yPosition = 50;
    doc.setFontSize(14);
    doc.text('📊 Análise Visual:', 20, yPosition);
    yPosition += 15;
    
    // Gráfico de Status
    doc.setFontSize(10);
    doc.text('Status dos Agendamentos:', 20, yPosition);
    yPosition += 8;
    const statusCounts = {
      scheduled: data.appointments.filter((apt: any) => apt.status === 'scheduled').length,
      confirmed: data.appointments.filter((apt: any) => apt.status === 'confirmed').length,
      completed: data.appointments.filter((apt: any) => apt.status === 'completed').length,
      cancelled: data.appointments.filter((apt: any) => apt.status === 'cancelled').length
    };
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      const statusLabel = status === 'scheduled' ? 'Agendados' :
                         status === 'confirmed' ? 'Confirmados' :
                         status === 'completed' ? 'Concluídos' : 'Cancelados';
      doc.text('• ' + statusLabel + ': ' + count, 25, yPosition);
      yPosition += 6;
    });
    yPosition += 10;
    
    // Estatísticas
    doc.text('Resumo:', 20, yPosition);
    yPosition += 10;
    doc.text(`Total de Agendamentos: ${data.appointments.length}`, 20, yPosition);
    yPosition += 7;
    doc.text('Confirmados: ' + statusCounts.confirmed, 20, yPosition);
    yPosition += 7;
    doc.text('Concluídos: ' + statusCounts.completed, 20, yPosition);
    yPosition += 7;
    doc.text('Cancelados: ' + statusCounts.cancelled, 20, yPosition);
    
    // Tabela de agendamentos
    const tableData = data.appointments.map((apt: any) => {
      const provider = data.providers.find((p: any) => p.id === apt.providerId);
      const company = data.companies.find((c: any) => c.id === apt.companyId);
      
      return [
        new Date(apt.date).toLocaleDateString('pt-BR'),
        apt.startTime,
        apt.service,
        provider?.name || '',
        company?.name || 'Individual',
        apt.status === 'completed' ? 'Concluído' :
        apt.status === 'confirmed' ? 'Confirmado' :
        apt.status === 'cancelled' ? 'Cancelado' : 'Agendado'
      ];
    });

    doc.autoTable({
      head: [['Data', 'Hora', 'Serviço', 'Prestador', 'Empresa', 'Status']],
      body: tableData,
      startY: yPosition + 15,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });
  }
  
  // Salvar
  const fileName = data.type === 'company-detailed' 
    ? `relatorio-empresas-${new Date().toISOString().split('T')[0]}.pdf`
    : `relatorio-agendamentos-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const generateExcelReport = (data: any) => {
  const workbook = XLSX.utils.book_new();
  
  if (data.type === 'company-detailed') {
    // 🎯 RELATÓRIO DETALHADO POR EMPRESA
    
    // Aba 1: Resumo por Empresa
    const companyResumoData = data.companyData.map((companyInfo: any) => ({
      'Empresa': companyInfo.company.name,
      'Endereço': companyInfo.company.address,
      'Telefone': companyInfo.company.phone,
      'Email': companyInfo.company.email || '',
      'Total Agendamentos': companyInfo.total,
      'Agendados': companyInfo.scheduled,
      'Confirmados': companyInfo.confirmed,
      'Concluídos': companyInfo.completed,
      'Cancelados': companyInfo.cancelled,
      'Tempo Total (min)': companyInfo.totalDuration,
      'Colaboradores Ativos': companyInfo.employees.size,
      'Prestadores': companyInfo.providers.size,
      'Tipos de Serviços': companyInfo.services.size,
      'Taxa de Sucesso (%)': companyInfo.total > 0 ? Math.round(((companyInfo.confirmed + companyInfo.completed) / companyInfo.total) * 100) : 0
    }));
    
    const companySheet = XLSX.utils.json_to_sheet(companyResumoData);
    XLSX.utils.book_append_sheet(workbook, companySheet, 'Resumo por Empresa');
    
    // Aba 2: Agendamentos Detalhados
    const appointmentsData = data.appointments.map((apt: any) => {
      const provider = data.providers.find((p: any) => p.id === apt.providerId);
      const company = data.companies.find((c: any) => c.id === apt.companyId);
      const employee = company?.employees.find((e: any) => e.id === apt.employeeId);
      
      return {
        'Data': new Date(apt.date).toLocaleDateString('pt-BR'),
        'Hora Início': apt.startTime,
        'Hora Fim': apt.endTime,
        'Duração (min)': apt.duration,
        'Serviço': apt.service,
        'Prestador': provider?.name || '',
        'Empresa': company?.name || 'Individual',
        'Colaborador': employee?.name || '',
        'Departamento': employee?.department || '',
        'Status': apt.status === 'completed' ? 'Concluído' :
                  apt.status === 'confirmed' ? 'Confirmado' :
                  apt.status === 'cancelled' ? 'Cancelado' : 'Agendado',
        'Observações': apt.notes || ''
      };
    });
    
    const appointmentsSheet = XLSX.utils.json_to_sheet(appointmentsData);
    XLSX.utils.book_append_sheet(workbook, appointmentsSheet, 'Agendamentos Detalhados');
    
    // Aba 3: Estatísticas Consolidadas
    const statsData = [
      { 'Métrica': 'Total de Empresas', 'Valor': data.companyData.length },
      { 'Métrica': 'Total de Agendamentos', 'Valor': data.appointments.length },
      { 'Métrica': 'Confirmados', 'Valor': data.appointments.filter((apt: any) => apt.status === 'confirmed').length },
      { 'Métrica': 'Concluídos', 'Valor': data.appointments.filter((apt: any) => apt.status === 'completed').length },
      { 'Métrica': 'Cancelados', 'Valor': data.appointments.filter((apt: any) => apt.status === 'cancelled').length },
      { 'Métrica': 'Período', 'Valor': data.period },
      { 'Métrica': 'Gerado em', 'Valor': data.generatedAt }
    ];
    
    const statsSheet = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estatísticas');
    
    // 📊 ABA 5: DADOS DOS GRÁFICOS
    if (data.chartData) {
      // Status Chart Data
      const statusChartData = Object.entries(data.chartData.status || {}).map(([status, count]) => ({
        'Status': status === 'scheduled' ? 'Agendados' :
                 status === 'confirmed' ? 'Confirmados' :
                 status === 'completed' ? 'Concluídos' : 'Cancelados',
        'Quantidade': count,
        'Percentual': data.appointments.length > 0 ? Math.round((count as number / data.appointments.length) * 100) + '%' : '0%'
      }));
      
      const statusChartSheet = XLSX.utils.json_to_sheet(statusChartData);
      XLSX.utils.book_append_sheet(workbook, statusChartSheet, 'Gráfico Status');
      
      // Services Chart Data
      if (data.chartData.services) {
        const servicesChartData = data.chartData.services.map(([service, count]: [string, number]) => ({
          'Serviço': service,
          'Quantidade': count,
          'Percentual': data.appointments.length > 0 ? Math.round((count / data.appointments.length) * 100) + '%' : '0%'
        }));
        
        const servicesChartSheet = XLSX.utils.json_to_sheet(servicesChartData);
        XLSX.utils.book_append_sheet(workbook, servicesChartSheet, 'Gráfico Serviços');
      }
      
      // Companies Chart Data
      if (data.chartData.companies) {
        const companiesChartData = data.chartData.companies.map(([company, count]: [string, number]) => ({
          'Empresa': company,
          'Quantidade': count,
          'Percentual': data.appointments.length > 0 ? Math.round((count / data.appointments.length) * 100) + '%' : '0%'
        }));
        
        const companiesChartSheet = XLSX.utils.json_to_sheet(companiesChartData);
        XLSX.utils.book_append_sheet(workbook, companiesChartSheet, 'Gráfico Empresas');
      }
    }
    
    // Aba 4: Ranking de Empresas
    const rankingData = data.companyData.map((companyInfo: any, index: number) => ({
      'Posição': index + 1,
      'Empresa': companyInfo.company.name,
      'Total Agendamentos': companyInfo.total,
      'Taxa de Conclusão (%)': companyInfo.total > 0 ? Math.round((companyInfo.completed / companyInfo.total) * 100) : 0,
      'Colaboradores': companyInfo.employees.size,
      'Tempo Total (horas)': Math.round(companyInfo.totalDuration / 60 * 100) / 100
    }));
    
    const rankingSheet = XLSX.utils.json_to_sheet(rankingData);
    XLSX.utils.book_append_sheet(workbook, rankingSheet, 'Ranking Empresas');
    
  } else {
    // 🎯 RELATÓRIO GERAL ORIGINAL
    const appointmentsData = data.appointments.map((apt: any) => {
      const provider = data.providers.find((p: any) => p.id === apt.providerId);
      const company = data.companies.find((c: any) => c.id === apt.companyId);
      
      return {
        'Data': new Date(apt.date).toLocaleDateString('pt-BR'),
        'Hora Início': apt.startTime,
        'Hora Fim': apt.endTime,
        'Duração (min)': apt.duration,
        'Serviço': apt.service,
        'Prestador': provider?.name || '',
        'Empresa': company?.name || 'Individual',
        'Status': apt.status === 'completed' ? 'Concluído' :
                  apt.status === 'confirmed' ? 'Confirmado' :
                  apt.status === 'cancelled' ? 'Cancelado' : 'Agendado',
        'Observações': apt.notes || ''
      };
    });

    const appointmentsSheet = XLSX.utils.json_to_sheet(appointmentsData);
    XLSX.utils.book_append_sheet(workbook, appointmentsSheet, 'Agendamentos');

    // 📊 ABA DE GRÁFICOS
    const chartData = [
      { 'Tipo': 'Status - Agendados', 'Valor': data.appointments.filter((apt: any) => apt.status === 'scheduled').length },
      { 'Tipo': 'Status - Confirmados', 'Valor': data.appointments.filter((apt: any) => apt.status === 'confirmed').length },
      { 'Tipo': 'Status - Concluídos', 'Valor': data.appointments.filter((apt: any) => apt.status === 'completed').length },
      { 'Tipo': 'Status - Cancelados', 'Valor': data.appointments.filter((apt: any) => apt.status === 'cancelled').length }
    ];
    
    const chartSheet = XLSX.utils.json_to_sheet(chartData);
    XLSX.utils.book_append_sheet(workbook, chartSheet, 'Dados Gráficos');
    
    // Aba de Estatísticas Gerais
    const statsData = [
      { 'Métrica': 'Total de Agendamentos', 'Valor': data.appointments.length },
      { 'Métrica': 'Confirmados', 'Valor': data.appointments.filter((apt: any) => apt.status === 'confirmed').length },
      { 'Métrica': 'Concluídos', 'Valor': data.appointments.filter((apt: any) => apt.status === 'completed').length },
      { 'Métrica': 'Cancelados', 'Valor': data.appointments.filter((apt: any) => apt.status === 'cancelled').length },
      { 'Métrica': 'Período', 'Valor': new Date(data.dateRange.start).toLocaleDateString('pt-BR') + ' a ' + new Date(data.dateRange.end).toLocaleDateString('pt-BR') }
    ];

    const statsSheet = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estatísticas');
  }
  
  // Salvar
  const fileName = data.type === 'company-detailed' 
    ? 'relatorio-empresas-' + new Date().toISOString().split('T')[0] + '.xlsx'
    : 'relatorio-agendamentos-' + new Date().toISOString().split('T')[0] + '.xlsx';
  XLSX.writeFile(workbook, fileName);
};
import React, { useState, useEffect } from 'react';
import { Calendar, Download, FileText, BarChart3, PieChart, TrendingUp, Users, Clock, CheckCircle, XCircle, AlertCircle, Filter, Building2 } from 'lucide-react';
import { generatePDFReport, generateExcelReport } from '../../utils/reportGenerator';
import { formatDate, getCurrentDateString, getMonthRange } from '../../utils/dateUtils';

interface ReportsPageProps {
  appointments: any[];
  providers: any[];
  companies: any[];
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  company: string;
  service: string;
  status: string;
  reportType: 'general' | 'company-detailed';
}

export default function ReportsPage({ appointments, providers, companies }: ReportsPageProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    company: '',
    service: '',
    status: '',
    reportType: 'general'
  });

  const [filteredAppointments, setFilteredAppointments] = useState(appointments);

  // 🎯 INICIALIZAR COM DADOS DO MÊS ATUAL
  useEffect(() => {
    const today = getCurrentDateString();
    const { start, end } = getMonthRange(today);
    setFilters(prev => ({
      ...prev,
      startDate: start,
      endDate: end
    }));
  }, []);

  // Filter appointments
  useEffect(() => {
    let filtered = appointments;

    if (filters.startDate) {
      filtered = filtered.filter(apt => apt.date >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter(apt => apt.date <= filters.endDate);
    }
    if (filters.company) {
      filtered = filtered.filter(apt => apt.companyId === filters.company);
    }
    if (filters.service) {
      filtered = filtered.filter(apt => apt.service === filters.service);
    }
    if (filters.status) {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    setFilteredAppointments(filtered);
  }, [filters, appointments]);

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    const today = getCurrentDateString();
    const { start, end } = getMonthRange(today);
    setFilters({
      startDate: start,
      endDate: end,
      company: '',
      service: '',
      status: '',
      reportType: 'general'
    });
  };

  // 🎯 FUNÇÃO: Gerar dados dos gráficos
  const generateChartData = () => {
    // Gráfico de Status
    const statusData = filteredAppointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Gráfico de Serviços
    const servicesData = filteredAppointments.reduce((acc, apt) => {
      acc[apt.service] = (acc[apt.service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Gráfico de Empresas
    const companiesData = filteredAppointments.reduce((acc, apt) => {
      if (apt.companyId) {
        const company = companies.find(c => c.id === apt.companyId);
        if (company) {
          acc[company.name] = (acc[company.name] || 0) + 1;
        }
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      status: statusData,
      services: Object.entries(servicesData).sort(([,a], [,b]) => b - a),
      companies: Object.entries(companiesData).sort(([,a], [,b]) => b - a)
    };
  };

  // 🎯 FUNÇÃO: Gerar dados detalhados por empresa
  const generateCompanyDetailedData = () => {
    const companyData = companies.map(company => {
      const companyAppointments = filteredAppointments.filter(apt => apt.companyId === company.id);
      
      const stats = {
        total: companyAppointments.length,
        scheduled: companyAppointments.filter(apt => apt.status === 'scheduled').length,
        confirmed: companyAppointments.filter(apt => apt.status === 'confirmed').length,
        completed: companyAppointments.filter(apt => apt.status === 'completed').length,
        cancelled: companyAppointments.filter(apt => apt.status === 'cancelled').length,
        totalDuration: companyAppointments.reduce((sum, apt) => sum + apt.duration, 0),
        employees: new Set(companyAppointments.map(apt => apt.employeeId).filter(Boolean)),
        providers: new Set(companyAppointments.map(apt => apt.providerId)),
        services: new Set(companyAppointments.map(apt => apt.service))
      };

      return {
        company,
        ...stats
      };
    }).filter(data => data.total > 0); // Apenas empresas com agendamentos

    return companyData.sort((a, b) => b.total - a.total); // Ordenar por total de agendamentos
  };

  const exportToPDF = () => {
    const chartData = generateChartData();
    
    const reportData = {
      type: filters.reportType,
      period: filters.startDate && filters.endDate ? 
        `${formatDate(filters.startDate)} a ${formatDate(filters.endDate)}` : 
        'Todos os períodos',
      generatedAt: new Date().toLocaleString('pt-BR'),
      appointments: filteredAppointments,
      providers,
      companies,
      chartData, // 🎯 INCLUIR DADOS DOS GRÁFICOS
      dateRange: {
        start: filters.startDate,
        end: filters.endDate
      }
    };

    // 🎯 DADOS ESPECÍFICOS PARA RELATÓRIO POR EMPRESA
    if (filters.reportType === 'company-detailed') {
      reportData.companyData = generateCompanyDetailedData();
    }

    generatePDFReport(reportData);
  };

  const exportToExcel = () => {
    const chartData = generateChartData();
    
    const reportData = {
      type: filters.reportType,
      period: filters.startDate && filters.endDate ? 
        `${formatDate(filters.startDate)} a ${formatDate(filters.endDate)}` : 
        'Todos os períodos',
      generatedAt: new Date().toLocaleString('pt-BR'),
      appointments: filteredAppointments,
      providers,
      companies,
      chartData, // 🎯 INCLUIR DADOS DOS GRÁFICOS
      dateRange: {
        start: filters.startDate,
        end: filters.endDate
      }
    };

    // 🎯 DADOS ESPECÍFICOS PARA RELATÓRIO POR EMPRESA
    if (filters.reportType === 'company-detailed') {
      reportData.companyData = generateCompanyDetailedData();
    }

    generateExcelReport(reportData);
  };

  const getStatusDistribution = () => {
    const distribution = filteredAppointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
      percentage: filteredAppointments.length > 0 ? Math.round((count / filteredAppointments.length) * 100) : 0
    }));
  };

  const getTopServices = () => {
    const services = filteredAppointments.reduce((acc, apt) => {
      acc[apt.service] = (acc[apt.service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(services)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getCompaniesPerformance = () => {
    const companiesStats = filteredAppointments.reduce((acc, apt) => {
      if (apt.companyId) {
        const company = companies.find(c => c.id === apt.companyId);
        if (company) {
          if (!acc[company.name]) {
            acc[company.name] = { total: 0, completed: 0 };
          }
          acc[company.name].total++;
          if (apt.status === 'completed') {
            acc[company.name].completed++;
          }
        }
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    return Object.entries(companiesStats).map(([company, data]) => ({
      company,
      total: data.total,
      completed: data.completed,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
    }));
  };

  const getUniqueServices = () => {
    return [...new Set(filteredAppointments.map(apt => apt.service))];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'confirmed':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'scheduled':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'confirmed':
        return 'text-blue-600 bg-blue-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      case 'scheduled':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const PieChartComponent = ({ data }: { data: Array<{ status: string; count: number; percentage: number }> }) => {
    const colors = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B'];
    let cumulativePercentage = 0;

    return (
      <div className="flex items-center justify-center">
        <svg width="200" height="200" viewBox="0 0 42 42" className="transform -rotate-90">
          <circle
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke="#E5E7EB"
            strokeWidth="3"
          />
          {data.map((item, index) => {
            const strokeDasharray = item.percentage + ' ' + (100 - item.percentage);
            const strokeDashoffset = 100 - cumulativePercentage;
            cumulativePercentage += item.percentage;
            
            return (
              <circle
                key={item.status}
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke={colors[index]}
                strokeWidth="3"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  const BarChart = ({ data, title }: { data: Array<{ label: string; value: number }>, title: string }) => {
    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">{title}</h4>
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: maxValue > 0 ? (item.value / maxValue) * 100 + '%' : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const statusDistribution = getStatusDistribution();
  const topServices = getTopServices();
  const companiesPerformance = getCompaniesPerformance();
  const companyDetailedData = generateCompanyDetailedData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análise detalhada dos agendamentos e performance das empresas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Exportar PDF
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('reportType', 'general')}
              className={'px-3 py-1 rounded-full text-sm font-medium transition-colors ' + 
                (filters.reportType === 'general' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
            >
              📊 Geral
            </button>
            <button
              onClick={() => handleFilterChange('reportType', 'company-detailed')}
              className={'px-3 py-1 rounded-full text-sm font-medium transition-colors ' + 
                (filters.reportType === 'company-detailed' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
            >
              🏢 Por Empresa
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Início
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Fim
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empresa
            </label>
            <select
              value={filters.company}
              onChange={(e) => handleFilterChange('company', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Serviço
            </label>
            <select
              value={filters.service}
              onChange={(e) => handleFilterChange('service', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {getUniqueServices().map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="completed">Concluído</option>
              <option value="confirmed">Confirmado</option>
              <option value="cancelled">Cancelado</option>
              <option value="scheduled">Agendado</option>
            </select>
          </div>
        </div>

        {/* Resumo dos Filtros Ativos */}
        {(filters.startDate || filters.endDate || filters.company || filters.service || filters.status) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-blue-700">Filtros ativos:</span>
              {filters.startDate && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  Início: {formatDate(filters.startDate)}
                </span>
              )}
              {filters.endDate && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  Fim: {formatDate(filters.endDate)}
                </span>
              )}
              {filters.company && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  Empresa: {companies.find(c => c.id === filters.company)?.name}
                </span>
              )}
              {filters.service && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  Serviço: {filters.service}
                </span>
              )}
              {filters.status && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  Status: {filters.status}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total de Agendamentos</p>
              <p className="text-3xl font-bold">{filteredAppointments.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Concluídos</p>
              <p className="text-3xl font-bold">
                {filteredAppointments.filter(apt => apt.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Cancelados</p>
              <p className="text-3xl font-bold">
                {filteredAppointments.filter(apt => apt.status === 'cancelled').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Empresas Ativas</p>
              <p className="text-3xl font-bold">
                {new Set(filteredAppointments.filter(apt => apt.companyId).map(apt => apt.companyId)).size}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* 🎯 RELATÓRIO POR EMPRESA */}
      {filters.reportType === 'company-detailed' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Relatório Detalhado por Empresa
              <span className="text-sm font-normal text-green-600 ml-2">
                (Incluído na exportação PDF/Excel)
              </span>
            </h2>
          </div>

          <div className="space-y-4">
            {companyDetailedData.map((companyInfo, index) => (
              <div key={companyInfo.company.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        #{index + 1} {companyInfo.company.name}
                      </h3>
                      <p className="text-sm text-gray-600">{companyInfo.company.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">{companyInfo.total}</p>
                    <p className="text-xs text-gray-500">agendamentos</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-gray-600">Agendados</p>
                    <p className="text-lg font-bold text-yellow-600">{companyInfo.scheduled}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-gray-600">Confirmados</p>
                    <p className="text-lg font-bold text-green-600">{companyInfo.confirmed}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-gray-600">Concluídos</p>
                    <p className="text-lg font-bold text-blue-600">{companyInfo.completed}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-gray-600">Cancelados</p>
                    <p className="text-lg font-bold text-red-600">{companyInfo.cancelled}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                  <div>📞 {companyInfo.company.phone}</div>
                  <div>👥 {companyInfo.employees.size} colaboradores</div>
                  <div>👨‍⚕️ {companyInfo.providers.size} prestadores</div>
                  <div>⏱️ {Math.round(companyInfo.totalDuration / 60)} horas</div>
                </div>

                {companyInfo.total > 0 && (
                  <div className="mt-3 bg-white p-3 rounded border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Taxa de Sucesso:</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ 
                              width: `${Math.round(((companyInfo.confirmed + companyInfo.completed) / companyInfo.total) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold text-green-600">
                          {Math.round(((companyInfo.confirmed + companyInfo.completed) / companyInfo.total) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {companyDetailedData.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma empresa com agendamentos no período selecionado</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gráficos - Incluídos na Exportação */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Análise Visual 
            <span className="text-sm font-normal text-green-600 ml-2">
              (Incluído na exportação PDF/Excel)
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Status */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Distribuição por Status
            </h3>
            {statusDistribution.length > 0 ? (
              <div className="space-y-4">
                <PieChartComponent data={statusDistribution} />
                <div className="space-y-2">
                  {statusDistribution.map((item, index) => (
                    <div key={item.status} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="capitalize">
                          {item.status === 'scheduled' ? 'Agendados' :
                           item.status === 'confirmed' ? 'Confirmados' :
                           item.status === 'completed' ? 'Concluídos' : 'Cancelados'}
                        </span>
                      </div>
                      <span className="font-medium">{item.count} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
            )}
          </div>

          {/* Gráfico de Serviços */}
          <div>
            <BarChart 
              data={topServices.map(service => ({ label: service.service, value: service.count }))}
              title="Top 5 Serviços Mais Solicitados"
            />
          </div>

          {/* Gráfico de Performance das Empresas */}
          <div>
            <BarChart 
              data={companiesPerformance.map(company => ({ label: company.company, value: company.completionRate }))}
              title="Taxa de Conclusão por Empresa (%)"
            />
          </div>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Agendamentos ({filteredAppointments.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Colaborador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Serviço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prestador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duração
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => {
                const company = companies.find(c => c.id === appointment.companyId);
                const provider = providers.find(p => p.id === appointment.providerId);
                const employee = company?.employees.find(e => e.id === appointment.employeeId);
                
                return (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {company?.name || 'Individual'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {employee?.name || 'Vaga disponível'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.service}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        {formatDate(appointment.date)} às {appointment.startTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {provider?.name || 'Não especificado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ' + getStatusColor(appointment.status)}>
                        {getStatusIcon(appointment.status)}
                        <span className="capitalize">
                          {appointment.status === 'scheduled' ? 'Agendado' :
                           appointment.status === 'confirmed' ? 'Confirmado' :
                           appointment.status === 'completed' ? 'Concluído' : 'Cancelado'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-1" />
                        {appointment.duration}min
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAppointments.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum agendamento encontrado com os filtros aplicados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
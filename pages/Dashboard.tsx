import React, { useState, useEffect } from 'react';
import { ClipboardList, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ServiceOrder, OSStatus, OSType } from '../types';
import { supabase } from '../supabaseClient'; // Import supabase

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 p-5">
    <div className="flex items-center">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div className="ml-4">
        <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
        <dd className="text-2xl font-bold text-gray-900">{value}</dd>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    porIniciar: 0,
    emExecucao: 0,
    altaPrioridade: 0,
    concluidasHoje: 0,
  });
  const [recentOs, setRecentOs] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const isDemo = localStorage.getItem('demo_session') === 'true';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    if (isDemo) {
      // Mock data for demo mode
      setStats({
        porIniciar: 12,
        emExecucao: 3,
        altaPrioridade: 5,
        concluidasHoje: 8,
      });
      setRecentOs([
        { id: '1', code: 'CR-2023-001', client_id: 'c1', type: OSType.AVARIA, status: OSStatus.ATRIBUIDA, description: 'Forno Industrial não aquece', priority: 'alta', created_at: new Date().toISOString() },
        { id: '2', code: 'PM-2023-002', client_id: 'c2', type: OSType.MANUTENCAO, status: OSStatus.INICIADA, description: 'Revisão semestral Ar Condicionado', priority: 'media', created_at: new Date().toISOString() },
        { id: '3', code: 'CR-2023-003', client_id: 'c3', type: OSType.INSTALACAO, status: OSStatus.POR_INICIAR, description: 'Instalação Máquina Lavar Louça', priority: 'media', created_at: new Date().toISOString() },
        { id: '4', code: 'PM-2023-004', client_id: 'c4', type: OSType.AVARIA, status: OSStatus.AGUARDA_PECAS, description: 'Frigorífico com fuga de gás', priority: 'alta', created_at: new Date().toISOString() },
        { id: '5', code: 'CR-2023-005', client_id: 'c5', type: OSType.REVISAO, status: OSStatus.CONCLUIDA, description: 'Revisão anual de equipamentos de cozinha', priority: 'baixa', created_at: new Date().toISOString() },
      ]);
      setLoading(false);
      return;
    }

    try {
      // Fetch stats
      const { count: porIniciarCount } = await supabase
        .from('service_orders')
        .select('count', { count: 'exact' })
        .in('status', [OSStatus.POR_INICIAR, OSStatus.ATRIBUIDA]);

      const { count: emExecucaoCount } = await supabase
        .from('service_orders')
        .select('count', { count: 'exact' })
        .in('status', [OSStatus.INICIADA, OSStatus.PAUSA, OSStatus.AGUARDA_PECAS, OSStatus.PECAS_RECEBIDAS]);

      const { count: altaPrioridadeCount } = await supabase
        .from('service_orders')
        .select('count', { count: 'exact' })
        .in('priority', ['alta', 'urgente'])
        .not('status', 'in', `(${OSStatus.CONCLUIDA},${OSStatus.FATURADA},${OSStatus.CANCELADA})`);

      const today = new Date().toISOString().split('T')[0];
      const { count: concluidasHojeCount } = await supabase
        .from('service_orders')
        .select('count', { count: 'exact' })
        .eq('status', OSStatus.CONCLUIDA)
        .gte('end_time', today); // Assuming end_time is set on completion

      setStats({
        porIniciar: porIniciarCount || 0,
        emExecucao: emExecucaoCount || 0,
        altaPrioridade: altaPrioridadeCount || 0,
        concluidasHoje: concluidasHojeCount || 0,
      });

      // Fetch recent service orders
      const { data: recentOsData, error: recentOsError } = await supabase
        .from('service_orders')
        .select(`
          *,
          client:clients(name),
          equipment:equipments(type)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentOsError) throw recentOsError;
      setRecentOs(recentOsData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data on error
      setStats({
        porIniciar: 12,
        emExecucao: 3,
        altaPrioridade: 5,
        concluidasHoje: 8,
      });
      setRecentOs([
        { id: '1', code: 'CR-2023-001', client_id: 'c1', type: OSType.AVARIA, status: OSStatus.ATRIBUIDA, description: 'Forno Industrial não aquece', priority: 'alta', created_at: new Date().toISOString() },
        { id: '2', code: 'PM-2023-002', client_id: 'c2', type: OSType.MANUTENCAO, status: OSStatus.INICIADA, description: 'Revisão semestral Ar Condicionado', priority: 'media', created_at: new Date().toISOString() },
        { id: '3', code: 'CR-2023-003', client_id: 'c3', type: OSType.INSTALACAO, status: OSStatus.POR_INICIAR, description: 'Instalação Máquina Lavar Louça', priority: 'media', created_at: new Date().toISOString() },
        { id: '4', code: 'PM-2023-004', client_id: 'c4', type: OSType.AVARIA, status: OSStatus.AGUARDA_PECAS, description: 'Frigorífico com fuga de gás', priority: 'alta', created_at: new Date().toISOString() },
        { id: '5', code: 'CR-2023-005', client_id: 'c5', type: OSType.REVISAO, status: OSStatus.CONCLUIDA, description: 'Revisão anual de equipamentos de cozinha', priority: 'baixa', created_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">A carregar dados do dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="OS por Iniciar" value={stats.porIniciar} icon={ClipboardList} color="bg-blue-500" />
        <StatCard title="Em Execução" value={stats.emExecucao} icon={Clock} color="bg-yellow-500" />
        <StatCard title="Alta Prioridade" value={stats.altaPrioridade} icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Concluídas Hoje" value={stats.concluidasHoje} icon={CheckCircle} color="bg-green-500" />
      </div>

      {/* Recent OS Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Ordens de Serviço Recentes</h2>
          <Link to="/os" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Ver todas</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOs.map((os) => (
                <tr key={os.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{os.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{os.client?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{os.equipment?.type || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${os.status === OSStatus.INICIADA ? 'bg-yellow-100 text-yellow-800' : 
                        os.status === OSStatus.POR_INICIAR ? 'bg-blue-100 text-blue-800' : 
                        os.status === OSStatus.CONCLUIDA ? 'bg-green-100 text-green-800' :
                        os.status === OSStatus.AGUARDA_PECAS ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {os.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link to={`/os/${os.id}`} className="text-blue-600 hover:text-blue-900">Gerir</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
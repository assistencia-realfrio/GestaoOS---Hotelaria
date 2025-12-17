import React, { useState, useEffect } from 'react';
import { ClipboardList, Clock, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { OSStatus } from '../types';

const StatCard = ({ title, value, icon: Icon, color, subText }: any) => (
  <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between h-full">
    <div className="flex items-center">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div className="ml-4">
        <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
        <dd className="text-2xl font-bold text-gray-900">{value}</dd>
      </div>
    </div>
    {subText && (
      <div className="mt-4 text-xs text-gray-400 border-t pt-2">
        {subText}
      </div>
    )}
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    blocked: 0, // Aguarda Peças / Orçamento
    completedToday: 0
  });
  const [loading, setLoading] = useState(true);
  const isDemo = localStorage.getItem('demo_session') === 'true';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (isDemo) {
      // Mock stats for demo
      setStats({
        pending: 5,
        active: 2,
        blocked: 3,
        completedToday: 4
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select('status, created_at, end_time');
      
      if (error) throw error;

      if (data) {
        const today = new Date().toISOString().split('T')[0];
        
        const pending = data.filter(os => os.status === OSStatus.POR_INICIAR).length;
        const active = data.filter(os => os.status === OSStatus.INICIADA).length;
        const blocked = data.filter(os => 
          os.status === OSStatus.AGUARDA_PECAS || 
          os.status === OSStatus.PARA_ORCAMENTO || 
          os.status === OSStatus.ORCAMENTO_ENVIADO
        ).length;
        
        // Count completed today based on end_time or status change (simplified check)
        const completedToday = data.filter(os => 
          os.status === OSStatus.CONCLUIDA && 
          os.end_time && os.end_time.startsWith(today)
        ).length;

        setStats({ pending, active, blocked, completedToday });
      }
    } catch (e) {
      console.error("Error fetching dashboard stats", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
         <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Por Iniciar" 
          value={loading ? '-' : stats.pending} 
          icon={ClipboardList} 
          color="bg-gray-500" 
          subText="Ordens de serviço em backlog"
        />
        <StatCard 
          title="Em Execução" 
          value={loading ? '-' : stats.active} 
          icon={Clock} 
          color="bg-blue-500" 
          subText="Técnicos a trabalhar agora"
        />
        <StatCard 
          title="Bloqueadas / Peças" 
          value={loading ? '-' : stats.blocked} 
          icon={Package} 
          color="bg-orange-500" 
          subText="Aguarda peças ou orçamento"
        />
        <StatCard 
          title="Concluídas Hoje" 
          value={loading ? '-' : stats.completedToday} 
          icon={CheckCircle} 
          color="bg-green-500" 
          subText="Total finalizado nas últimas 24h"
        />
      </div>

      {/* Quick Actions / Recent Activity could go here */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
         <h3 className="font-semibold text-gray-800 mb-4">Atividade Recente</h3>
         <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed">
            Funcionalidade de feed de atividade em breve.
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React from 'react';
import { ClipboardList, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ServiceOrder, OSStatus, OSType } from '../types';

// Mock Data for demonstration
const mockOS: ServiceOrder[] = [
  { id: '1', code: 'OS-2023-001', client_id: 'c1', type: OSType.AVARIA, status: OSStatus.ATRIBUIDA, description: 'Forno Industrial não aquece', priority: 'alta', created_at: new Date().toISOString() },
  { id: '2', code: 'OS-2023-002', client_id: 'c2', type: OSType.MANUTENCAO, status: OSStatus.EM_EXECUCAO, description: 'Revisão semestral Ar Condicionado', priority: 'media', created_at: new Date().toISOString() },
  { id: '3', code: 'OS-2023-003', client_id: 'c3', type: OSType.INSTALACAO, status: OSStatus.ABERTA, description: 'Instalação Máquina Lavar Louça', priority: 'media', created_at: new Date().toISOString() },
];

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
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="OS em Aberto" value="12" icon={ClipboardList} color="bg-blue-500" />
        <StatCard title="Em Execução" value="3" icon={Clock} color="bg-yellow-500" />
        <StatCard title="Alta Prioridade" value="5" icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Finalizadas Hoje" value="8" icon={CheckCircle} color="bg-green-500" />
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockOS.map((os) => (
                <tr key={os.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{os.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{os.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${os.status === OSStatus.EM_EXECUCAO ? 'bg-yellow-100 text-yellow-800' : 
                        os.status === OSStatus.ABERTA ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {os.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`${os.priority === 'alta' ? 'text-red-600 font-bold' : ''}`}>
                      {os.priority}
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

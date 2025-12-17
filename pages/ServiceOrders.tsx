import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, Calendar, User, AlertCircle, Clock, CheckCircle2, HardDrive, Filter, LayoutGrid, List, ChevronDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { ServiceOrder, OSStatus, OSType } from '../types';
import OSStatusBadge from '../components/OSStatusBadge';

// Mock data expandido para o modo Demo
const MOCK_OS_LIST: any[] = [
  { 
    id: '1', 
    code: 'OS-2023-001', 
    client: { name: 'Hotel Baía Azul' }, 
    equipment: { type: 'Máquina de Gelo', brand: 'Hoshizaki', model: 'IM-45CNE' },
    type: OSType.AVARIA, 
    status: OSStatus.INICIADA, 
    description: 'Máquina de gelo parou de fabricar gelo. Compressor muito quente.', 
    priority: 'alta', 
    created_at: '2023-10-10T09:00:00Z',
    scheduled_date: '2023-10-10'
  },
  { 
    id: '2', 
    code: 'OS-2023-002', 
    client: { name: 'Restaurante O Pescador' }, 
    equipment: { type: 'Exaustão', brand: 'Industrial', model: 'X500' },
    type: OSType.MANUTENCAO, 
    status: OSStatus.AGUARDA_PECAS, 
    description: 'Limpeza preventiva da exaustão e verificação de filtros.', 
    priority: 'media', 
    created_at: '2023-10-11T14:30:00Z',
    scheduled_date: '2023-10-12'
  },
  { 
    id: '3', 
    code: 'OS-2023-003', 
    client: { name: 'Pastelaria Central' }, 
    equipment: { type: 'Forno', brand: 'Rational', model: 'iCombi' },
    type: OSType.INSTALACAO, 
    status: OSStatus.CONCLUIDA, 
    description: 'Instalação de novo Forno Convector Rational.', 
    priority: 'media', 
    created_at: '2023-10-09T10:00:00Z',
    scheduled_date: '2023-10-09'
  },
  { 
    id: '4', 
    code: 'OS-2023-004', 
    client: { name: 'Hotel Baía Azul' }, 
    equipment: { type: 'Câmara Frigorífica', brand: 'FrioInd', model: 'CF-20' },
    type: OSType.REVISAO, 
    status: OSStatus.POR_INICIAR, 
    description: 'Revisão geral das câmaras frigoríficas antes da época alta.', 
    priority: 'baixa', 
    created_at: '2023-10-12T08:00:00Z',
    scheduled_date: '2023-10-15'
  },
];

// Helpers Visuais
const getStatusLabelText = (status: string) => {
  switch (status) {
    case OSStatus.POR_INICIAR: return 'Por Iniciar';
    case OSStatus.INICIADA: return 'Iniciada';
    case OSStatus.PARA_ORCAMENTO: return 'Para Orçamento';
    case OSStatus.ORCAMENTO_ENVIADO: return 'Orçamento Enviado';
    case OSStatus.AGUARDA_PECAS: return 'Aguarda Peças';
    case OSStatus.PECAS_RECEBIDAS: return 'Peças Recebidas';
    case OSStatus.CONCLUIDA: return 'Concluída';
    case OSStatus.CANCELADA: return 'Cancelada';
    default: return status;
  }
};

const getStatusBorderColor = (status: OSStatus) => {
  switch (status) {
    case OSStatus.INICIADA: return 'bg-blue-500';
    case OSStatus.PARA_ORCAMENTO: return 'bg-yellow-500';
    case OSStatus.ORCAMENTO_ENVIADO: return 'bg-indigo-500';
    case OSStatus.AGUARDA_PECAS: return 'bg-orange-500';
    case OSStatus.PECAS_RECEBIDAS: return 'bg-teal-500';
    case OSStatus.CONCLUIDA: return 'bg-green-500';
    case OSStatus.CANCELADA: return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

// Helper for the Select background
const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case OSStatus.POR_INICIAR: return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';
      case OSStatus.INICIADA: return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case OSStatus.PARA_ORCAMENTO: return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
      case OSStatus.ORCAMENTO_ENVIADO: return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
      case OSStatus.AGUARDA_PECAS: return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
      case OSStatus.PECAS_RECEBIDAS: return 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100';
      case OSStatus.CONCLUIDA: return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case OSStatus.CANCELADA: return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getPriorityIcon = (priority: string) => {
  switch(priority) {
    case 'urgente': return <AlertCircle size={16} className="text-red-600" />;
    case 'alta': return <AlertCircle size={16} className="text-orange-500" />;
    case 'media': return <Clock size={16} className="text-yellow-500" />;
    default: return <CheckCircle2 size={16} className="text-blue-400" />;
  }
};

const getPriorityLabel = (priority: string) => {
   const labels: {[key:string]: string} = { 'urgente': 'Urgente', 'alta': 'Alta', 'media': 'Média', 'baixa': 'Baixa' };
   return labels[priority] || priority;
};

// Kanban Columns Definition
const kanbanColumns = [
  { title: 'Por Iniciar', statuses: [OSStatus.POR_INICIAR], color: 'bg-gray-100 border-gray-200' },
  { title: 'Em Execução', statuses: [OSStatus.INICIADA, OSStatus.PECAS_RECEBIDAS], color: 'bg-blue-50 border-blue-100' },
  { title: 'Pendente / Bloqueado', statuses: [OSStatus.AGUARDA_PECAS, OSStatus.PARA_ORCAMENTO, OSStatus.ORCAMENTO_ENVIADO], color: 'bg-orange-50 border-orange-100' },
  { title: 'Concluído', statuses: [OSStatus.CONCLUIDA, OSStatus.CANCELADA], color: 'bg-green-50 border-green-100' },
];

const KanbanCard: React.FC<{ os: ServiceOrder }> = ({ os }) => (
  <Link 
    to={`/os/${os.id}`} 
    className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow block mb-3 relative overflow-hidden group"
  >
    <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusBorderColor(os.status)}`} />
    <div className="pl-2">
      <div className="flex justify-between items-start mb-2">
         <span className="font-mono text-xs text-gray-500 font-medium">{os.code}</span>
         <span className="text-xs text-gray-400">{new Date(os.created_at).toLocaleDateString()}</span>
      </div>
      <h4 className="font-bold text-gray-800 text-sm mb-1 leading-tight group-hover:text-blue-600 transition-colors">
        {os.client?.name}
      </h4>
      <p className="text-xs text-gray-500 mb-2 truncate">
        {os.equipment ? `${os.equipment.type} ${os.equipment.brand}` : 'Equipamento não esp.'}
      </p>
      
      <div className="flex items-center justify-between mt-2">
         <OSStatusBadge status={os.status} className="scale-90 origin-left" />
         <div className="flex items-center" title={`Prioridade ${getPriorityLabel(os.priority)}`}>
            {getPriorityIcon(os.priority)}
         </div>
      </div>
    </div>
  </Link>
);

const ServiceOrders: React.FC = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OSStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  
  const isDemo = localStorage.getItem('demo_session') === 'true';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 600));
      setOrders(MOCK_OS_LIST);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          client:clients (name),
          equipment:equipments (type, brand, model)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
      setOrders(MOCK_OS_LIST); 
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusUpdate = async (e: React.ChangeEvent<HTMLSelectElement>, osId: string) => {
    e.preventDefault(); // Impede a navegação do Link
    const newStatus = e.target.value as OSStatus;

    // Atualização Otimista
    setOrders(prevOrders => 
      prevOrders.map(o => o.id === osId ? { ...o, status: newStatus } : o)
    );

    if (!isDemo) {
      try {
        const { error } = await supabase
          .from('service_orders')
          .update({ status: newStatus })
          .eq('id', osId);
        
        if (error) {
           console.error('Error updating status', error);
           // Reverter em caso de erro (simplificado, normalmente faríamos refetch)
           fetchOrders();
        }
      } catch (err) {
        console.error('Error updating status', err);
      }
    }
  };

  // Lógica de Filtros (Texto + Estado)
  const filteredOrders = orders.filter(os => {
    const searchLower = searchTerm.toLowerCase();
    const equipmentStr = os.equipment ? `${os.equipment.type} ${os.equipment.brand} ${os.equipment.model}`.toLowerCase() : '';
    
    const matchesSearch = 
      os.code.toLowerCase().includes(searchLower) ||
      os.client?.name.toLowerCase().includes(searchLower) ||
      os.description.toLowerCase().includes(searchLower) ||
      equipmentStr.includes(searchLower);

    const matchesStatus = statusFilter === 'all' || os.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 h-[calc(100vh-140px)] flex flex-col">
      {/* Header e Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Ordens de Serviço</h1>
        
        {/* View Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Vista de Lista"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Vista de Quadro"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-2 p-2">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
              placeholder="Pesquisar cliente, equipamento, código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Dropdown - Only show in list view or if needed */}
          <div className="relative min-w-[200px]">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-500" />
             </div>
             <select
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value as OSStatus | 'all')}
               className="block w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm appearance-none cursor-pointer"
             >
               <option value="all">Todos os Estados</option>
               {Object.values(OSStatus).map((status) => (
                 <option key={status} value={status}>{getStatusLabelText(status)}</option>
               ))}
             </select>
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">A carregar ordens de serviço...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center bg-white rounded-xl border border-dashed border-gray-300">
          <div className="h-12 w-12 text-gray-300 mb-3">
            <Search size={48} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Nenhuma OS encontrada</h3>
          <p className="text-gray-500 mt-1">
            {searchTerm || statusFilter !== 'all' 
              ? 'Tente ajustar os filtros de pesquisa.' 
              : 'Crie uma nova ordem de serviço para começar.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        // LIST VIEW
        <div className="space-y-4 overflow-y-auto pb-4">
          {filteredOrders.map((os) => (
            <Link 
              to={`/os/${os.id}`} 
              key={os.id} 
              className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200 block relative overflow-visible"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getStatusBorderColor(os.status)} rounded-l-xl`} />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                    <span className="font-mono font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{os.code}</span>
                    <span className="flex items-center"><Calendar size={12} className="mr-1"/> {new Date(os.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center mb-1.5">
                    <User size={16} className="text-gray-400 mr-2" />
                    <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {os.client?.name || 'Cliente Desconhecido'}
                    </h3>
                  </div>
                  {os.equipment && (
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                       <HardDrive size={14} className="mr-2 flex-shrink-0" />
                       <span className="truncate">{os.equipment.type} {os.equipment.brand} {os.equipment.model}</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {os.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* Status Dropdown in List Card */}
                    <div 
                      className="relative inline-block"
                      onClick={(e) => e.preventDefault()} // Prevent Link click on container
                    >
                      <select
                        value={os.status}
                        onChange={(e) => handleQuickStatusUpdate(e, os.id)}
                        onClick={(e) => e.stopPropagation()} // Stop bubbling
                        className={`appearance-none pl-3 pr-8 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors ${getStatusBadgeColor(os.status)}`}
                      >
                        {Object.values(OSStatus).map((status) => (
                          <option key={status} value={status}>
                            {getStatusLabelText(status)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-1.5 pointer-events-none opacity-60 text-current" />
                    </div>

                    <div className="flex items-center text-xs font-medium bg-gray-50 text-gray-600 px-2.5 py-0.5 rounded-full border border-gray-100">
                       <span className="mr-1.5">{getPriorityIcon(os.priority)}</span>
                       Prioridade {getPriorityLabel(os.priority)}
                    </div>
                    <div className="text-xs text-gray-400 px-2 py-0.5 border border-gray-100 rounded-full capitalize">
                      {os.type}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end sm:border-l sm:pl-6 sm:border-gray-100">
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        // BOARD VIEW (KANBAN)
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex h-full gap-4 min-w-[1000px]">
            {kanbanColumns.map(col => {
              const colOrders = filteredOrders.filter(os => col.statuses.includes(os.status));
              return (
                <div key={col.title} className="flex-1 flex flex-col h-full bg-gray-50 rounded-xl border border-gray-200 max-w-xs">
                  <div className={`p-3 border-b ${col.color} rounded-t-xl flex justify-between items-center`}>
                     <h3 className="font-bold text-gray-700 text-sm">{col.title}</h3>
                     <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                       {colOrders.length}
                     </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                    {colOrders.length === 0 ? (
                       <div className="text-center py-8 text-gray-400 text-xs italic">
                         Sem ordens neste estado
                       </div>
                    ) : (
                       colOrders.map(os => <KanbanCard key={os.id} os={os} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceOrders;
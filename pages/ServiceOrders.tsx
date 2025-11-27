import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Filter, Plus } from 'lucide-react';
import { ServiceOrder, OSStatus, OSType, Client } from '../types';
import { supabase } from '../supabaseClient';

// Mock data for demo mode (consistent with Clients.tsx)
const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Hotel Baía Azul', type: 'Hotel', address: 'Av. Marginal 123, Lisboa', phone: '912345678', email: 'admin@hotel.pt', contact_person: 'Sr. Silva' },
  { id: '2', name: 'Restaurante O Pescador', type: 'Restaurante', address: 'Rua do Porto 5, Setúbal', phone: '966554433', email: 'pescador@rest.pt', contact_person: 'D. Maria' },
  { id: '3', name: 'Pastelaria Central', type: 'Pastelaria', address: 'Praça da República, Coimbra', phone: '239123123', email: 'geral@central.pt', contact_person: 'João Santos' },
  { id: '4', name: 'Lavandaria Expresso', type: 'Lavandaria', address: 'Rua das Flores, Porto', phone: '223344556', email: 'info@expresso.pt', contact_person: 'Ana Costa' },
];

const mockOSList: ServiceOrder[] = [
  { 
    id: '1', code: 'OS-001', client_id: '1', type: OSType.AVARIA, status: OSStatus.ATRIBUIDA, description: 'Máquina Gelo Avaria', priority: 'alta', created_at: '2023-10-10',
    client: MOCK_CLIENTS.find(c => c.id === '1') 
  },
  { 
    id: '2', code: 'OS-002', client_id: '2', type: OSType.MANUTENCAO, status: OSStatus.FINALIZADA, description: 'Limpeza Exaustão', priority: 'media', created_at: '2023-10-09',
    client: MOCK_CLIENTS.find(c => c.id === '2') 
  },
  { 
    id: '3', code: 'OS-003', client_id: '3', type: OSType.INSTALACAO, status: OSStatus.ABERTA, description: 'Instalação Forno', priority: 'media', created_at: '2023-10-11',
    client: MOCK_CLIENTS.find(c => c.id === '3') 
  },
];

const ServiceOrders: React.FC = () => {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const isDemo = localStorage.getItem('demo_session') === 'true';

  useEffect(() => {
    fetchServiceOrders();
  }, []);

  const fetchServiceOrders = async () => {
    if (isDemo) {
      setServiceOrders(mockOSList);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          client:clients(*) // Fetch client details
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setServiceOrders(data || []);
    } catch (error) {
      console.error('Error fetching service orders:', error);
      setServiceOrders(mockOSList); // Fallback to mock data
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Ordens de Serviço</h1>
        <div className="flex space-x-2 w-full sm:w-auto">
          <button className="flex items-center justify-center space-x-2 text-gray-600 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 flex-1 sm:flex-none">
            <Filter size={18} />
            <span>Filtros</span>
          </button>
          <Link to="/os/new" className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm flex-1 sm:flex-none">
            <Plus size={18} />
            <span>Nova OS</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">A carregar ordens de serviço...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {serviceOrders.map((os) => (
            <Link to={`/os/${os.id}`} key={os.id} className="block hover:bg-gray-50 transition-colors">
              <div className="p-4 sm:px-6 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-blue-600 truncate">{os.code}</p>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${os.status === OSStatus.FINALIZADA ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {os.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                     <div>
                       <p className="text-base font-semibold text-gray-900 truncate">{os.description}</p>
                       <p className="text-sm text-gray-500">Cliente: <span className="font-medium text-gray-700">{os.client?.name || 'N/A'}</span></p>
                       <p className="text-sm text-gray-500">Prioridade: {os.priority}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs text-gray-400">{new Date(os.created_at).toLocaleDateString()}</p>
                   </div>
                </div>
              </div>
              <div className="ml-5 flex-shrink-0">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Link>
        ))}
        </div>
      )}
    </div>
  );
};

export default ServiceOrders;
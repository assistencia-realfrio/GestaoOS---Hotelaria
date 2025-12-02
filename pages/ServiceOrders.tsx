import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Filter, Plus } from 'lucide-react';
import { ServiceOrder, OSStatus, OSType, Client, Equipment, Store } from '../types';
import { supabase } from '../supabaseClient';

// Mock data for demo mode (consistent with Clients.tsx)
const MOCK_STORES: Store[] = [
  { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', name: 'CALDAS DA RAINHA', address: 'Rua Principal, 10, Caldas da Rainha', phone: '262123456', email: 'caldas@gestaos.pt' },
  { id: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210', name: 'PORTO DE MÓS', address: 'Avenida Central, 20, Porto de Mós', phone: '244987654', email: 'portodemos@gestaos.pt' },
];

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Hotel Baía Azul', type: 'Hotel', address: 'Av. Marginal 123, Lisboa', phone: '912345678', email: 'admin@hotel.pt', contact_person: 'Sr. Silva', store_id: MOCK_STORES[0].id, store: MOCK_STORES[0] },
  { id: '2', name: 'Restaurante O Pescador', type: 'Restaurante', address: 'Rua do Porto 5, Setúbal', phone: '966554433', email: 'pescador@rest.pt', contact_person: 'D. Maria', store_id: MOCK_STORES[1].id, store: MOCK_STORES[1] },
  { id: '3', name: 'Pastelaria Central', type: 'Pastelaria', address: 'Praça da República, Coimbra', phone: '239123123', email: 'geral@central.pt', contact_person: 'João Santos', store_id: MOCK_STORES[0].id, store: MOCK_STORES[0] },
  { id: '4', name: 'Lavandaria Expresso', type: 'Lavandaria', address: 'Rua das Flores, Porto', phone: '223344556', email: 'info@expresso.pt', contact_person: 'Ana Costa', store_id: MOCK_STORES[1].id, store: MOCK_STORES[1] },
];

const MOCK_EQUIPMENTS: Equipment[] = [
  { id: 'eq-1', client_id: '1', type: 'Máquina de Gelo', brand: 'Hoshizaki', model: 'IM-45CNE', serial_number: 'L00543', status: 'ativo', store_id: MOCK_STORES[0].id },
  { id: 'eq-2', client_id: '1', type: 'Forno', brand: 'Rational', model: 'iCombi Pro', serial_number: 'E112233', status: 'em_reparacao', store_id: MOCK_STORES[0].id },
  { id: 'eq-3', client_id: '2', type: 'Máquina de Café', brand: 'Jura', model: 'Giga X8', serial_number: 'JX8001', status: 'ativo', store_id: MOCK_STORES[1].id },
  { id: 'eq-4', client_id: '3', type: 'Máquina de Lavar Louça', brand: 'Winterhalter', model: 'PT-500', serial_number: 'WPT500', status: 'ativo', store_id: MOCK_STORES[0].id },
];

const mockOSList: ServiceOrder[] = [
  { 
    id: '1', code: 'OS-001', client_id: '1', equipment_id: 'eq-1', type: OSType.AVARIA, status: OSStatus.ATRIBUIDA, description: 'Máquina de Gelo não produz cubos, faz barulho estranho.', priority: 'alta', created_at: '2023-10-10',
    client: MOCK_CLIENTS.find(c => c.id === '1'),
    equipment: MOCK_EQUIPMENTS.find(e => e.id === 'eq-1'),
    store_id: MOCK_STORES[0].id, store: MOCK_STORES[0]
  },
  { 
    id: '2', code: 'OS-002', client_id: '2', equipment_id: 'eq-3', type: OSType.MANUTENCAO, status: OSStatus.FINALIZADA, description: 'Manutenção preventiva e limpeza geral do sistema de exaustão.', priority: 'media', created_at: '2023-10-09',
    client: MOCK_CLIENTS.find(c => c.id === '2'),
    equipment: MOCK_EQUIPMENTS.find(e => e.id === 'eq-3'),
    store_id: MOCK_STORES[1].id, store: MOCK_STORES[1]
  },
  { 
    id: '3', code: 'OS-003', client_id: '3', equipment_id: 'eq-4', type: OSType.INSTALACAO, status: OSStatus.ABERTA, description: 'Instalação de novo forno industrial na cozinha principal.', priority: 'media', created_at: '2023-10-11',
    client: MOCK_CLIENTS.find(c => c.id === '3'),
    equipment: MOCK_EQUIPMENTS.find(e => e.id === 'eq-4'),
    store_id: MOCK_STORES[0].id, store: MOCK_STORES[0]
  },
];

const ServiceOrders: React.FC = () => {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(undefined);
  const isDemo = localStorage.getItem('demo_session') === 'true';

  useEffect(() => {
    fetchServiceOrders();
  }, [selectedStoreId]);

  const fetchServiceOrders = async () => {
    setLoading(true);
    if (isDemo) {
      setStores(MOCK_STORES);
      setServiceOrders(selectedStoreId ? mockOSList.filter(os => os.store_id === selectedStoreId) : mockOSList);
      setLoading(false);
      return;
    }

    try {
      // Fetch Stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('name');
      if (storesError) throw storesError;
      setStores(storesData || []);

      let query = supabase
        .from('service_orders')
        .select(`
          *,
          client:clients(*), // Fetch client details
          equipment:equipments(*), // Fetch equipment details
          store:stores(name) // Fetch store details
        `)
        .order('created_at', { ascending: false });
      
      if (selectedStoreId) {
        query = query.eq('store_id', selectedStoreId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setServiceOrders(data || []);
    } catch (error) {
      console.error('Error fetching service orders:', error);
      setServiceOrders(selectedStoreId ? mockOSList.filter(os => os.store_id === selectedStoreId) : mockOSList); // Fallback to mock data
      setStores(MOCK_STORES);
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

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <select
          value={selectedStoreId || ''}
          onChange={(e) => setSelectedStoreId(e.target.value || undefined)}
          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">Todas as Lojas</option>
          {stores.map(store => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">A carregar ordens de serviço...</div>
      ) : (
        <div className="space-y-4"> {/* Alterado para usar space-y-4 para espaçamento */}
          {serviceOrders.map((os) => (
            <Link 
              to={`/os/${os.id}`} 
              key={os.id} 
              className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors" // Estilos movidos para o Link
            >
              <div className="p-4 sm:px-6 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-blue-600 truncate">{os.code}</p>
                    <div className="flex items-center gap-2">
                      {os.store && (
                        <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded">{os.store.name}</span>
                      )}
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${os.status === OSStatus.FINALIZADA ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {os.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                     <div>
                       <p className="text-base font-semibold text-gray-900 truncate">Cliente: {os.client?.name || 'N/A'}</p>
                       <p className="text-sm text-gray-500">Problema: <span className="font-medium text-gray-700">{os.description}</span></p>
                       {os.equipment && (
                         <p className="text-sm text-gray-500">Equipamento: <span className="font-medium text-gray-700">{os.equipment.type}</span></p>
                       )}
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
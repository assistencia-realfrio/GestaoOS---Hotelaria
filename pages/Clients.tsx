import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Phone, Building2, Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Client, Store, ClientType } from '../types'; // Import ClientType

// Mock data for demo mode
const MOCK_STORES: Store[] = [
  { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', name: 'CALDAS DA RAINHA', short_code: 'CR', address: 'Rua Principal, 10, Caldas da Rainha', phone: '262123456', email: 'caldas@gestaos.pt' },
  { id: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210', name: 'PORTO DE MÓS', short_code: 'PM', address: 'Avenida Central, 20, Porto de Mós', phone: '244987654', email: 'portodemos@gestaos.pt' },
];

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Hotel Baía Azul', type: ClientType.HOTEL, address: 'Av. Marginal 123, Lisboa', phone: '912345678', email: 'admin@hotel.pt', contact_person: 'Sr. Silva', store_id: MOCK_STORES[0].id, store: MOCK_STORES[0] },
  { id: '2', name: 'Restaurante O Pescador', type: ClientType.RESTAURANTE, address: 'Rua do Porto 5, Setúbal', phone: '966554433', email: 'pescador@rest.pt', contact_person: 'D. Maria', store_id: MOCK_STORES[1].id, store: MOCK_STORES[1] },
  { id: '3', name: 'Pastelaria Central', type: ClientType.CAFETERIA, address: 'Praça da República, Coimbra', phone: '239123123', email: 'geral@central.pt', contact_person: 'João Santos', store_id: MOCK_STORES[0].id, store: MOCK_STORES[0] },
  { id: '4', name: 'Lavandaria Expresso', type: ClientType.LAVANDARIA, address: 'Rua das Flores, Porto', phone: '223344556', email: 'info@expresso.pt', contact_person: 'Ana Costa', store_id: MOCK_STORES[1].id, store: MOCK_STORES[1] },
];

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(undefined);
  const isDemo = localStorage.getItem('demo_session') === 'true';

  useEffect(() => {
    fetchData();
  }, [selectedStoreId]); // Refetch when selectedStoreId changes

  const fetchData = async () => {
    setLoading(true);
    if (isDemo) {
      setStores(MOCK_STORES);
      setClients(selectedStoreId ? MOCK_CLIENTS.filter(c => c.store_id === selectedStoreId) : MOCK_CLIENTS);
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

      // Fetch Clients
      let query = supabase
        .from('clients')
        .select(`*, store:stores(name, short_code)`) // Join with stores table, include short_code
        .order('name');
      
      if (selectedStoreId) {
        query = query.eq('store_id', selectedStoreId);
      }

      const { data: clientsData, error: clientsError } = await query;
      
      if (clientsError) throw clientsError;
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setClients(selectedStoreId ? MOCK_CLIENTS.filter(c => c.store_id === selectedStoreId) : MOCK_CLIENTS); 
      setStores(MOCK_STORES);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Link to="/clients/new" className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
          <Plus size={18} className="mr-2" />
          Novo Cliente
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Pesquisar por nome ou contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
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
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">A carregar clientes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Link 
              key={client.id} 
              to={`/clients/${client.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Building2 size={24} />
                </div>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                  {client.type}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1">{client.name}</h3>
              <p className="text-sm text-gray-500 mb-4">Cont: {client.contact_person}</p>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin size={16} className="mr-2 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{client.address}</span>
                </div>
                <div className="flex items-center">
                  <Phone size={16} className="mr-2 text-gray-400 flex-shrink-0" />
                  <span>{client.phone}</span>
                </div>
                {client.store && (
                  <div className="flex items-center text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                    <span className="font-medium text-gray-700">{client.store.name}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clients;
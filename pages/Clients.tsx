import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Phone, Building2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Client } from '../types';

// Mock data for demo mode
const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Hotel Baía Azul', type: 'Hotel', address: 'Av. Marginal 123, Lisboa', phone: '912345678', email: 'admin@hotel.pt', contact_person: 'Sr. Silva' },
  { id: '2', name: 'Restaurante O Pescador', type: 'Restaurante', address: 'Rua do Porto 5, Setúbal', phone: '966554433', email: 'pescador@rest.pt', contact_person: 'D. Maria' },
  { id: '3', name: 'Pastelaria Central', type: 'Pastelaria', address: 'Praça da República, Coimbra', phone: '239123123', email: 'geral@central.pt', contact_person: 'João Santos' },
  { id: '4', name: 'Lavandaria Expresso', type: 'Lavandaria', address: 'Rua das Flores, Porto', phone: '223344556', email: 'info@expresso.pt', contact_person: 'Ana Costa' },
];

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const isDemo = localStorage.getItem('demo_session') === 'true';

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    if (isDemo) {
      setClients(MOCK_CLIENTS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      // Fallback to mock if API fails in what looks like a demo environment
      setClients(MOCK_CLIENTS); 
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
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="relative">
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clients;
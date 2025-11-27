import React, { useState, useEffect } from 'react';
import { Search, HardDrive, Filter, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Equipment } from '../types';

const MOCK_ALL_EQUIPMENTS: (Equipment & { client_name?: string })[] = [
  { id: '1', client_id: '1', client_name: 'Hotel Baía Azul', type: 'Máquina de Gelo', brand: 'Hoshizaki', model: 'IM-45CNE', serial_number: 'L00543', status: 'ativo' },
  { id: '2', client_id: '1', client_name: 'Hotel Baía Azul', type: 'Forno', brand: 'Rational', model: 'iCombi Pro', serial_number: 'E112233', status: 'em_reparacao' },
  { id: '3', client_id: '2', client_name: 'Restaurante O Pescador', type: 'Grelhador', brand: 'GrelhaMox', model: 'G-500', serial_number: 'G55001', status: 'ativo' },
  { id: '4', client_id: '3', client_name: 'Pastelaria Central', type: 'Vitrina Fria', brand: 'Jarp', model: 'V-200', serial_number: 'V20099', status: 'inativo' },
];

const Equipments: React.FC = () => {
  const [equipments, setEquipments] = useState<(Equipment & { client_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const isDemo = localStorage.getItem('demo_session') === 'true';

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    if (isDemo) {
      setEquipments(MOCK_ALL_EQUIPMENTS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('equipments')
        .select(`
          *,
          clients (name)
        `);
      
      if (error) throw error;
      
      const formatted = data.map((item: any) => ({
        ...item,
        client_name: item.clients?.name
      }));

      setEquipments(formatted);
    } catch (error) {
      console.error('Error fetching equipments:', error);
      setEquipments(MOCK_ALL_EQUIPMENTS);
    } finally {
      setLoading(false);
    }
  };

  const filtered = equipments.filter(eq => 
    eq.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (eq.client_name && eq.client_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Parque de Equipamentos</h1>
        <button className="flex items-center space-x-2 text-gray-600 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 shadow-sm">
          <Filter size={18} />
          <span>Filtros</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Pesquisar por tipo, marca, série ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">A carregar...</div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
           <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca/Modelo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((eq) => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                        <HardDrive size={20} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{eq.type}</div>
                        <div className="text-xs text-gray-500">S/N: {eq.serial_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     {eq.client_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {eq.brand} <span className="text-gray-500">{eq.model}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${eq.status === 'ativo' ? 'bg-green-100 text-green-800' : 
                        eq.status === 'em_reparacao' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {eq.status === 'em_reparacao' ? (
                         <span className="flex items-center gap-1"><AlertCircle size={12}/> Em Reparação</span>
                      ) : eq.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={`#/clients/${eq.client_id}`} className="text-blue-600 hover:text-blue-900">Ver Cliente</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Equipments;
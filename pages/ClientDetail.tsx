import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Mail, User, HardDrive, History } from 'lucide-react';
import { mockData } from '../services/mockData';
import { Client, Equipment, ServiceOrder } from '../types';
import OSStatusBadge from '../components/OSStatusBadge';

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [history, setHistory] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'equipments' | 'history'>('equipments');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const c = await mockData.getClientById(id);
      const allEq = await mockData.getEquipments();
      const allOs = await mockData.getServiceOrders();

      if (c) {
          setClient(c);
          setEquipments(allEq.filter(e => e.client_id === id));
          setHistory(allOs.filter(o => o.client_id === id));
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-8 text-center">A carregar...</div>;
  if (!client) return <div className="p-8 text-center">Cliente não encontrado.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-4">
          <div className="flex justify-between items-center">
             <h1 className="text-2xl font-bold text-white">{client.name}</h1>
             <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded">{client.type}</span>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
             <div className="flex items-center text-gray-600">
               <User className="w-5 h-5 mr-3 text-gray-400" />
               <span className="font-medium text-gray-900">{client.contact_person}</span>
             </div>
             <div className="flex items-center text-gray-600">
               <Phone className="w-5 h-5 mr-3 text-gray-400" />
               <span>{client.phone}</span>
             </div>
             <div className="flex items-center text-gray-600">
               <Mail className="w-5 h-5 mr-3 text-gray-400" />
               <span>{client.email}</span>
             </div>
          </div>
          <div className="space-y-3">
             <div className="flex items-start text-gray-600">
               <MapPin className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
               <span>{client.address}</span>
             </div>
             <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mt-2">
               <p className="text-xs text-yellow-800 font-medium uppercase mb-1">Notas:</p>
               <p className="text-sm text-gray-700">{client.notes || 'Sem notas registadas.'}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('equipments')}
            className={`flex-1 py-4 text-sm font-medium text-center flex items-center justify-center
              ${activeTab === 'equipments' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}
            `}
          >
            <HardDrive className="w-4 h-4 mr-2" />
            Equipamentos ({equipments.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 text-sm font-medium text-center flex items-center justify-center
              ${activeTab === 'history' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}
            `}
          >
            <History className="w-4 h-4 mr-2" />
            Histórico OS ({history.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'equipments' && (
            <div className="space-y-4">
              {equipments.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Nenhum equipamento registado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {equipments.map(eq => (
                    <div key={eq.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors bg-gray-50">
                       <div className="flex justify-between items-start mb-2">
                         <h3 className="font-bold text-gray-900">{eq.type}</h3>
                         <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${eq.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                           {eq.status}
                         </span>
                       </div>
                       <p className="text-sm text-gray-600">Marca: <span className="font-medium text-gray-800">{eq.brand}</span></p>
                       <p className="text-sm text-gray-600">Modelo: <span className="font-medium text-gray-800">{eq.model}</span></p>
                       <p className="text-xs text-gray-500 mt-2">S/N: {eq.serial_number}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {history.map(os => (
                      <tr key={os.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{new Date(os.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{os.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 capitalize">{os.type}</td>
                        <td className="px-4 py-3">
                           <OSStatusBadge status={os.status} />
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <Link to={`/os/${os.id}`} className="text-blue-600 hover:text-blue-900">Ver</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
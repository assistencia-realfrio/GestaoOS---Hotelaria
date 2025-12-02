import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { MapPin, Phone, Mail, User, HardDrive, ClipboardList, PenTool, History, ReceiptText, Edit } from 'lucide-react'; // Import Edit icon
import { supabase } from '../supabaseClient';
import { Client, Equipment, ServiceOrder, OSStatus, OSType, Store, ClientType } from '../types';

// Mock Data
const MOCK_STORES: Store[] = [
  { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', name: 'CALDAS DA RAINHA', short_code: 'CR', address: 'Rua Principal, 10, Caldas da Rainha', phone: '262123456', email: 'caldas@gestaos.pt' },
  { id: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210', name: 'PORTO DE MÓS', short_code: 'PM', address: 'Avenida Central, 20, Porto de Mós', phone: '244987654', email: 'portodemos@gestaos.pt' },
];

const MOCK_CLIENT: Client = { 
  id: '1', name: 'Hotel Baía Azul', type: ClientType.HOTEL, address: 'Av. Marginal 123, Lisboa', phone: '912345678', email: 'admin@baiaazul.pt', contact_person: 'Sr. Silva', notes: 'Cliente preferencial. Acesso pelas traseiras.',
  store_id: MOCK_STORES[0].id, store: MOCK_STORES[0],
  billing_name: 'Hotel Baía Azul, Lda.' // Added for demo
};

const MOCK_EQUIPMENTS: Equipment[] = [
  { id: 'eq-1', client_id: '1', type: 'Máquina de Gelo', brand: 'Hoshizaki', model: 'IM-45CNE', serial_number: 'L00543', status: 'ativo', store_id: MOCK_STORES[0].id },
  { id: 'eq-2', client_id: '1', type: 'Forno', brand: 'Rational', model: 'iCombi Pro', serial_number: 'E112233', status: 'em_reparacao', store_id: MOCK_STORES[0].id },
];

const MOCK_HISTORY: ServiceOrder[] = [
  { id: '1', code: 'CR-20230915-001', client_id: '1', type: OSType.AVARIA, status: OSStatus.CONCLUIDA, description: 'Máquina de gelo parada', priority: 'alta', created_at: '2023-09-15', store_id: MOCK_STORES[0].id },
  { id: '2', code: 'CR-20230910-002', client_id: '1', type: OSType.MANUTENCAO, status: OSStatus.INICIADA, description: 'Manutenção preventiva', priority: 'media', created_at: '2023-09-10', store_id: MOCK_STORES[0].id },
  { id: '3', code: 'CR-20230905-003', client_id: '1', type: OSType.INSTALACAO, status: OSStatus.POR_INICIAR, description: 'Instalação de novo equipamento', priority: 'baixa', created_at: '2023-09-05', store_id: MOCK_STORES[0].id },
];

const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); // Initialize useNavigate
  const [client, setClient] = useState<Client | null>(null);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [history, setHistory] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'equipments' | 'history'>('equipments');
  const isDemo = localStorage.getItem('demo_session') === 'true';

  useEffect(() => {
    const fetchData = async () => {
      if (isDemo) {
        setClient(MOCK_CLIENT);
        setEquipments(MOCK_EQUIPMENTS);
        setHistory(MOCK_HISTORY);
        setLoading(false);
        return;
      }

      try {
        // Fetch Client
        const { data: clientData } = await supabase.from('clients').select(`*, store:stores(name, short_code)`).eq('id', id).single();
        if (clientData) setClient(clientData);

        // Fetch Equipment
        const { data: equipData } = await supabase.from('equipments').select('*').eq('client_id', id);
        if (equipData) setEquipments(equipData);

        // Fetch History
        const { data: historyData } = await supabase.from('service_orders').select('*').eq('client_id', id).order('created_at', { ascending: false });
        if (historyData) setHistory(historyData);

      } catch (error) {
        console.error("Error loading client data", error);
        setClient(MOCK_CLIENT); // Fallback for stability
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isDemo]);

  if (loading) return <div className="p-8 text-center">A carregar...</div>;
  if (!client) return <div className="p-8 text-center">Cliente não encontrado.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Client Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-4">
          <div className="flex justify-between items-center">
             <h1 className="text-2xl font-bold text-white">{client.name}</h1>
             <div className="flex items-center gap-2">
               <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded">{client.type}</span>
               {client.store && (
                 <span className="bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">{client.store.name}</span>
               )}
             </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
             <div className="flex items-center text-gray-600">
               <User className="w-5 h-5 mr-3 text-gray-400" />
               <span className="font-medium text-gray-900">{client.contact_person}</span>
             </div>
             {client.billing_name && ( // Display billing name if available
               <div className="flex items-center text-gray-600">
                 <ReceiptText className="w-5 h-5 mr-3 text-gray-400" />
                 <span className="font-medium text-gray-900">{client.billing_name}</span>
               </div>
             )}
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
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => navigate(`/clients/${client.id}/edit`)}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Edit size={18} className="mr-2" />
            Editar Cliente
          </button>
        </div>
      </div>

      {/* Tabs */}
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
              <div className="flex justify-end">
                <button className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors">
                  + Adicionar Equipamento
                </button>
              </div>
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
                           <span className={`px-2 text-xs leading-5 font-semibold rounded-full 
                             ${os.status === OSStatus.CONCLUIDA ? 'bg-green-100 text-green-800' : 
                               os.status === OSStatus.INICIADA ? 'bg-yellow-100 text-yellow-800' : 
                               os.status === OSStatus.POR_INICIAR ? 'bg-blue-100 text-blue-800' :
                               os.status === OSStatus.CANCELADA ? 'bg-red-100 text-red-800' :
                               'bg-gray-100 text-gray-800'}`}>
                             {os.status.replace('_', ' ')}
                           </span>
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
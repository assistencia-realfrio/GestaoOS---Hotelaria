"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Client, Store, Equipment } from '../types';
import EquipmentForm from '../components/EquipmentForm'; // Import the new EquipmentForm

const MOCK_STORES: Store[] = [
  { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', name: 'CALDAS DA RAINHA', short_code: 'CR', address: '', phone: '', email: '' },
  { id: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210', name: 'PORTO DE MÓS', short_code: 'PM', address: '', phone: '', email: '' },
];

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Hotel Baía Azul', type: 'Hotel' as any, address: '', phone: '', email: '', contact_person: '', store_id: MOCK_STORES[0].id },
  { id: '2', name: 'Restaurante O Pescador', type: 'Restaurante' as any, address: '', phone: '', email: '', contact_person: '', store_id: MOCK_STORES[1].id },
];

const NewEquipment: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>(); // Get client ID from URL
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const isDemo = localStorage.getItem('demo_session') === 'true';

  const [formData, setFormData] = useState<Partial<Equipment> & { client_id: string, store_id: string }>({
    client_id: clientId || '', // Pre-fill client_id if available from URL
    store_id: '',
    type: '',
    brand: '',
    model: '',
    serial_number: '',
    install_date: new Date().toISOString().split('T')[0], // Default to today
    status: 'ativo', // Default status
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // If client_id is set, try to find its store_id and set it
    if (formData.client_id && clients.length > 0) {
      const selectedClient = clients.find(c => c.id === formData.client_id);
      if (selectedClient && selectedClient.store_id && formData.store_id === '') {
        setFormData(prev => ({ ...prev, store_id: selectedClient.store_id! }));
      }
    }
  }, [formData.client_id, clients]);

  const fetchData = async () => {
    setLoading(true);
    if (isDemo) {
      setStores(MOCK_STORES);
      setClients(MOCK_CLIENTS);
      setLoading(false);
      return;
    }

    try {
      const { data: storesData, error: storesError } = await supabase.from('stores').select('id, name').order('name');
      if (storesError) throw storesError;
      setStores(storesData || []);

      const { data: clientsData, error: clientsError } = await supabase.from('clients').select('id, name, store_id').order('name');
      if (clientsError) throw clientsError;
      setClients(clientsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Erro ao carregar dados necessários.');
      setStores(MOCK_STORES);
      setClients(MOCK_CLIENTS);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.client_id || !formData.store_id || !formData.type || !formData.brand || !formData.model || !formData.serial_number) {
        throw new Error("Por favor, preencha todos os campos obrigatórios.");
      }

      if (isDemo) {
        console.log("Novo Equipamento (Demo):", formData);
        await new Promise(r => setTimeout(r, 1000));
        alert("Equipamento adicionado com sucesso! (Modo Demo)");
        navigate(`/clients/${formData.client_id}`);
        return;
      }

      const { error } = await supabase.from('equipments').insert({
        client_id: formData.client_id,
        store_id: formData.store_id,
        type: formData.type,
        brand: formData.brand,
        model: formData.model,
        serial_number: formData.serial_number,
        install_date: formData.install_date || null,
        status: formData.status,
      });

      if (error) throw error;

      alert("Equipamento adicionado com sucesso!");
      navigate(`/clients/${formData.client_id}`);
    } catch (err: any) {
      alert(err.message || "Erro ao adicionar equipamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Equipamento</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <EquipmentForm
          formData={formData}
          handleChange={handleChange}
          clients={clients}
          stores={stores}
          loading={loading}
          clientIdFromUrl={clientId}
        />
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
          >
            <Save size={20} className="mr-2" />
            {loading ? 'A adicionar...' : 'Adicionar Equipamento'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewEquipment;
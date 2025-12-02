"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Store, ClientType, Client } from '../types';
import ClientForm from '../components/ClientForm'; // Import the new ClientForm

const MOCK_STORES: Store[] = [
  { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', name: 'CALDAS DA RAINHA', short_code: 'CR', address: 'Rua Principal, 10, Caldas da Rainha', phone: '262123456', email: 'caldas@gestaos.pt' },
  { id: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210', name: 'PORTO DE MÓS', short_code: 'PM', address: 'Avenida Central, 20, Porto de Mós', phone: '244987654', email: 'portodemos@gestaos.pt' },
];

const MOCK_CLIENT: Client = {
  id: '1', name: 'Hotel Baía Azul', type: ClientType.HOTEL, address: 'Av. Marginal 123, Lisboa', phone: '912345678', email: 'admin@baiaazul.pt', contact_person: 'Sr. Silva', notes: 'Cliente preferencial. Acesso pelas traseiras.',
  store_id: MOCK_STORES[0].id, store: MOCK_STORES[0],
  billing_name: 'Hotel Baía Azul, Lda.'
};

const EditClient: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isDemo = localStorage.getItem('demo_session') === 'true';

  const [formData, setFormData] = useState<Client>({
    id: id || '',
    name: '',
    address: '',
    phone: '',
    email: '',
    contact_person: '',
    notes: '',
    store_id: '',
    billing_name: '',
    type: ClientType.OUTRO,
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    if (isDemo) {
      setStores(MOCK_STORES);
      if (id === MOCK_CLIENT.id) {
        setFormData(MOCK_CLIENT);
      }
      setLoading(false);
      return;
    }

    try {
      // Fetch Stores
      const { data: storesData, error: storesError } = await supabase.from('stores').select('id, name, short_code').order('name');
      if (storesError) throw storesError;
      setStores(storesData || []);

      // Fetch Client Data
      const { data: clientData, error: clientError } = await supabase.from('clients').select('*').eq('id', id).single();
      if (clientError) throw clientError;
      if (clientData) {
        setFormData({
          ...clientData,
          type: clientData.type as ClientType, // Ensure type is ClientType
          store_id: clientData.store_id || '', // Handle potential null store_id
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Erro ao carregar dados do cliente.');
      // Fallback to mock data if in demo or error
      setStores(MOCK_STORES);
      if (id === MOCK_CLIENT.id) {
        setFormData(MOCK_CLIENT);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value as ClientType | string });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.name || !formData.store_id) {
        throw new Error("Por favor, preencha os campos obrigatórios: Nome do Cliente e Loja Associada.");
      }

      if (isDemo) {
        console.log("Atualizar Cliente (Demo):", formData);
        await new Promise(r => setTimeout(r, 1000));
        alert("Cliente atualizado com sucesso! (Modo Demo)");
        navigate(`/clients/${id}`);
        return;
      }

      const { error } = await supabase.from('clients').update({
        name: formData.name,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        contact_person: formData.contact_person || null,
        notes: formData.notes || null,
        store_id: formData.store_id,
        type: formData.type,
        billing_name: formData.billing_name || null,
      }).eq('id', id);

      if (error) throw error;

      alert("Cliente atualizado com sucesso!");
      navigate(`/clients/${id}`);
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar cliente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">A carregar dados do cliente...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Editar Cliente: {formData.name}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <ClientForm
          formData={formData}
          handleChange={handleChange}
          stores={stores}
          loading={submitting} // Use submitting for the button loading state
          isEditMode={true}
        />
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
          >
            <Save size={20} className="mr-2" />
            {submitting ? 'A guardar...' : 'Guardar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditClient;
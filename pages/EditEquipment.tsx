"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, HardDrive, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Client, Store, Equipment } from '../types';

// MOCK DATA (similar to NewEquipment, but for a specific equipment)
const MOCK_STORES: Store[] = [
  { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', name: 'CALDAS DA RAINHA', short_code: 'CR', address: '', phone: '', email: '' },
  { id: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210', name: 'PORTO DE MÓS', short_code: 'PM', address: '', phone: '', email: '' },
];

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Hotel Baía Azul', type: 'Hotel' as any, address: '', phone: '', email: '', contact_person: '', store_id: MOCK_STORES[0].id },
  { id: '2', name: 'Restaurante O Pescador', type: 'Restaurante' as any, address: '', phone: '', email: '', contact_person: '', store_id: MOCK_STORES[1].id },
];

const MOCK_EQUIPMENT: Equipment = {
  id: 'eq-1', client_id: '1', type: 'Máquina de Gelo', brand: 'Hoshizaki', model: 'IM-45CNE', serial_number: 'L00543', status: 'ativo', store_id: MOCK_STORES[0].id, install_date: '2022-01-15'
};

const EditEquipment: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Equipment ID
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isDemo = localStorage.getItem('demo_session') === 'true';

  const [formData, setFormData] = useState<Partial<Equipment> & { client_id: string, store_id: string }>({
    client_id: '',
    store_id: '',
    type: '',
    brand: '',
    model: '',
    serial_number: '',
    install_date: '',
    status: 'ativo',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    if (isDemo) {
      setStores(MOCK_STORES);
      setClients(MOCK_CLIENTS);
      if (id === MOCK_EQUIPMENT.id) {
        setFormData({
          ...MOCK_EQUIPMENT,
          install_date: MOCK_EQUIPMENT.install_date?.split('T')[0] || '', // Format date for input
        });
      }
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

      // Fetch existing equipment data
      const { data: equipmentData, error: equipmentError } = await supabase.from('equipments').select('*').eq('id', id).single();
      if (equipmentError) throw equipmentError;
      if (equipmentData) {
        setFormData({
          ...equipmentData,
          install_date: equipmentData.install_date?.split('T')[0] || '', // Format date for input
        });
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Erro ao carregar dados necessários.');
      setStores(MOCK_STORES);
      setClients(MOCK_CLIENTS);
      if (id === MOCK_EQUIPMENT.id) {
        setFormData({
          ...MOCK_EQUIPMENT,
          install_date: MOCK_EQUIPMENT.install_date?.split('T')[0] || '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.client_id || !formData.store_id || !formData.type || !formData.brand || !formData.model || !formData.serial_number) {
        throw new Error("Por favor, preencha todos os campos obrigatórios.");
      }

      if (isDemo) {
        console.log("Atualizar Equipamento (Demo):", formData);
        await new Promise(r => setTimeout(r, 1000));
        alert("Equipamento atualizado com sucesso! (Modo Demo)");
        navigate(`/clients/${formData.client_id}`);
        return;
      }

      const { error } = await supabase.from('equipments').update({
        client_id: formData.client_id,
        store_id: formData.store_id,
        type: formData.type,
        brand: formData.brand,
        model: formData.model,
        serial_number: formData.serial_number,
        install_date: formData.install_date || null,
        status: formData.status,
      }).eq('id', id);

      if (error) throw error;

      alert("Equipamento atualizado com sucesso!");
      navigate(`/clients/${formData.client_id}`);
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar equipamento.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">A carregar dados do equipamento...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Editar Equipamento: {formData.type} ({formData.model})</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {/* Loja */}
          <div>
            <label htmlFor="store_id" className="block text-sm font-medium text-gray-700 mb-1">Loja Associada *</label>
            <select
              id="store_id"
              name="store_id"
              value={formData.store_id}
              onChange={handleChange}
              required
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
            >
              <option value="">Selecione uma loja</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Cliente */}
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <select
              id="client_id"
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              required
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">Selecione um cliente</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Equipamento *</label>
              <div className="relative">
                <HardDrive className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
                  placeholder="Ex: Máquina de Gelo"
                />
              </div>
            </div>

            {/* Marca */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
                placeholder="Ex: Hoshizaki"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Modelo */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
                placeholder="Ex: IM-45CNE"
              />
            </div>

            {/* Número de Série */}
            <div>
              <label htmlFor="serial_number" className="block text-sm font-medium text-gray-700 mb-1">Número de Série *</label>
              <input
                type="text"
                id="serial_number"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                required
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
                placeholder="Ex: L0054321"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data de Instalação */}
            <div>
              <label htmlFor="install_date" className="block text-sm font-medium text-gray-700 mb-1">Data de Instalação (Opcional)</label>
              <div className="relative max-w-sm">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  id="install_date"
                  name="install_date"
                  value={formData.install_date || ''}
                  onChange={handleChange}
                  className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="relative">
                <AlertCircle className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="em_reparacao">Em Reparação</option>
                </select>
              </div>
            </div>
          </div>

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
    </div>
  );
};

export default EditEquipment;
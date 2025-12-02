"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Phone, Mail, User, FileText, Save, ReceiptText } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Store } from '../types';

const MOCK_STORES: Store[] = [
  { id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', name: 'CALDAS DA RAINHA', short_code: 'CR', address: 'Rua Principal, 10, Caldas da Rainha', phone: '262123456', email: 'caldas@gestaos.pt' },
  { id: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210', name: 'PORTO DE MÓS', short_code: 'PM', address: 'Avenida Central, 20, Porto de Mós', phone: '244987654', email: 'portodemos@gestaos.pt' },
];

const NewClient: React.FC = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const isDemo = localStorage.getItem('demo_session') === 'true';

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    contact_person: '',
    notes: '',
    store_id: '',
    billing_name: '', // Novo campo para o nome da faturação
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    if (isDemo) {
      setStores(MOCK_STORES);
      return;
    }
    try {
      const { data, error } = await supabase.from('stores').select('id, name, short_code').order('name');
      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores(MOCK_STORES); // Fallback to mock data
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Only 'name' and 'store_id' are now strictly required
      if (!formData.name || !formData.store_id) {
        throw new Error("Por favor, preencha os campos obrigatórios: Nome do Cliente e Loja Associada.");
      }

      if (isDemo) {
        console.log("Novo Cliente (Demo):", { ...formData, type: 'Outro' }); // Add default type for demo log
        await new Promise(r => setTimeout(r, 1000)); // Simulate network delay
        alert("Cliente adicionado com sucesso! (Modo Demo)");
        navigate('/clients');
        return;
      }

      const { error } = await supabase.from('clients').insert({
        name: formData.name,
        address: formData.address || null, // Now optional
        phone: formData.phone || null,     // Now optional
        email: formData.email || null,     // Now optional
        contact_person: formData.contact_person || null, // Now optional
        notes: formData.notes || null,
        store_id: formData.store_id,
        type: 'Outro', // Set a default type if not provided by the user
        billing_name: formData.billing_name || null,
      });

      if (error) throw error;

      alert("Cliente adicionado com sucesso!");
      navigate('/clients');
    } catch (err: any) {
      alert(err.message || "Erro ao adicionar cliente.");
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
        <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* Nome do Cliente */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
                placeholder="Ex: Hotel Central"
              />
            </div>
          </div>

          {/* Nome da Faturação (Opcional) */}
          <div>
            <label htmlFor="billing_name" className="block text-sm font-medium text-gray-700 mb-1">Nome da Faturação (Opcional)</label>
            <div className="relative">
              <ReceiptText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="billing_name"
                name="billing_name"
                value={formData.billing_name}
                onChange={handleChange}
                className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
                placeholder="Ex: Hotel Central, Lda."
              />
            </div>
          </div>

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

          {/* Endereço */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Morada (Opcional)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                // Removed 'required'
                className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
                placeholder="Ex: Rua da Liberdade, 10, 2500-000 Caldas da Rainha"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Telefone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone (Opcional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  // Removed 'required'
                  className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
                  placeholder="Ex: 912345678"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (Opcional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  // Removed 'required'
                  className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
                  placeholder="Ex: geral@hotelcentral.pt"
                />
              </div>
            </div>
          </div>

          {/* Pessoa de Contacto */}
          <div>
            <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-1">Pessoa de Contacto (Opcional)</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                // Removed 'required'
                className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
                placeholder="Ex: João Silva"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
            {/* Removed the relative div and icon for textarea */}
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
              placeholder="Informações adicionais sobre o cliente..."
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
            >
              <Save size={20} className="mr-2" />
              {loading ? 'A adicionar...' : 'Adicionar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewClient;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Calendar, AlertTriangle, FileText } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Client, Equipment, OSType } from '../types';

const NewServiceOrder: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    client_id: '',
    equipment_id: '',
    type: OSType.AVARIA,
    priority: 'media',
    description: '',
    scheduled_date: new Date().toISOString().split('T')[0] // Today YYYY-MM-DD
  });

  // Mock data for demo
  const isDemo = localStorage.getItem('demo_session') === 'true';

  useEffect(() => {
    fetchClients();
  }, []);

  // When client changes, fetch their equipment
  useEffect(() => {
    if (formData.client_id) {
      fetchEquipments(formData.client_id);
    } else {
      setEquipments([]);
    }
  }, [formData.client_id]);

  const fetchClients = async () => {
    if (isDemo) {
      setClients([
        { id: '1', name: 'Hotel Baía Azul', type: 'Hotel', address: '', phone: '', email: '', contact_person: '' },
        { id: '2', name: 'Restaurante O Pescador', type: 'Restaurante', address: '', phone: '', email: '', contact_person: '' },
      ]);
      return;
    }
    const { data } = await supabase.from('clients').select('id, name');
    if (data) setClients(data as any);
  };

  const fetchEquipments = async (clientId: string) => {
    if (isDemo) {
      const mockEq = [
        { id: '1', client_id: '1', type: 'Máquina de Gelo', brand: 'Hoshizaki', model: 'IM-45', serial_number: '123', status: 'ativo' },
        { id: '2', client_id: '1', type: 'Forno', brand: 'Rational', model: 'iCombi', serial_number: '456', status: 'ativo' },
        { id: '3', client_id: '2', type: 'Grelhador', brand: 'GrelhaMox', model: 'G500', serial_number: '789', status: 'ativo' },
      ];
      setEquipments(mockEq.filter(e => e.client_id === clientId) as any);
      return;
    }
    const { data } = await supabase.from('equipments').select('*').eq('client_id', clientId);
    if (data) setEquipments(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.client_id || !formData.description) {
        throw new Error("Preencha os campos obrigatórios.");
      }

      if (isDemo) {
        console.log("OS Criada (Demo):", formData);
        await new Promise(r => setTimeout(r, 1000)); // Fake network delay
        alert("Ordem de Serviço criada com sucesso! (Modo Demo)");
        navigate('/os');
        return;
      }

      // Generate a Code (In real DB this would be a trigger or function)
      const code = `OS-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

      const { error } = await supabase.from('service_orders').insert({
        code,
        client_id: formData.client_id,
        equipment_id: formData.equipment_id || null,
        type: formData.type,
        priority: formData.priority,
        description: formData.description,
        status: 'aberta',
        scheduled_date: formData.scheduled_date
      });

      if (error) throw error;

      navigate('/os');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nova Ordem de Serviço</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                required
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
              >
                <option value="">Selecione um cliente</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Equipamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipamento</label>
              <select
                name="equipment_id"
                value={formData.equipment_id}
                onChange={handleChange}
                disabled={!formData.client_id}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">Selecione o equipamento (Opcional)</option>
                {equipments.map(e => (
                  <option key={e.id} value={e.id}>{e.type} - {e.brand} ({e.model})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Serviço</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
              >
                <option value="avaria">Avaria / Reparação</option>
                <option value="manutencao">Manutenção Preventiva</option>
                <option value="instalacao">Instalação</option>
                <option value="revisao">Revisão Geral</option>
              </select>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Prevista */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Agendada</label>
            <div className="relative max-w-sm">
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="date"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Problema / Pedido *</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
                placeholder="Descreva detalhadamente o problema reportado ou o serviço a realizar..."
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
            >
              <Save size={20} className="mr-2" />
              {loading ? 'A criar...' : 'Criar Ordem de Serviço'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default NewServiceOrder;
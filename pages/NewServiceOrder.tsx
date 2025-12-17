import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Calendar, AlertTriangle, FileText } from 'lucide-react';
import { mockData } from '../services/mockData';
import { Client, Equipment, OSType, OSStatus } from '../types';

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

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (formData.client_id) {
      fetchEquipments(formData.client_id);
    } else {
      setEquipments([]);
    }
  }, [formData.client_id]);

  const fetchClients = async () => {
    const data = await mockData.getClients();
    setClients(data);
  };

  const fetchEquipments = async (clientId: string) => {
    const all = await mockData.getEquipments();
    setEquipments(all.filter(e => e.client_id === clientId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.client_id || !formData.description) {
        throw new Error("Preencha os campos obrigatórios.");
      }

      await mockData.createServiceOrder({
        client_id: formData.client_id,
        equipment_id: formData.equipment_id || undefined,
        type: formData.type,
        priority: formData.priority as any,
        description: formData.description,
        status: OSStatus.POR_INICIAR,
        scheduled_date: formData.scheduled_date
      });

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
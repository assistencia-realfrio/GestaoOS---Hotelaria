"use client";

import React from 'react';
import { HardDrive, Calendar, AlertCircle } from 'lucide-react';
import { Client, Store, Equipment } from '../types';

interface EquipmentFormProps {
  formData: Partial<Equipment> & { client_id: string, store_id: string };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  clients: Client[];
  stores: Store[];
  loading: boolean;
  isEditMode?: boolean;
  clientIdFromUrl?: string; // To disable client selection if coming from client detail page
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({ 
  formData, 
  handleChange, 
  clients, 
  stores, 
  loading, 
  isEditMode = false,
  clientIdFromUrl
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 md:p-8 space-y-6">
        
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
            disabled={!!clientIdFromUrl} // Disable if client ID is from URL
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
                value={formData.type || ''}
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
              value={formData.brand || ''}
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
              value={formData.model || ''}
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
              value={formData.serial_number || ''}
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
      </div>
    </div>
  );
};

export default EquipmentForm;
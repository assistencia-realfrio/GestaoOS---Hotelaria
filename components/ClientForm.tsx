"use client";

import React from 'react';
import { Building2, MapPin, Phone, Mail, User, FileText, ReceiptText } from 'lucide-react';
import { ClientType, Store, Client } from '../types';

interface ClientFormProps {
  formData: Client;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  stores: Store[];
  loading: boolean;
  isEditMode?: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({ formData, handleChange, stores, loading, isEditMode = false }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 md:p-8 space-y-6">
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
              value={formData.billing_name || ''}
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

        {/* Tipo de Cliente */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cliente</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
          >
            {Object.values(ClientType).map((type) => (
              <option key={type} value={type}>{type}</option>
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
              value={formData.address || ''}
              onChange={handleChange}
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
                value={formData.phone || ''}
                onChange={handleChange}
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
                value={formData.email || ''}
                onChange={handleChange}
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
              value={formData.contact_person || ''}
              onChange={handleChange}
              className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
              placeholder="Ex: João Silva"
            />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes || ''}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2.5"
            placeholder="Informações adicionais sobre o cliente..."
          />
        </div>
      </div>
    </div>
  );
};

export default ClientForm;
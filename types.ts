export enum UserRole {
  ADMIN = 'admin',
  BACKOFFICE = 'backoffice',
  TECNICO = 'tecnico'
}

export enum OSStatus {
  POR_INICIAR = 'por_iniciar',
  ATRIBUIDA = 'atribuida',
  INICIADA = 'iniciada',
  PAUSA = 'pausa',
  PARA_ORCAMENTO = 'para_orcamento',
  ORCAMENTO_ENVIADO = 'orcamento_enviado',
  AGUARDA_PECAS = 'aguarda_pecas',
  PECAS_RECEBIDAS = 'pecas_recebidas',
  CONCLUIDA = 'concluida',
  FATURADA = 'faturada',
  CANCELADA = 'cancelada'
}

export enum OSType {
  INSTALACAO = 'instalacao',
  MANUTENCAO = 'manutencao',
  AVARIA = 'avaria',
  REVISAO = 'revisao'
}

export enum ClientType { // Novo enum para tipos de cliente
  HOTEL = 'Hotel',
  RESTAURANTE = 'Restaurante',
  CAFETERIA = 'Cafetaria',
  LAVANDARIA = 'Lavandaria',
  SUPERMERCADO = 'Supermercado',
  OUTRO = 'Outro'
}

export interface Store {
  id: string;
  name: string;
  short_code: string; // Nova propriedade para o código curto da loja
  address?: string;
  phone?: string;
  email?: string;
}

export interface Client {
  id: string;
  name: string;
  type: ClientType; // Usar o novo enum ClientType
  address: string;
  phone: string;
  email: string;
  contact_person: string;
  notes?: string;
  store_id?: string; // New field
  store?: Store; // New field for joined data
  billing_name?: string; // Novo campo para o nome da faturação
}

export interface Equipment {
  id: string;
  client_id: string;
  type: string;
  brand: string;
  model: string;
  serial_number: string;
  install_date?: string;
  status: 'ativo' | 'inativo' | 'em_reparacao';
  store_id?: string; // New field
  store?: Store; // New field for joined data
}

export interface PartCatalogItem {
  id: string;
  name: string;
  reference: string;
  price: number;
  stock: number;
}

export interface PartUsed {
  id: string; // ID of the usage record
  part_id: string; // ID from catalog
  name: string;
  reference: string;
  quantity: number;
  price: number;
}

export interface OSPhoto {
  id: string;
  os_id: string;
  url: string;
  type: 'antes' | 'depois' | 'peca' | 'geral';
  created_at: string;
}

export interface TimeEntry {
  id: string;
  os_id: string;
  start_time: string;
  end_time?: string | null;
  duration_minutes?: number;
  description?: string;
  technician_id?: string;
}

export interface ServiceOrder {
  id: string;
  code: string;
  client_id: string;
  equipment_id?: string;
  technician_id?: string;
  type: OSType;
  status: OSStatus;
  description: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  created_at: string;
  scheduled_date?: string;
  start_time?: string;
  end_time?: string;
  resolution_notes?: string;
  internal_notes?: string; // New field for internal technician notes
  client_signature?: string; // Base64 or URL
  client?: Client;
  equipment?: Equipment;
  store_id?: string; // New field
  store?: Store; // New field for joined data
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  store_id?: string; // New field for user's assigned store
}
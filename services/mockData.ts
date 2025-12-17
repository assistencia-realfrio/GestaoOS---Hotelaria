import { Client, Equipment, ServiceOrder, OSStatus, OSType, Profile, UserRole, PartUsed, TimeEntry, OSPhoto, PartCatalogItem } from '../types';

// Initial Data Seeds
const SEED_CLIENTS: Client[] = [
  { id: '1', name: 'Hotel Baía Azul', type: 'Hotel', address: 'Av. Marginal 123, Lisboa', phone: '912345678', email: 'admin@baiaazul.pt', contact_person: 'Sr. Silva', notes: 'Cliente Premium' },
  { id: '2', name: 'Restaurante O Pescador', type: 'Restaurante', address: 'Rua do Porto 5, Setúbal', phone: '966554433', email: 'pescador@rest.pt', contact_person: 'D. Maria' },
  { id: '3', name: 'Pastelaria Central', type: 'Pastelaria', address: 'Praça da República, Coimbra', phone: '239123123', email: 'geral@central.pt', contact_person: 'João Santos' },
];

const SEED_EQUIPMENTS: Equipment[] = [
  { id: 'eq-1', client_id: '1', type: 'Máquina de Gelo', brand: 'Hoshizaki', model: 'IM-45CNE', serial_number: 'L00543', status: 'ativo' },
  { id: 'eq-2', client_id: '1', type: 'Forno', brand: 'Rational', model: 'iCombi Pro', serial_number: 'E112233', status: 'em_reparacao' },
  { id: 'eq-3', client_id: '2', type: 'Exaustão', brand: 'Industrial', model: 'X500', serial_number: 'EX-9988', status: 'ativo' },
  { id: 'eq-4', client_id: '3', type: 'Forno', brand: 'Rational', model: 'iCombi', serial_number: 'RAT-2023-X', status: 'ativo' },
];

const SEED_CATALOG: PartCatalogItem[] = [
  { id: 'p1', name: 'Termostato Digital', reference: 'TERM-001', price: 45.50, stock: 10 },
  { id: 'p2', name: 'Compressor 1/2HP', reference: 'COMP-12', price: 250.00, stock: 3 },
  { id: 'p3', name: 'Gás Refrigerante R404A (kg)', reference: 'GAS-404', price: 80.00, stock: 50 },
  { id: 'p4', name: 'Bomba de Água', reference: 'PUMP-H2O', price: 120.00, stock: 5 },
  { id: 'p5', name: 'Vedante Porta', reference: 'VED-09', price: 35.00, stock: 15 },
];

const SEED_OS: ServiceOrder[] = [
  {
    id: '1', code: 'OS-2023-001', client_id: '1', equipment_id: 'eq-1', type: OSType.AVARIA, status: OSStatus.INICIADA, priority: 'alta',
    description: 'Máquina de gelo parou de fabricar gelo. Compressor muito quente.', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), scheduled_date: new Date().toISOString()
  },
  {
    id: '2', code: 'OS-2023-002', client_id: '2', equipment_id: 'eq-3', type: OSType.MANUTENCAO, status: OSStatus.AGUARDA_PECAS, priority: 'media',
    description: 'Limpeza preventiva da exaustão e verificação de filtros.', created_at: new Date(Date.now() - 86400000).toISOString(), scheduled_date: new Date().toISOString()
  },
  {
    id: '3', code: 'OS-2023-003', client_id: '3', equipment_id: 'eq-4', type: OSType.INSTALACAO, status: OSStatus.CONCLUIDA, priority: 'media',
    description: 'Instalação de novo Forno Convector Rational.', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), scheduled_date: new Date(Date.now() - 86400000 * 5).toISOString(),
    start_time: new Date(Date.now() - 86400000 * 5).toISOString(), end_time: new Date(Date.now() - 86400000 * 5 + 7200000).toISOString(),
    resolution_notes: 'Instalação efetuada com sucesso.'
  }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generic LocalStorage Manager
const getStorage = <T>(key: string, seed: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(stored);
};

const setStorage = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const mockData = {
  // Clients
  getClients: async (): Promise<Client[]> => {
    await delay(300);
    return getStorage('db_clients', SEED_CLIENTS);
  },
  
  getClientById: async (id: string): Promise<Client | undefined> => {
    await delay(300);
    const clients = getStorage('db_clients', SEED_CLIENTS);
    return clients.find(c => c.id === id);
  },

  // Equipments
  getEquipments: async (): Promise<Equipment[]> => {
    await delay(300);
    return getStorage('db_equipments', SEED_EQUIPMENTS);
  },

  // Catalog / Inventory
  getCatalog: async (): Promise<PartCatalogItem[]> => {
    await delay(300);
    return getStorage('db_catalog', SEED_CATALOG);
  },

  addCatalogItem: async (item: Omit<PartCatalogItem, 'id'>): Promise<PartCatalogItem> => {
    await delay(400);
    const catalog = getStorage('db_catalog', SEED_CATALOG);
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    catalog.push(newItem);
    setStorage('db_catalog', catalog);
    return newItem;
  },

  updateCatalogItem: async (id: string, updates: Partial<PartCatalogItem>): Promise<void> => {
    await delay(300);
    let catalog = getStorage('db_catalog', SEED_CATALOG);
    catalog = catalog.map(i => i.id === id ? { ...i, ...updates } : i);
    setStorage('db_catalog', catalog);
  },

  // Service Orders
  getServiceOrders: async (): Promise<ServiceOrder[]> => {
    await delay(500);
    const oss = getStorage('db_os', SEED_OS);
    const clients = getStorage('db_clients', SEED_CLIENTS);
    const equipments = getStorage('db_equipments', SEED_EQUIPMENTS);

    // Join data for list view
    return oss.map(os => ({
      ...os,
      client: clients.find(c => c.id === os.client_id),
      equipment: equipments.find(e => e.id === os.equipment_id)
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getServiceOrderById: async (id: string): Promise<ServiceOrder | undefined> => {
    await delay(300);
    const oss = getStorage('db_os', SEED_OS);
    const os = oss.find(o => o.id === id);
    if (!os) return undefined;

    const clients = getStorage('db_clients', SEED_CLIENTS);
    const equipments = getStorage('db_equipments', SEED_EQUIPMENTS);

    return {
      ...os,
      client: clients.find(c => c.id === os.client_id),
      equipment: equipments.find(e => e.id === os.equipment_id)
    };
  },

  createServiceOrder: async (os: Omit<ServiceOrder, 'id' | 'created_at' | 'code'>): Promise<ServiceOrder> => {
    await delay(600);
    const oss = getStorage('db_os', SEED_OS);
    const newId = Math.random().toString(36).substr(2, 9);
    const newCode = `OS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newOS: ServiceOrder = {
      ...os,
      id: newId,
      code: newCode,
      created_at: new Date().toISOString()
    };
    
    oss.unshift(newOS);
    setStorage('db_os', oss);
    return newOS;
  },

  updateServiceOrder: async (id: string, updates: Partial<ServiceOrder>): Promise<void> => {
    await delay(400);
    let oss = getStorage('db_os', SEED_OS);
    oss = oss.map(o => o.id === id ? { ...o, ...updates } : o);
    setStorage('db_os', oss);
  },

  // Sub-resources (Parts, Photos, Time) - Simplified: stored in separate keys
  getOSParts: async (osId: string): Promise<PartUsed[]> => {
    await delay(200);
    const allParts = getStorage<PartUsed[]>('db_parts', []);
    return allParts.filter(p => p.id.startsWith(osId + '_') || (p as any).os_id === osId); // fallback logic
  },

  addOSPart: async (osId: string, part: PartUsed): Promise<void> => {
    await delay(200);
    const allParts = getStorage<PartUsed[]>('db_parts', []);
    // Ensure we tag it with OS ID if not present
    const partWithId = { ...part, id: `${osId}_${Math.random().toString(36).substr(2,5)}`, os_id: osId }; 
    allParts.push(partWithId);
    setStorage('db_parts', allParts);
    
    // Decrement stock (simulation)
    const catalog = getStorage('db_catalog', SEED_CATALOG);
    const catalogItemIndex = catalog.findIndex(c => c.id === part.part_id);
    if (catalogItemIndex >= 0) {
       catalog[catalogItemIndex].stock -= part.quantity;
       setStorage('db_catalog', catalog);
    }
  },

  removeOSPart: async (partId: string): Promise<void> => {
    const allParts = getStorage<PartUsed[]>('db_parts', []);
    const partToRemove = allParts.find(p => p.id === partId);
    
    // Increment stock back (simulation)
    if (partToRemove) {
      const catalog = getStorage('db_catalog', SEED_CATALOG);
      const catalogItemIndex = catalog.findIndex(c => c.id === partToRemove.part_id);
      if (catalogItemIndex >= 0) {
         catalog[catalogItemIndex].stock += partToRemove.quantity;
         setStorage('db_catalog', catalog);
      }
    }

    const filtered = allParts.filter(p => p.id !== partId);
    setStorage('db_parts', filtered);
  },
  
  // Auth Mock
  signIn: async (email: string, password: string): Promise<{ user: any, error: any }> => {
    await delay(800);
    if (password === '123456') { // Simple password check
       const user = { id: 'user-1', email, role: UserRole.TECNICO };
       localStorage.setItem('session_user', JSON.stringify(user));
       return { user, error: null };
    }
    return { user: null, error: { message: 'Credenciais inválidas. Tente password: 123456' } };
  },

  signOut: async () => {
    localStorage.removeItem('session_user');
  },

  getSession: () => {
    const stored = localStorage.getItem('session_user');
    return stored ? JSON.parse(stored) : null;
  }
};

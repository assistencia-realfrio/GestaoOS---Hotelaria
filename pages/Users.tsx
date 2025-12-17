import React, { useState, useEffect } from 'react';
import { Search, Mail, Shield, UserCog, User } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Profile, UserRole } from '../types';

// Mock Data para modo Demo
const MOCK_USERS: Profile[] = [
  { id: '1', full_name: 'Admin Principal', email: 'admin@realfrio.pt', role: UserRole.ADMIN },
  { id: '2', full_name: 'João Técnico', email: 'joao.silva@realfrio.pt', role: UserRole.TECNICO },
  { id: '3', full_name: 'Maria Santos', email: 'maria.santos@realfrio.pt', role: UserRole.BACKOFFICE },
  { id: '4', full_name: 'Carlos Instalações', email: 'carlos@realfrio.pt', role: UserRole.TECNICO },
  { id: '5', full_name: 'Ana Suporte', email: 'ana@realfrio.pt', role: UserRole.BACKOFFICE },
];

const Users: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const isDemo = localStorage.getItem('demo_session') === 'true';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (isDemo) {
      // Simular delay de rede
      await new Promise(r => setTimeout(r, 500));
      setUsers(MOCK_USERS);
      setLoading(false);
      return;
    }

    try {
      // Nota: Em Supabase real, isto requer uma tabela 'profiles' pública
      // sincronizada com auth.users, pois auth.users não é acessível publicamente via client
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback para mock se a tabela não existir ou der erro
      setUsers(MOCK_USERS); 
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case UserRole.BACKOFFICE:
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case UserRole.TECNICO:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'Administrador';
      case UserRole.BACKOFFICE: return 'Backoffice';
      case UserRole.TECNICO: return 'Técnico';
      default: return role;
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilizadores</h1>
          <p className="text-sm text-gray-500">Gestão da equipa e permissões.</p>
        </div>
        
        {/* Botão fictício de adicionar - Funcionalidade complexa para demo */}
        <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center">
            <UserCog size={16} className="mr-2" />
            Convidar Utilizador
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Pesquisar por nome, email ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            A carregar equipa...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div 
              key={user.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                 <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider ${getRoleBadgeColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                 </span>
              </div>

              <div className="flex items-center mb-4 mt-2">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                   {user.avatar_url ? (
                       <img src={user.avatar_url} alt={user.full_name} className="h-full w-full rounded-full object-cover" />
                   ) : (
                       <span className="text-lg font-bold">{user.full_name.charAt(0)}</span>
                   )}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{user.full_name}</h3>
                  <span className="text-xs text-green-600 flex items-center mt-1 font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                    Ativo
                  </span>
                </div>
              </div>
              
              <div className="space-y-3 mt-2">
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                  <Mail size={16} className="mr-3 text-gray-400" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                  <Shield size={16} className="mr-3 text-gray-400" />
                  <span className="capitalize">{user.role}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2">
                 <button className="text-xs font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    Editar
                 </button>
                 <button className="text-xs font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    Ver Perfil
                 </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;
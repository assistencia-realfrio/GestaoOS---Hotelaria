import React, { useState, useEffect } from 'react';
import { Search, Mail, Shield, UserCog } from 'lucide-react';
import { Profile, UserRole } from '../types';

const MOCK_USERS: Profile[] = [
  { id: '1', full_name: 'Admin Principal', email: 'admin@realfrio.pt', role: UserRole.ADMIN },
  { id: '2', full_name: 'João Técnico', email: 'joao.silva@realfrio.pt', role: UserRole.TECNICO },
];

const Users: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-purple-100 text-purple-700 border-purple-200';
      case UserRole.BACKOFFICE: return 'bg-orange-100 text-orange-700 border-orange-200';
      case UserRole.TECNICO: return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilizadores</h1>
        </div>
        <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center">
            <UserCog size={16} className="mr-2" />
            Convidar Utilizador
        </button>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div 
            key={user.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
               <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
               </span>
            </div>

            <div className="flex items-center mb-4 mt-2">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                 <span className="text-lg font-bold">{user.full_name.charAt(0)}</span>
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;
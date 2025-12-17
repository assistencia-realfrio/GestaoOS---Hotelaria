import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, LogOut, Briefcase, Clock, CheckCircle } from 'lucide-react';
import { mockData } from '../services/mockData';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = mockData.getSession();
    setUser(u);
  }, []);

  const handleLogout = async () => {
    await mockData.signOut();
    navigate('/login');
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">O Meu Perfil</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-slate-900 h-24"></div>
        <div className="px-6 pb-6 relative">
          <div className="absolute -top-12 left-6">
            <div className="h-24 w-24 rounded-full bg-white p-1 shadow-lg">
              <div className="h-full w-full rounded-full bg-blue-600 flex items-center justify-center text-white">
                <User size={40} />
              </div>
            </div>
          </div>
          
          <div className="mt-14 space-y-1">
            <h2 className="text-xl font-bold text-gray-900">Técnico Admin</h2>
            <div className="flex items-center text-sm text-gray-500">
               <Mail size={14} className="mr-1" />
               {user?.email}
            </div>
            <div className="flex items-center text-sm text-blue-600 font-medium">
               <Shield size={14} className="mr-1" />
               {user?.role}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Informações da Conta</h3>
        
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center text-gray-700">
            <Briefcase size={18} className="mr-3 text-gray-400" />
            <span>Empresa</span>
          </div>
          <span className="font-medium">Real Frio</span>
        </div>
        
        <div className="flex items-center justify-between py-3">
           <div className="flex items-center text-gray-700">
             <CheckCircle size={18} className="mr-3 text-gray-400" />
             <span>Versão da App</span>
           </div>
           <span className="text-sm text-gray-500">v1.1.0 (Local-First)</span>
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl font-medium hover:bg-red-100 transition-colors"
      >
        <LogOut size={20} />
        <span>Terminar Sessão</span>
      </button>
    </div>
  );
};

export default Profile;
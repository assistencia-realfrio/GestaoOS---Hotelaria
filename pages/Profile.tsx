import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, LogOut, Briefcase, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isDemo = localStorage.getItem('demo_session') === 'true';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (isDemo) {
      setUser({
        email: 'demo@tecnico.pt',
        role: UserRole.TECNICO,
        last_sign_in: new Date().toISOString(),
        id: 'demo-user-123'
      });
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem('demo_session');
    await supabase.auth.signOut();
    navigate('/login');
    window.location.reload();
  };

  if (loading) return <div className="p-8 text-center">A carregar perfil...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">O Meu Perfil</h1>

      {/* User Card */}
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
            <h2 className="text-xl font-bold text-gray-900">{isDemo ? 'Técnico Demo' : user?.email?.split('@')[0]}</h2>
            <div className="flex items-center text-sm text-gray-500">
               <Mail size={14} className="mr-1" />
               {user?.email}
            </div>
            <div className="flex items-center text-sm text-blue-600 font-medium">
               <Shield size={14} className="mr-1" />
               {isDemo ? 'Técnico' : user?.role || 'Técnico'}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
             <div className="text-center p-3 bg-gray-50 rounded-lg">
                <span className="block text-2xl font-bold text-gray-900">12</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">OS Realizadas</span>
             </div>
             <div className="text-center p-3 bg-gray-50 rounded-lg">
                <span className="block text-2xl font-bold text-gray-900">4.5</span>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Média Horas/OS</span>
             </div>
          </div>
        </div>
      </div>

      {/* Settings / Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Informações da Conta</h3>
        
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center text-gray-700">
            <Briefcase size={18} className="mr-3 text-gray-400" />
            <span>Empresa</span>
          </div>
          <span className="font-medium">Real Frio</span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center text-gray-700">
            <Clock size={18} className="mr-3 text-gray-400" />
            <span>Último Acesso</span>
          </div>
          <span className="text-sm text-gray-500">
             {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Agora'}
          </span>
        </div>
        
        <div className="flex items-center justify-between py-3">
           <div className="flex items-center text-gray-700">
             <CheckCircle size={18} className="mr-3 text-gray-400" />
             <span>Versão da App</span>
           </div>
           <span className="text-sm text-gray-500">v1.0.3</span>
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
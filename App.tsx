import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServiceOrders from './pages/ServiceOrders';
import ServiceOrderDetail from './pages/ServiceOrderDetail';
import NewServiceOrder from './pages/NewServiceOrder';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import NewClient from './pages/NewClient';
import EditClient from './pages/EditClient';
import Equipments from './pages/Equipments';
import NewEquipment from './pages/NewEquipment';
import EditEquipment from './pages/EditEquipment'; // Import the new component
import Profile from './pages/Profile';
import { UserRole } from './types';

function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<UserRole | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      // 1. Check for Demo Session (Local Storage)
      const demoSession = localStorage.getItem('demo_session');
      if (demoSession === 'true') {
        setSession({ user: { email: 'demo@exemplo.com' } });
        setRole(UserRole.TECNICO);
        setLoading(false);
        return;
      }

      // 2. Check for Real Supabase Session
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      
      if (supabaseSession) {
        setSession(supabaseSession);
        // In a real app, fetch role from 'profiles' table here using supabaseSession.user.id
        // For now, we'll keep it as TECNICO for simplicity in this context.
        setRole(UserRole.TECNICO); 
      }
      
      setLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // If we are not in demo mode, update session
      if (!localStorage.getItem('demo_session')) {
        setSession(session);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500">A carregar aplicação...</div>;
  }
  
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route path="/" element={session ? <Layout userRole={role}><Dashboard /></Layout> : <Navigate to="/login" />} />
        <Route path="/os" element={session ? <Layout userRole={role}><ServiceOrders /></Layout> : <Navigate to="/login" />} />
        <Route path="/os/new" element={session ? <Layout userRole={role}><NewServiceOrder /></Layout> : <Navigate to="/login" />} />
        <Route path="/os/:id" element={session ? <Layout userRole={role}><ServiceOrderDetail /></Layout> : <Navigate to="/login" />} />
        
        {/* Client Routes */}
        <Route path="/clients" element={session ? <Layout userRole={role}><Clients /></Layout> : <Navigate to="/login" />} />
        <Route path="/clients/new" element={session ? <Layout userRole={role}><NewClient /></Layout> : <Navigate to="/login" />} />
        <Route path="/clients/:id" element={session ? <Layout userRole={role}><ClientDetail /></Layout> : <Navigate to="/login" />} />
        <Route path="/clients/:id/edit" element={session ? <Layout userRole={role}><EditClient /></Layout> : <Navigate to="/login" />} />
        <Route path="/clients/:clientId/equipments/new" element={session ? <Layout userRole={role}><NewEquipment /></Layout> : <Navigate to="/login" />} />
        
        {/* Equipment Routes */}
        <Route path="/equipments" element={session ? <Layout userRole={role}><Equipments /></Layout> : <Navigate to="/login" />} />
        <Route path="/equipments/:id/edit" element={session ? <Layout userRole={role}><EditEquipment /></Layout> : <Navigate to="/login" />} /> {/* New Edit Equipment Route */}

        <Route path="/profile" element={session ? <Layout userRole={role}><Profile /></Layout> : <Navigate to="/login" />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
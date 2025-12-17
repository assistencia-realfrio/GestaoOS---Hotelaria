import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { mockData } from './services/mockData';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServiceOrders from './pages/ServiceOrders';
import ServiceOrderDetail from './pages/ServiceOrderDetail';
import NewServiceOrder from './pages/NewServiceOrder';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Equipments from './pages/Equipments';
import Inventory from './pages/Inventory';
import Users from './pages/Users';
import Profile from './pages/Profile';
import { UserRole } from './types';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      const sessionUser = mockData.getSession();
      if (sessionUser) {
        setUser(sessionUser);
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500">A iniciar aplicação...</div>;
  }
  
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route path="/" element={user ? <Layout userRole={user.role}><Dashboard /></Layout> : <Navigate to="/login" />} />
        <Route path="/os" element={user ? <Layout userRole={user.role}><ServiceOrders /></Layout> : <Navigate to="/login" />} />
        <Route path="/os/new" element={user ? <Layout userRole={user.role}><NewServiceOrder /></Layout> : <Navigate to="/login" />} />
        <Route path="/os/:id" element={user ? <Layout userRole={user.role}><ServiceOrderDetail /></Layout> : <Navigate to="/login" />} />
        
        {/* Management Routes */}
        <Route path="/clients" element={user ? <Layout userRole={user.role}><Clients /></Layout> : <Navigate to="/login" />} />
        <Route path="/clients/:id" element={user ? <Layout userRole={user.role}><ClientDetail /></Layout> : <Navigate to="/login" />} />
        <Route path="/equipments" element={user ? <Layout userRole={user.role}><Equipments /></Layout> : <Navigate to="/login" />} />
        <Route path="/inventory" element={user ? <Layout userRole={user.role}><Inventory /></Layout> : <Navigate to="/login" />} />
        <Route path="/users" element={user ? <Layout userRole={user.role}><Users /></Layout> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Layout userRole={user.role}><Profile /></Layout> : <Navigate to="/login" />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
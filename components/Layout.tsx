import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ClipboardList, Users, HardDrive, LayoutDashboard, LogOut, User, WifiOff, Plus, ArrowUp, UserCog, Package } from 'lucide-react';
import { mockData } from '../services/mockData';
import { UserRole } from '../types';
import BrandLogo from './BrandLogo';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll detection for FAB
    const handleScroll = () => {
      const mainElement = document.querySelector('main');
      if (mainElement && mainElement.scrollTop > 300) {
        setShowScrollTop(true);
      } else if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainEl) mainEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await mockData.signOut();
    navigate('/login');
    window.location.reload();
  };

  const scrollToTop = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Ordens de Serviço', path: '/os', icon: ClipboardList },
    { name: 'Clientes', path: '/clients', icon: Users },
    { name: 'Equipamentos', path: '/equipments', icon: HardDrive },
    { name: 'Stock & Catálogo', path: '/inventory', icon: Package },
    { name: 'Utilizadores', path: '/users', icon: UserCog },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Dynamic FAB Configuration based on Route
  const getFabConfig = () => {
    const path = location.pathname;
    
    if (path.startsWith('/clients')) {
      return { to: '/clients/new', title: 'Novo Cliente', visible: true };
    }
    if (path.startsWith('/equipments')) {
      return { to: '/equipments/new', title: 'Novo Equipamento', visible: true };
    }
    if (path.startsWith('/users')) {
      return { to: '#', title: 'Convidar Utilizador', visible: false }; // Hide FAB on users for now
    }
    // Default to OS creation (Dashboard and OS list)
    return { to: '/os/new', title: 'Nova Ordem de Serviço', visible: true };
  };

  const fabConfig = getFabConfig();
  const showFab = fabConfig.visible && !location.pathname.endsWith('/new');

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-20 px-4 bg-slate-800">
          <div className="w-full flex justify-center">
            <Link to="/os" className="hover:opacity-90 transition-opacity" title="Ir para Ordens de Serviço">
              <BrandLogo variant="light" size="sm" />
            </Link>
          </div>
          <button 
            className="lg:hidden text-gray-300 hover:text-white absolute right-4 top-6"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${isActive(item.path) 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full bg-slate-800 p-4">
          <Link 
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center mb-4 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span className="truncate">Utilizador: {userRole || 'Técnico'}</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-300 rounded-lg hover:bg-slate-700 hover:text-red-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white shadow-sm lg:hidden z-10 mt-0">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <Menu size={24} />
            </button>
            <Link to="/os" className="hover:opacity-90 transition-opacity">
              <BrandLogo variant="dark" size="sm" />
            </Link>
            <div className="w-6" />
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto p-4 md:p-8 pt-8 scroll-smooth`}>
          {children}
        </main>

        {/* Floating Action Buttons (FAB) */}
        <div className="fixed bottom-6 right-6 z-10 flex flex-col gap-3">
          {/* Scroll To Top */}
          {showScrollTop && (
            <button 
              onClick={scrollToTop}
              className="p-3 bg-white text-gray-600 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all transform hover:scale-110"
              title="Voltar ao topo"
            >
              <ArrowUp size={20} />
            </button>
          )}

          {/* Dynamic Creation Button */}
          {showFab && (
            <Link 
              to={fabConfig.to}
              className="p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 hover:shadow-2xl transition-all transform hover:scale-110 flex items-center justify-center"
              title={fabConfig.title}
            >
              <Plus size={24} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Layout;
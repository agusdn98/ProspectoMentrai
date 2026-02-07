import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useUIStore } from '../../store/store';
import clsx from 'clsx';

export default function Layout() {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);

  return (
    <div className="app-shell flex bg-white h-screen overflow-hidden">
      <Sidebar />
      
      <div className={clsx(
        'flex-1 flex flex-col transition-all duration-300 overflow-hidden',
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      )}>
        <Navbar />
        
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

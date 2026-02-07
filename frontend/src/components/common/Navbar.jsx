import { Menu } from '@headlessui/react';
import { 
  UserIcon, 
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/store';
import { toast } from 'react-hot-toast';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();

  const titles = {
    '/': 'Dashboard',
    '/ai-finder': 'AI Finder',
    '/lists': 'Lists',
    '/settings': 'Settings',
  };

  const pageTitle = titles[location.pathname] || 'Mentrai';

  const handleLogout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="bg-white/80 backdrop-blur border-b border-slate-200 h-16 flex items-center justify-between px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mentrai</p>
        <h2 className="text-lg font-semibold text-slate-900 font-display">{pageTitle}</h2>
      </div>

      {/* User menu */}
      <div className="flex items-center gap-4">
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-2 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-slate-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </Menu.Button>

          <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => navigate('/settings')}
                    className={`${
                      active ? 'bg-slate-100' : ''
                    } group flex items-center w-full px-4 py-2 text-sm text-slate-700`}
                  >
                    <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
                    Settings
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    className={`${
                      active ? 'bg-slate-100' : ''
                    } group flex items-center w-full px-4 py-2 text-sm text-red-600`}
                  >
                    <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-red-600" />
                    Logout
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Menu>
      </div>
    </nav>
  );
}

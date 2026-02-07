import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  ListBulletIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useUIStore } from '../../store/store';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'AI Finder', href: '/ai-finder', icon: MagnifyingGlassIcon },
  { name: 'Lists', href: '/lists', icon: ListBulletIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div className={clsx(
      'fixed inset-y-0 left-0 bg-slate-950/95 text-white transition-all duration-300 z-20 border-r border-slate-800',
      sidebarCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        {!sidebarCollapsed && (
          <h1 className="text-lg font-bold tracking-wide font-display bg-gradient-to-r from-primary-200 to-secondary-500 bg-clip-text text-transparent">
            MENTRAI
          </h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => clsx(
                'flex items-center px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <item.icon className={clsx('h-5 w-5 flex-shrink-0', !sidebarCollapsed && 'mr-3')} />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">{item.name}</span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Version info */}
      {!sidebarCollapsed && (
        <div className="absolute bottom-4 left-4 right-4 text-xs text-slate-500">
          <p>Version 1.0.0</p>
          <p className="mt-1">© 2026 MENTRAI</p>
        </div>
      )}
    </div>
  );
}

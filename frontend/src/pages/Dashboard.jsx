import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  ListBulletIcon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { companiesApi, listsApi } from '../services/api';
import { useAuthStore } from '../store/store';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  // Fetch dashboard stats
  const { data: companiesData } = useQuery({
    queryKey: ['companies', { page: 1, limit: 5 }],
    queryFn: () => companiesApi.getAll({ page: 1, limit: 5 })
  });

  const { data: listsData } = useQuery({
    queryKey: ['lists'],
    queryFn: () => listsApi.getAll()
  });

  const companies = companiesData?.data?.data?.companies || [];
  const lists = listsData?.data?.data?.lists || [];
  const totalCompanies = companiesData?.data?.data?.pagination?.total || 0;

  const stats = [
    {
      name: 'Total Companies',
      value: totalCompanies,
      icon: BuildingOfficeIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      name: 'Total Lists',
      value: lists.length,
      icon: ListBulletIcon,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      name: 'Avg Score',
      value: companies.length > 0 
        ? Math.round(companies.reduce((sum, c) => sum + c.idealCustomerScore, 0) / companies.length)
        : 0,
      icon: ArrowTrendingUpIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-10">
      <div className="panel-muted rounded-2xl p-6 border border-primary-100/60">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Overview</p>
        <h1 className="text-3xl font-semibold text-slate-900 font-display mt-2">
          Welcome back, {user?.firstName}
        </h1>
        <p className="mt-2 text-slate-600">
          Track signal-rich accounts and keep outreach focused.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{stat.name}</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.bg} rounded-xl p-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
            <p className="text-sm text-slate-500">Move from search to list in seconds.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/ai-finder">
            <div className="flex items-center p-4 border border-slate-200 rounded-xl hover:border-primary-500 hover:bg-primary-50/60 transition-all cursor-pointer">
              <div className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center mr-4">
                <MagnifyingGlassIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">AI-Powered Search</p>
                <p className="text-sm text-slate-600">Find ideal companies</p>
              </div>
            </div>
          </Link>

          <Link to="/lists">
            <div className="flex items-center p-4 border border-slate-200 rounded-xl hover:border-primary-500 hover:bg-primary-50/60 transition-all cursor-pointer">
              <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center mr-4">
                <ListBulletIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Manage Lists</p>
                <p className="text-sm text-slate-600">Organize your prospects</p>
              </div>
            </div>
          </Link>
        </div>
      </Card>

      {/* Recent Companies */}
      {companies.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Top Scored Companies</h2>
            <Link to="/ai-finder">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {companies.slice(0, 5).map((company) => (
              <Link
                key={company.id}
                to={`/companies/${company.id}`}
                className="block p-4 border border-slate-200 rounded-xl hover:border-primary-500 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mr-3">
                      <BuildingOfficeIcon className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{company.companyName}</p>
                      <p className="text-sm text-slate-600">{company.industry}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500 mr-2">Score</span>
                      <span className="text-lg font-semibold text-primary-600">
                        {company.idealCustomerScore}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

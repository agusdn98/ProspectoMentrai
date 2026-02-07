import Card from '../components/common/Card';
import { useAuthStore } from '../store/store';

export default function Settings() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your account and API integrations
        </p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">{user?.firstName} {user?.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Role</p>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">API Integrations</h2>
        <p className="text-gray-600">Configure Apollo.io, Hunter.io, and other API keys</p>
        <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
      </Card>
    </div>
  );
}

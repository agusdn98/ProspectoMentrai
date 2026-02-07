import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { listsApi } from '../services/api';
import Card from '../components/common/Card';

export default function ListDetails() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['list', id],
    queryFn: () => listsApi.getById(id),
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const list = data?.data?.data?.list;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{list?.listName}</h1>
        {list?.listDescription && (
          <p className="mt-2 text-gray-600">{list.listDescription}</p>
        )}
      </div>

      <Card>
        <p>List details and companies will be displayed here</p>
      </Card>
    </div>
  );
}

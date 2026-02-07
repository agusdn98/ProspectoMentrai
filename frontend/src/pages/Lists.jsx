import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { listsApi } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { PlusIcon, ListBulletIcon } from '@heroicons/react/24/outline';

export default function Lists() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    listName: '',
    listDescription: ''
  });

  const { data: listsData, isLoading } = useQuery({
    queryKey: ['lists'],
    queryFn: () => listsApi.getAll()
  });

  const createMutation = useMutation({
    mutationFn: listsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['lists']);
      toast.success('List created successfully');
      setIsCreateModalOpen(false);
      setFormData({ listName: '', listDescription: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create list');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: listsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['lists']);
      toast.success('List deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete list');
    }
  });

  const handleCreateList = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDeleteList = (listId) => {
    if (window.confirm('Are you sure you want to delete this list?')) {
      deleteMutation.mutate(listId);
    }
  };

  const lists = listsData?.data?.data?.lists || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lists</h1>
          <p className="mt-2 text-gray-600">
            Organize your prospects into targeted lists
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={<PlusIcon className="h-5 w-5" />}
        >
          Create List
        </Button>
      </div>

      {lists.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ListBulletIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No lists yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new list
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Create your first list
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <Card key={list.id} hover>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {list.listName}
                  </h3>
                  {list.listDescription && (
                    <p className="mt-1 text-sm text-gray-600">
                      {list.listDescription}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {list._count?.listCompanies || 0}
                  </p>
                  <p className="text-xs text-gray-600">Companies</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {list._count?.listContacts || 0}
                  </p>
                  <p className="text-xs text-gray-600">Contacts</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link to={`/lists/${list.id}`} className="flex-1">
                  <Button fullWidth variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteList(list.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create List Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New List"
      >
        <form onSubmit={handleCreateList} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              List Name
            </label>
            <input
              type="text"
              value={formData.listName}
              onChange={(e) => setFormData({ ...formData, listName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., High-Value SaaS Prospects"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.listDescription}
              onChange={(e) => setFormData({ ...formData, listDescription: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="3"
              placeholder="Describe the purpose of this list..."
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending}
            >
              Create List
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

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

  const companies = list?.listCompanies || [];
  const contacts = list?.listContacts || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{list?.listName}</h1>
        {list?.listDescription && (
          <p className="mt-2 text-gray-600">{list.listDescription}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm text-gray-600">Companies</p>
          <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Contacts</p>
          <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Companies</h2>
        {companies.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-600">No companies saved in this list yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {companies.map((item) => {
              const company = item.company || {};
              return (
                <Card key={item.id}>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {company.companyName || 'Unknown'}
                        </h3>
                        {company.domain && (
                          <p className="text-sm text-gray-600">{company.domain}</p>
                        )}
                      </div>
                      {company.industry && (
                        <span className="px-2 py-1 text-xs bg-teal-100 text-teal-700 rounded-full">
                          {company.industry}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                      {company.companySize && <span>Size: {company.companySize}</span>}
                      {company.locationCity && (
                        <span>
                          {company.locationCity}
                          {company.locationCountry ? `, ${company.locationCountry}` : ''}
                        </span>
                      )}
                      {company._count?.contacts !== undefined && (
                        <span>Contacts: {company._count.contacts}</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
        {contacts.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-600">No contacts saved in this list yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {contacts.map((item) => {
              const contact = item.contact || {};
              const company = contact.company || {};
              const fullName = contact.fullName || [contact.firstName, contact.lastName].filter(Boolean).join(' ');
              return (
                <Card key={item.id}>
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {fullName || 'Unknown'}
                      </h3>
                      {contact.jobTitle && (
                        <p className="text-sm text-gray-600">{contact.jobTitle}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                      {company.companyName && <span>{company.companyName}</span>}
                      {contact.email && <span>{contact.email}</span>}
                      {contact.phone && <span>{contact.phone}</span>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

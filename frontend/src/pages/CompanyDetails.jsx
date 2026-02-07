import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { 
  GlobeAltIcon, 
  BuildingOfficeIcon,
  MapPinIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function CompanyDetails() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companiesApi.getById(id),
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const company = data?.data?.data?.company;

  if (!company) {
    return (
      <Card>
        <p className="text-center py-12 text-gray-600">Company not found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/">
        <Button variant="ghost" icon={<ArrowLeftIcon className="h-4 w-4" />}>
          Back
        </Button>
      </Link>

      {/* Header */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.companyName} className="w-14 h-14 rounded" />
              ) : (
                <BuildingOfficeIcon className="h-8 w-8 text-gray-600" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{company.companyName}</h1>
              <p className="text-gray-600 mt-1">{company.domain}</p>
              {company.industry && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mt-2">
                  {company.industry}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Ideal Customer Score</p>
            <p className="text-4xl font-bold text-primary-600">{company.idealCustomerScore}</p>
          </div>
        </div>
      </Card>

      {/* Company Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">Company Information</h2>
          <div className="space-y-3">
            {company.websiteUrl && (
              <div className="flex items-center">
                <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Website</p>
                  <a 
                    href={company.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {company.websiteUrl}
                  </a>
                </div>
              </div>
            )}

            {company.locationCity && (
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">
                    {company.locationCity}, {company.locationCountry}
                  </p>
                </div>
              </div>
            )}

            {company.companySize && (
              <div className="flex items-center">
                <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Company Size</p>
                  <p className="font-medium">{company.companySize} employees</p>
                </div>
              </div>
            )}

            {company.fundingStage && (
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Funding</p>
                  <p className="font-medium">{company.fundingStage}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Description</h2>
          <p className="text-gray-700">
            {company.description || 'No description available'}
          </p>

          {company.growthSignals && company.growthSignals.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Growth Signals</h3>
              <div className="space-y-1">
                {company.growthSignals.map((signal, idx) => (
                  <p key={idx} className="text-sm text-green-600">• {signal}</p>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Contacts */}
      {company.contacts && company.contacts.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">
            Contacts ({company.contacts.length})
          </h2>
          <div className="space-y-3">
            {company.contacts.slice(0, 10).map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{contact.fullName}</p>
                  <p className="text-sm text-gray-600">{contact.jobTitle}</p>
                  {contact.email && (
                    <p className="text-sm text-primary-600">{contact.email}</p>
                  )}
                </div>
                {contact.relevanceScore && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Relevance</p>
                    <p className="text-lg font-bold text-primary-600">
                      {contact.relevanceScore}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

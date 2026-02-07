import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { prospectingApi, listsApi } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { BuildingOfficeIcon, PlusIcon } from '@heroicons/react/24/outline';

const INDUSTRIES = ['SaaS', 'Technology', 'E-commerce', 'FinTech', 'HealthTech', 'EdTech'];
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
const FUNDING_STAGES = ['Seed', 'Series A', 'Series B', 'Series C', 'Growth'];

export default function AIFinder() {
  const [source, setSource] = useState('open-web');
  const [filters, setFilters] = useState({
    industries: [],
    companySizes: [],
    locations: [],
    fundingStages: [],
    technologies: [],
    keywords: ''
  });

  const [results, setResults] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  const searchMutation = useMutation({
    mutationFn: ({ source, criteria }) => {
      return source === 'open-web'
        ? prospectingApi.searchOpenWebCompanies(criteria)
        : prospectingApi.searchCompanies(criteria);
    },
    onSuccess: (response) => {
      setResults(response.data.data.companies);
      toast.success(`Found ${response.data.data.companies.length} companies`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Search failed');
    }
  });

  const addCompanyMutation = useMutation({
    mutationFn: (company) => prospectingApi.addCompany({ 
      domain: company.domain, 
      apolloId: company.apolloId 
    }),
    onSuccess: () => {
      toast.success('Company added successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add company');
    }
  });

  const handleSearch = () => {
    searchMutation.mutate({
      source,
      criteria: {
        ...filters,
        includeContacts: source === 'open-web'
      }
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      if (Array.isArray(prev[key])) {
        const isSelected = prev[key].includes(value);
        return {
          ...prev,
          [key]: isSelected
            ? prev[key].filter(v => v !== value)
            : [...prev[key], value]
        };
      }
      return { ...prev, [key]: value };
    });
  };

  const handleAddCompany = (company) => {
    addCompanyMutation.mutate(company);
  };

  const toggleSelectCompany = (company) => {
    const key = company.domain || company.apolloId;
    setSelectedCompanies(prev => {
      const isSelected = prev.find(c => (c.domain || c.apolloId) === key);
      return isSelected
        ? prev.filter(c => (c.domain || c.apolloId) !== key)
        : [...prev, company];
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Search</p>
          <h1 className="text-3xl font-semibold text-slate-900 font-display mt-2">AI Company Finder</h1>
          <p className="mt-2 text-slate-600">
            Build precise filters and surface high-fit accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setSource('open-web')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md ${source === 'open-web' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              Open Web
            </button>
            <button
              type="button"
              onClick={() => setSource('apollo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md ${source === 'apollo' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              Apollo
            </button>
          </div>
          <Button onClick={handleSearch} loading={searchMutation.isPending}>
            Run Search
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-base font-semibold mb-4 text-slate-900">Filters</h3>
            
            {/* Industries */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industries
              </label>
              <div className="space-y-2">
                {INDUSTRIES.map(industry => (
                  <label key={industry} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.industries.includes(industry)}
                      onChange={() => handleFilterChange('industries', industry)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{industry}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Company Size */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Size
              </label>
              <div className="space-y-2">
                {COMPANY_SIZES.map(size => (
                  <label key={size} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.companySizes.includes(size)}
                      onChange={() => handleFilterChange('companySizes', size)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{size}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Funding Stage */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funding Stage
              </label>
              <div className="space-y-2">
                {FUNDING_STAGES.map(stage => (
                  <label key={stage} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.fundingStages.includes(stage)}
                      onChange={() => handleFilterChange('fundingStages', stage)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{stage}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button fullWidth onClick={handleSearch} loading={searchMutation.isPending}>
              Search Companies
            </Button>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {results.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <BuildingOfficeIcon className="mx-auto h-10 w-10 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">No results yet</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Use the filters to search for companies
                </p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900">
                  {results.length} Companies Found
                </h3>
                {selectedCompanies.length > 0 && (
                  <Button size="sm">
                    Add {selectedCompanies.length} to List
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {results.map((company) => (
                  <div
                    key={company.domain || company.apolloId}
                    className="border border-slate-200 rounded-xl p-4 hover:border-primary-500 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <input
                          type="checkbox"
                          checked={selectedCompanies.some(c => (c.domain || c.apolloId) === (company.domain || company.apolloId))}
                          onChange={() => toggleSelectCompany(company)}
                          className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-semibold text-slate-900">
                              {company.name}
                            </h4>
                            <span className={`text-base font-semibold ${getScoreColor(company.idealCustomerScore)}`}>
                              {company.idealCustomerScore}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{company.domain}</p>
                          
                          {company.description && (
                            <p className="mt-2 text-sm text-slate-700 line-clamp-2">
                              {company.description}
                            </p>
                          )}
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            {company.industry && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                {company.industry}
                              </span>
                            )}
                            {company.companySize && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                {company.companySize} employees
                              </span>
                            )}
                            {company.locationCountry && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                {company.locationCity}, {company.locationCountry}
                              </span>
                            )}
                          </div>

                          {company.growthSignals && company.growthSignals.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-slate-500 font-medium">Growth Signals:</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {company.growthSignals.map((signal, idx) => (
                                  <span key={idx} className="text-xs text-emerald-600">
                                    • {signal}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddCompany(company)}
                        loading={addCompanyMutation.isPending}
                        icon={<PlusIcon className="h-4 w-4" />}
                      >
                        Add
                      </Button>
                    </div>
                    {company.contacts && company.contacts.length > 0 && (
                      <div className="mt-3 text-xs text-slate-500">
                        Emails found: {company.contacts.map((c) => c.email).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

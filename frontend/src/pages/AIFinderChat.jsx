import { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import api from '../services/api';

export default function AIFinderChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: '👋 Hi! I\'m your AI prospecting assistant. Tell me what kind of prospects you\'re looking for. For example: "Find CRM managers in USA" or "I need startup founders in Europe"',
      companies: [],
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState(new Set());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Add user message
    const userMessage = {
      id: Math.random(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = messages
        .filter(m => m.role !== 'user' || m.content)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const response = await api.post('/prospecting/search/chat', {
        message: userInput,
        conversationHistory
      });

      if (response.data.success) {
        const { message, companies = [], criteria } = response.data.data;
        const assistantMessage = {
          id: Math.random(),
          role: 'assistant',
          content: message || 'I found some companies matching your criteria.',
          companies: Array.isArray(companies) ? companies : [],
          criteria: criteria,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMsg = {
          id: Math.random(),
          role: 'assistant',
          content: '❌ ' + (response.data.error || 'Error processing your request. Please try again.'),
          companies: [],
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred';
      const errorMsg = {
        id: Math.random(),
        role: 'assistant',
        content: '❌ Error: ' + errorMessage,
        companies: [],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompanySelection = (companyId) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
    } else {
      newSelected.add(companyId);
    }
    setSelectedCompanies(newSelected);
  };

  const handleAddToList = () => {
    if (selectedCompanies.size === 0) return;
    console.log('Adding companies to list:', Array.from(selectedCompanies));
    // TODO: Implement actual add to list functionality
    alert(`Added ${selectedCompanies.size} companies to list`);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-4 shadow-md flex-shrink-0">
        <h1 className="text-2xl font-bold">🤖 AI Prospecting Chat</h1>
        <p className="text-teal-100 text-sm mt-1">Find the right prospects with natural language</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              {/* Message Bubble */}
              <div  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl ${
                  message.role === 'user'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                } p-4 rounded-lg`}>
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
              </div>

              {/* Company Cards */}
              {message.companies && message.companies.length > 0 && (
                <div className="mt-4">
                  <div className="max-w-2xl mx-auto space-y-3">
                    {message.companies.map((company, idx) => {
                      const compId = `${company.domain || 'unknown'}-${idx}`;
                      const isSelected = selectedCompanies.has(compId);
                      return (
                        <div
                          key={compId}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-200 bg-white hover:border-teal-300'
                          }`}
                        >
                          <div className="flex gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCompanySelection(compId)}
                              className="w-5 h-5 accent-teal-600 flex-shrink-0 mt-1 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              {/* Company Header */}
                              <div className="flex justify-between items-start gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-gray-900">{company.name || 'Unknown'}</h3>
                                  {company.domain && (
                                    <p className="text-sm text-gray-600">{company.domain}</p>
                                  )}
                                </div>
                                {company.industrySearch && (
                                  <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs rounded-full font-medium flex-shrink-0 whitespace-nowrap">
                                    {company.industrySearch}
                                  </span>
                                )}
                              </div>

                              {/* Description */}
                              {company.description && (
                                <p className="text-sm text-gray-700 mb-2">{company.description}</p>
                              )}

                              {/* Meta Info */}
                              <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3">
                                {company.locationCountry && (
                                  <span>📍 {company.locationCountry}</span>
                                )}
                                {company.rolesMatched && company.rolesMatched.length > 0 && (
                                  <span>👤 {company.rolesMatched.slice(0, 2).join(', ')}</span>
                                )}
                              </div>

                              {/* Emails Section */}
                              {(company.contacts?.length > 0 || company.suggestedContactEmails?.length > 0) && (
                                <div className="text-xs space-y-2 pt-2 border-t border-gray-200">
                                  {company.contacts?.length > 0 && (
                                    <div>
                                      <p className="font-medium text-gray-700">Found emails:</p>
                                      <p className="text-teal-600">{company.contacts.map(c => c.email).join(', ')}</p>
                                    </div>
                                  )}
                                  {company.suggestedContactEmails?.length > 0 && (
                                    <div>
                                      <p className="font-medium text-gray-700">Suggested:</p>
                                      <p className="text-amber-600">{company.suggestedContactEmails.join(', ')}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-100 text-gray-900 p-4 rounded-lg inline-flex gap-2 items-center">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Searching for prospects...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-gray-50 p-6 flex-shrink-0">
        {selectedCompanies.size > 0 && (
          <div className="max-w-4xl mx-auto mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg flex justify-between items-center">
            <span className="text-sm font-medium text-teal-900">
              ✓ {selectedCompanies.size} compan{selectedCompanies.size === 1 ? 'y' : 'ies'} selected
            </span>
            <button
              onClick={handleAddToList}
              className="px-4 py-2 bg-teal-600 text-white rounded text-sm font-medium hover:bg-teal-700 transition"
            >
              Add to List
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., 'Find HR directors at SaaS companies in California with 100-500 employees'"
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium flex items-center gap-2 flex-shrink-0"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Searching...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </button>
        </form>

        <div className="text-xs text-gray-500 mt-3 max-w-4xl mx-auto">
          ℹ️ Tip: Be as specific as possible with roles, industries, company size, and location for better results
        </div>
      </div>
    </div>
  );
}

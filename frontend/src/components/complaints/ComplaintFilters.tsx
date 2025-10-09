import { useState } from 'react';
import { Filter, X, Search } from 'lucide-react';

interface ComplaintFiltersProps {
  statuses: string[];
  priorities: string[];
  selectedStatuses: string[];
  selectedPriorities: string[];
  searchQuery: string;
  onToggleStatus: (status: string) => void;
  onTogglePriority: (priority: string) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export function ComplaintFilters({
  statuses,
  priorities,
  selectedStatuses,
  selectedPriorities,
  searchQuery,
  onToggleStatus,
  onTogglePriority,
  onSearchChange,
  onClearFilters
}: ComplaintFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="search"
            className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search complaints..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters || selectedStatuses.length > 0 || selectedPriorities.length > 0
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(selectedStatuses.length > 0 || selectedPriorities.length > 0) && (
              <span className="flex items-center justify-center w-5 h-5 text-xs font-medium bg-blue-600 text-white rounded-full">
                {selectedStatuses.length + selectedPriorities.length}
              </span>
            )}
          </button>
          {(selectedStatuses.length > 0 || selectedPriorities.length > 0 || searchQuery) && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Status</h3>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => onToggleStatus(status)}
                    className={`px-3 py-1 text-sm rounded-full border ${
                      selectedStatuses.includes(status)
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Priority</h3>
              <div className="flex flex-wrap gap-2">
                {priorities.map((priority) => (
                  <button
                    key={priority}
                    onClick={() => onTogglePriority(priority)}
                    className={`px-3 py-1 text-sm rounded-full border ${
                      selectedPriorities.includes(priority)
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
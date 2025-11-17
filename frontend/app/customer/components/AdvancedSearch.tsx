'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface SearchFilters {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  minDuration: string;
  maxDuration: string;
  sortBy: string;
  sortOrder: string;
}

interface FilterOptions {
  categories: string[];
  priceRange: {
    minPrice: number;
    maxPrice: number;
    minDuration: number;
    maxDuration: number;
  };
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  filterOptions: FilterOptions;
  loading?: boolean;
}

export default function AdvancedSearch({ onSearch, filterOptions, loading = false }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    minDuration: '',
    maxDuration: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      minDuration: '',
      maxDuration: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const hasActiveFilters = () => {
    return !!(
      filters.search ||
      filters.category ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.minDuration ||
      filters.maxDuration ||
      filters.sortBy !== 'createdAt' ||
      filters.sortOrder !== 'desc'
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)] w-5 h-5" />
          <input
            type="text"
            placeholder="Search services..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-blue-100' : ''}`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
        {hasActiveFilters() && (
          <button
            onClick={clearFilters}
            className="btn-ghost flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="card p-6 space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input-field"
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium mb-2">Min Price (₱)</label>
              <input
                type="number"
                placeholder={`Min: ₱${filterOptions.priceRange.minPrice}`}
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Price (₱)</label>
              <input
                type="number"
                placeholder={`Max: ₱${filterOptions.priceRange.maxPrice}`}
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="input-field"
                min="0"
              />
            </div>

            {/* Duration Range */}
            <div>
              <label className="block text-sm font-medium mb-2">Min Duration (min)</label>
              <input
                type="number"
                placeholder={`Min: ${filterOptions.priceRange.minDuration}min`}
                value={filters.minDuration}
                onChange={(e) => handleFilterChange('minDuration', e.target.value)}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Duration (min)</label>
              <input
                type="number"
                placeholder={`Max: ${filterOptions.priceRange.maxDuration}min`}
                value={filters.maxDuration}
                onChange={(e) => handleFilterChange('maxDuration', e.target.value)}
                className="input-field"
                min="0"
              />
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="input-field"
              >
                <option value="createdAt">Date Added</option>
                <option value="price">Price</option>
                <option value="duration">Duration</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sort Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="input-field"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters() && (
            <div className="pt-4 border-t border-[var(--border)]">
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <span className="badge-primary">
                    Search: "{filters.search}"
                  </span>
                )}
                {filters.category && (
                  <span className="badge-primary">
                    Category: {filters.category}
                  </span>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <span className="badge-primary">
                    Price: ₱{filters.minPrice || '0'} - ₱{filters.maxPrice || '∞'}
                  </span>
                )}
                {(filters.minDuration || filters.maxDuration) && (
                  <span className="badge-primary">
                    Duration: {filters.minDuration || '0'} - {filters.maxDuration || '∞'} min
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[var(--primary)]"></div>
          <span className="ml-2 text-[var(--muted)]">Searching...</span>
        </div>
      )}
    </div>
  );
}
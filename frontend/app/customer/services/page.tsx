'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdvancedSearch from '../components/AdvancedSearch';

interface Service {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
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

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    priceRange: { minPrice: 0, maxPrice: 0, minDuration: 0, maxDuration: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchServices = async (filters: SearchFilters = {
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    minDuration: '',
    maxDuration: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  }) => {
    setSearchLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`http://localhost:5000/api/services?${queryParams}`);
      const data = await response.json();
      if (data.success) {
        setServices(data.services);
        setFilterOptions(data.filters);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  if (loading) return <div>Loading services...</div>;

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">Our Services</h1>
      <p className="text-[var(--muted)] mb-8">Choose from our wide range of services</p>

      {/* Advanced Search */}
      <div className="mb-8">
        <AdvancedSearch
          onSearch={fetchServices}
          filterOptions={filterOptions}
          loading={searchLoading}
        />
      </div>

      {services.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[var(--muted)]">No services available at the moment</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service._id} className="card p-6 flex flex-col">
              <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
              <p className="text-[var(--muted)] text-sm mb-4">{service.description}</p>

              <div className="mt-auto space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)] text-sm">Duration:</span>
                  <span className="font-semibold">{service.duration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)] text-sm">Category:</span>
                  <span className="font-semibold capitalize">{service.category}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                  <span className="font-semibold">Price:</span>
                  <span className="text-[var(--primary)] font-bold">₱{service.price}</span>
                </div>
              </div>

              <Link href={`/customer/booking/${service._id}`} className="btn-primary text-center">
                Book Now
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

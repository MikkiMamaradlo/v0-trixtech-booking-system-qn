'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalServices: 0,
    totalBookings: 0,
    totalCustomers: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');

      try {
        const [servicesRes, bookingsRes, customersRes] = await Promise.all([
          fetch('http://localhost:5000/api/services', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:5000/api/bookings/admin/all', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:5000/api/users', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const servicesData = await servicesRes.json();
        const bookingsData = await bookingsRes.json();
        const customersData = await customersRes.json();

        let revenue = 0;
        if (bookingsData.bookings) {
          revenue = bookingsData.bookings.reduce((sum: number, booking: any) => sum + booking.totalPrice, 0);
        }

        setStats({
          totalServices: servicesData.services?.length || 0,
          totalBookings: bookingsData.bookings?.length || 0,
          totalCustomers: customersData.users?.filter((u: any) => u.role === 'customer').length || 0,
          revenue,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-[var(--muted)] mb-8">Overview of your business</p>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-[var(--muted)] text-sm font-semibold mb-2">Total Services</h3>
          <p className="text-3xl font-bold text-[var(--primary)]">{stats.totalServices}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-[var(--muted)] text-sm font-semibold mb-2">Total Bookings</h3>
          <p className="text-3xl font-bold text-[var(--accent)]">{stats.totalBookings}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-[var(--muted)] text-sm font-semibold mb-2">Total Customers</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalCustomers}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-[var(--muted)] text-sm font-semibold mb-2">Revenue</h3>
          <p className="text-3xl font-bold text-green-600">${stats.revenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/admin/services" className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-xl font-semibold mb-2">Manage Services</h3>
          <p className="text-[var(--muted)]">Create, edit, or delete services</p>
        </Link>
        <Link href="/admin/bookings" className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-xl font-semibold mb-2">Manage Bookings</h3>
          <p className="text-[var(--muted)]">Update booking status and payments</p>
        </Link>
        <Link href="/admin/customers" className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <h3 className="text-xl font-semibold mb-2">Manage Customers</h3>
          <p className="text-[var(--muted)]">View and manage customer accounts</p>
        </Link>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function CustomerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedBookings: 0,
    upcomingBookings: 0,
  });

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">Welcome, {user?.name}!</h1>
      <p className="text-[var(--muted)] mb-8">Here's your booking overview</p>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-[var(--muted)] text-sm font-semibold mb-2">Total Bookings</h3>
          <p className="text-3xl font-bold text-[var(--primary)]">{stats.totalBookings}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-[var(--muted)] text-sm font-semibold mb-2">Upcoming</h3>
          <p className="text-3xl font-bold text-[var(--accent)]">{stats.upcomingBookings}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-[var(--muted)] text-sm font-semibold mb-2">Completed</h3>
          <p className="text-3xl font-bold text-green-600">{stats.completedBookings}</p>
        </div>
      </div>

      <div className="mt-12 card p-6">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="flex gap-4 flex-wrap">
          <a href="/customer/services" className="btn-primary">
            Browse Services
          </a>
          <a href="/customer/bookings" className="btn-secondary">
            View Bookings
          </a>
        </div>
      </div>
    </div>
  );
}

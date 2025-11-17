'use client';

import { useState, useEffect } from 'react';
import { Crown, Gift, Star, Trophy } from 'lucide-react';

interface LoyaltyData {
  points: number;
  tier: string;
  totalSpent: number;
  bookingsCount: number;
  tierBenefits: {
    name: string;
    pointsMultiplier: number;
    benefits: string[];
  };
  availableRewards: Array<{
    type: string;
    value: any;
    description: string;
    expiresAt?: string;
  }>;
  nextTierThreshold: {
    tier: string;
    amount: number;
    remaining: number;
  };
}

export default function LoyaltyCard() {
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchLoyaltyStatus();
  }, []);

  const fetchLoyaltyStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/loyalty/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setLoyalty(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch loyalty status:', error);
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async (rewardType: string, pointsRequired: number) => {
    setRedeeming(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rewardType, pointsRequired }),
      });
      const data = await response.json();
      if (data.success) {
        fetchLoyaltyStatus(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to redeem reward:', error);
    } finally {
      setRedeeming(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return <Crown className="w-6 h-6 text-purple-600" />;
      case 'gold':
        return <Trophy className="w-6 h-6 text-yellow-600" />;
      case 'silver':
        return <Star className="w-6 h-6 text-gray-600" />;
      default:
        return <Gift className="w-6 h-6 text-blue-600" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'from-purple-500 to-purple-600';
      case 'gold':
        return 'from-yellow-500 to-yellow-600';
      case 'silver':
        return 'from-gray-400 to-gray-500';
      default:
        return 'from-blue-500 to-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!loyalty) return null;

  return (
    <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex items-center gap-3 mb-6">
        {getTierIcon(loyalty.tier)}
        <div>
          <h3 className="text-xl font-bold text-[var(--foreground)]">
            {loyalty.tierBenefits.name} Member
          </h3>
          <p className="text-sm text-[var(--muted)]">
            {loyalty.points} points • ₱{loyalty.totalSpent} spent
          </p>
        </div>
      </div>

      {/* Progress to next tier */}
      {loyalty.nextTierThreshold.remaining > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress to {loyalty.nextTierThreshold.tier}</span>
            <span>₱{loyalty.nextTierThreshold.remaining} to go</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  ((loyalty.totalSpent / loyalty.nextTierThreshold.amount) * 100),
                  100
                )}%`,
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Tier Benefits */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3 text-[var(--foreground)]">Your Benefits</h4>
        <ul className="space-y-2">
          {loyalty.tierBenefits.benefits.map((benefit, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      {/* Available Rewards */}
      {loyalty.availableRewards.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-[var(--foreground)]">Available Rewards</h4>
          <div className="space-y-3">
            {loyalty.availableRewards.map((reward, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{reward.description}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {reward.type === 'discount' ? `${reward.value}% off` : 'Free service'}
                  </p>
                </div>
                <button
                  onClick={() => redeemReward(reward.type, 100)} // Assuming 100 points for demo
                  disabled={redeeming}
                  className="btn-primary text-sm px-4 py-2"
                >
                  Redeem
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button className="btn-secondary text-sm flex-1">
          View History
        </button>
        <button className="btn-ghost text-sm flex-1">
          Earn More Points
        </button>
      </div>
    </div>
  );
}
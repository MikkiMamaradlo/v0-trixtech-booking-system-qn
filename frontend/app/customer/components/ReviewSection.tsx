'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp } from 'lucide-react';

interface Review {
  _id: string;
  userId: { name: string };
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
  isVerified: boolean;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

interface ReviewSectionProps {
  serviceId: string;
}

export default function ReviewSection({ serviceId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ averageRating: 0, totalReviews: 0 });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [serviceId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews/service/${serviceId}`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.data.reviews);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId,
          ...newReview,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowReviewForm(false);
        setNewReview({ rating: 5, comment: '' });
        fetchReviews(); // Refresh reviews
      } else {
        setError(data.message || 'Failed to submit review');
      }
    } catch (error) {
      setError('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const markHelpful = async (reviewId: string) => {
    try {
      await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'POST' });
      fetchReviews(); // Refresh to show updated count
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } transition-transform`}
            onClick={interactive ? () => onRatingChange?.(star) : undefined}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-[var(--primary)]">
              {stats.averageRating.toFixed(1)}
            </div>
            {renderStars(Math.round(stats.averageRating))}
            <div className="text-sm text-[var(--muted)] mt-1">
              {stats.totalReviews} reviews
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="btn-primary"
        >
          Write a Review
        </button>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          <form onSubmit={submitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              {renderStars(newReview.rating, true, (rating) =>
                setNewReview({ ...newReview, rating })
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Comment</label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                className="input-field"
                rows={4}
                placeholder="Share your experience with this service..."
                required
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted)]">
            No reviews yet. Be the first to review this service!
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold">{review.userId.name}</span>
                    {review.isVerified && (
                      <span className="badge-success text-xs">Verified</span>
                    )}
                    <span className="text-sm text-[var(--muted)]">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-[var(--foreground)] mb-3">{review.comment}</p>
                  <button
                    onClick={() => markHelpful(review._id)}
                    className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Helpful ({review.helpful})
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
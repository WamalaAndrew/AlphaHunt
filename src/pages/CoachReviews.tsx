import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ArrowLeft, Star, Send } from 'lucide-react';
import { AlphaLogo } from '../components/AlphaLogo';
import { NotificationBadge } from '../components/NotificationBadge';
import { handleFirestoreError, OperationType } from '../contexts/AuthContext';

interface Review {
  id: string;
  coachId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export default function CoachReviews() {
  const { coachId } = useParams<{ coachId: string }>();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachName, setCoachName] = useState('Coach');

  // New review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (coachId) {
      fetchReviews();
      fetchCoachName();
    }
  }, [coachId]);

  const fetchCoachName = async () => {
    try {
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', coachId)));
      if (!userDoc.empty) {
        setCoachName(userDoc.docs[0].data().displayName || 'Coach');
      }
    } catch (e) {
      console.error("Error fetching coach details", e);
    }
  };

  const fetchReviews = async () => {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('coachId', '==', coachId)
      );
      const querySnapshot = await getDocs(q);
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      
      // Sort in memory by newest first
      reviewsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setReviews(reviewsData);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !coachId || !comment.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        coachId,
        reviewerId: user.uid,
        reviewerName: user.displayName || 'Anonymous User',
        rating,
        comment,
        createdAt: serverTimestamp()
      });
      
      setComment('');
      setRating(5);
      fetchReviews();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reviews');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white shadow-sm border-b border-slate-200 p-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <NotificationBadge />
          <button 
            onClick={() => navigate('/coaches')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl hidden sm:block">
              <AlphaLogo className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Reviews for {coachName}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 md:p-12">
        {user && user.uid !== coachId && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Leave a Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star 
                        className={`w-8 h-8 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Your Review</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this coach..."
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Submitting...' : <><Send className="w-4 h-4" /> Submit Review</>}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 mb-6">All Reviews ({reviews.length})</h3>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No reviews yet</h3>
              <p className="text-slate-500">Be the first to leave a review for {coachName}.</p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-900">{review.reviewerName}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Recently'}
                  </span>
                </div>
                <p className="text-slate-700">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

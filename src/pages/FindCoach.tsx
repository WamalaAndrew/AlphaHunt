import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Users, ArrowLeft, Star, MessageSquare, Calendar, Clock, CreditCard, X, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlphaLogo } from '../components/AlphaLogo';
import { handleFirestoreError, OperationType } from '../contexts/AuthContext';
import { NotificationBadge } from '../components/NotificationBadge';

interface CoachProfile {
  uid: string;
  title: string;
  bio: string;
  services: string[];
  pricing: string;
  linkedinUrl?: string;
  availability?: string;
  testimonials?: string[];
  displayName?: string; // We'll need to fetch this from the users collection
  photoURL?: string;
}

export default function FindCoach() {
  const { user, userProfile } = useAuth();
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Booking Modal State
  const [selectedCoach, setSelectedCoach] = useState<CoachProfile | null>(null);
  const [selectedService, setSelectedService] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCoaches();
    }
  }, [user]);

  const fetchCoaches = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'coachProfiles'));
      const querySnapshot = await getDocs(q);
      
      const coachesData = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let displayName = 'Career Coach';
        let photoURL = '';
        
        try {
          const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', docSnap.id)));
          if (!userDoc.empty) {
            displayName = userDoc.docs[0].data().displayName || displayName;
            photoURL = userDoc.docs[0].data().photoURL || '';
          }
        } catch (e) {
          console.error("Error fetching user details for coach", e);
        }

        return {
          uid: docSnap.id,
          ...data,
          displayName,
          photoURL
        } as CoachProfile;
      }));

      coachesData.sort((a, b) => {
        const timeA = (a as any).updatedAt?.toMillis ? (a as any).updatedAt.toMillis() : 0;
        const timeB = (b as any).updatedAt?.toMillis ? (b as any).updatedAt.toMillis() : 0;
        return timeB - timeA;
      });

      setCoaches(coachesData);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'coachProfiles');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCoach) return;

    setIsBooking(true);

    try {
      // Bypass payment for now (marketing phase)
      
      // Save confirmed booking to Firestore
      await addDoc(collection(db, 'bookings'), {
        coachId: selectedCoach.uid,
        seekerId: user.uid,
        seekerName: userProfile?.displayName || 'A user',
        service: selectedService,
        date: bookingDate,
        time: bookingTime,
        status: 'confirmed', // Auto-confirm for now
        createdAt: serverTimestamp()
      });

      // Send notification to coach
      await addDoc(collection(db, 'notifications'), {
        userId: selectedCoach.uid,
        title: 'New Session Booked!',
        message: `${userProfile?.displayName || 'A user'} has booked a ${selectedService} session with you on ${bookingDate} at ${bookingTime}.`,
        read: false,
        type: 'booking_confirmed',
        createdAt: serverTimestamp()
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedCoach(null);
      }, 3000);

    } catch (error: any) {
      console.error("Booking error:", error);
      alert(`Failed to process booking: ${error.message}`);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] font-sans">
      <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <NotificationBadge />
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl hidden sm:block">
              <AlphaLogo className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Coach Marketplace</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Find Your Career Coach</h2>
          <p className="text-slate-500 mt-2 font-medium">Connect with experienced professionals who can guide your career journey.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 mt-4">Loading coaches...</p>
          </div>
        ) : coaches.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No coaches available yet</h3>
            <p className="text-slate-500 mt-1">Check back soon as we onboard new professionals.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coaches.map(coach => (
              <div key={coach.uid} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-5">
                  {coach.photoURL || coach.userPhotoURL ? (
                    <img src={coach.photoURL || coach.userPhotoURL} alt={coach.displayName} className="w-16 h-16 rounded-full border border-slate-200 object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xl">
                      {coach.displayName?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{coach.displayName}</h3>
                    <p className="text-sm text-amber-600 font-medium">{coach.title}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="font-medium">Top Rated</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-slate-600 text-sm mb-6 line-clamp-3 flex-1 leading-relaxed">{coach.bio}</p>
                
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Services</h4>
                  <ul className="text-sm text-slate-700 space-y-2">
                    {coach.services?.slice(0, 3).map((service, idx) => (
                      <li key={idx} className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                        <span className="truncate font-medium">{service}</span>
                      </li>
                    ))}
                    {coach.services && coach.services.length > 3 && (
                      <li className="text-xs text-slate-400 italic pl-4">+ {coach.services.length - 3} more</li>
                    )}
                  </ul>
                </div>

                {coach.availability && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Availability
                    </h4>
                    <p className="text-sm text-slate-700 font-medium">{coach.availability}</p>
                  </div>
                )}

                {coach.testimonials && coach.testimonials.length > 0 && (
                  <div className="mb-6 bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" /> Client Feedback
                    </h4>
                    <p className="text-sm text-slate-700 italic line-clamp-2">"{coach.testimonials[0]}"</p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-100">
                  <span className="text-base font-bold text-slate-900">{coach.pricing}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/messages?userId=${coach.uid}&name=${encodeURIComponent(coach.displayName || 'Coach')}&role=coach`)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      title="Message Coach"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => navigate(`/coach/${coach.uid}/reviews`)}
                      className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-colors"
                      title="View Reviews"
                    >
                      <Star className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedCoach(coach);
                        setSelectedService(coach.services?.[0] || '');
                      }}
                      className="premium-button px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      Book Session
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {selectedCoach && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Book Session with {selectedCoach.displayName}</h3>
              <button 
                onClick={() => !isBooking && !bookingSuccess && setSelectedCoach(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                disabled={isBooking || bookingSuccess}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Booking Confirmed!</h4>
                  <p className="text-slate-600">Your session has been booked and payment was successful. Notifications have been sent.</p>
                </div>
              ) : (
                <form onSubmit={handleBookSession} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Service</label>
                    <select 
                      required
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {selectedCoach.services?.map((service, idx) => (
                        <option key={idx} value={service}>{service}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> Date
                      </label>
                      <input 
                        type="date" 
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Time
                      </label>
                      <input 
                        type="time" 
                        required
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" /> Payment Information
                    </h4>
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-4 flex justify-between items-center">
                      <span className="text-sm font-medium text-emerald-800">Special Offer:</span>
                      <span className="font-bold text-emerald-700 text-lg">Free (Limited Time)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Payment is currently waived for our promotional period. Enjoy your session!</p>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={isBooking}
                      className="w-full premium-button px-4 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isBooking ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Booking Session...
                        </>
                      ) : (
                        `Book Session Now`
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

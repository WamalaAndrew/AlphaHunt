import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Users, ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlphaLogo } from '../components/AlphaLogo';
import { NotificationBadge } from '../components/NotificationBadge';

export default function CoachProfile() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Profile data
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [services, setServices] = useState('');
  const [pricing, setPricing] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'coachProfiles', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title || '');
        setBio(data.bio || '');
        setServices(data.services?.join('\n') || '');
        setPricing(data.pricing || '');
        setLinkedinUrl(data.linkedinUrl || '');
      }
    } catch (error) {
      console.error("Error fetching coach profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setSuccess(false);
    
    try {
      const docRef = doc(db, 'coachProfiles', user.uid);
      const docSnap = await getDoc(docRef);
      
      const servicesArray = services.split('\n').filter(s => s.trim() !== '');
      
      if (docSnap.exists()) {
        await setDoc(docRef, {
          uid: user.uid,
          title,
          bio,
          services: servicesArray,
          pricing,
          linkedinUrl,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await setDoc(docRef, {
          uid: user.uid,
          title,
          bio,
          services: servicesArray,
          pricing,
          linkedinUrl,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving coach profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#062016]/5 font-sans selection:bg-[#bef264] selection:text-[#062016]">
      <header className="bg-[#062016] border-b border-white/10 p-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-[#bef264] p-2 rounded-xl hidden sm:block">
              <AlphaLogo className="w-5 h-5 text-[#062016]" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Coach Profile</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBadge />
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 md:p-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-[#062016] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 mt-4 font-medium">Loading profile...</p>
          </div>
        ) : userProfile?.role !== 'coach' ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-[#062016]/10 shadow-sm">
            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-2xl font-extrabold text-[#062016] tracking-tight">Access Denied</h3>
            <p className="text-slate-500 mt-2 font-medium">You must be registered as a coach to view this page.</p>
          </div>
        ) : (
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-[#062016]/10">
            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-[#062016] tracking-tight">Manage Your Services</h2>
              <p className="text-slate-500 mt-2 font-medium">Update your profile to attract more job seekers.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Professional Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#bef264] outline-none font-medium" placeholder="e.g. Senior Career Coach & HR Consultant" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bio</label>
                <textarea required value={bio} onChange={e => setBio(e.target.value)} rows={4} className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#bef264] outline-none font-medium resize-none" placeholder="Tell job seekers about your experience and how you can help them..."></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Services Offered (One per line)</label>
                <textarea required value={services} onChange={e => setServices(e.target.value)} rows={4} className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#bef264] outline-none font-medium resize-none" placeholder="- CV Review & Rewrite&#10;- 1-on-1 Mock Interview&#10;- Career Strategy Session"></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pricing Information</label>
                  <input type="text" required value={pricing} onChange={e => setPricing(e.target.value)} className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#bef264] outline-none font-medium" placeholder="e.g. Starting at UGX 50,000/hr" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">LinkedIn URL (Optional)</label>
                  <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#bef264] outline-none font-medium" placeholder="https://linkedin.com/in/yourprofile" />
                </div>
              </div>

              <div className="pt-6 flex items-center justify-end gap-6">
                {success && (
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                    <CheckCircle className="w-5 h-5" /> Saved successfully
                  </span>
                )}
                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-[#062016] text-white px-10 py-3.5 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-[#062016]/10 flex items-center gap-2 disabled:opacity-70"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

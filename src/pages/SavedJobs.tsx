import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Briefcase, Building, MapPin, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlphaLogo } from '../components/AlphaLogo';
import { NotificationBadge } from '../components/NotificationBadge';
import { Spinner } from '../components/Spinner';
import { Button } from '@/components/ui/button';

export default function SavedJobs() {
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchSavedJobs();
    }
  }, [user]);

  const fetchSavedJobs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'savedJobs'), where('userId', '==', user?.uid));
      const querySnapshot = await getDocs(q);
      const jobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedJobs(jobs);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSavedJob = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'savedJobs', id));
      setSavedJobs(savedJobs.filter(job => job.id !== id));
    } catch (error) {
      console.error('Error removing saved job:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="rounded-full w-10 h-10 p-0"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl hidden sm:block">
              <AlphaLogo className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Saved Jobs</h1>
          </div>
        </div>
        <NotificationBadge />
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Your Saved Jobs</h2>
          <p className="text-slate-500 mt-2 font-medium">Jobs you have bookmarked for later.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-10 h-10" />
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="text-center py-16 card p-12">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No saved jobs</h3>
            <p className="text-slate-500 mt-1">You haven't saved any jobs yet.</p>
            <Button 
              onClick={() => navigate('/jobs')}
              className="mt-6 premium-button"
            >
              Browse Jobs
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {savedJobs.map(job => (
              <div 
                key={job.id} 
                onClick={() => {
                  if (job.isLocal) {
                    navigate(`/jobs/${job.jobId}`);
                  } else if (job.url) {
                    window.open(job.url, '_blank');
                  }
                }}
                className="card p-6 md:p-8 hover:border-slate-300 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">{job.jobTitle}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600 font-medium">
                      <span className="flex items-center gap-1.5"><Building className="w-4 h-4 text-slate-400" /> {job.company}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {job.location}</span>
                      <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-sm font-medium">
                        <Briefcase className="w-4 h-4 text-slate-500" /> {job.type}
                      </span>
                    </div>
                  </div>
                  <Button 
                    onClick={(e) => handleRemoveSavedJob(job.id, e)}
                    variant="ghost"
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2"
                    title="Remove Saved Job"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

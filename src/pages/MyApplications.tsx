import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, where, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Briefcase, ArrowLeft, CheckCircle, Clock, XCircle, FileText, Link as LinkIcon, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlphaLogo } from '../components/AlphaLogo';
import { handleFirestoreError, OperationType } from '../contexts/AuthContext';
import { NotificationBadge } from '../components/NotificationBadge';

interface Application {
  id: string;
  jobId: string;
  seekerId: string;
  employerId: string;
  status: string;
  createdAt: any;
  jobTitle?: string;
  companyName?: string;
  cvUrl?: string;
  coverLetter?: string;
}

export default function MyApplications() {
  const { user, userProfile } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'status'>('date-desc');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, [userProfile]);

  const fetchApplications = async () => {
    if (!user || !userProfile) return;

    try {
      let q;
      if (userProfile.role === 'employer') {
        q = query(collection(db, 'applications'), where('employerId', '==', user.uid));
      } else {
        q = query(collection(db, 'applications'), where('seekerId', '==', user.uid));
      }
      
      const querySnapshot = await getDocs(q);
      const appsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Application, 'id'>)
      })) as Application[];
      
      setApplications(appsData);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'applications');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId: string, newStatus: string, seekerId: string, jobTitle: string = 'a job') => {
    setUpdatingStatus(appId);
    try {
      const appRef = doc(db, 'applications', appId);
      await updateDoc(appRef, { status: newStatus });
      
      // Create notification for the seeker
      await addDoc(collection(db, 'notifications'), {
        userId: seekerId,
        title: 'Application Status Updated',
        message: `Your application for ${jobTitle} has been marked as ${newStatus}.`,
        read: false,
        createdAt: serverTimestamp(),
        type: 'application_update',
        link: '/applications'
      });

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === appId ? { ...app, status: newStatus } : app
      ));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `applications/${appId}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const toggleExpand = (appId: string) => {
    setExpandedApps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  const sortedApplications = [...applications].sort((a, b) => {
    if (sortBy === 'date-desc') {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    } else if (sortBy === 'date-asc') {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeA - timeB;
    } else if (sortBy === 'status') {
      return (a.status || '').localeCompare(b.status || '');
    }
    return 0;
  });

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'shortlisted':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-rose-600" />;
      case 'viewed':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-amber-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'shortlisted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'viewed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
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
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                {userProfile?.role === 'employer' ? 'Manage Applications' : 'My Applications'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-slate-900">
            {userProfile?.role === 'employer' ? 'Received Applications' : 'Your Applications'}
          </h2>
          
          {!loading && applications.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm font-medium text-slate-600">Sort by:</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="status">Status</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 mt-4">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No applications found</h3>
            <p className="text-slate-500">
              {userProfile?.role === 'employer' 
                ? "You haven't received any applications yet." 
                : "You haven't applied to any jobs yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sortedApplications.map(app => {
              const isExpanded = expandedApps.has(app.id);
              return (
                <div key={app.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-6 hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">{app.jobTitle || 'Job Application'}</h3>
                    <p className="text-slate-600 font-medium">{app.companyName || 'Company'}</p>
                    <p className="text-xs text-slate-400 mt-1.5 mb-4 uppercase tracking-wider font-medium">
                      Applied on {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString() : 'Recently'}
                    </p>
                    
                    {(app.cvUrl || app.coverLetter) && (
                      <div className="mt-4">
                        <button 
                          onClick={() => toggleExpand(app.id)}
                          className="flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                        
                        {isExpanded && (
                          <div className="mt-4 space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                              {userProfile?.role === 'employer' ? 'Applicant Details' : 'Your Application Details'}
                            </h4>
                            {app.cvUrl && (
                              <a 
                                href={app.cvUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 bg-white px-4 py-2.5 rounded-xl border border-slate-200 transition-colors shadow-sm"
                              >
                                <LinkIcon className="w-4 h-4" /> View CV / Resume
                              </a>
                            )}
                            {app.coverLetter && (
                              <div className="mt-3">
                                <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                  <FileText className="w-4 h-4" /> Cover Letter
                                </p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap bg-white p-4 rounded-xl border border-slate-200 leading-relaxed">
                                  {app.coverLetter}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-3 items-start sm:items-end">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${getStatusColor(app.status)}`}>
                      {getStatusIcon(app.status)}
                      <span className="font-bold capitalize">{app.status || 'Pending'}</span>
                    </div>
                    
                    {userProfile?.role === 'employer' && (
                      <div className="flex flex-col gap-2 w-full sm:w-auto mt-2">
                        <label className="sr-only">Update Status</label>
                        <select
                          disabled={updatingStatus === app.id}
                          value={app.status || 'pending'}
                          onChange={(e) => handleUpdateStatus(app.id, e.target.value, app.seekerId, app.jobTitle)}
                          className="w-full sm:w-auto border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="viewed">Viewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button
                          onClick={() => navigate(`/messages?userId=${app.seekerId}&name=Candidate&role=seeker`)}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" /> Message
                        </button>
                      </div>
                    )}
                    
                    {userProfile?.role !== 'employer' && app.jobId && (
                      <button
                        onClick={() => navigate(`/chat?feature=interview&jobId=${app.jobId}`)}
                        className="mt-2 text-sm text-amber-600 hover:text-amber-700 font-bold hover:underline"
                      >
                        Prepare for Interview
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, MessageSquare, Search, LogOut, ChevronRight, Users, Bell, Settings, AlertTriangle, Sparkles, Menu, X, Home } from 'lucide-react';
import { AlphaLogo } from '../components/AlphaLogo';
import { NotificationBadge } from '../components/NotificationBadge';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useState, useEffect } from 'react';
import Feed from '../components/Feed';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [verificationSent, setVerificationSent] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfilePromptDismissed, setIsProfilePromptDismissed] = useState(false);

  useEffect(() => {
    if (user && userProfile) {
      const hasSeenWelcome = sessionStorage.getItem(`welcome_${user.uid}`);
      if (!hasSeenWelcome) {
        toast.success(`Welcome back, ${user.displayName || userProfile.displayName || 'User'}! 👋`);
        sessionStorage.setItem(`welcome_${user.uid}`, 'true');
      }
    }
  }, [user, userProfile]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleResendVerification = async () => {
    if (user) {
      try {
        await sendEmailVerification(user);
        setVerificationSent(true);
      } catch (error) {
        console.error("Error sending verification email:", error);
        alert("Failed to send verification email. Please try again later.");
      }
    }
  };

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role: e.target.value
      });
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleFeatureClick = (featureId: string) => {
    if (featureId === 'home') {
      navigate('/');
    } else if (featureId === 'jobs') {
      navigate('/jobs');
    } else if (featureId === 'saved-jobs') {
      navigate('/saved-jobs');
    } else if (featureId === 'applications') {
      navigate('/applications');
    } else if (featureId === 'coaches') {
      navigate('/coaches');
    } else if (featureId === 'coach-profile') {
      navigate('/coach-profile');
    } else if (featureId === 'admin') {
      navigate('/admin');
    } else if (featureId === 'cv') {
      navigate('/cv-builder');
    } else if (featureId === 'messages') {
      navigate('/messages');
    } else if (featureId === 'settings') {
      navigate('/settings');
    } else {
      navigate(`/chat?feature=${encodeURIComponent(featureId)}`);
    }
  };

  const seekerFeatures = [
    { id: 'home', icon: <Home className="w-5 h-5" />, title: 'Home Page', description: 'Return to the main landing page.' },
    { id: 'jobs', icon: <Search className="w-5 h-5" />, title: 'Find Jobs', description: 'Browse and apply for jobs across East Africa.' },
    { id: 'saved-jobs', icon: <Briefcase className="w-5 h-5" />, title: 'Saved Jobs', description: 'View jobs you have saved for later.' },
    { id: 'applications', icon: <Briefcase className="w-5 h-5" />, title: 'My Applications', description: 'Track the status of jobs you have applied for.' },
    { id: 'cv', icon: <FileText className="w-5 h-5" />, title: 'AI CV Builder', description: 'Create a professional CV tailored to employers.' },
    { id: 'messages', icon: <MessageSquare className="w-5 h-5" />, title: 'Messages', description: 'Chat directly with employers.' },
    { id: 'interview', icon: <Sparkles className="w-5 h-5" />, title: 'AI Career Coach', description: 'Practice interviews and get instant career advice.' },
    { id: 'coaches', icon: <Users className="w-5 h-5" />, title: 'Human Coaches (Beta)', description: 'Book sessions with verified career coaches.' },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, title: 'Settings', description: 'Update your profile and preferences.' },
  ];

  const coachFeatures = [
    { id: 'home', icon: <Home className="w-5 h-5" />, title: 'Home Page', description: 'Return to the main landing page.' },
    { id: 'coach-profile', icon: <Users className="w-5 h-5" />, title: 'Manage Profile', description: 'Update your bio, services, and pricing.' },
    { id: 'bookings', icon: <Briefcase className="w-5 h-5" />, title: 'Manage Bookings', description: 'View and manage your upcoming coaching sessions.' },
    { id: 'messages', icon: <MessageSquare className="w-5 h-5" />, title: 'Messages', description: 'Chat with your clients and leads.' },
    { id: 'earnings', icon: <FileText className="w-5 h-5" />, title: 'Earnings & Payouts', description: 'Track your income and request payouts.' },
    { id: 'advice', icon: <MessageSquare className="w-5 h-5" />, title: 'BrighterMonday AI', description: 'Get AI advice on how to grow your coaching business.' },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, title: 'Settings', description: 'Update your profile and preferences.' },
  ];

  const employerFeatures = [
    { id: 'home', icon: <Home className="w-5 h-5" />, title: 'Home Page', description: 'Return to the main landing page.' },
    { id: 'jobs', icon: <Briefcase className="w-5 h-5" />, title: 'Employer Dashboard', description: 'Post new jobs and manage existing listings.' },
    { id: 'applications', icon: <Users className="w-5 h-5" />, title: 'View Applicants', description: 'Review candidates who applied to your jobs.' },
    { id: 'messages', icon: <MessageSquare className="w-5 h-5" />, title: 'Messages', description: 'Chat directly with candidates.' },
    { id: 'advice', icon: <MessageSquare className="w-5 h-5" />, title: 'BrighterMonday AI', description: 'Get AI help writing job descriptions and interview questions.' },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, title: 'Settings', description: 'Update your profile and preferences.' },
  ];

  const adminFeatures = [
    { id: 'home', icon: <Home className="w-5 h-5" />, title: 'Home Page', description: 'Return to the main landing page.' },
    { id: 'admin', icon: <Users className="w-5 h-5" />, title: 'User Management', description: 'View and manage all registered users on the platform.' },
    { id: 'jobs', icon: <Briefcase className="w-5 h-5" />, title: 'Job Board Overview', description: 'Monitor all job postings across the platform.' },
    { id: 'coaches', icon: <Search className="w-5 h-5" />, title: 'Coach Directory', description: 'Review all registered career coaches.' },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, title: 'Settings', description: 'Update your profile and preferences.' },
  ];

  let features = seekerFeatures;
  if (userProfile?.role === 'coach') features = coachFeatures;
  if (userProfile?.role === 'employer') features = employerFeatures;
  if (userProfile?.role === 'admin') features = adminFeatures;

  const getMissingFields = () => {
    if (!userProfile) return [];
    const missing = [];
    if (userProfile.role === 'seeker') {
      if (!userProfile.skills || userProfile.skills.length === 0) {
        missing.push({ field: 'skills', message: 'Add your top 3 skills' });
      }
      if (!userProfile.bio) {
        missing.push({ field: 'bio', message: 'Write a detailed career summary' });
      }
    } else if (userProfile.role === 'coach' || userProfile.role === 'employer') {
      if (!userProfile.bio) {
        missing.push({ field: 'bio', message: 'Add a professional bio' });
      }
    }
    return missing;
  };

  const missingFields = getMissingFields();
  const isProfileComplete = missingFields.length === 0;
  const missingMessages = missingFields.map(m => m.message);

  return (
    <div className="min-h-screen bg-[#062016]/5 font-sans selection:bg-[#bef264] selection:text-[#062016]">
      {user && !user.emailVerified && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-800 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Please verify your email address to access all features.</span>
          </div>
          {verificationSent ? (
            <span className="font-medium text-amber-700">Verification email sent!</span>
          ) : (
            <button 
              onClick={handleResendVerification}
              className="font-semibold underline hover:text-amber-900 transition-colors"
            >
              Resend verification email
            </button>
          )}
        </div>
      )}
      {!isProfileComplete && !isProfilePromptDismissed && (
        <div className="bg-[#bef264]/10 border-b border-[#bef264]/20 px-4 py-3 text-[#062016] flex flex-col sm:flex-row items-center justify-center gap-3 text-sm relative">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#062016]/60" />
            <span>
              Complete your profile: <strong>{missingMessages.join(' and ')}</strong> to leverage our AI features more effectively!
            </span>
          </div>
          <button 
            onClick={() => navigate(userProfile?.role === 'coach' ? '/coach-profile' : '/settings')}
            className="font-bold underline hover:text-black transition-colors"
          >
            Complete Profile
          </button>
          <button 
            onClick={() => setIsProfilePromptDismissed(true)}
            className="absolute right-4 p-1 hover:bg-[#062016]/5 rounded-full transition-colors hidden sm:block"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsProfilePromptDismissed(true)}
            className="mt-2 text-xs text-[#062016]/60 underline sm:hidden"
          >
            Dismiss
          </button>
        </div>
      )}
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-[#062016]/80 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white z-[70] lg:hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 bg-[#062016] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#bef264] p-2 rounded-xl">
                    <AlphaLogo className="w-5 h-5 text-[#062016]" />
                  </div>
                  <h2 className="text-lg font-bold text-white">BrighterMonday</h2>
                </div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-[#bef264]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Profile Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {userProfile?.photoURL || user?.photoURL ? (
                      <img src={userProfile?.photoURL || user.photoURL} alt="Profile" className="w-12 h-12 rounded-full border-2 border-[#062016]/10" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#062016] text-[#bef264] flex items-center justify-center font-bold text-xl">
                        {user?.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-[#062016] text-lg leading-tight">{user?.displayName || 'User'}</h3>
                      <p className="text-xs font-bold text-[#062016]/40 uppercase tracking-widest">{userProfile?.role || 'seeker'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Your Role</p>
                    <div className="bg-[#062016]/5 rounded-xl p-3 border border-[#062016]/10">
                      <p className="w-full bg-transparent text-[#062016] text-sm font-bold capitalize">
                        {userProfile?.role === 'seeker' ? 'Job Seeker' : 
                         userProfile?.role === 'coach' ? 'Career Coach' : 
                         userProfile?.role === 'employer' ? 'Employer' : 
                         userProfile?.role === 'admin' ? 'Admin' : 'Job Seeker'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-4">Navigation</p>
                  {features.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => {
                        handleFeatureClick(feature.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-[#062016]/5 text-[#062016] transition-all group"
                    >
                      <div className="p-2 rounded-xl bg-[#062016]/5 group-hover:bg-[#bef264] transition-colors">
                        {feature.icon}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm">{feature.title}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 ml-auto text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-[#062016]/5">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-[#062016] text-white font-bold hover:bg-black transition-all shadow-lg shadow-[#062016]/10"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <header className="bg-[#062016] border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors text-[#bef264]"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="bg-[#bef264] p-2 rounded-xl hidden sm:block">
            <AlphaLogo className="w-6 h-6 text-[#062016]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">BrighterMonday</h1>
            <p className="text-xs text-[#bef264] font-bold tracking-wide uppercase">Premium Job Board</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/settings')}
            className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors"
            title="Profile Settings"
          >
            <Settings className="w-4 h-4 text-white/40" />
            <span className="text-white text-sm font-medium capitalize">
              {userProfile?.role === 'seeker' ? 'Job Seeker' : 
               userProfile?.role === 'coach' ? 'Career Coach' : 
               userProfile?.role === 'employer' ? 'Employer' : 
               userProfile?.role === 'admin' ? 'Admin' : 'Job Seeker'}
            </span>
          </button>
          <div className="hidden md:flex items-center gap-2">
            {userProfile?.photoURL || user?.photoURL ? (
              <img src={userProfile?.photoURL || user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#bef264] text-[#062016] flex items-center justify-center font-bold text-xs">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-xs text-[#bef264] uppercase tracking-wider leading-none mb-0.5">{userProfile?.role || 'User'}</span>
              <span className="font-bold text-sm text-white capitalize leading-none">{user?.displayName || user?.email?.split('@')[0]}</span>
            </div>
          </div>
          <NotificationBadge />
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/60 hover:text-white px-2 py-2 rounded-lg text-sm transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Hidden on mobile, shown in sidebar menu instead */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-[#062016]/10 overflow-hidden">
              <div className="h-24 bg-[#062016] relative">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #bef264 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
              </div>
              <div className="px-6 pb-6 relative">
                <div className="absolute -top-10 left-6">
                  {userProfile?.photoURL || user?.photoURL ? (
                    <img src={userProfile?.photoURL || user.photoURL} alt="Profile" className="w-20 h-20 rounded-full border-4 border-white object-cover bg-white shadow-md" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-20 h-20 rounded-full border-4 border-white bg-[#bef264] flex items-center justify-center text-[#062016] font-bold text-2xl shadow-md">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="mt-16">
                  <p className="text-[10px] font-bold text-[#062016]/60 uppercase tracking-[0.2em] mb-1">{userProfile?.role || 'Job Seeker'}</p>
                  <h2 className="text-2xl font-extrabold text-[#062016] capitalize tracking-tight leading-tight">
                    {user?.displayName || 'Welcome!'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-2 font-medium truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#062016]/10 p-5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-5 px-2">Navigation</h3>
              <div className="space-y-1.5">
                {features.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => handleFeatureClick(feature.id)}
                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-[#bef264]/10 text-left transition-all group border border-transparent hover:border-[#bef264]/20"
                  >
                    <div className="text-slate-400 group-hover:text-[#062016] transition-colors">
                      {feature.icon}
                    </div>
                    <span className="font-semibold text-sm text-slate-700 group-hover:text-[#062016]">{feature.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Feed Area */}
          <div className="lg:col-span-6">
            {userProfile?.role === 'employer' && (
              <div className="mb-6 bg-[#062016] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg border border-white/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#bef264]/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold tracking-tight mb-1">Welcome back, <span className="capitalize">{user?.displayName?.split(' ')[0] || 'Employer'}</span>!</h2>
                  <p className="text-slate-400 text-sm font-medium">Manage your job postings and find the best talent for your team.</p>
                </div>
              </div>
            )}
            <Feed />
          </div>

          {/* Right Sidebar - Trending/Suggestions */}
          <div className="lg:col-span-3 hidden lg:block space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-[#062016]/10 p-6">
              <h3 className="font-bold text-lg text-[#062016] mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#bef264]" />
                BrighterMonday AI
              </h3>
              <div className="space-y-4">
                <div className="bg-[#062016]/5 rounded-xl p-4 border border-[#062016]/5">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <strong className="text-[#062016] block mb-1">Pro Tip:</strong> 
                    {missingFields.length > 0 
                      ? `Complete your profile: ${missingMessages.join(' and ')} to improve your matches.`
                      : "Your profile is complete! Keep it up-to-date to ensure you get the best recommendations."}
                  </p>
                </div>
                <button 
                  onClick={() => navigate(`/cv-builder`)}
                  className="w-full bg-[#bef264] text-[#062016] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#a3e635] transition-all shadow-lg shadow-[#bef264]/10"
                >
                  Improve my CV with AI
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

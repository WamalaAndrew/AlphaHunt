import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp, query } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { Briefcase, Plus, Search, MapPin, DollarSign, Building, ArrowLeft, Filter, CheckCircle, Bell, Sparkles, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlphaLogo } from '../components/AlphaLogo';
import { handleFirestoreError, OperationType } from '../contexts/AuthContext';
import { fetchRealJobs, Job } from '../services/jobService';

import { NotificationBadge } from '../components/NotificationBadge';

export default function JobBoard() {
  const { user, userProfile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('london');

  useEffect(() => {
    fetchJobs();
  }, []);

  // Job Alert state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertSkills, setAlertSkills] = useState('');
  const [alertLocation, setAlertLocation] = useState('');
  const [alertIndustry, setAlertIndustry] = useState('');
  const [alertType, setAlertType] = useState('All');
  const [alertSuccess, setAlertSuccess] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [skills, setSkills] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [industry, setIndustry] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [type, setType] = useState('Full-time');

  const [filterType, setFilterType] = useState('All');
  const [filterSkills, setFilterSkills] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Fetch Firestore jobs
      const q = query(collection(db, 'jobs'));
      const querySnapshot = await getDocs(q);
      const firestoreJobs = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          isLocal: true
        }))
        .filter((job: any) => job.status !== 'pending_payment') as any[];

      // Fetch Adzuna jobs
      const realJobs = await fetchRealJobs(searchQuery, filterLocation, 'gb'); // You can make this dynamic if needed
      
      // Combine and sort
      const allJobs = [...firestoreJobs, ...realJobs].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      
      setJobs(allJobs);
      
      // Generate AI suggestions if user is a seeker
      if (userProfile?.role === 'seeker' && allJobs.length > 0) {
        generateAiSuggestions(allJobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAiSuggestions = async (allJobs: any[]) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        You are an expert career advisor. I have a job seeker profile and a list of available jobs.
        Recommend the top 2 jobs that best match the seeker's skills and bio.
        Return ONLY a JSON array of objects, where each object has 'jobId' and 'reason' (a short 1-sentence explanation).
        
        Seeker Skills: ${userProfile?.skills?.join(', ') || 'Not specified'}
        Seeker Bio: ${userProfile?.bio || 'Not specified'}
        
        Available Jobs:
        ${allJobs.slice(0, 20).map(j => `ID: ${j.id}, Title: ${j.title}, Skills/Reqs: ${j.skills?.join(', ') || j.description.substring(0, 100)}`).join('\n\n')}
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      let rankedData = [];
      try {
        const text = response.text || '[]';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          rankedData = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse Gemini response for job suggestions", e);
      }
      
      const suggestions = rankedData.map((rank: any) => {
        const job = allJobs.find(j => j.id === rank.jobId);
        return job ? { ...job, matchReason: rank.reason } : null;
      }).filter(Boolean);
      
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
    }
  };

  const handleSaveJob = async (job: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const savedJobData: any = {
        userId: user.uid,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        isLocal: job.isLocal || false,
        savedAt: serverTimestamp()
      };
      
      if (job.url) {
        savedJobData.url = job.url;
      }
      
      await addDoc(collection(db, 'savedJobs'), savedJobData);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'savedJobs');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsProcessingPayment(true);
    try {
      const reqArray = requirements.split('\n').filter(r => r.trim() !== '');
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s !== '');
      
      const docRef = await addDoc(collection(db, 'jobs'), {
        employerId: user.uid,
        title,
        company,
        location,
        description,
        requirements: reqArray,
        skills: skillsArray,
        companySize,
        industry,
        salaryRange,
        type,
        status: 'active',
        createdAt: serverTimestamp()
      });
      
      // Trigger job alerts
      try {
        const alertsSnapshot = await getDocs(collection(db, 'jobAlerts'));
        alertsSnapshot.forEach(async (alertDoc) => {
          const alert = alertDoc.data();
          if (alert.userId === user.uid) return; // Don't notify the employer
          
          let matches = true;
          if (alert.location && !location.toLowerCase().includes(alert.location.toLowerCase())) matches = false;
          if (alert.industry && !industry.toLowerCase().includes(alert.industry.toLowerCase())) matches = false;
          if (alert.type && alert.type !== 'All' && type !== alert.type) matches = false;
          
          if (alert.skills && alert.skills.length > 0) {
            const hasSkill = alert.skills.some((s: string) => 
              skillsArray.map(sk => sk.toLowerCase()).includes(s.toLowerCase()) ||
              description.toLowerCase().includes(s.toLowerCase())
            );
            if (!hasSkill) matches = false;
          }
          
          if (matches) {
            await addDoc(collection(db, 'notifications'), {
              userId: alert.userId,
              type: 'job_alert',
              title: 'New Job Match!',
              message: `${company} just posted a ${title} role that matches your alert.`,
              link: `/jobs/${docRef.id}`,
              read: false,
              createdAt: serverTimestamp()
            });
          }
        });
      } catch (err) {
        console.error("Error checking alerts:", err);
      }
      
      setShowPostForm(false);
      // Reset form
      setTitle(''); setCompany(''); setLocation(''); setDescription(''); setRequirements(''); setSkills(''); setCompanySize(''); setIndustry(''); setSalaryRange('');
      fetchJobs();
      
      // Show success toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setIsProcessingPayment(false);
    } catch (error) {
      console.error("Failed to post job:", error);
      alert("Failed to post job. Please try again.");
      setIsProcessingPayment(false);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const skillsArray = alertSkills.split(',').map(s => s.trim()).filter(s => s !== '');
      await addDoc(collection(db, 'jobAlerts'), {
        userId: user.uid,
        skills: skillsArray,
        location: alertLocation,
        industry: alertIndustry,
        type: alertType,
        createdAt: serverTimestamp()
      });
      
      setShowAlertModal(false);
      setAlertSkills(''); setAlertLocation(''); setAlertIndustry(''); setAlertType('All');
      setAlertSuccess(true);
      setTimeout(() => setAlertSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'jobAlerts');
    }
  };

  // Filter jobs based on search query, type, and skills
  let filteredJobs = jobs.filter(job => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      job.title.toLowerCase().includes(searchLower) ||
      job.company.toLowerCase().includes(searchLower) ||
      job.location.toLowerCase().includes(searchLower);
      
    const matchesType = filterType === 'All' || job.type === filterType;
    
    const skillsArray = filterSkills.split(',').map(s => s.trim().toLowerCase()).filter(s => s !== '');
    const jobSkills = (job as any).skills ? ((job as any).skills as string[]).map(s => s.toLowerCase()) : [];
    const jobDesc = job.description.toLowerCase();
    
    const matchesSkills = skillsArray.length === 0 || skillsArray.some(skill => 
      jobSkills.includes(skill) || jobDesc.includes(skill)
    );

    return matchesSearch && matchesType && matchesSkills;
  });

  return (
    <div className="min-h-screen bg-[#062016]/5 font-sans relative selection:bg-[#bef264] selection:text-[#062016]">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#bef264] text-[#062016] px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4 font-bold">
          <CheckCircle className="w-5 h-5" />
          <span>Job posted successfully!</span>
        </div>
      )}
      {alertSuccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#bef264] text-[#062016] px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4 font-bold">
          <CheckCircle className="w-5 h-5" />
          <span>Job alert created!</span>
        </div>
      )}

      <header className="bg-[#062016] border-b border-white/10 p-3 md:p-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-[#bef264] p-1.5 md:p-2 rounded-lg md:rounded-xl hidden xs:block">
              <AlphaLogo className="w-4 h-4 md:w-5 md:h-5 text-[#062016]" />
            </div>
            <div>
              <h1 className="text-base md:text-xl font-bold text-white tracking-tight leading-tight">Job Board</h1>
              <p className="text-[10px] md:text-xs text-[#bef264] font-bold tracking-wide uppercase">Find Your Next Role</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <NotificationBadge />
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-12">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#062016] tracking-tight">Latest Opportunities</h2>
            <p className="text-slate-500 mt-1 md:mt-2 font-medium text-sm md:text-base">Discover opportunities or find top talent in East Africa.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              <button 
                onClick={() => setShowPostForm(true)}
                className="flex-1 bg-[#062016] text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-[#062016]/10 text-sm"
              >
                <Plus className="w-4 h-4" /> Post
              </button>
              <button 
                onClick={() => setShowAlertModal(true)}
                className="flex-1 bg-white border border-[#062016]/10 text-[#062016] px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm text-sm"
              >
                <Bell className="w-4 h-4" /> Alert
              </button>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  placeholder="Search jobs..."
                  className="w-full border border-[#062016]/10 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-[#bef264] outline-none bg-white text-sm"
                />
              </div>
              <button type="submit" className="bg-[#bef264] text-[#062016] px-5 py-2.5 rounded-xl font-bold hover:bg-[#a3e635] transition-all text-sm">Search</button>
            </form>
          </div>
        </div>

        {/* Post Job Form */}
        {showPostForm && (
          <div className="fixed inset-0 bg-[#062016]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl my-8 border border-white/10">
              <h3 className="text-3xl font-extrabold text-[#062016] mb-6 tracking-tight">Post a New Job</h3>
              <form onSubmit={handlePostJob} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Job Title</label>
                    <input type="text" placeholder="e.g. Senior Developer" value={title} onChange={e => setTitle(e.target.value)} className="border border-[#062016]/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-[#bef264] outline-none" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Company</label>
                    <input type="text" placeholder="e.g. AlphaHunt" value={company} onChange={e => setCompany(e.target.value)} className="border border-[#062016]/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-[#bef264] outline-none" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Location</label>
                  <input type="text" placeholder="e.g. Kampala, Uganda" value={location} onChange={e => setLocation(e.target.value)} className="border border-[#062016]/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-[#bef264] outline-none" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Description</label>
                  <textarea placeholder="Tell us about the role..." value={description} onChange={e => setDescription(e.target.value)} className="border border-[#062016]/10 rounded-xl px-4 py-3 w-full h-24 focus:ring-2 focus:ring-[#bef264] outline-none" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Requirements</label>
                  <textarea placeholder="One requirement per line..." value={requirements} onChange={e => setRequirements(e.target.value)} className="border border-[#062016]/10 rounded-xl px-4 py-3 w-full h-24 focus:ring-2 focus:ring-[#bef264] outline-none" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Skills</label>
                  <input type="text" placeholder="e.g. React, Node.js, Python" value={skills} onChange={e => setSkills(e.target.value)} className="border border-[#062016]/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-[#bef264] outline-none" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Company Size</label>
                    <input type="text" placeholder="e.g. 10-50 employees" value={companySize} onChange={e => setCompanySize(e.target.value)} className="border border-[#062016]/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-[#bef264] outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Industry</label>
                    <input type="text" placeholder="e.g. Technology" value={industry} onChange={e => setIndustry(e.target.value)} className="border border-[#062016]/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-[#bef264] outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Salary Range</label>
                    <input type="text" placeholder="e.g. $2k - $4k / month" value={salaryRange} onChange={e => setSalaryRange(e.target.value)} className="border border-[#062016]/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-[#bef264] outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Job Type</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="border border-[#062016]/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-[#bef264] outline-none appearance-none bg-white cursor-pointer">
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button type="button" onClick={() => setShowPostForm(false)} disabled={isProcessingPayment} className="px-6 py-3 text-slate-500 hover:text-[#062016] font-bold transition-colors disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={isProcessingPayment} className="bg-[#062016] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-[#062016]/10 disabled:opacity-70 flex items-center gap-2">
                    {isProcessingPayment && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    {isProcessingPayment ? 'Posting Job...' : 'Post Job'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-[#062016]/10 shadow-sm mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                placeholder="e.g. Uganda, Kampala"
                className="w-full border border-[#062016]/10 rounded-xl pl-9 pr-4 py-2 focus:ring-2 focus:ring-[#bef264] outline-none text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Job Type</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-[#062016]/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#bef264] outline-none appearance-none bg-white cursor-pointer text-sm"
            >
              <option value="All">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Skills</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={filterSkills}
                onChange={(e) => setFilterSkills(e.target.value)}
                placeholder="e.g. React, Node"
                className="w-full border border-[#062016]/10 rounded-xl pl-9 pr-4 py-2 focus:ring-2 focus:ring-[#bef264] outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* AI Suggestions Section */}
        {aiSuggestions.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-[#bef264]/20 p-1.5 rounded-lg">
                <Sparkles className="w-5 h-5 text-[#062016]" />
              </div>
              <h3 className="text-xl font-bold text-[#062016] tracking-tight">AI Recommended for You</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {aiSuggestions.map(job => (
                <div 
                  key={job.id} 
                  onClick={() => navigate(`/jobs/${job.id}`, { state: { job } })}
                  className="bg-gradient-to-br from-[#bef264]/10 to-white p-6 rounded-2xl border border-[#bef264]/20 hover:border-[#bef264] transition-all cursor-pointer shadow-sm group"
                >
                  <h4 className="font-bold text-[#062016] mb-1 text-lg group-hover:text-black">{job.title}</h4>
                  <p className="text-sm text-slate-500 mb-4 font-medium">{job.company} • {job.location}</p>
                  <div className="bg-white/80 p-3 rounded-xl text-sm text-[#062016] font-semibold border border-[#bef264]/10 leading-relaxed">
                    {job.matchReason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-[#062016] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 mt-4 font-bold uppercase tracking-widest text-xs">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-[#062016]/10 shadow-sm">
            <Briefcase className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-2xl font-extrabold text-[#062016] tracking-tight">No jobs found</h3>
            <p className="text-slate-500 mt-2 font-medium">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {filteredJobs.map(job => (
              <div 
                key={job.id} 
                onClick={() => navigate(`/jobs/${job.id}`, { state: { job } })}
                className="bg-white p-5 md:p-8 rounded-[2rem] border border-[#062016]/5 hover:border-[#bef264]/50 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-xl hover:shadow-[#062016]/5"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4 md:mb-6">
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-extrabold text-[#062016] group-hover:text-black transition-colors tracking-tight leading-tight">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs md:text-sm text-slate-500 font-bold">
                      <span className="flex items-center gap-1.5"><Building className="w-4 h-4 text-slate-400" /> {job.company}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {job.location}</span>
                      <span className="flex items-center gap-1.5 bg-[#062016]/5 px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-extrabold text-[#062016] uppercase tracking-wider">
                        <Briefcase className="w-3.5 h-3.5" /> {job.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                    {job.salaryRange && (
                      <span className="flex items-center gap-1.5 text-[#062016] font-extrabold bg-[#bef264] px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm whitespace-nowrap shadow-lg shadow-[#bef264]/20">
                        <DollarSign className="w-3.5 h-3.5" /> {job.salaryRange}
                      </span>
                    )}
                    <button 
                      onClick={(e) => handleSaveJob(job, e)}
                      className="p-2.5 text-slate-300 hover:text-[#062016] hover:bg-[#bef264]/10 rounded-xl transition-all"
                      title="Save Job"
                    >
                      <Bookmark className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-600 line-clamp-2 mb-6 md:mb-8 text-sm md:text-base leading-relaxed font-medium">{job.description}</p>
                <div className="flex justify-between items-center pt-4 md:pt-6 border-t border-[#062016]/5">
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}</span>
                  <span className="text-[#062016] font-extrabold text-xs md:text-sm opacity-0 md:opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 translate-x-4 group-hover:translate-x-0">
                    View Details <ArrowLeft className="w-4 h-4 rotate-180" />
                  </span>
                  <span className="md:hidden text-[#062016] font-extrabold text-xs flex items-center gap-1">
                    Details <ArrowLeft className="w-3 h-3 rotate-180" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Job Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-[#062016]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-white/10">
            <h3 className="text-3xl font-extrabold text-[#062016] mb-2 tracking-tight">Create Job Alert</h3>
            <p className="text-slate-500 mb-8 font-medium">Get notified when new jobs match your criteria.</p>
            
            <form onSubmit={handleCreateAlert} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Skills</label>
                <input 
                  type="text" 
                  value={alertSkills} 
                  onChange={(e) => setAlertSkills(e.target.value)}
                  placeholder="e.g., React, Node.js, Marketing"
                  className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#bef264]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Location</label>
                <input 
                  type="text" 
                  value={alertLocation} 
                  onChange={(e) => setAlertLocation(e.target.value)}
                  placeholder="e.g., Kampala, Remote"
                  className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#bef264]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Industry</label>
                <input 
                  type="text" 
                  value={alertIndustry} 
                  onChange={(e) => setAlertIndustry(e.target.value)}
                  placeholder="e.g., Technology, Finance"
                  className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#bef264]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Job Type</label>
                <select 
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                  className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#bef264] appearance-none bg-white cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setShowAlertModal(false)}
                  className="px-6 py-3 text-slate-500 hover:text-[#062016] font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-[#062016] text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-[#062016]/10"
                >
                  Create Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

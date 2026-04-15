import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '../services/uploadService';
import { ArrowLeft, Building, MapPin, DollarSign, Briefcase, Clock, CheckCircle, Upload, Sparkles, MessageSquare, Plus } from 'lucide-react';
import { AlphaLogo } from '../components/AlphaLogo';
import { handleFirestoreError, OperationType } from '../contexts/AuthContext';
import { NotificationBadge } from '../components/NotificationBadge';
import { GoogleGenAI } from '@google/genai';

interface Job {
  id: string;
  employerId?: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements?: string[];
  salaryRange?: string;
  type: string;
  createdAt: any;
  isLocal?: boolean;
  url?: string;
}

export default function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  
  // Apply Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [cvUrl, setCvUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  
  // AI Smart Matching State
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [matchingCandidates, setMatchingCandidates] = useState<any[]>([]);
  const [findingMatches, setFindingMatches] = useState(false);
  
  // CV Upload State
  const [uploadingCv, setUploadingCv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const location = useLocation();
  const stateJob = location.state?.job;

  useEffect(() => {
    if (user && jobId) {
      if (stateJob) {
        setJob(stateJob);
        setLoading(false);
      } else {
        fetchJobDetails();
      }
      checkIfApplied();
    }
  }, [user, jobId, stateJob]);

  const handleFindMatches = async () => {
    if (!job) return;
    
    setFindingMatches(true);
    setShowMatchingModal(true);
    try {
      // 1. Fetch all seekers
      const q = query(collection(db, 'users'), where('role', '==', 'seeker'));
      const querySnapshot = await getDocs(q);
      const seekers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (seekers.length === 0) {
        setMatchingCandidates([]);
        return;
      }

      // 2. Use Gemini to rank them
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        You are an expert technical recruiter. I have a job description and a list of candidates.
        Rank the candidates based on how well their skills and bio match the job requirements.
        Return ONLY a JSON array of objects, where each object has 'candidateId' and 'matchScore' (0-100) and 'reason' (a short 1-sentence explanation).
        
        Job Title: ${job.title}
        Job Requirements: ${job.requirements ? job.requirements.join(', ') : job.description.substring(0, 500)}
        
        Candidates:
        ${seekers.map(s => `ID: ${s.id}, Name: ${(s as any).displayName}, Skills: ${(s as any).skills?.join(', ')}, Bio: ${(s as any).bio}`).join('\n\n')}
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      // Parse JSON
      let rankedData = [];
      try {
        const text = response.text || '[]';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          rankedData = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse Gemini response", e);
      }
      
      // Merge with seeker data
      const matchedSeekers = rankedData.map((rank: any) => {
        const seeker = seekers.find(s => s.id === rank.candidateId);
        return { ...seeker, matchScore: rank.matchScore, matchReason: rank.reason };
      }).filter((s: any) => s.displayName).sort((a: any, b: any) => b.matchScore - a.matchScore);
      
      setMatchingCandidates(matchedSeekers);
    } catch (error) {
      console.error("Error finding matches:", error);
      alert("Failed to find matches. Please try again.");
    } finally {
      setFindingMatches(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!job || !userProfile) return;
    
    setGeneratingCoverLetter(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        You are an expert career coach helping a job seeker write a cover letter.
        
        Job Title: ${job.title}
        Company: ${job.company}
        Job Description: ${job.description}
        Job Requirements: ${job.requirements ? job.requirements.join(', ') : 'See description'}
        
        Candidate Name: ${userProfile.displayName || 'Candidate'}
        Candidate Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
        Candidate Bio: ${userProfile.bio || 'Not specified'}
        
        Write a professional, concise, and compelling cover letter tailored to this specific job and candidate. 
        Keep it under 300 words. Do not include placeholder brackets like [Date] or [Address], just write the body of the letter and sign off with the candidate's name.
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      if (response.text) {
        setCoverLetter(response.text);
      }
    } catch (error) {
      console.error("Error generating cover letter:", error);
      alert("Failed to generate cover letter. Please try again.");
    } finally {
      setGeneratingCoverLetter(false);
    }
  };

  const fetchJobDetails = async () => {
    if (!jobId) return;
    try {
      const docRef = doc(db, 'jobs', jobId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setJob({ id: docSnap.id, ...docSnap.data() } as Job);
      } else {
        console.error("No such job!");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `jobs/${jobId}`);
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    if (!user || !jobId) return;
    try {
      const q = query(
        collection(db, 'applications'), 
        where('jobId', '==', jobId),
        where('seekerId', '==', user.uid)
      );
      const existing = await getDocs(q);
      setHasApplied(!existing.empty);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'applications');
    }
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !job || userProfile?.role !== 'seeker') return;

    setUploadingCv(true);
    try {
      const downloadUrl = await uploadToCloudinary(file);
      
      setCvUrl(downloadUrl);
      alert("CV uploaded successfully! You can now submit your application.");
    } catch (error) {
      console.error("Error uploading CV:", error);
      alert("Failed to upload CV. Please check your Cloudinary configuration.");
    } finally {
      setUploadingCv(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !job || userProfile?.role !== 'seeker') return;
    
    setApplying(true);
    try {
      await addDoc(collection(db, 'applications'), {
        jobId: job.id,
        seekerId: user.uid,
        seekerName: user.displayName || 'Anonymous Candidate',
        seekerEmail: user.email || '',
        employerId: job.employerId,
        jobTitle: job.title,
        companyName: job.company,
        status: 'pending',
        cvUrl: cvUrl.trim() || null,
        coverLetter: coverLetter.trim() || null,
        createdAt: serverTimestamp()
      });
      
      setHasApplied(true);
      setShowApplyModal(false);
      alert("Application submitted successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'applications');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Job not found</h2>
        <button onClick={() => navigate('/jobs')} className="text-amber-600 hover:underline">
          Return to Job Board
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#062016]/5 font-sans pb-12 selection:bg-[#bef264] selection:text-[#062016]">
      <header className="bg-[#062016] border-b border-white/10 p-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/jobs')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-[#bef264] p-2 rounded-xl hidden sm:block">
              <AlphaLogo className="w-5 h-5 text-[#062016]" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Job Details</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBadge />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 mt-6">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-[#062016]/5 overflow-hidden">
          {/* Header Section */}
          <div className="p-6 md:p-10 border-b border-[#062016]/5">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#062016] mb-4 tracking-tight">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-slate-500 font-bold">
                  <span className="flex items-center gap-1.5 text-[#062016]">
                    <Building className="w-5 h-5 text-slate-400" /> {job.company}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-5 h-5 text-slate-400" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1.5 bg-[#062016]/5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-[#062016] uppercase tracking-wider">
                    <Briefcase className="w-4 h-4" /> {job.type}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest">
                    <Clock className="w-4 h-4 text-slate-300" /> 
                    Posted {job.createdAt?.toDate ? job.createdAt.toDate().toLocaleDateString() : 'Recently'}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 w-full lg:w-auto">
                {(!job.isLocal && job.url) ? (
                  <a 
                    href={job.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-[#062016] text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-[#062016]/10 hover:bg-black inline-flex items-center justify-center gap-2"
                  >
                    Apply Externally <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                ) : userProfile?.role === 'seeker' && (
                  hasApplied ? (
                    <div className="flex items-center justify-center gap-2 bg-[#bef264]/20 text-[#062016] px-8 py-4 rounded-2xl font-bold border border-[#bef264]/30">
                      <CheckCircle className="w-5 h-5" />
                      Already Applied
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-3">
                      <button 
                        onClick={() => setShowApplyModal(true)}
                        className="bg-[#062016] text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-[#062016]/10 hover:bg-black"
                      >
                        Apply Now
                      </button>
                      
                      <button 
                        onClick={() => navigate(`/messages?userId=${job.employerId}&name=${encodeURIComponent(job.company)}&role=employer`)}
                        className="bg-white hover:bg-slate-50 text-[#062016] border border-[#062016]/10 px-6 py-4 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-5 h-5" />
                        Message Employer
                      </button>
                    </div>
                  )
                )}
                
                {userProfile?.role === 'employer' && job.employerId === user?.uid && (
                  <button 
                    onClick={handleFindMatches}
                    className="w-full bg-[#bef264] text-[#062016] px-6 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-[#bef264]/20 hover:bg-[#a3e635] flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Find Matching Candidates
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 md:p-10 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-10">
              <section>
                <h2 className="text-2xl font-extrabold text-[#062016] mb-4 tracking-tight">Job Description</h2>
                <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">
                  {job.description}
                </div>
              </section>

              {job.requirements && job.requirements.length > 0 && (
                <section>
                  <h2 className="text-2xl font-extrabold text-[#062016] mb-4 tracking-tight">Requirements</h2>
                  <ul className="space-y-4">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-4 text-slate-600 font-medium">
                        <div className="w-2 h-2 rounded-full bg-[#bef264] mt-2 flex-shrink-0 shadow-sm shadow-[#bef264]/50"></div>
                        <span className="leading-relaxed">{req.replace(/^- /, '')}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-[#062016]/5 rounded-[2rem] p-8 border border-[#062016]/5 shadow-sm">
                <h3 className="text-lg font-bold text-[#062016] mb-6 tracking-tight">Job Overview</h3>
                <div className="space-y-6">
                  {job.salaryRange && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Salary Range</p>
                      <p className="font-extrabold text-[#062016] flex items-center gap-1.5 text-lg">
                        <DollarSign className="w-5 h-5 text-[#bef264]" /> {job.salaryRange}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Job Type</p>
                    <p className="font-bold text-[#062016]">{job.type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Location</p>
                    <p className="font-bold text-[#062016]">{job.location}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-[#062016]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/10">
            <div className="p-8 border-b border-[#062016]/5 flex justify-between items-center">
              <h2 className="text-2xl font-extrabold text-[#062016] tracking-tight">Apply for {job.title}</h2>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-300 hover:text-[#062016] transition-colors">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleApplySubmit} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">CV / Resume</label>
                <p className="text-xs text-slate-500 mb-2">Provide a link or upload your CV directly.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="url" 
                    value={cvUrl} 
                    onChange={(e) => setCvUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 border border-[#062016]/10 rounded-xl p-3.5 focus:ring-2 focus:ring-[#bef264] outline-none font-medium"
                  />
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleCvUpload} 
                    accept=".pdf,.doc,.docx" 
                    className="hidden" 
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingCv}
                    className="bg-[#062016]/5 hover:bg-[#062016]/10 text-[#062016] px-6 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70 whitespace-nowrap"
                  >
                    {uploadingCv ? (
                      <div className="w-5 h-5 border-2 border-[#062016] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                    {uploadingCv ? 'Uploading...' : 'Upload File'}
                  </button>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Cover Letter (Optional)</label>
                  <button 
                    type="button"
                    onClick={handleGenerateCoverLetter}
                    disabled={generatingCoverLetter}
                    className="text-xs flex items-center gap-1.5 text-[#062016] hover:text-black font-bold disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 text-[#bef264]" />
                    {generatingCoverLetter ? 'Generating...' : 'Generate with AI'}
                  </button>
                </div>
                <textarea 
                  value={coverLetter} 
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={6}
                  placeholder="Why are you a great fit for this role?"
                  className="w-full border border-[#062016]/10 rounded-xl p-3.5 focus:ring-2 focus:ring-[#bef264] outline-none font-medium resize-none"
                ></textarea>
              </div>
              
              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowApplyModal(false)}
                  className="px-6 py-3 text-slate-500 font-bold hover:text-[#062016] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={applying}
                  className="bg-[#062016] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#062016]/10 hover:bg-black flex items-center justify-center gap-2"
                >
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Matching Modal */}
      {showMatchingModal && (
        <div className="fixed inset-0 bg-[#062016]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/10">
            <div className="p-8 border-b border-[#062016]/5 flex justify-between items-center bg-[#062016]/5">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-[#062016]" />
                <h2 className="text-2xl font-extrabold text-[#062016] tracking-tight">AI Candidate Matches</h2>
              </div>
              <button onClick={() => setShowMatchingModal(false)} className="text-slate-300 hover:text-[#062016] transition-colors">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1">
              {findingMatches ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-[#062016] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-[#062016] font-bold">Analyzing candidate profiles...</p>
                </div>
              ) : matchingCandidates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 font-medium">No candidates found to match.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matchingCandidates.map((candidate) => (
                    <div key={candidate.id} className="border border-[#062016]/10 rounded-2xl p-5 hover:border-[#bef264] transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#062016]/5 flex items-center justify-center text-[#062016] font-extrabold text-lg border border-[#062016]/10">
                            {candidate.displayName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#062016] text-lg group-hover:text-black transition-colors">{candidate.displayName}</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{candidate.skills?.slice(0, 3).join(', ')}</p>
                          </div>
                        </div>
                        <div className="bg-[#bef264] text-[#062016] px-4 py-1.5 rounded-xl text-xs font-extrabold shadow-lg shadow-[#bef264]/20">
                          {candidate.matchScore}% Match
                        </div>
                      </div>
                      <div className="bg-[#062016]/5 rounded-xl p-4 mt-4 text-sm text-slate-700 font-medium leading-relaxed border border-[#062016]/5">
                        <strong className="text-[#062016] block mb-1">AI Analysis:</strong> {candidate.matchReason}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button 
                          onClick={() => navigate(`/messages?userId=${candidate.id}&name=${encodeURIComponent(candidate.displayName || 'Candidate')}&role=seeker`)}
                          className="bg-white hover:bg-[#062016]/5 text-[#062016] border border-[#062016]/10 px-4 py-2 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Message Candidate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Plus, Trash2, Sparkles, Download, FileText } from 'lucide-react';
import { AlphaLogo } from '../components/AlphaLogo';
import { NotificationBadge } from '../components/NotificationBadge';
import { GoogleGenAI } from '@google/genai';
import { useReactToPrint } from 'react-to-print';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Spinner } from '../components/Spinner';

interface Experience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  school: string;
  year: string;
}

interface CVData {
  personal: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
  };
  experience: Experience[];
  education: Education[];
  skills: string;
}

export default function CVBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cvRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'education' | 'skills'>('personal');
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);
  
  const [cvData, setCvData] = useState<CVData>({
    personal: {
      fullName: user?.displayName || '',
      email: user?.email || '',
      phone: '',
      location: 'Kampala, Uganda',
      summary: '',
    },
    experience: [
      { id: '1', title: '', company: '', startDate: '', endDate: '', description: '' }
    ],
    education: [
      { id: '1', degree: '', school: '', year: '' }
    ],
    skills: '',
  });

  const handlePrint = useReactToPrint({
    contentRef: cvRef,
    documentTitle: `${cvData.personal.fullName.replace(/\s+/g, '_')}_CV`,
    onPrintError: (error) => console.error("Print error:", error),
  });

  const triggerPrint = () => {
    if (cvRef.current) {
      handlePrint();
    } else {
      console.error("CV content not ready for printing.");
    }
  };

  const handlePersonalChange = (field: string, value: string) => {
    setCvData(prev => ({
      ...prev,
      personal: { ...prev.personal, [field]: value }
    }));
  };

  const handleExperienceChange = (id: string, field: string, value: string) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    }));
  };

  const addExperience = () => {
    setCvData(prev => ({
      ...prev,
      experience: [...prev.experience, { id: Date.now().toString(), title: '', company: '', startDate: '', endDate: '', description: '' }]
    }));
  };

  const removeExperience = (id: string) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const handleEducationChange = (id: string, field: string, value: string) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
    }));
  };

  const addEducation = () => {
    setCvData(prev => ({
      ...prev,
      education: [...prev.education, { id: Date.now().toString(), degree: '', school: '', year: '' }]
    }));
  };

  const removeEducation = (id: string) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const enhanceWithAI = async (type: 'summary' | 'experience' | 'skills', id?: string) => {
    setIsEnhancing(id || type);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let prompt = '';
      if (type === 'summary') {
        prompt = `Rewrite the following professional summary to be more impactful, concise, and tailored for a Ugandan employer. Make it sound professional and action-oriented. Return ONLY the rewritten text, no quotes or intro.\n\nCurrent summary: ${cvData.personal.summary}`;
      } else if (type === 'experience' && id) {
        const exp = cvData.experience.find(e => e.id === id);
        prompt = `Rewrite the following job description bullet points to be more impactful, using strong action verbs and highlighting achievements. Format as a clean bulleted list. Return ONLY the rewritten text.\n\nRole: ${exp?.title}\nCompany: ${exp?.company}\nCurrent description:\n${exp?.description}`;
      } else if (type === 'skills') {
        prompt = `Review the following list of skills. Organize them, remove duplicates, and suggest 2-3 highly relevant professional skills that might be missing based on the current list. Format as a clean, comma-separated list. Return ONLY the final comma-separated list.\n\nCurrent skills: ${cvData.skills}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const enhancedText = response.text || '';

      if (type === 'summary') {
        handlePersonalChange('summary', enhancedText);
      } else if (type === 'experience' && id) {
        handleExperienceChange(id, 'description', enhancedText);
      } else if (type === 'skills') {
        setCvData(prev => ({ ...prev, skills: enhancedText }));
      }
    } catch (error) {
      console.error("Error enhancing with AI:", error);
      alert("Failed to enhance text. Please try again.");
    } finally {
      setIsEnhancing(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#062016]/5 font-sans flex flex-col selection:bg-[#bef264] selection:text-[#062016]">
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
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">AI CV Builder</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => triggerPrint()}
            className="bg-[#bef264] text-[#062016] px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-[#bef264]/20 hover:bg-[#a3e635] flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Form */}
        <div className="w-full lg:w-1/2 flex flex-col border-r border-[#062016]/10 bg-white overflow-y-auto h-[calc(100vh-73px)]">
          <div className="flex border-b border-[#062016]/10 sticky top-0 bg-white z-10 p-2 gap-2">
            {['personal', 'experience', 'education', 'skills'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                  activeTab === tab 
                    ? 'bg-[#062016] text-white shadow-lg shadow-[#062016]/10' 
                    : 'text-slate-400 hover:text-[#062016] hover:bg-[#062016]/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 lg:p-10 space-y-8">
            {activeTab === 'personal' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-extrabold text-[#062016] tracking-tight">Personal Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      type="text" 
                      value={cvData.personal.fullName}
                      onChange={(e) => handlePersonalChange('fullName', e.target.value)}
                      className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#bef264] outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <input 
                      type="email" 
                      value={cvData.personal.email}
                      onChange={(e) => handlePersonalChange('email', e.target.value)}
                      className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#bef264] outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={cvData.personal.phone}
                      onChange={(e) => handlePersonalChange('phone', e.target.value)}
                      className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#bef264] outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location</label>
                    <input 
                      type="text" 
                      value={cvData.personal.location}
                      onChange={(e) => handlePersonalChange('location', e.target.value)}
                      className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#bef264] outline-none font-medium"
                    />
                  </div>
                </div>
                <div className="pt-4 space-y-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Professional Summary</label>
                    <button 
                      onClick={() => enhanceWithAI('summary')}
                      disabled={isEnhancing === 'summary' || !cvData.personal.summary}
                      className="text-xs font-bold text-[#062016] hover:text-black flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isEnhancing === 'summary' ? <Spinner className="w-3 h-3" /> : <Sparkles className="w-3 h-3 text-[#bef264]" />}
                      {isEnhancing === 'summary' ? 'Enhancing...' : 'AI Enhance'}
                    </button>
                  </div>
                  <textarea 
                    value={cvData.personal.summary}
                    onChange={(e) => handlePersonalChange('summary', e.target.value)}
                    rows={4}
                    className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#bef264] outline-none font-medium resize-none"
                    placeholder="Briefly describe your professional background and goals..."
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-extrabold text-[#062016] tracking-tight">Work Experience</h2>
                  <button 
                    onClick={addExperience}
                    className="text-xs font-bold text-[#062016] hover:text-black flex items-center gap-1.5 bg-[#062016]/5 px-3 py-1.5 rounded-lg"
                  >
                    <Plus className="w-4 h-4" /> Add Role
                  </button>
                </div>
                
                {cvData.experience.map((exp) => (
                  <div key={exp.id} className="p-6 border border-[#062016]/10 rounded-[2rem] bg-[#062016]/5 relative group">
                    {cvData.experience.length > 1 && (
                      <button 
                        onClick={() => removeExperience(exp.id)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Job Title</label>
                        <input 
                          type="text" 
                          value={exp.title}
                          onChange={(e) => handleExperienceChange(exp.id, 'title', e.target.value)}
                          className="w-full border border-[#062016]/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#bef264] outline-none bg-white font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Company</label>
                        <input 
                          type="text" 
                          value={exp.company}
                          onChange={(e) => handleExperienceChange(exp.id, 'company', e.target.value)}
                          className="w-full border border-[#062016]/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#bef264] outline-none bg-white font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Jan 2020"
                          value={exp.startDate}
                          onChange={(e) => handleExperienceChange(exp.id, 'startDate', e.target.value)}
                          className="w-full border border-[#062016]/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#bef264] outline-none bg-white font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Present"
                          value={exp.endDate}
                          onChange={(e) => handleExperienceChange(exp.id, 'endDate', e.target.value)}
                          className="w-full border border-[#062016]/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#bef264] outline-none bg-white font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description (Bullet Points)</label>
                        <button 
                          onClick={() => enhanceWithAI('experience', exp.id)}
                          disabled={isEnhancing === exp.id || !exp.description}
                          className="text-xs font-bold text-[#062016] hover:text-black flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3 text-[#bef264]" />
                          {isEnhancing === exp.id ? 'Enhancing...' : 'AI Enhance'}
                        </button>
                      </div>
                      <textarea 
                        value={exp.description}
                        onChange={(e) => handleExperienceChange(exp.id, 'description', e.target.value)}
                        rows={4}
                        className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#bef264] outline-none bg-white resize-none font-medium"
                        placeholder="- Led a team of 5 developers...&#10;- Increased revenue by 20%..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-extrabold text-[#062016] tracking-tight">Education</h2>
                  <button 
                    onClick={addEducation}
                    className="text-xs font-bold text-[#062016] hover:text-black flex items-center gap-1.5 bg-[#062016]/5 px-3 py-1.5 rounded-lg"
                  >
                    <Plus className="w-4 h-4" /> Add Education
                  </button>
                </div>
                
                {cvData.education.map((edu) => (
                  <div key={edu.id} className="p-6 border border-[#062016]/10 rounded-[2rem] bg-[#062016]/5 relative group">
                    {cvData.education.length > 1 && (
                      <button 
                        onClick={() => removeEducation(edu.id)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Degree / Certificate</label>
                        <input 
                          type="text" 
                          value={edu.degree}
                          onChange={(e) => handleEducationChange(edu.id, 'degree', e.target.value)}
                          className="w-full border border-[#062016]/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#bef264] outline-none bg-white font-medium"
                          placeholder="e.g. Bachelor of Science in Computer Science"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">School / University</label>
                        <input 
                          type="text" 
                          value={edu.school}
                          onChange={(e) => handleEducationChange(edu.id, 'school', e.target.value)}
                          className="w-full border border-[#062016]/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#bef264] outline-none bg-white font-medium"
                          placeholder="e.g. Makerere University"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Year</label>
                        <input 
                          type="text" 
                          value={edu.year}
                          onChange={(e) => handleEducationChange(edu.id, 'year', e.target.value)}
                          className="w-full border border-[#062016]/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#bef264] outline-none bg-white font-medium"
                          placeholder="e.g. 2018 - 2022"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-extrabold text-[#062016] tracking-tight">Skills</h2>
                  <button 
                    onClick={() => enhanceWithAI('skills')}
                    disabled={isEnhancing === 'skills' || !cvData.skills}
                    className="text-xs font-bold text-[#062016] hover:text-black flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isEnhancing === 'skills' ? <Spinner className="w-3 h-3" /> : <Sparkles className="w-3 h-3 text-[#bef264]" />}
                    {isEnhancing === 'skills' ? 'Enhancing...' : 'AI Enhance'}
                  </button>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">List your key skills (comma separated)</label>
                  <textarea 
                    value={cvData.skills}
                    onChange={(e) => setCvData(prev => ({ ...prev, skills: e.target.value }))}
                    rows={6}
                    className="w-full border border-[#062016]/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#bef264] outline-none font-medium resize-none"
                    placeholder="e.g. Project Management, Data Analysis, JavaScript, Communication, Leadership..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="w-full lg:w-1/2 bg-[#062016]/5 p-4 md:p-8 overflow-y-auto h-[calc(100vh-73px)] flex justify-center">
          <div 
            ref={cvRef}
            className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-[10mm] md:p-[20mm] font-sans text-[#062016] rounded-sm"
            style={{ boxSizing: 'border-box' }}
          >
            {/* CV Header */}
            <div className="border-b-2 border-[#062016] pb-6 mb-6 text-center">
              <h1 className="text-3xl font-extrabold text-[#062016] uppercase tracking-wider mb-2">
                {cvData.personal.fullName || 'Your Name'}
              </h1>
              <div className="text-sm text-slate-500 font-bold flex flex-wrap justify-center gap-x-4 gap-y-1">
                {cvData.personal.email && <span>{cvData.personal.email}</span>}
                {cvData.personal.phone && <span>• {cvData.personal.phone}</span>}
                {cvData.personal.location && <span>• {cvData.personal.location}</span>}
              </div>
            </div>

            {/* Summary */}
            {cvData.personal.summary && (
              <div className="mb-8">
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">
                  {cvData.personal.summary}
                </p>
              </div>
            )}

            {/* Experience */}
            {cvData.experience.some(exp => exp.title || exp.company) && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-[#062016] uppercase tracking-widest border-b border-[#062016]/10 pb-1 mb-4">
                  Professional Experience
                </h2>
                <div className="space-y-6">
                  {cvData.experience.filter(exp => exp.title || exp.company).map(exp => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-extrabold text-[#062016]">{exp.title}</h3>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          {exp.startDate} {exp.startDate && exp.endDate && '-'} {exp.endDate}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[#062016]/60 italic mb-2">{exp.company}</div>
                      {exp.description && (
                        <div className="text-sm text-slate-700 whitespace-pre-wrap pl-4 font-medium" style={{ textIndent: '-1rem' }}>
                          {exp.description.split('\n').map((line, i) => (
                            line.trim() ? <div key={i} className="mb-1">{line.trim().startsWith('-') ? line : `- ${line}`}</div> : null
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {cvData.education.some(edu => edu.degree || edu.school) && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-[#062016] uppercase tracking-widest border-b border-[#062016]/10 pb-1 mb-4">
                  Education
                </h2>
                <div className="space-y-5">
                  {cvData.education.filter(edu => edu.degree || edu.school).map(edu => (
                    <div key={edu.id} className="flex justify-between items-baseline">
                      <div>
                        <h3 className="font-extrabold text-[#062016]">{edu.degree}</h3>
                        <div className="text-sm font-bold text-[#062016]/60">{edu.school}</div>
                      </div>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{edu.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {cvData.skills && (
              <div>
                <h2 className="text-lg font-bold text-[#062016] uppercase tracking-widest border-b border-[#062016]/10 pb-1 mb-4">
                  Skills
                </h2>
                <div className="text-sm text-slate-700 leading-relaxed font-bold">
                  {cvData.skills.split(',').map(s => s.trim()).filter(Boolean).join(' • ')}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Building2, ChevronRight, Star, ShieldCheck, Zap, LogIn, 
  ArrowRight, Play, CheckCircle2, Users, Briefcase, Globe, MessageSquare,
  Facebook, Twitter, Instagram, Linkedin, Plus, Minus, Sparkles
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AlphaLogo } from '../components/AlphaLogo';
import { motion, AnimatePresence } from 'motion/react';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleAction = () => {
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  const handleCategoryClick = (category: string) => {
    setSearchQuery(category);
    navigate('/login');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const stats = [
    { value: '12k+', label: 'Active job seekers across East Africa looking for their next career move.' },
    { value: '500+', label: 'Verified employers posting high-quality opportunities daily.' },
    { value: '98%', label: 'Success rate in matching candidates with roles using our AI technology.' },
  ];

  const faqs = [
    {
      question: "How does the AI matching work?",
      answer: "BrighterMonday uses Gemini AI to analyze your skills, experience, and preferences. It then compares this data with thousands of job listings to recommend the most relevant opportunities for you."
    },
    {
      question: "Is BrighterMonday free for job seekers?",
      answer: "Yes! Job seekers can browse, apply for jobs, and receive AI recommendations for free. We also offer premium career coaching services for those looking for extra support."
    },
    {
      question: "How can I post a job as an employer?",
      answer: "Employers can create an account, verify their company, and post job listings directly from their dashboard. We offer advanced filtering tools to help you find the best candidates."
    }
  ];

  const jobCategories = ['Designer', 'Web Developer', 'Software Engineer', 'Marketing', 'Sales'];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-[#bef264] selection:text-[#062016]">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto bg-[#062016]/80 backdrop-blur-xl border border-white/10 rounded-3xl md:rounded-full px-4 md:px-6 py-3 flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="bg-[#bef264] p-1.5 rounded-lg">
              <AlphaLogo className="w-5 h-5 text-[#062016]" />
            </div>
            <span className="text-lg md:text-xl font-extrabold text-white tracking-tight">BrighterMonday</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-white/70">
            <button onClick={() => scrollToSection('home')} className="hover:text-[#bef264] transition-colors">Home</button>
            <button onClick={() => scrollToSection('jobs')} className="hover:text-[#bef264] transition-colors">Find Jobs</button>
            <button onClick={() => scrollToSection('candidates')} className="hover:text-[#bef264] transition-colors">Find Candidates</button>
            <button onClick={() => scrollToSection('blog')} className="hover:text-[#bef264] transition-colors">Blog</button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-[#bef264] transition-colors">Contact</button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={handleAction} className="text-sm font-bold text-white/80 hover:text-white transition-colors px-4">Log In</button>
              <button onClick={handleAction} className="bg-[#bef264] text-[#062016] px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#a3e635] transition-all flex items-center gap-2 shadow-lg shadow-[#bef264]/20">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-white/80 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <Minus className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden mt-4 mx-2 bg-[#062016] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex flex-col gap-4">
                <button onClick={() => { scrollToSection('home'); setIsMobileMenuOpen(false); }} className="text-left text-white font-bold py-2 border-b border-white/5">Home</button>
                <button onClick={() => { scrollToSection('jobs'); setIsMobileMenuOpen(false); }} className="text-left text-white font-bold py-2 border-b border-white/5">Find Jobs</button>
                <button onClick={() => { scrollToSection('candidates'); setIsMobileMenuOpen(false); }} className="text-left text-white font-bold py-2 border-b border-white/5">Find Candidates</button>
                <button onClick={() => { scrollToSection('blog'); setIsMobileMenuOpen(false); }} className="text-left text-white font-bold py-2 border-b border-white/5">Blog</button>
                <button onClick={() => { scrollToSection('contact'); setIsMobileMenuOpen(false); }} className="text-left text-white font-bold py-2 border-b border-white/5">Contact</button>
                
                <div className="flex flex-col gap-3 mt-4 sm:hidden">
                  <button onClick={handleAction} className="w-full bg-white/10 text-white py-3 rounded-2xl font-bold">Log In</button>
                  <button onClick={handleAction} className="w-full bg-[#bef264] text-[#062016] py-3 rounded-2xl font-bold">Get Started</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main>
        {/* Hero Section */}
        <section id="home" className="relative min-h-[100svh] flex flex-col pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=60&w=1600" 
              alt="Vibrant Office Community" 
              className="w-full h-full object-cover object-right md:object-center"
              referrerPolicy="no-referrer"
              loading="eager"
            />
            <div className="absolute inset-0 bg-[#062016]/60 md:bg-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-[#062016]/90 via-[#062016]/60 to-[#062016]/90 md:bg-gradient-to-r md:from-[#062016] md:via-[#062016]/80 md:to-transparent"></div>
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 w-full my-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-2 bg-[#bef264]/10 border border-[#bef264]/20 rounded-full px-4 py-2 mb-6"
                >
                  <Sparkles className="w-4 h-4 text-[#bef264]" />
                  <span className="text-[#bef264] text-xs font-bold uppercase tracking-wider">AI-Powered Career Platform</span>
                </motion.div>

                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white mb-6 md:mb-8 tracking-tight leading-[1.1]"
                >
                  Find your dream <br />
                  career in <span className="text-[#bef264]">East Africa</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-lg md:text-xl text-slate-300 mb-8 md:mb-12 max-w-xl font-medium leading-relaxed"
                >
                  The most advanced AI-powered job board for professionals in Uganda and beyond. Get matched with top employers instantly.
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="max-w-2xl"
                >
                  <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-2xl flex flex-col md:flex-row items-center gap-2">
                    <div className="flex-1 flex items-center px-6 w-full">
                      <Search className="w-5 h-5 text-[#bef264] mr-3" />
                      <input 
                        type="text" 
                        placeholder="Job title, skills or company" 
                        className="w-full bg-transparent text-white focus:outline-none placeholder:text-slate-400 font-medium py-3"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="hidden md:flex items-center px-6 border-l border-white/10">
                      <MapPin className="w-5 h-5 text-[#bef264] mr-3" />
                      <select className="bg-transparent text-white focus:outline-none font-medium cursor-pointer py-3">
                        <option className="text-slate-900">Kampala, UG</option>
                        <option className="text-slate-900">Nairobi, KE</option>
                        <option className="text-slate-900">Kigali, RW</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full md:w-auto bg-[#bef264] px-8 py-4 rounded-xl text-[#062016] font-bold hover:bg-[#a3e635] transition-all flex items-center justify-center gap-2">
                      Search
                      <Search className="w-5 h-5" />
                    </button>
                  </form>
                  
                  <div className="mt-6 flex flex-wrap gap-3">
                    <span className="text-slate-400 text-sm font-bold mr-2">Popular:</span>
                    {jobCategories.map((cat) => (
                      <button 
                        key={cat} 
                        onClick={() => handleCategoryClick(cat)}
                        className="text-white/60 hover:text-[#bef264] text-sm font-medium transition-colors bg-white/5 px-3 py-1 rounded-full border border-white/10"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>

              <div className="hidden lg:block relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative z-10"
                >
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-[2.5rem] shadow-2xl">
                    <div className="bg-[#062016] rounded-[2rem] p-8 border border-[#bef264]/20">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="bg-[#bef264] p-3 rounded-2xl">
                          <Users className="w-8 h-8 text-[#062016]" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-xl">12k+ Active Seekers</h3>
                          <p className="text-slate-400 text-sm">Join the growing community</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                              <div className="h-2 w-24 bg-slate-600 rounded"></div>
                            </div>
                            <div className="h-2 w-12 bg-[#bef264]/20 rounded"></div>
                          </div>
                        ))}
                      </div>
                      <button className="w-full mt-8 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all border border-white/10">
                        View Success Stories
                      </button>
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -top-6 -right-6 bg-[#bef264] p-4 rounded-2xl shadow-xl z-20"
                  >
                    <CheckCircle2 className="w-6 h-6 text-[#062016]" />
                  </motion.div>
                  <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl z-20"
                  >
                    <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="py-12 border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-slate-400 text-sm font-bold uppercase tracking-widest mb-8">Trusted by leading companies across East Africa</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale">
              <div className="flex items-center gap-2 font-bold text-xl"><Zap className="w-6 h-6" /> Luminous</div>
              <div className="flex items-center gap-2 font-bold text-xl"><Globe className="w-6 h-6" /> Lightbox</div>
              <div className="flex items-center gap-2 font-bold text-xl"><Building2 className="w-6 h-6" /> FocalPoint</div>
              <div className="flex items-center gap-2 font-bold text-xl"><Users className="w-6 h-6" /> Polymath</div>
              <div className="flex items-center gap-2 font-bold text-xl"><Briefcase className="w-6 h-6" /> Alt+Shift</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 px-6">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#062016] mb-6 leading-tight">
                Streamline hiring with <br /> AI precision
              </h2>
              <p className="text-slate-500 mb-10 leading-relaxed font-medium">
                BrighterMonday's intelligent platform removes the friction from recruiting, connecting top talent with leading companies instantly and accurately.
              </p>
              
              <div className="space-y-8">
                {[
                  { title: 'AI-Powered Matching', desc: 'Our Gemini-powered algorithms analyze your profile to match you with the perfect roles in seconds.' },
                  { title: 'Career Coaching', desc: 'Connect with industry experts to polish your CV, prepare for interviews, and accelerate your growth.' },
                  { title: 'Smart Job Alerts', desc: 'Never miss an opportunity. Set custom alerts based on your skills, location, and preferred industry.' }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="text-xl font-black text-[#062016] opacity-20">0{i+1}.</div>
                    <div>
                      <h4 className="text-lg font-bold text-[#062016] mb-2">{step.title}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-[#062016] rounded-[3rem] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#bef264]/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=60&w=800" 
                  alt="Professionals collaborating" 
                  className="rounded-2xl w-full mb-8 shadow-lg object-cover aspect-[4/3]"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <h3 className="text-2xl font-bold mb-4">Built for ambitious professionals. <span className="text-[#bef264]">Accelerate your career</span> and become an industry leader.</h3>
                <button onClick={handleAction} className="bg-[#bef264] text-[#062016] px-6 py-3 rounded-full font-bold text-sm">Upload Resume</button>
              </div>
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
                <div className="bg-red-500 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg">
                  <Globe className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-12">
              {stats.map((stat, i) => (
                <div key={i} className="space-y-4">
                  <div className="text-5xl font-black text-[#062016]">{stat.value}</div>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Job Listings Section */}
        <section id="jobs" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
              <div>
                <h2 className="text-4xl font-extrabold text-[#062016] mb-4">Featured Opportunities</h2>
                <div className="flex flex-wrap gap-2">
                  {['Designer', 'Web Developer', 'Software Engineer', 'Doctors', 'Marketing'].map((cat) => (
                    <button 
                      key={cat} 
                      onClick={() => handleCategoryClick(cat)}
                      className="px-4 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-[#062016] hover:text-white transition-all"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-slate-100 p-1.5 rounded-full flex items-center gap-2">
                <form onSubmit={handleSearch} className="bg-white px-6 py-2 rounded-full shadow-sm flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search Your Needs" 
                    className="bg-transparent text-sm font-medium focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
                <button onClick={handleSearch} className="bg-[#bef264] p-2.5 rounded-full text-[#062016]">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
                {[
                  { title: 'Senior Product Designer', company: 'Safaricom', location: 'Nairobi, KE', salary: 'KSh 250k - 350k', logo: 'https://picsum.photos/seed/safaricom/100/100' },
                  { title: 'Full Stack Developer', company: 'Andela', location: 'Kigali, RW', salary: '$3k - $5k', logo: 'https://picsum.photos/seed/andela/100/100' },
                  { title: 'Marketing Director', company: 'MTN Group', location: 'Kampala, UG', salary: 'UGX 5M - 8M', logo: 'https://picsum.photos/seed/mtn/100/100' },
                  { title: 'UX Researcher', company: 'Flutterwave', location: 'Remote', salary: '$4k - $6k', logo: 'https://picsum.photos/seed/flutterwave/100/100' },
                  { title: 'Product Manager', company: 'SafeBoda', location: 'Kampala, UG', salary: 'UGX 4M - 6M', logo: 'https://picsum.photos/seed/safeboda/100/100' },
                  { title: 'Data Scientist', company: 'M-KOPA', location: 'Nairobi, KE', salary: 'KSh 300k - 400k', logo: 'https://picsum.photos/seed/mkopa/100/100' },
                ].map((job, i) => (
                  <div key={i} className="card p-6 flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <img src={job.logo} alt={job.company} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" loading="lazy" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{job.location}</span>
                      </div>
                      <h4 className="text-lg font-bold text-[#062016] mb-1 group-hover:text-indigo-600 transition-colors">{job.title}</h4>
                      <p className="text-sm text-slate-500 font-medium mb-4">{job.company}</p>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> 05 Hours Ago</span>
                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> Full Time</span>
                      </div>
                    </div>
                    <div className="mt-8 flex items-center justify-between">
                      <div className="text-sm font-bold text-[#062016]">{job.salary}</div>
                      <button onClick={handleAction} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#bef264] hover:text-[#062016] transition-all">Apply Now</button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-8">
                <div className="bg-[#062016] rounded-3xl p-8 text-white text-center">
                  <h3 className="text-2xl font-bold mb-4">Your Next Great Hire Is Just A Click Away!</h3>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">Post your job today and quickly connect with top talent. Our user-friendly platform streamlines hiring.</p>
                  <button onClick={handleAction} className="bg-[#bef264] text-[#062016] w-full py-3 rounded-full font-bold text-sm">Post Job On BrighterMonday</button>
                </div>
                
                <div className="card p-8">
                  <h3 className="text-lg font-bold text-[#062016] mb-6">Featured Companies</h3>
                  <div className="space-y-6">
                    {[
                      { name: 'Safaricom', loc: 'Nairobi, KE', logo: 'https://picsum.photos/seed/safaricom/40/40' },
                      { name: 'MTN Group', loc: 'Kampala, UG', logo: 'https://picsum.photos/seed/mtn/40/40' },
                      { name: 'Flutterwave', loc: 'Lagos, NG', logo: 'https://picsum.photos/seed/flutterwave/40/40' },
                      { name: 'Andela', loc: 'Kigali, RW', logo: 'https://picsum.photos/seed/andela/40/40' },
                    ].map((comp, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <img src={comp.logo} alt={comp.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                        <div>
                          <h5 className="text-sm font-bold text-[#062016]">{comp.name}</h5>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{comp.loc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <button onClick={handleAction} className="bg-[#bef264] text-[#062016] px-12 py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition-all">Load More</button>
            </div>
          </div>
        </section>

        {/* Profiles Section */}
        <section id="candidates" className="py-32 bg-slate-50 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-16">
              <h2 className="text-4xl font-extrabold text-[#062016] leading-tight">
                Stand out to top <br /> employers instantly
              </h2>
              <button onClick={handleAction} className="bg-[#062016] text-white px-6 py-3 rounded-full font-bold text-sm">Browse Candidates</button>
            </div>
            
            <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar">
              {[
                { name: 'Grace J. Park', role: 'Digital Marketer', img: 'https://picsum.photos/seed/p1/400/500' },
                { name: 'Melissa Sampson', role: 'Digital Marketer', img: 'https://picsum.photos/seed/p2/400/500' },
                { name: 'Lori Schkufza', role: 'Digital Marketer', img: 'https://picsum.photos/seed/p3/400/500' },
                { name: 'Paige Stewart Enslow', role: 'Digital Marketer', img: 'https://picsum.photos/seed/p4/400/500' },
                { name: 'Nina Nesdoly', role: 'Digital Marketer', img: 'https://picsum.photos/seed/p5/400/500' },
              ].map((profile, i) => (
                <div key={i} className="min-w-[280px] group cursor-pointer" onClick={handleAction}>
                  <div className="relative rounded-[2.5rem] overflow-hidden mb-6 aspect-[4/5]">
                    <img src={profile.img} alt={profile.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#062016]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleAction(); }} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white"><Twitter className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleAction(); }} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white"><Linkedin className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                  <h5 className="text-lg font-bold text-[#062016] mb-1">{profile.name}</h5>
                  <p className="text-sm text-slate-500 font-medium">{profile.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-32 px-6 bg-[#fefce8]">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl font-extrabold text-[#062016] mb-4">Why professionals love <br /> BrighterMonday</h2>
            <p className="text-slate-500 font-medium mb-16">Join thousands of job seekers and employers who have transformed <br /> their careers and businesses with our AI platform.</p>
            
            <button onClick={handleAction} className="bg-[#bef264] text-[#062016] px-8 py-3 rounded-full font-bold text-sm mb-20">Read Success Stories</button>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Sarah N.', role: 'HR Director, TechCorp', text: 'BrighterMonday reduced our time-to-hire by 40%. The AI matching is incredibly accurate.' },
                { name: 'David K.', role: 'Senior Developer', text: 'I found my dream job within a week of creating my profile. The career coach feature was a game-changer.' },
                { name: 'Grace M.', role: 'Startup Founder', text: 'As a growing startup, finding the right talent quickly is crucial. BrighterMonday delivered beyond our expectations.' },
                { name: 'James O.', role: 'Marketing Manager', text: 'The platform is intuitive, and the quality of opportunities is unmatched in the region.' },
              ].map((t, i) => (
                <div key={i} className="bg-white rounded-3xl p-8 text-left shadow-sm border border-slate-100">
                  <p className="text-slate-600 text-sm leading-relaxed mb-8 italic">"{t.text}"</p>
                  <div className="flex items-center gap-4">
                    <img src={`https://picsum.photos/seed/u${i}/40/40`} alt={t.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                    <div>
                      <h6 className="text-sm font-bold text-[#062016]">{t.name}</h6>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section id="blog" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
              <div>
                <h2 className="text-4xl font-extrabold text-[#062016] mb-4">Resources that Help you <br /> Hire with Intention</h2>
                <div className="flex gap-4">
                  <button onClick={handleAction} className="text-slate-400 font-bold text-sm hover:text-[#062016]">Guides</button>
                  <button onClick={handleAction} className="bg-[#062016] text-white px-4 py-1 rounded-full text-sm font-bold">Articles</button>
                </div>
              </div>
              <p className="text-slate-500 text-sm font-medium max-w-xs">Not an expert? No worries! We've got guides and articles packed with hiring best practices and tips.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'How AI is Transforming Recruitment in East Africa', date: 'Oct 12, 2024', time: '5 min read', img: 'https://picsum.photos/seed/tech1/600/400' },
                { title: '5 Skills Top Employers are Looking for in 2025', date: 'Oct 08, 2024', time: '7 min read', img: 'https://picsum.photos/seed/tech2/600/400' },
                { title: 'Mastering the Remote Interview: A Complete Guide', date: 'Sep 28, 2024', time: '6 min read', img: 'https://picsum.photos/seed/tech3/600/400' },
              ].map((blog, i) => (
                <div key={i} className="group cursor-pointer" onClick={handleAction}>
                  <div className="rounded-[2.5rem] overflow-hidden mb-6 aspect-[4/3]">
                    <img src={blog.img} alt={blog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" loading="lazy" />
                  </div>
                  <h4 className="text-xl font-bold text-[#062016] mb-3 group-hover:text-indigo-600 transition-colors">{blog.title}</h4>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{blog.date}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{blog.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section className="py-32 px-6 bg-[#062016]">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
            <div className="bg-[#062016] rounded-[3rem] p-12 text-white relative overflow-hidden cursor-pointer" onClick={handleAction}>
              <div className="absolute top-10 right-10 bg-[#bef264] p-4 rounded-full text-[#062016] rotate-[-45deg]">
                <ArrowRight className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-bold mb-12">Integrations with your <br /> Favorite Apps</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  'https://picsum.photos/seed/slack/100/100',
                  'https://picsum.photos/seed/zoom/100/100',
                  'https://picsum.photos/seed/google/100/100',
                  'https://picsum.photos/seed/notion/100/100',
                  'https://picsum.photos/seed/figma/100/100',
                  'https://picsum.photos/seed/github/100/100'
                ].map((imgUrl, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center justify-center">
                    <img src={imgUrl} alt="Integration" className="w-12 h-12 rounded-xl object-cover opacity-90 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <span className="bg-white/10 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 inline-block border border-white/20">Workflow</span>
              <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight">Seamlessly integrates <br /> with your tools</h2>
              <p className="text-slate-300 font-medium mb-10 leading-relaxed">Connect BrighterMonday with the apps your team already uses. From communication to project management, we've got you covered.</p>
              <button onClick={handleAction} className="bg-[#bef264] text-[#062016] px-8 py-3 rounded-full font-bold text-sm shadow-lg hover:bg-[#a3e635] transition-colors">View Integrations</button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-32 px-6 bg-slate-50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-[#062016] mb-4">Frequently Asked Questions</h2>
              <p className="text-slate-500 font-medium">Everything you need to know about the platform. Can't find the answer you're looking for? Feel free to contact our support team.</p>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <button 
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full px-8 py-6 flex justify-between items-center text-left"
                  >
                    <span className="font-bold text-[#062016]">{faq.question}</span>
                    {activeFaq === i ? <Minus className="w-5 h-5 text-[#bef264]" /> : <Plus className="w-5 h-5 text-slate-400" />}
                  </button>
                  <AnimatePresence>
                    {activeFaq === i && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-8 pb-6"
                      >
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Community Vibe Section */}
        <section className="py-24 px-6 bg-white text-[#062016] overflow-hidden relative">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative z-10"
              >
                <div className="inline-flex items-center gap-2 bg-[#bef264]/20 border border-[#bef264]/40 rounded-full px-4 py-2 mb-6">
                  <Sparkles className="w-4 h-4 text-[#062016]" />
                  <span className="text-[#062016] text-xs font-bold uppercase tracking-wider">The BrighterMonday Vibe</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight text-[#062016]">
                  More than just a job board. <br />
                  <span className="text-[#062016]/50">It's a community.</span>
                </h2>
                <p className="text-lg text-slate-600 mb-8 font-medium leading-relaxed max-w-lg">
                  Join thousands of professionals who are building their careers, sharing knowledge, and celebrating wins together. We believe that finding your dream job should be an exciting journey, not a stressful task.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-4">
                    <img src="https://picsum.photos/seed/user1/100/100" alt="User" className="w-12 h-12 rounded-full border-2 border-white" referrerPolicy="no-referrer" loading="lazy" />
                    <img src="https://picsum.photos/seed/user2/100/100" alt="User" className="w-12 h-12 rounded-full border-2 border-white" referrerPolicy="no-referrer" loading="lazy" />
                    <img src="https://picsum.photos/seed/user3/100/100" alt="User" className="w-12 h-12 rounded-full border-2 border-white" referrerPolicy="no-referrer" loading="lazy" />
                  </div>
                  <div className="text-sm font-bold">
                    <span className="text-[#062016]">10,000+</span><br />
                    <span className="text-slate-500">Active Members</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-[#062016]/10 relative">
                  <img 
                    src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=60&w=800" 
                    alt="Community Vibe" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#062016]/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div>
                      <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold inline-block mb-2">
                        🎉 Celebrating a new hire!
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -bottom-6 -left-6 bg-[#bef264] text-[#062016] p-6 rounded-3xl shadow-xl max-w-[200px] hidden md:block">
                  <div className="text-3xl font-black mb-1">98%</div>
                  <div className="text-sm font-bold leading-tight">of our users report a positive hiring experience.</div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-32 px-6 bg-[#062016]">
          <div className="max-w-7xl mx-auto bg-[#062016] rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute top-10 left-10 w-24 h-24 bg-pink-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#bef264]/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex justify-center mb-8">
                <div className="bg-white p-4 rounded-full shadow-xl">
                  <Globe className="w-8 h-8 text-[#062016]" />
                </div>
              </div>
              <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8 leading-tight">Ready to transform <br /> your career?</h2>
              
              <div className="flex flex-wrap justify-center gap-8 mb-12 text-white/60 text-sm font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#bef264]" /> Free 15-day trial</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#bef264]" /> No credit card needed</span>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={handleAction} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-bold hover:bg-white/20 transition-all">Start Free Trial</button>
                <button onClick={handleAction} className="bg-[#bef264] text-[#062016] px-8 py-4 rounded-full font-bold shadow-lg hover:bg-[#a3e635] transition-all">Get a Demo</button>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Heading */}
        <section id="contact" className="py-24 px-6 text-center">
          <h2 className="text-6xl md:text-8xl font-black text-[#062016] tracking-tighter flex items-center justify-center gap-4">
            Let's Contact
            <button onClick={handleAction} className="bg-[#bef264] p-4 md:p-8 rounded-full text-[#062016] rotate-[-45deg] hover:scale-110 transition-transform">
              <ArrowRight className="w-8 h-8 md:w-16 md:h-16" />
            </button>
          </h2>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-[#062016] p-1.5 rounded-lg">
                  <AlphaLogo className="w-5 h-5 text-[#bef264]" />
                </div>
                <span className="text-2xl font-extrabold text-[#062016] tracking-tight">BrighterMonday</span>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed max-w-sm mb-8">
                The premier AI-powered job board and career platform connecting top talent with leading employers across East Africa.
              </p>
              <div className="flex gap-4">
                <button className="bg-slate-100 p-3 rounded-full text-[#062016] hover:bg-[#bef264] transition-all"><Facebook className="w-5 h-5" /></button>
                <button className="bg-slate-100 p-3 rounded-full text-[#062016] hover:bg-[#bef264] transition-all"><Twitter className="w-5 h-5" /></button>
                <button className="bg-slate-100 p-3 rounded-full text-[#062016] hover:bg-[#bef264] transition-all"><Instagram className="w-5 h-5" /></button>
                <button className="bg-slate-100 p-3 rounded-full text-[#062016] hover:bg-[#bef264] transition-all"><Linkedin className="w-5 h-5" /></button>
              </div>
            </div>
            
            <div>
              <h5 className="font-bold text-[#062016] mb-6">Support</h5>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><button onClick={() => scrollToSection('home')} className="hover:text-[#062016]">How It Works</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-[#062016]">Features</button></li>
                <li><button onClick={handleAction} className="hover:text-[#062016]">Pricing</button></li>
                <li><button onClick={handleAction} className="hover:text-[#062016]">Download</button></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold text-[#062016] mb-6">Useful Links</h5>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><button onClick={() => scrollToSection('home')} className="hover:text-[#062016]">About</button></li>
                <li><button onClick={() => scrollToSection('home')} className="hover:text-[#062016]">Workflow</button></li>
                <li><button onClick={() => scrollToSection('blog')} className="hover:text-[#062016]">Articles & Guides</button></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-[#062016]">Contact</button></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold text-[#062016] mb-6">Legal & Support</h5>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-[#062016]">FAQS</button></li>
                <li><button onClick={handleAction} className="hover:text-[#062016]">Help Center</button></li>
                <li><button onClick={handleAction} className="hover:text-[#062016]">Terms & Conditions</button></li>
                <li><button onClick={handleAction} className="hover:text-[#062016]">Privacy Policy</button></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-400 text-sm font-bold">© {new Date().getFullYear()} BrighterMonday. All rights reserved.</p>
            <div className="flex gap-8 text-sm font-bold text-slate-400">
              <a href="#" className="hover:text-[#062016]">Terms</a>
              <a href="#" className="hover:text-[#062016]">Privacy</a>
              <a href="#" className="hover:text-[#062016]">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

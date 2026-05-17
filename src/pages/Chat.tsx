import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Briefcase, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlphaLogo } from '../components/AlphaLogo';
import { NotificationBadge } from '../components/NotificationBadge';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const getSystemInstruction = (feature: string, jobDetails?: any, userRole?: string) => {
  const baseInstruction = `You are BrighterMonday — an AI career coach and networking assistant built specifically for Ugandan job seekers, career coaches, and employers. You are friendly, encouraging, practical, and speak in simple, clear English that feels natural to East African users. Occasionally use light Luganda phrases like "Webale" (thank you) or "Kale" (okay/alright) to feel local and warm — but keep it professional.

YOUR MISSION:
Help users in Uganda find jobs, write better CVs, prepare for interviews, write cover letters, and build their careers — all for free or at low cost.

HOW TO BEHAVE:
- Always start by warmly greeting the user and asking what they need help with today
- Be encouraging — many users are stressed about unemployment. Your tone should feel like a helpful older sibling or mentor, not a robot
- Keep responses concise and mobile-friendly — many users are on phones with small screens
- If a user writes in broken English, respond naturally without correcting their grammar — focus on helping them
- Never make the user feel stupid for not knowing something
- If you don't know something specific (like a company's exact hiring process), be honest and guide them to the right resource
- Always end your response with one clear next step or question to keep the conversation moving

IMPORTANT RULES:
- You only help with career and job-related topics
- If someone asks about something unrelated (politics, entertainment, etc.), kindly redirect: "I'm best at career advice — want help with your CV or interview prep?"
- Never generate fake job listings or promise specific job placement
- Keep all advice relevant to the Ugandan job market and East African context`;

  let featureSpecificInstruction = '';

  if (userRole) {
    featureSpecificInstruction += `\n\nUSER CONTEXT:\nThe user you are talking to is a ${userRole}. Tailor your advice and tone to be most helpful for a ${userRole}.`;
  }

  switch (feature) {
    case 'cv':
      featureSpecificInstruction = `\n\nCURRENT FOCUS: CV BUILDER
You are currently acting as a specialized CV Builder.
- Ask them step by step: name, contact, education, work experience, skills, achievements
- Keep questions one at a time so it doesn't feel overwhelming
- Then generate a clean, professional CV in plain text format they can copy
- Tailor it to Ugandan employer expectations (clear, concise, no photos unless asked)
- If they mention a specific job, tailor the CV to match that job description`;
      break;
    case 'interview':
      featureSpecificInstruction = `\n\nCURRENT FOCUS: MOCK INTERVIEW COACH
You are currently acting as a Mock Interview Coach.
- Ask what role they are applying for
- Ask their experience level (fresh graduate, 1–3 years, etc.)
- Then ask them interview questions one at a time, like a real interviewer
- After each answer, give honest, kind feedback: what was good, what to improve, and a sample better answer
- Common roles to prepare for: teacher, accountant, software developer, nurse, bank teller, NGO officer, sales rep, customer care`;
      break;
    case 'cover-letter':
      featureSpecificInstruction = `\n\nCURRENT FOCUS: COVER LETTER WRITER
You are currently acting as a Cover Letter Writer.
- Ask for the job title, company name, and what the job requires
- Ask what makes the user a good fit (their top 2–3 strengths)
- Write a short, professional cover letter (max 3 paragraphs) they can copy and send`;
      break;
    case 'job-search':
      featureSpecificInstruction = `\n\nCURRENT FOCUS: JOB SEARCH GUIDE
You are currently acting as a Job Search Guide.
- Recommend: Fuzu.com, BrighterMonday Uganda, LinkedIn, NITA-U portal, government jobs at publicservice.go.ug, NGO job boards like ReliefWeb and Devex
- Remind them to also network — many Ugandan jobs are found through referrals and WhatsApp groups
- Give practical tips like following company pages on LinkedIn, attending career fairs at Makerere, Kyambogo, MUBS`;
      break;
    case 'skills':
      featureSpecificInstruction = `\n\nCURRENT FOCUS: SKILLS GAP ANALYSIS
You are currently acting as a Skills Gap Analyst.
- Ask their current skills and their target job
- Tell them the 3–5 most important skills they are missing
- Recommend free learning resources: Google Digital Skills, Coursera free courses, YouTube tutorials, ALX Africa, Andela learning`;
      break;
    case 'advice':
      featureSpecificInstruction = `\n\nCURRENT FOCUS: CAREER ADVICE
You are currently acting as a General Career Advisor.
Answer any general career question warmly and practically:
- How to negotiate salary in Uganda
- How to write a LinkedIn profile
- How to follow up after a job interview
- How to handle rejection and keep going
- How to work as a freelancer on platforms like Upwork or Fiverr`;
      break;
  }

  if (jobDetails) {
    featureSpecificInstruction += `\n\nCONTEXT: The user is asking about a specific job they applied for or are interested in.
Job Title: ${jobDetails.title}
Company: ${jobDetails.company}
Description: ${jobDetails.description}
Requirements: ${jobDetails.requirements?.join(', ')}
Please use this context to provide more tailored advice, interview questions, or cover letter content.`;
  }

  return baseInstruction + featureSpecificInstruction;
};

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

export default function Chat() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const feature = queryParams.get('feature') || 'general';
  const jobId = queryParams.get('jobId');

  const [jobDetails, setJobDetails] = useState<any>(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (jobId) {
        try {
          const jobDoc = await getDoc(doc(db, 'jobs', jobId));
          if (jobDoc.exists()) {
            setJobDetails(jobDoc.data());
          }
        } catch (error) {
          console.error("Error fetching job details:", error);
        }
      }
    };
    fetchJobDetails();
  }, [jobId]);

  const getInitialMessage = (feat: string) => {
    switch (feat) {
      case 'cv':
        return `Hello ${user?.displayName?.split(' ')[0] || ''}! Welcome to the CV Builder. 🇺🇬\n\nLet's build a professional CV tailored for Ugandan employers. To get started, what is your full name and contact information?`;
      case 'interview':
        return `Hello ${user?.displayName?.split(' ')[0] || ''}! Welcome to the Mock Interview Coach. 🇺🇬\n\nI'm ready to help you practice. What role are you applying for, and what is your experience level (e.g., fresh graduate, 1-3 years)?`;
      case 'cover-letter':
        return `Hello ${user?.displayName?.split(' ')[0] || ''}! Welcome to the Cover Letter Writer. 🇺🇬\n\nLet's write a compelling cover letter. What is the job title and company name you are applying to?`;
      case 'job-search':
        return `Hello ${user?.displayName?.split(' ')[0] || ''}! Welcome to the Job Search Guide. 🇺🇬\n\nI can help you find the best platforms and strategies to find jobs in Uganda. What kind of job are you looking for?`;
      case 'skills':
        return `Hello ${user?.displayName?.split(' ')[0] || ''}! Welcome to the Skills Gap Analysis. 🇺🇬\n\nLet's figure out what you need to learn. What is your target job, and what skills do you currently have?`;
      case 'advice':
        return `Hello ${user?.displayName?.split(' ')[0] || ''}! Welcome to Career Advice. 🇺🇬\n\nI'm here to answer any career questions you have. How can I help you today?`;
      default:
        return `Hello ${user?.displayName?.split(' ')[0] || ''}! Welcome to BrighterMonday — your personal career coach for Uganda. 🇺🇬\n\nI can help you with:\n✅ Building your CV\n✅ Practising for interviews\n✅ Writing cover letters\n✅ Finding jobs in Uganda\n✅ Figuring out what skills to learn next\n\nWhat would you like help with today? Just tell me in your own words!`;
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: getInitialMessage(feature) },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    chatRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: getSystemInstruction(feature, jobDetails, userProfile?.role),
        temperature: 0.7,
      },
    });
  }, [feature, jobDetails, userProfile?.role]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'user', text: userMessage },
    ]);
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessageStream({ message: userMessage });
      
      let aiText = '';
      const aiMessageId = (Date.now() + 1).toString();
      
      setMessages((prev) => [
        ...prev,
        { id: aiMessageId, role: 'model', text: '' },
      ]);

      for await (const chunk of response) {
        aiText += chunk.text;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId ? { ...msg, text: aiText } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          text: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#062016]/5 font-sans selection:bg-[#bef264] selection:text-[#062016]">
      {/* Header */}
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
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">BrighterMonday AI</h1>
              <p className="text-xs text-[#bef264] hidden sm:block font-bold">Your Ugandan Career Coach 🇺🇬</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:px-20">
        <div className="max-w-3xl mx-auto space-y-6 pb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  msg.role === 'user'
                    ? 'bg-[#062016] text-[#bef264]'
                    : 'bg-[#bef264] text-[#062016]'
                }`}
              >
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-[#062016] text-white rounded-tr-none font-medium'
                    : 'bg-white text-[#062016] border border-[#062016]/10 rounded-tl-none font-medium'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="prose prose-sm md:prose-base max-w-none prose-p:leading-relaxed prose-a:text-[#062016] prose-a:font-bold hover:prose-a:text-[#bef264]">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#bef264] text-[#062016] flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div className="bg-white border border-[#062016]/10 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-[#062016]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#062016]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#062016]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-[#062016]/10 p-4 pb-safe">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message here..."
            className="flex-1 border border-[#062016]/10 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-[#bef264] focus:border-transparent bg-white font-medium text-[#062016]"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-[#062016] hover:bg-black text-white rounded-full p-3 md:px-6 md:py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#062016]/10"
          >
            <span className="hidden md:inline font-bold">Send</span>
            <Send size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}

import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../services/uploadService';
import { ArrowLeft, Save, Upload, User, Briefcase, Globe, Phone, FileText, Image as ImageIcon, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlphaLogo } from '../components/AlphaLogo';

export default function Settings() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [skills, setSkills] = useState(userProfile?.skills?.join(', ') || '');
  const [nationality, setNationality] = useState(userProfile?.nationality || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [role, setRole] = useState(userProfile?.role || 'seeker');
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setMessage('');
    setError('');
    
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        bio,
        skills: skillsArray,
        nationality,
        phoneNumber,
        role: user.email === 'wamalaandrew632@gmail.com' ? role : userProfile?.role, // Only allow role update if it's the admin email
        updatedAt: new Date()
      });
      
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    setError('');
    try {
      const downloadUrl = await uploadToCloudinary(file);
      
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: downloadUrl
      });
      
      setMessage('Profile picture updated! It may take a moment to reflect everywhere.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image. Please check your Cloudinary configuration.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#062016]/5 font-sans pb-12 selection:bg-[#bef264] selection:text-[#062016]">
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
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Profile Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-6 mt-6">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-[#062016]/5 overflow-hidden">
          <div className="p-8 border-b border-[#062016]/5">
            <h2 className="text-2xl font-extrabold text-[#062016] tracking-tight">Edit Profile</h2>
            <p className="text-slate-500 mt-1 font-medium">Update your personal information and how you appear to others.</p>
          </div>
          
          <div className="p-8">
            {message && (
              <div className="mb-6 bg-[#bef264]/20 text-[#062016] p-4 rounded-xl font-bold border border-[#bef264]/30">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-6 bg-rose-50 text-rose-600 p-4 rounded-xl font-bold border border-rose-100">
                {error}
              </div>
            )}

            <div className="mb-10 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                {userProfile?.photoURL || user?.photoURL ? (
                  <img src={userProfile?.photoURL || user?.photoURL || ''} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-[#062016]/5" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#062016] text-[#bef264] flex items-center justify-center font-bold text-3xl border-4 border-[#062016]/5">
                    {displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                )}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute bottom-0 right-0 bg-[#bef264] text-[#062016] p-2 rounded-full shadow-lg hover:bg-[#a3e635] transition-colors disabled:opacity-50"
                  title="Change Profile Picture"
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-[#062016] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div>
                <h3 className="font-bold text-[#062016] text-lg">Profile Picture</h3>
                <p className="text-sm text-slate-500">Upload a professional photo. Max 5MB.</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-[#062016]/5 border border-[#062016]/10 rounded-xl text-[#062016] font-bold focus:ring-2 focus:ring-[#bef264] focus:bg-white outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="tel" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-[#062016]/5 border border-[#062016]/10 rounded-xl text-[#062016] font-bold focus:ring-2 focus:ring-[#bef264] focus:bg-white outline-none transition-all"
                      placeholder="+256..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Nationality</label>
                  <div className="relative">
                    <Globe className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-[#062016]/5 border border-[#062016]/10 rounded-xl text-[#062016] font-bold focus:ring-2 focus:ring-[#bef264] focus:bg-white outline-none transition-all"
                      placeholder="Ugandan"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Skills (Comma Separated)</label>
                  <div className="relative">
                    <Briefcase className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-[#062016]/5 border border-[#062016]/10 rounded-xl text-[#062016] font-bold focus:ring-2 focus:ring-[#bef264] focus:bg-white outline-none transition-all"
                      placeholder="React, Node.js, Marketing..."
                    />
                  </div>
                </div>
              </div>

              {user?.email === 'wamalaandrew632@gmail.com' && (
                <div className="p-6 bg-purple-50 border border-purple-100 rounded-xl mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-purple-900">Admin Override: Change Your Role</h3>
                  </div>
                  <p className="text-sm text-purple-700 mb-4">
                    Because you are the platform owner ({user.email}), you can change your role here to test different views.
                  </p>
                  <div className="relative">
                    <select 
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full pl-4 pr-10 py-3.5 bg-white border border-purple-200 rounded-xl text-purple-900 font-bold focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="seeker">Job Seeker</option>
                      <option value="employer">Employer</option>
                      <option value="coach">Career Coach</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Professional Bio</label>
                <div className="relative">
                  <FileText className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={5}
                    className="w-full pl-12 pr-4 py-3.5 bg-[#062016]/5 border border-[#062016]/10 rounded-xl text-[#062016] font-medium focus:ring-2 focus:ring-[#bef264] focus:bg-white outline-none transition-all resize-none"
                    placeholder="Tell employers or clients about your experience and what you're looking for..."
                  ></textarea>
                </div>
              </div>

              <div className="pt-6 border-t border-[#062016]/5 flex justify-end">
                <button 
                  type="submit"
                  disabled={saving}
                  className="bg-[#062016] text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-[#062016]/10 hover:bg-black flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

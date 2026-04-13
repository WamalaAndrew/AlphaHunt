import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, doc, updateDoc } from 'firebase/firestore';
import { Users, ArrowLeft, Shield, Briefcase, User, GraduationCap, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlphaLogo } from '../components/AlphaLogo';
import { NotificationBadge } from '../components/NotificationBadge';

interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
  createdAt: any;
  updatedAt?: any;
}

export default function AdminDashboard() {
  const { user, userProfile } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile?.role === 'admin' as any) {
      fetchUsers();
    } else if (userProfile && userProfile.role !== 'admin' as any) {
      navigate('/dashboard');
    }
  }, [userProfile, navigate]);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as AppUser[];
      
      // Sort in memory by creation date (newest first)
      usersData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: selectedRole
      });
      setUsers(users.map(u => u.uid === userId ? { ...u, role: selectedRole } : u));
      setEditingRole(null);
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update user role.");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-purple-600" />;
      case 'employer': return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'coach': return <GraduationCap className="w-4 h-4 text-emerald-600" />;
      default: return <User className="w-4 h-4 text-slate-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'employer': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'coach': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#062016]/5 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#062016] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Admin Dashboard</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBadge />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-6">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-[#062016] tracking-tight">Registered Users</h2>
          <p className="text-slate-500 mt-2 font-medium">Manage and track all users on the AlphaHunt platform.</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-[#062016]/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#062016]/5 border-b border-[#062016]/10 text-[#062016] text-xs font-bold uppercase tracking-widest">
                  <th className="p-6">User</th>
                  <th className="p-6">Email</th>
                  <th className="p-6">Role</th>
                  <th className="p-6">Joined</th>
                  <th className="p-6">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#062016]/5">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-[#062016]/5 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.displayName} className="w-12 h-12 rounded-full object-cover border-2 border-[#062016]/10" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#062016] text-[#bef264] flex items-center justify-center font-bold text-xl border-2 border-[#062016]/10">
                            {u.displayName?.charAt(0) || u.email?.charAt(0) || '?'}
                          </div>
                        )}
                        <span className="font-bold text-[#062016] capitalize text-lg group-hover:text-black">{u.displayName || u.email.split('@')[0]}</span>
                      </div>
                    </td>
                    <td className="p-6 text-slate-500 font-medium">{u.email}</td>
                    <td className="p-6">
                      {editingRole === u.uid ? (
                        <div className="flex items-center gap-2">
                          <select 
                            value={selectedRole} 
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-[#bef264] focus:border-[#bef264] block p-2"
                          >
                            <option value="seeker">Seeker</option>
                            <option value="employer">Employer</option>
                            <option value="coach">Coach</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button onClick={() => handleRoleChange(u.uid)} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingRole(null)} className="p-1.5 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border cursor-pointer hover:opacity-80 ${getRoleBadgeColor(u.role)}`}
                          onClick={() => {
                            setEditingRole(u.uid);
                            setSelectedRole(u.role);
                          }}
                          title="Click to change role"
                        >
                          {getRoleIcon(u.role)}
                          <span className="capitalize">{u.role || 'seeker'}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-6 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="p-6 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      {u.updatedAt?.toDate ? u.updatedAt.toDate().toLocaleDateString() : (u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'Unknown')}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">
                      <Users className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                      <p className="font-bold text-lg">No users found in the database.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

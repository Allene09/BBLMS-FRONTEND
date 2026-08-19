import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  PiUserCircle as FiProfile,
  PiShieldCheck as FiShield,
  PiLockKey as FiLock,
  PiFloppyDisk as FiSave,
  PiIdentificationCard as FiId,
  PiEnvelopeSimple as FiMail,
  PiPhone as FiPhone,
  PiMapPin as FiMapPin,
  PiUsersThree as FiUsers,
  PiUser as FiUser,
  PiEye as FiEye,
  PiEyeSlash as FiEyeOff,
  PiPencilSimple as FiEdit,
} from 'react-icons/pi';

const blankBorrower = {
  firstname: '',
  middle_name: '',
  lastname: '',
  gender: 'Male',
  college: 'CTECH',
  mobile_phone: '',
  email: '',
  address: '',
  type: 'Student',
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    username: '',
    designation: '',
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [borrower, setBorrower] = useState({ ...blankBorrower });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await api.get('/auth/me');
        if (!active) return;

        setProfile({
          username: res.data.username || '',
          designation: res.data.designation || '',
        });

        const borrowed = res.data.borrower || {};
        setBorrower({
          firstname: borrowed.firstname || res.data.username?.split(' ')?.[0] || '',
          middle_name: borrowed.middle_name || '',
          lastname: borrowed.lastname || res.data.username?.split(' ')?.slice(1).join(' ') || '',
          gender: borrowed.gender || 'Male',
          college: borrowed.college || 'CTECH',
          mobile_phone: borrowed.mobile_phone || '',
          email: borrowed.email || '',
          address: borrowed.address || '',
          type: borrowed.type || 'Student',
        });
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load profile');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, []);

  const isBorrower = String(user?.access_right || '').toUpperCase() === 'BORROWER';

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleBorrowerChange = (field, value) => {
    setBorrower((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password || confirmPassword) {
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        username: profile.username.trim(),
        designation: profile.designation.trim(),
      };

      if (password) {
        payload.password = password;
      }

      const firstname = borrower.firstname.trim();
      const lastname = borrower.lastname.trim();
      payload.username = `${firstname} ${lastname}`.trim();
      payload.borrower = {
        firstname,
        middle_name: borrower.middle_name.trim(),
        lastname,
        gender: borrower.gender,
        college: borrower.college,
        mobile_phone: borrower.mobile_phone.trim(),
        email: borrower.email.trim(),
        address: borrower.address.trim(),
        type: borrower.type,
      };

      const res = await api.patch('/auth/me', payload);
      toast.success('Profile updated successfully');
      setProfile({
        username: res.data.username || payload.username,
        designation: res.data.designation || payload.designation,
      });
      if (res.data.borrower) {
        setBorrower({
          firstname: res.data.borrower.firstname || '',
          middle_name: res.data.borrower.middle_name || '',
          lastname: res.data.borrower.lastname || '',
          gender: res.data.borrower.gender || 'Male',
          college: res.data.borrower.college || 'CTECH',
          mobile_phone: res.data.borrower.mobile_phone || '',
          email: res.data.borrower.email || '',
          address: res.data.borrower.address || '',
          type: res.data.borrower.type || 'Student',
        });
      }
      setPassword('');
      setConfirmPassword('');
      await refreshUser();
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] -m-6 p-6 lg:p-10 relative overflow-hidden flex flex-col font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#f5f3ff] z-0" />
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-blue-300/40 rounded-full mix-blend-multiply filter blur-[110px] z-0" />
      <div className="absolute top-[25%] right-[-10%] w-[34rem] h-[34rem] bg-purple-300/35 rounded-full mix-blend-multiply filter blur-[110px] z-0" />
      <div className="absolute bottom-[-15%] left-[18%] w-[44rem] h-[44rem] bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[120px] z-0" />

      <div className="relative z-10 max-w-[1400px] w-full mx-auto flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-2 flex items-center gap-2">
              <FiProfile size={14} /> User Module
            </p>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight drop-shadow-sm">Profile</h1>
            <p className="text-sm text-slate-600/80 font-semibold mt-1">Update your account and borrower information from one place.</p>
          </div>
          <button 
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${isEditing ? 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200' : 'bg-white/60 text-slate-700 border-white/70 hover:bg-white shadow-sm'}`}
          >
            <FiEdit size={16} /> {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6 items-start">
          <div className="bg-white/35 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.05)] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
            <div className="p-6 relative z-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-blue-500/20">
                  {profile.username?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="mt-5">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">{profile.username || user?.username}</h2>
                  <p className="text-sm font-semibold text-slate-500 mt-1">{user?.access_right}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-white/60 border border-white/70 p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 flex items-center gap-2"><FiId /> Account ID</p>
                  <p className="text-sm font-bold text-slate-700">{user?.user_id}</p>
                </div>
                <div className="rounded-2xl bg-white/60 border border-white/70 p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 flex items-center gap-2"><FiShield /> Status</p>
                  <p className="text-sm font-bold text-emerald-700">{user?.status || 'APPROVED'}</p>
                </div>
                <div className="rounded-2xl bg-white/60 border border-white/70 p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1 flex items-center gap-2"><FiUsers /> Role</p>
                  <p className="text-sm font-bold text-slate-700">{user?.access_right}</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/35 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.05)] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
            <fieldset disabled={!isEditing} className="p-6 lg:p-8 relative z-10 space-y-8 min-w-0">
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center border border-white/70 shadow-sm">
                    <FiUser size={18} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Account Details</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">General login information</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-2 pl-1">Display Name</label>
                    <input
                      className="w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                      value={profile.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-2 pl-1">Designation</label>
                    <input
                      className="w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                      value={profile.designation}
                      onChange={(e) => handleChange('designation', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-2 pl-1">Type</label>
                    <select
                      className="w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                      value={borrower.type}
                      onChange={(e) => handleBorrowerChange('type', e.target.value)}
                    >
                      <option value="Student">Student</option>
                      <option value="Faculty">Faculty</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-2 pl-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        className="w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-3 pr-12 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank to keep current password"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
                        onClick={() => setShowPw(!showPw)}
                      >
                        {showPw ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-2 pl-1">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? "text" : "password"}
                        className="w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-3 pr-12 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat the new password"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors p-1"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                      >
                        {showConfirmPw ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-white/70 shadow-sm">
                    <FiProfile size={18} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{isBorrower ? 'Borrower Profile' : 'Personal Details'}</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Editable personal record</p>
                  </div>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-2 pl-1">First Name</label>
                      <input
                        className="w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                        value={borrower.firstname}
                        onChange={(e) => handleBorrowerChange('firstname', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-2 pl-1">Middle Name</label>
                      <input
                        className="w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                        value={borrower.middle_name}
                        onChange={(e) => handleBorrowerChange('middle_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-2 pl-1">Last Name</label>
                      <input
                        className="w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                        value={borrower.lastname}
                        onChange={(e) => handleBorrowerChange('lastname', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={`grid grid-cols-1 ${isBorrower ? 'md:grid-cols-2' : ''} gap-4 mt-4`}>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-2 pl-1">Gender</label>
                      <select
                        className="w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                        value={borrower.gender}
                        onChange={(e) => handleBorrowerChange('gender', e.target.value)}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {isBorrower && (
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-2 pl-1">College</label>
                        <select
                          className="w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                          value={borrower.college}
                          onChange={(e) => handleBorrowerChange('college', e.target.value)}
                        >
                          <option value="CTECH">CTECH</option>
                          <option value="CFES">CFES</option>
                          <option value="CBM">CBM</option>
                          <option value="COAS">COAS</option>
                          <option value="CTE">CTE</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-2 pl-1 flex items-center gap-1.5"><FiPhone size={12} /> Mobile Phone</label>
                      <input
                        className="w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                        value={borrower.mobile_phone}
                        onChange={(e) => handleBorrowerChange('mobile_phone', e.target.value)}
                        placeholder="09XXXXXXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-2 pl-1 flex items-center gap-1.5"><FiMail size={12} /> Email</label>
                      <input
                        type="email"
                        className="w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                        value={borrower.email}
                        onChange={(e) => handleBorrowerChange('email', e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-2 pl-1 flex items-center gap-1.5"><FiMapPin size={12} /> Address</label>
                      <input
                        className="w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
                        value={borrower.address}
                        onChange={(e) => handleBorrowerChange('address', e.target.value)}
                        placeholder="Complete address"
                      />
                    </div>
                  </div>
                </section>

              {isEditing && (
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-wider transition-all shadow-[0_8px_20px_rgba(79,70,229,0.25)]"
                  >
                    <FiSave size={16} /> {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              )}
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
}

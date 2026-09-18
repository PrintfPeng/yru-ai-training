import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User as UserIcon, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { authApi, ApiError } from '../api';

const AdminLogin = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { admin } = await authApi.login(username.trim(), password);
      onLogin?.(admin);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_CREDENTIALS') {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError(err?.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-yrugray-950 p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yrupink-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-yrupink-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-5xl bg-yrugray-900/60 backdrop-blur-xl border border-yrugray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10">
        
        {/* Left Branding Panel (Hidden on mobile) */}
        <div className="hidden md:flex md:w-1/2 p-12 flex-col justify-between bg-gradient-to-br from-yrugray-800/80 to-yrugray-900/80 border-r border-yrugray-700/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yrupink-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-yrupink-400 to-yrupink-700 rounded-xl flex items-center justify-center font-bold text-white shadow-lg text-xl">
                AI
              </div>
              <span className="font-bold text-2xl tracking-wide text-white">CENTER <span className="text-yrupink-400">YRU</span></span>
            </div>
            
            <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
              ระบบจัดการ <br />
              <span className="text-gradient">ส่วนผู้ดูแลระบบ</span>
            </h1>
            <p className="text-yrugray-300 text-lg">
              จัดการข้อมูลผู้ช่วย AI, หลักสูตรอบรม และการจองห้องประชุม อย่างปลอดภัย
            </p>
          </div>
          
          <div className="relative z-10 flex items-center gap-2 text-sm text-yrugray-400">
            <ShieldCheck className="w-5 h-5 text-yrupink-400" />
            <span>ระบบเข้าใช้งานที่ปลอดภัย</span>
          </div>
        </div>

        {/* Right Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-yrugray-900/40">
          <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-yrupink-400 to-yrupink-700 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
              AI
            </div>
            <span className="font-bold text-xl tracking-wide text-white">CENTER <span className="text-yrupink-400">YRU</span></span>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">ยินดีต้อนรับ, ผู้ดูแลระบบ</h2>
            <p className="text-yrugray-400 text-sm">กรุณาเข้าสู่ระบบเพื่อจัดการระบบ</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-yrugray-300 ml-1">ชื่อผู้ใช้</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-yrugray-500 group-focus-within:text-yrupink-400 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  required
                  disabled={submitting}
                  className="w-full bg-yrugray-800/50 border border-yrugray-700 text-white rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-yrupink-500/50 focus:border-yrupink-500 transition-all placeholder-yrugray-500 shadow-inner disabled:opacity-60"
                  placeholder="superadmin"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-yrugray-300 ml-1">รหัสผ่าน</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-yrugray-500 group-focus-within:text-yrupink-400 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                  className="w-full bg-yrugray-800/50 border border-yrugray-700 text-white rounded-xl pl-12 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-yrupink-500/50 focus:border-yrupink-500 transition-all placeholder-yrugray-500 shadow-inner disabled:opacity-60"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-yrugray-500 hover:text-yrupink-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-5 h-5 border-2 border-yrugray-600 rounded bg-yrugray-800/50 peer-checked:bg-yrupink-500 peer-checked:border-yrupink-500 transition-all"></div>
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <span className="text-sm text-yrugray-400 group-hover:text-yrugray-300 transition-colors">จดจำฉันไว้ในระบบ</span>
              </label>
              <a href="#" className="text-sm font-medium text-yrupink-400 hover:text-yrupink-300 transition-colors">
                ลืมรหัสผ่าน?
              </a>
            </div>

            <button
              type="submit"
              disabled={submitting || !username.trim() || !password}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-yrupink-600 to-yrupink-500 text-white font-bold text-lg shadow-lg shadow-yrupink-500/25 hover:shadow-yrupink-500/50 hover:-translate-y-0.5 transition-all duration-300 mt-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-yrugray-800/80 text-center">
            <p className="text-xs text-yrugray-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              การเข้าถึงระบบถูกจำกัดไว้สำหรับเจ้าหน้าที่ที่ได้รับอนุญาตเท่านั้น
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types';
import { ShieldAlert, BookOpen, Briefcase, Eye, EyeOff, HelpCircle, ArrowRight } from 'lucide-react';
import TextType from './TextType';
import ShinyText from './ShinyText';
import DarkVeil from './DarkVeil';
import SpotlightCard from './SpotlightCard';
import ParticleNetwork from './ParticleNetwork';

interface AuthInterfaceProps {
  onLoginSuccess: (role: UserRole, email: string, name?: string) => void;
}

export default function AuthInterface({ onLoginSuccess }: AuthInterfaceProps) {
  const [mode, setMode] = useState<'landing' | 'login' | 'signup'>('landing');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quotes = [
    "The future of wealth is autonomous, secured by intelligence.",
    "Algorithms don't just predict the market; they protect your peace of mind.",
    "Financial security in the digital age requires forensic precision.",
    "True financial freedom is built on a foundation of cryptographic trust.",
    "Your financial decisions, optimized by cold, hard data.",
    "Where artificial intelligence meets impenetrable financial security."
  ];

  const [quoteIndex, setQuoteIndex] = React.useState(0);

  React.useEffect(() => {
    if (mode !== 'landing') {
      const interval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [mode, quotes.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      const BASE_URL = "http://127.0.0.1:8000";

const endpoint =
  mode === "signup"
    ? `${BASE_URL}/api/auth/register`
    : `${BASE_URL}/api/auth/login`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, name: mode === 'signup' ? name : undefined })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user.role, data.user.email, data.user.name);
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Connecting to server failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'landing') {
    return (
      <div className="min-h-screen bg-transparent flex flex-col font-sans overflow-hidden relative">
        <div className="absolute inset-0 z-0 opacity-50 pointer-events-auto">
          <DarkVeil
            hueShift={20}
            noiseIntensity={0.2}
            scanlineIntensity={0.1}
            speed={0.5}
            scanlineFrequency={50}
            warpAmount={0.2}
            resolutionScale={1}
          />
        </div>

        {/* Top Navbar */}
        <nav className="relative z-20 w-full px-6 py-4 flex items-center justify-between border-b dark:border-white/5 border-black/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ShieldAlert size={24} className="text-[#EF4444]" />
            <span className="font-bold text-lg tracking-tight dark:text-white text-slate-900">NEXUS <span className="text-[#EF4444]">CORE</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMode('login')}
              className="text-sm font-medium text-neutral-300 hover:dark:text-white text-slate-900 transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => setMode('signup')}
              className="text-sm font-medium bg-white text-black px-5 py-2 rounded-full hover:bg-neutral-200 transition-all"
            >
              Get Started
            </button>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto w-full z-10 pb-20">
          <div className="flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto w-full p-6 lg:p-12 relative gap-12">
          
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#EF4444]/10 blur-[120px] rounded-full pointer-events-none" />
          
          {/* Left Side: Copy */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex-1 max-w-2xl text-left space-y-8 mt-10 lg:mt-0"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border dark:border-white/10 border-black/10 dark:bg-white/5 bg-black/5 backdrop-blur-sm text-xs font-medium text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
              <ShinyText text="New · v4.14 Security Update" disabled={false} speed={3} className="" />
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight dark:text-white text-slate-900 leading-[1.1] h-[160px] md:h-[200px]">
              <TextType 
                text={[
                  "Master your wealth, today.",
                  "Secure your future, now.",
                  "Analyze your assets, fast."
                ]}
                typingSpeed={75}
                pauseDuration={2000}
                showCursor={true}
                cursorCharacter="_"
              />
            </h1>
            
            <p className="text-lg lg:text-xl dark:text-neutral-400 text-slate-600 max-w-lg leading-relaxed">
              We craft financial intelligence tools that are secure, intuitive, and designed to protect your money.
            </p>

            <div className="pt-4 flex items-center gap-4">
              <button 
                onClick={() => setMode('signup')}
                className="bg-white text-black px-7 py-3 rounded-full font-semibold text-sm hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                Get Started
              </button>
              <button 
                onClick={() => setMode('login')}
                className="px-7 py-3 rounded-full font-semibold text-sm dark:text-white text-slate-900 border dark:border-white/10 border-black/10 hover:dark:bg-white/5 bg-black/5 transition-all"
              >
                View Features
              </button>
            </div>
          </motion.div>

          {/* Right Side: Particle Network Animation */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="flex-1 w-full max-w-lg relative h-[500px] flex items-center justify-center hidden lg:flex"
          >
            <div className="absolute inset-0">
              <ParticleNetwork />
            </div>
          </motion.div>
        </div>

        {/* New Section: Features using SpotlightCards */}
        <div className="max-w-7xl mx-auto w-full p-6 lg:p-12 mt-12 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold dark:text-white text-slate-900 mb-4">Unmatched Financial Intelligence</h2>
            <p className="dark:text-neutral-400 text-slate-600 max-w-2xl mx-auto text-lg">Advanced tools designed to secure your assets and accelerate your wealth growth.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SpotlightCard className="flex flex-col text-left" spotlightColor="rgba(239, 68, 68, 0.2)">
              <ShieldAlert className="w-10 h-10 text-[#EF4444] mb-6" />
              <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-3">Forensic Security</h3>
              <p className="dark:text-neutral-400 text-slate-600 leading-relaxed">Real-time fraud detection and dynamic safety scans for all your transactions.</p>
            </SpotlightCard>
            
            <SpotlightCard className="flex flex-col text-left" spotlightColor="rgba(59, 130, 246, 0.2)">
              <Briefcase className="w-10 h-10 text-blue-500 mb-6" />
              <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-3">Wealth Modeling</h3>
              <p className="dark:text-neutral-400 text-slate-600 leading-relaxed">AI-driven projections to map out your financial trajectory with pinpoint accuracy.</p>
            </SpotlightCard>

            <SpotlightCard className="flex flex-col text-left" spotlightColor="rgba(16, 185, 129, 0.2)">
              <BookOpen className="w-10 h-10 text-emerald-500 mb-6" />
              <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-3">Smart Auditing</h3>
              <p className="dark:text-neutral-400 text-slate-600 leading-relaxed">Instant buy-decision analysis to prevent impulsive spending and optimize budget.</p>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </div>
  );
  }

  return (
    <div className="relative min-h-screen bg-transparent flex flex-col p-4 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-50 pointer-events-auto">
        <DarkVeil
          hueShift={20}
          noiseIntensity={0.2}
          scanlineIntensity={0.1}
          speed={0.5}
          scanlineFrequency={50}
          warpAmount={0.2}
          resolutionScale={1}
        />
      </div>

      {/* Dynamic Navbar in Auth Form too */}
      <nav className="absolute top-0 left-0 w-full px-6 py-4 flex items-center justify-between z-50">
        <button onClick={() => setMode('landing')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ShieldAlert size={24} className="text-[#EF4444]" />
          <span className="font-bold text-lg tracking-tight dark:text-white text-slate-900 hidden sm:block">NEXUS <span className="text-[#EF4444]">CORE</span></span>
        </button>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setMode('login'); setError(null); }}
            className={`text-sm font-medium transition-colors ${mode === 'login' ? 'dark:text-white text-slate-900' : 'text-neutral-400 hover:dark:text-white text-slate-900'}`}
          >
            Sign In
          </button>
          <button 
            onClick={() => { setMode('signup'); setError(null); }}
            className={`text-sm font-medium transition-colors ${mode === 'signup' ? 'dark:text-white text-slate-900' : 'text-neutral-400 hover:dark:text-white text-slate-900'}`}
          >
            Sign Up
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 pt-16">
        <div className="mb-10 h-16 flex items-center justify-center max-w-2xl text-center px-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={quoteIndex}
              initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm md:text-base font-light text-neutral-300 italic tracking-wide"
              style={{ textShadow: '0 0 20px rgba(255,255,255,0.1)' }}
            >
              "{quotes[quoteIndex]}"
            </motion.p>
          </AnimatePresence>
        </div>
        
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-lg p-8 sm:p-10 rounded-[2rem] overflow-hidden"
        >
          {/* Subtle decorative internal gradient */}
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#EF4444]/10 blur-[80px] pointer-events-none" />

          <div className="text-center mb-8">
            <h1 className="text-4xl font-light tracking-tighter dark:text-white text-slate-900">
              NEXUS <span className="font-bold text-[#EF4444]">CORE</span>
            </h1>
            <p className="text-xs text-neutral-400 uppercase tracking-[0.2em] mt-2 font-mono">
              {mode === 'signup' ? 'Initialize Secure Profile' : 'Smart Money & Security Tracker'}
            </p>
          </div>

          {/* Error Feedback block */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-950/30 border border-red-500/20 rounded-xl text-center"
            >
              <p className="text-xs text-red-400 font-mono font-medium">⚠️ {error}</p>
            </motion.div>
          )}

          {/* Role Toggle Selector */}
          <div className="grid grid-cols-2 gap-3 mb-8 bg-neutral-900/50 p-1.5 rounded-2xl border dark:border-white/5 border-black/5">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-medium tracking-wide transition-all ${
                role === 'student'
                  ? 'bg-neutral-800 dark:text-white text-slate-900 border dark:border-white/10 border-black/10 shadow-md'
                  : 'dark:text-white text-slate-900'
              }`}
            >
              <BookOpen size={14} className={role === 'student' ? 'text-[#EF4444]' : ''} />
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('professional')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-medium tracking-wide transition-all ${
                role === 'professional'
                  ? 'bg-neutral-800 dark:text-white text-slate-900 border dark:border-white/10 border-black/10 shadow-md'
                  : 'dark:text-white text-slate-900'
              }`}
            >
              <Briefcase size={14} className={role === 'professional' ? 'text-[#EF4444]' : ''} />
              Professional
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/10 px-4 py-3.5 rounded-xl text-sm dark:text-white text-slate-900 placeholder-neutral-500 focus:outline-none focus:border-[#EF4444]/50 focus:dark:bg-white/10 bg-black/10 transition-all font-sans"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                Email Address
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/10 px-4 py-3.5 rounded-xl text-sm dark:text-white text-slate-900 placeholder-neutral-500 focus:outline-none focus:border-[#EF4444]/50 focus:dark:bg-white/10 bg-black/10 transition-all font-sans"
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/10 pl-4 pr-12 py-3.5 rounded-xl text-sm dark:text-white text-slate-900 placeholder-neutral-500 focus:outline-none focus:border-[#EF4444]/50 focus:dark:bg-white/10 bg-black/10 transition-all font-mono"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:dark:text-white text-slate-900 transition-all"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full py-4 bg-white hover:bg-neutral-200 text-black font-semibold rounded-xl transition-all duration-300 transform active:scale-[0.98] overflow-hidden shadow-lg hover:shadow-white/5"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs uppercase tracking-wider font-mono font-bold">
                      {mode === 'signup' ? 'Registering...' : 'Connecting...'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs uppercase tracking-wider font-mono font-bold">
                    {mode === 'signup' ? 'Sign Up' : 'Log In'}
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Switch Auth Modes */}
          <div className="mt-8 text-center space-y-3">
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => {
                  if (role === 'student') {
                    setEmail('student@example.com');
                    setPassword('student123');
                  } else {
                    setEmail('pro@example.com');
                    setPassword('pro123');
                  }
                  setError(null);
                }}
                className="w-full py-2.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/20 text-[#EF4444] rounded-xl text-xs font-mono font-bold tracking-wider transition-all"
              >
                ⚡ INSTANT DEMO LOGIN ({role === 'student' ? 'STUDENT' : 'PRO'})
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signup' ? 'login' : 'signup');
                setError(null);
              }}
              className="text-xs dark:text-white text-slate-900 transition-all underline decoration-neutral-700 dark:decoration-white underline-offset-4 font-sans block mx-auto pt-2"
            >
              {mode === 'signup' ? 'Already have an account? Log In' : "Don't have an account? Create one"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

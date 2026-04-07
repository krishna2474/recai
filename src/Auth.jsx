import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Mail, Lock, UserPlus, LogIn, Leaf, Sparkles, ShieldCheck, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const features = [
  { icon: Sparkles, title: 'AI-Powered Recipes', desc: 'Smart recipes tailored to your health goals' },
  { icon: ShieldCheck, title: 'Health Score Engine', desc: 'Every recipe rated on a 10-point nutrition scale' },
  { icon: Zap, title: 'Local Substitutions', desc: 'Intelligent ingredient swaps for your region' },
];

const Auth = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Check your email for confirmation!");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background blobs */}
      <div className="auth-bg-blobs">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />
      </div>

      <div className="auth-container">
        {/* Left Panel - Brand & Features */}
        <motion.div 
          className="auth-left"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="auth-brand">
            <div className="auth-logo">
              <Leaf size={28} />
            </div>
            <span className="auth-logo-text">RECAI</span>
          </div>

          <h1 className="auth-headline">
            Cook smarter.<br />
            <span className="auth-headline-accent">Live healthier.</span>
          </h1>
          <p className="auth-subline">
            AI-powered recipes designed around your health, your taste, and your local ingredients.
          </p>

          <div className="auth-features">
            {features.map((f, i) => (
              <motion.div 
                key={i} 
                className="auth-feature-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="auth-feature-icon">
                  <f.icon size={20} />
                </div>
                <div>
                  <p className="auth-feature-title">{f.title}</p>
                  <p className="auth-feature-desc">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="auth-footer-text">Trusted by health-conscious home cooks</p>
        </motion.div>

        {/* Right Panel - Auth Form */}
        <motion.div 
          className="auth-right"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="auth-form-card">
            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? 'signup' : 'signin'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="auth-form-title">
                  {isSignUp ? "Create your account" : "Welcome back"}
                </h2>
                <p className="auth-form-subtitle">
                  {isSignUp 
                    ? "Start your journey to healthier cooking" 
                    : "Sign in to access your recipe collection"}
                </p>
              </motion.div>
            </AnimatePresence>

            {error && (
              <motion.div 
                className="auth-error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleAuth} className="auth-form">
              <div className={`auth-input-group ${focusedField === 'email' ? 'focused' : ''}`}>
                <label className="auth-label" htmlFor="auth-email">Email</label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-icon" />
                  <input 
                    id="auth-email"
                    type="email" 
                    placeholder="you@example.com"
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="auth-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={`auth-input-group ${focusedField === 'password' ? 'focused' : ''}`}>
                <label className="auth-label" htmlFor="auth-password">Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input 
                    id="auth-password"
                    type="password" 
                    placeholder="Enter your password"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="auth-input"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                  />
                </div>
              </div>

              <motion.button 
                type="submit" 
                disabled={loading} 
                className="auth-submit-btn"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
              >
                {loading ? (
                  <Loader2 size={20} className="spin" />
                ) : (
                  <>
                    {isSignUp ? "Create Account" : "Sign In"}
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <p className="auth-switch-text">
              {isSignUp ? "Already have an account?" : "New to RECAI?"}{" "}
              <button 
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                className="auth-switch-link"
              >
                {isSignUp ? "Sign In" : "Create Account"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;

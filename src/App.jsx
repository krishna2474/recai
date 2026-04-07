import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  LogOut, 
  Share2, 
  Download, 
  Leaf, 
  ChevronLeft, 
  Menu,
  ShieldCheck,
  Clock,
  ClipboardCheck,
  Zap, 
  Flame, 
  Globe, 
  Loader2,
  Calendar,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

// --- HELPER COMPONENT: COOK MODE OVERLAY ---
const CookModeOverlay = ({ timeline, title, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(timeline[0]?.duration * 60 || 0);
  const [isActive, setIsActive] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, secondsLeft]);

  const currentTask = timeline[currentIndex];
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentIndex < timeline.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSecondsLeft(timeline[nextIdx].duration * 60);
      setIsActive(true);
    } else {
      onClose(); // Finished last step
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setSecondsLeft(timeline[prevIdx].duration * 60);
      setIsActive(true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="cook-mode-overlay"
    >
      <button onClick={onClose} style={{ position: 'absolute', top: '40px', right: '40px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '12px', borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
        <Plus size={32} style={{ transform: 'rotate(45deg)' }} />
      </button>

      <div style={{ maxWidth: '700px', width: '100%', textAlign: 'center', color: 'white' }}>
        <p style={{ color: 'var(--primary-light)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px' }}>
          Step {currentIndex + 1} of {timeline.length}
        </p>
        <h2 className="serif" style={{ fontSize: '1.5rem', marginBottom: '40px', opacity: 0.8 }}>{title}</h2>
        
        <div style={{ marginBottom: '60px' }}>
          <h1 style={{ fontSize: '4.5rem', fontWeight: 900, marginBottom: '20px', lineHeight: 1.1 }}>{currentTask.task}</h1>
          <div className="cook-mode-timer" style={{ fontSize: '6rem', fontWeight: 900, fontFamily: 'monospace', color: secondsLeft === 0 ? '#ef4444' : 'white', textShadow: secondsLeft === 0 ? '0 0 40px rgba(239, 68, 68, 0.4)' : 'none' }}>
            {formatTime(secondsLeft)}
          </div>
        </div>

        <div className="cook-mode-controls" style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '60px' }}>
          <button onClick={() => setIsActive(!isActive)} className="btn btn-primary" style={{ background: isActive ? 'white' : 'var(--primary)', color: isActive ? 'var(--primary-dark)' : 'white', padding: '16px 40px', borderRadius: '100px', fontSize: '1.2rem', boxShadow: isActive ? '0 10px 30px rgba(255, 255, 255, 0.2)' : '0 10px 30px rgba(16, 185, 129, 0.4)' }}>
            {isActive ? 'Pause Timer' : 'Resume Timer'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={handleBack} disabled={currentIndex === 0} style={{ background: 'transparent', border: 'none', color: 'white', cursor: currentIndex === 0 ? 'default' : 'pointer', opacity: currentIndex === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
            <ChevronLeft size={24} /> Back
          </button>
          
          <button onClick={handleNext} className="btn" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '20px 60px', borderRadius: '100px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.4rem', fontWeight: 800, boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)' }}>
            {currentIndex === timeline.length - 1 ? 'Finish' : 'Next Step'} <ArrowRightLeft size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- HELPER COMPONENT: TIMELINE VISUALIZER (Planning View) ---
const TimelineVisualizer = ({ timeline, onStartCook }) => {
  if (!timeline || timeline.length === 0) return null;
  const maxTimeSeconds = Math.max(...timeline.map(t => (t.start_time + t.duration) * 60));

  return (
    <div style={{ marginTop: '40px', padding: '40px', background: 'var(--bg-soft)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h4 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px', margin: 0, color: 'var(--text-main)' }}>
          <Calendar size={24} color="var(--primary)" />
          Chef Cooking Timeline
        </h4>
        {onStartCook && (
          <button onClick={onStartCook} className="btn btn-primary" style={{ padding: '0 24px', height: '48px', borderRadius: '14px', fontSize: '1rem', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}>
            <Zap size={20} />
            Start Cook Mode
          </button>
        )}
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {timeline.map((task, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '140px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="var(--text-light)" /> {task.task}
                </div>
                <div style={{ flex: 1, position: 'relative', height: '16px', background: 'rgba(0,0,0,0.04)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        position: 'absolute', 
                        left: `${(task.start_time * 60 / maxTimeSeconds) * 100}%`, 
                        width: `${(task.duration * 60 / maxTimeSeconds) * 100}%`,
                        height: '100%', 
                        background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                        opacity: 0.85,
                        borderRadius: '100px',
                        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4)'
                      }} 
                    />
                </div>
                <div style={{ width: '40px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>
                  {task.duration}m
                </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
function Dashboard({ session, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [recipeId, setRecipeId] = useState(null); 
  const [prompt, setPrompt] = useState('');
  const [isLocalMode, setIsLocalMode] = useState(true); 
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCookMode, setIsCookMode] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (data) setHistory(data);
    if (error) console.error("FETCH HISTORY ERROR:", error);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt) return;
    
    setLoading(true);
    setError(null);
    setRecipe(null);
    setRecipeId(null);

    try {
      const response = await axios.post('/api/generate', {
        prompt,
        userId: session.user.id,
        isLocalMode
      });

      const recipeData = response.data;
      setRecipe(recipeData);

      const { data: savedData, error: dbError } = await supabase
        .from('recipes')
        .insert([{ 
          user_id: session.user.id, 
          title: recipeData.title, 
          content: recipeData, 
          created_at: new Date().toISOString(),
          is_public: false
        }])
        .select()
        .single();

      if (dbError) console.error("❌ DB SAVE ERROR:", dbError);
      else if (savedData) {
        setRecipeId(savedData.id);
        window.history.pushState({}, '', `/recipe/${savedData.id}`);
        fetchHistory(); 
      }

      setPrompt('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to generate recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadFromUrl = () => {
      const match = window.location.pathname.match(/^\/recipe\/(.+)$/);
      if (match) {
        const id = match[1];
        const found = history.find(h => h.id === id);
        if (found) {
          setRecipe(found.content);
          setRecipeId(found.id);
        } else {
          supabase.from('recipes').select('*').eq('id', id).eq('user_id', session.user.id).single()
            .then(({ data }) => {
              if (data) {
                setRecipe(data.content);
                setRecipeId(data.id);
              }
            });
        }
      } else {
        setRecipe(null);
        setRecipeId(null);
      }
    };

    loadFromUrl();
    window.addEventListener('popstate', loadFromUrl);
    return () => window.removeEventListener('popstate', loadFromUrl);
  }, [history, session.user.id]);

  const selectFromHistory = (item) => {
    setRecipe(item.content);
    setRecipeId(item.id);
    window.history.pushState({}, '', `/recipe/${item.id}`);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const exportPDF = async () => {
    if (!recipe) return;
    setIsExporting(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = 210, pageH = 297, margin = 10;
      const innerW = pageW - margin * 2;
      const innerH = pageH - margin * 2;
      const containerWidth = 794; 

      const captureSection = async (htmlContent) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `position:fixed;top:0;left:-9999px;width:${containerWidth}px;z-index:99999;pointer-events:none;background:white;`;
        wrapper.innerHTML = htmlContent;
        document.body.appendChild(wrapper);
        await new Promise(r => setTimeout(r, 100));
        const canvas = await html2canvas(wrapper, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff', logging: false, allowTaint: true, width: containerWidth });
        document.body.removeChild(wrapper);
        return canvas;
      };

      let isFirstPage = true;
      const addCanvasToPDF = (canvas, sectionTitle) => {
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const drawW = innerW;
        const drawH = (canvas.height * drawW) / canvas.width;
        let heightLeft = drawH;
        let yPos = margin;

        while (heightLeft > 0) {
          if (!isFirstPage) pdf.addPage();
          isFirstPage = false;
          pdf.addImage(imgData, 'JPEG', margin, yPos, drawW, drawH);
          pdf.setFontSize(7);
          pdf.setTextColor(180);
          pdf.text(`RECAI  |  ${recipe.title}  |  ${sectionTitle}`, pageW / 2, 7, { align: 'center' });
          heightLeft -= innerH;
          yPos -= innerH;
        }
      };

      const coverHTML = `
        <div style="text-align:center;padding:100px 80px 60px;background:white;font-family:Georgia,serif;">
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:32px;">
            ${(recipe.dietary_labels || []).map(l => `<span style="background:#f0fdf4;color:#10b981;padding:8px 16px;border-radius:100px;font-size:0.8rem;font-weight:700;text-transform:uppercase;">${l}</span>`).join('')}
          </div>
          <h1 style="font-size:3.8rem;margin-bottom:32px;line-height:1.15;">${recipe.title}</h1>
          <div style="display:flex;align-items:center;gap:24px;justify-content:center;margin-bottom:48px;">
            <div style="font-size:1.5rem;font-weight:700;color:#047857;">Health Score: ${recipe.health_score}/10</div>
            <div style="font-size:1.5rem;color:#6b7280;">${recipe.prep_time}</div>
          </div>
          <div style="background:#f0fdf4;padding:48px;border-radius:40px;display:flex;justify-content:space-around;text-align:center;">
            ${(recipe.nutrition || '').split('|').map(item => {
              const p = item.trim().split(' ');
              return `<div><p style="font-size:2.5rem;font-weight:800;color:#064e3b;margin:0 0 4px;">${p[0]}</p><p style="font-size:1rem;color:#047857;font-weight:700;margin:0;">${p.slice(1).join(' ')}</p></div>`;
            }).join('')}
          </div>
          ${recipe.nutrition_focus ? `<div style="margin-top:48px;font-size:1.2rem;font-style:italic;color:#374151;">"${recipe.nutrition_focus}"</div>` : ''}
          <div style="margin-top:80px;font-size:0.9rem;color:#9ca3af;">Generated by RECAI — Health-First Recipe AI</div>
        </div>`;
      addCanvasToPDF(await captureSection(coverHTML), 'Cover');

      const ingredientsHTML = `
        <div style="padding:60px 80px;background:white;font-family:system-ui,-apple-system,sans-serif;">
          <h2 style="font-size:2.5rem;font-weight:800;margin-bottom:60px;text-align:center;border-bottom:2px solid #f3f4f6;padding-bottom:32px;">Ingredients &amp; Safety</h2>
          <div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-bottom:60px;">
            ${recipe.ingredients.map(ing => `<span style="padding:16px 24px;background:#f9fafb;border-radius:16px;border:1px solid #e5e7eb;font-size:1.2rem;">${ing}</span>`).join('')}
          </div>
          ${recipe.local_swaps && recipe.local_swaps.length > 0 ? `
            <div style="padding:40px;background:#f0fdf4;border-radius:40px;">
              <h3 style="margin-bottom:32px;text-align:center;font-size:1.8rem;">Smart Local Substitutions</h3>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;">
                ${recipe.local_swaps.map(s => `
                  <div style="background:white;padding:32px;border-radius:24px;">
                    <p style="font-weight:700;color:#6b7280;margin:0 0 8px;">Instead of ${s.original}</p>
                    <p style="font-size:1.4rem;font-weight:800;color:#10b981;margin:0;">Use ${s.substitute}</p>
                  </div>`).join('')}
              </div>
            </div>` : ''}
        </div>`;
      addCanvasToPDF(await captureSection(ingredientsHTML), 'Ingredients');

      const stepsHTML = `
        <div style="padding:60px 80px;background:white;font-family:system-ui,-apple-system,sans-serif;">
          <h2 style="font-size:2.5rem;font-weight:800;margin-bottom:60px;text-align:center;border-bottom:2px solid #f3f4f6;padding-bottom:32px;">Preparation Methodology</h2>
          <div style="display:flex;flex-direction:column;gap:48px;">
            ${recipe.steps.map((step, i) => `
              <div style="display:flex;gap:32px;align-items:flex-start;">
                <span style="font-size:3.5rem;font-weight:900;color:#d1fae5;line-height:1;min-width:60px;">${i + 1}</span>
                <p style="font-size:1.3rem;color:#374151;line-height:1.8;margin:0;">${step}</p>
              </div>`).join('')}
          </div>
        </div>`;
      addCanvasToPDF(await captureSection(stepsHTML), 'Preparation');

      if (recipe.cooking_timeline && recipe.cooking_timeline.length > 0) {
        const maxTime = Math.max(...recipe.cooking_timeline.map(t => (t.start_time + t.duration) * 60));
        const timelineHTML = `
          <div style="padding:60px 80px;background:white;font-family:system-ui,-apple-system,sans-serif;">
            <h2 style="font-size:2.5rem;font-weight:800;margin-bottom:60px;text-align:center;border-bottom:2px solid #f3f4f6;padding-bottom:32px;">Cooking Timeline</h2>
            <div style="display:flex;flex-direction:column;gap:20px;">
              ${recipe.cooking_timeline.map(task => `
                <div style="display:flex;align-items:center;gap:16px;">
                  <div style="width:140px;font-size:0.9rem;font-weight:700;color:#6b7280;">${task.task}</div>
                  <div style="flex:1;position:relative;height:18px;background:#f3f4f6;border-radius:100px;overflow:hidden;">
                    <div style="position:absolute;left:${(task.start_time * 60 / maxTime) * 100}%;width:${(task.duration * 60 / maxTime) * 100}%;height:100%;background:#10b981;opacity:0.6;border-radius:100px;"></div>
                  </div>
                  <div style="width:50px;font-size:0.8rem;font-weight:800;color:#6b7280;">${task.duration}m</div>
                </div>`).join('')}
            </div>
          </div>`;
        addCanvasToPDF(await captureSection(timelineHTML), 'Timeline');
      }

      const safeTitle = recipe.title?.replace(/[^a-z0-9]/gi, '_') || 'Recipe';
      const filename = `${safeTitle}_RECAI.pdf`;
      const pdfArrayBuffer = pdf.output('arraybuffer');
      const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
      saveAs(blob, filename);

    } catch (err) {
      console.error('CRITICAL PDF ERROR:', err);
      alert('PDF generation failed. Check the console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!recipeId) {
      const found = history.find(h => h.title === recipe?.title);
      if (found) setRecipeId(found.id);
      else return;
    }

    setSharing(true);
    try {
      const idToShare = recipeId || history.find(h => h.title === recipe?.title)?.id;
      const { error } = await supabase.from('recipes').update({ is_public: true }).eq('id', idToShare);
      if (error) throw error;
      const shareUrl = `${window.location.origin}/share/${idToShare}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error("SHARE ERROR:", error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Animated background blobs from index.css */}
      <div className="dash-bg-blobs">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />
      </div>

      <AnimatePresence>
        {(loading || isExporting) && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', inset: 0, zIndex: 3000, 
              background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px'
            }}
          >
            <Loader2 className="spin" size={48} color="var(--primary)" />
            <p style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '1.1rem' }}>
              {isExporting ? "Rendering Academic PDF..." : "Chef is designing your recipe..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside 
            initial={{ x: -320, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: -320, opacity: 0 }} 
            className="dashboard-sidebar"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{ padding: '10px', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', borderRadius: '14px', color: 'white', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                <Leaf size={24} />
              </div>
              <h1 className="serif" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-dark)', letterSpacing: '-0.03em' }}>RECAI</h1>
            </div>
            
            <button onClick={() => { setRecipe(null); setRecipeId(null); setPrompt(''); window.history.pushState({}, '', '/'); }} className="btn btn-primary" style={{ marginBottom: '32px', width: '100%', justifyContent: 'center', fontSize: '1rem' }}>
              <Plus size={20} />New Recipe
            </button>
            
            <div style={{ flex: 1, overflowY: 'auto', marginRight: '-12px', paddingRight: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Clock size={16} color="var(--text-light)" />
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>History</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.map(item => (
                  <motion.div 
                    key={item.id} 
                    className={`history-item ${recipeId === item.id ? 'active' : ''}`}
                    onClick={() => selectFromHistory(item)} 
                  >
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: recipeId === item.id ? 'var(--primary-dark)' : 'var(--text-main)', marginBottom: '4px', lineHeight: 1.3 }}>{item.title}</p>
                    <p style={{ fontSize: '0.75rem', color: recipeId === item.id ? 'var(--primary)' : 'var(--text-light)', fontWeight: 500 }}>{new Date(item.created_at).toLocaleDateString()}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <button onClick={onLogout} className="btn btn-ghost" style={{ width: '100%', color: '#ef4444', borderColor: '#fee2e2', background: 'rgba(255,255,255,0.7)' }}>
                 <LogOut size={18} />Sign Out
               </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="dashboard-main">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="glass" style={{ position: 'absolute', top: '32px', left: '32px', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', zIndex: 100, border: '1px solid rgba(255,255,255,0.8)' }}>
          {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
        
        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', paddingTop: '16px', paddingBottom: '60px' }}>
          <div style={{ position: 'sticky', top: '16px', zIndex: 40, paddingBottom: '16px' }}>
            <form onSubmit={handleGenerate} className="search-bar-glass">
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '20px', color: 'var(--primary)' }}>
                <Search size={22} />
              </div>
              <input 
                type="text" 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder="High protein breakfast..." 
                style={{ flex: 1, padding: '16px 8px', border: 'none', background: 'transparent', fontSize: '1.15rem', outline: 'none', color: 'var(--text-main)', fontWeight: 500 }} 
              />
              
              <div className="search-buttons-wrapper">
                <button 
                  type="button"
                  onClick={() => setIsLocalMode(!isLocalMode)}
                  className={`btn ${isLocalMode ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '0 16px', height: '44px', borderRadius: '12px', display: 'flex', gap: '8px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                >
                  <Globe size={16} />
                  {isLocalMode ? "Local Mode On" : "Local Mode Off"}
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0 32px', height: '44px', fontSize: '0.95rem', borderRadius: '12px' }}>
                  {loading ? <Loader2 className="spin" size={20} /> : "Generate"}
                </button>
              </div>
            </form>
          </div>

          <AnimatePresence mode="wait">
            {error && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '20px', borderRadius: 'var(--radius)', textAlign: 'center', marginTop: '32px', fontWeight: 500 }}>{error}</motion.div>}
            
            {recipe && (
              <motion.div key={recipeId || recipe.title} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="recipe-card-glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '48px', flexWrap: 'wrap', gap: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                      {recipe.dietary_labels?.map(label => (
                        <span key={label} style={{ background: 'var(--primary-glow)', color: 'var(--primary-dark)', padding: '6px 14px', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                      ))}
                    </div>
                    
                    <h3 className="serif recipe-title" style={{ fontSize: '3.5rem', marginBottom: '24px', lineHeight: 1.1, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{recipe.title}</h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <div className="recipe-stat-pill">
                        <ShieldCheck size={20} /> Health Score: {recipe.health_score}/10
                      </div>
                      <div className="recipe-stat-pill" style={{ background: 'rgba(0,0,0,0.03)', color: 'var(--text-muted)', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <Clock size={20} /> {recipe.prep_time}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }} data-html2canvas-ignore="true">
                    <button onClick={exportPDF} className="btn btn-ghost" style={{ padding: '14px', borderRadius: '14px', background: 'white' }}>
                      {loading ? <Loader2 className="spin" size={22} /> : <Download size={22} />}
                    </button>
                    <button onClick={handleShare} disabled={sharing} className="btn btn-ghost" style={{ padding: '14px', borderRadius: '14px', background: 'white', position: 'relative' }}>
                      {sharing ? <Loader2 className="spin" size={22} /> : (copied ? <ClipboardCheck size={22} color="var(--primary)" /> : <Share2 size={22} />)}
                    </button>
                  </div>
                </div>

                {recipe.local_swaps && recipe.local_swaps.length > 0 && (
                  <div className="local-swaps-box" style={{ marginBottom: '48px' }}>
                    <h4 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary-dark)' }}>
                      <ArrowRightLeft size={24} />
                      Smart Local Substitutions
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                      {recipe.local_swaps.map((swap, i) => (
                        <div key={i} style={{ background: 'var(--glass-strong)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: 'var(--shadow-sm)' }}>
                          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Instead of <span style={{ textDecoration: 'line-through' }}>{swap.original}</span></p>
                          <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '8px' }}>Use {swap.substitute}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="nutrition-box" style={{ marginBottom: '48px' }}>
                  {recipe.nutrition?.split('|').map((item, i) => {
                    const parts = item.trim().split(' ');
                    return (
                      <div key={i} style={{ padding: '0 16px' }}>
                        <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '4px' }}>{parts[0]}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{parts.slice(1).join(' ')}</p>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '64px', alignItems: 'start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
                      <Zap size={24} color="var(--accent-gold)" />
                      Ingredients
                    </h4>
                    <ul style={{ listStyle: 'none' }}>
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} style={{ padding: '16px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.05rem', color: 'var(--text-muted)' }}>
                          <div style={{ height: '8px', width: '8px', background: 'var(--primary)', borderRadius: '2px', opacity: 0.8 }}></div>
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
                      <Flame size={24} color="var(--primary)" />
                      Preparation
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                      {recipe.steps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: '24px' }}>
                          <span className="serif" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary-light)', opacity: 0.4, lineHeight: 0.8, marginTop: '8px' }}>{i+1}</span>
                          <p style={{ fontSize: '1.1rem', color: 'var(--text-main)', lineHeight: 1.8 }}>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <TimelineVisualizer timeline={recipe.cooking_timeline} onStartCook={() => setIsCookMode(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cook Mode Overlay Integration */}
        <AnimatePresence>
          {isCookMode && recipe && (
            <CookModeOverlay 
              timeline={recipe.cooking_timeline} 
              title={recipe.title} 
              onClose={() => setIsCookMode(false)} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- PUBLIC RECIPE VIEW COMPONENT ---
function PublicRecipe({ id }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    supabase.from('recipes').select('*').eq('id', id).eq('is_public', true).single()
      .then(({ data }) => {
        if (data) setRecipe(data.content);
        setLoading(false);
      });
  }, [id]);

  const exportPDF = async () => {
    if (!recipe) return;
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = 210, margin = 10;
      const innerW = pageW - margin * 2;
      const innerH = 297 - margin * 2;
      const cw = 794;

      const cap = async (html) => {
        const w = document.createElement('div');
        w.style.cssText = `position:fixed;top:0;left:-9999px;width:${cw}px;z-index:99999;pointer-events:none;background:white;`;
        w.innerHTML = html;
        document.body.appendChild(w);
        await new Promise(r => setTimeout(r, 100));
        const c = await html2canvas(w, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff', logging: false, allowTaint: true, width: cw });
        document.body.removeChild(w);
        return c;
      };

      let first = true;
      const add = (canvas, title) => {
        const img = canvas.toDataURL('image/jpeg', 0.85);
        const dW = innerW, dH = (canvas.height * dW) / canvas.width;
        let hL = dH, y = margin;
        while (hL > 0) { if (!first) pdf.addPage(); first = false; pdf.addImage(img, 'JPEG', margin, y, dW, dH); pdf.setFontSize(7); pdf.setTextColor(180); pdf.text(`RECAI  |  ${recipe.title}  |  ${title}`, pageW / 2, 7, { align: 'center' }); hL -= innerH; y -= innerH; }
      };

      add(await cap(`<div style="text-align:center;padding:100px 80px 60px;background:white;font-family:Georgia,serif;"><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:32px;">${(recipe.dietary_labels||[]).map(l=>`<span style="background:#f0fdf4;color:#10b981;padding:8px 16px;border-radius:100px;font-size:0.8rem;font-weight:700;text-transform:uppercase;">${l}</span>`).join('')}</div><h1 style="font-size:3.8rem;margin-bottom:32px;line-height:1.15;">${recipe.title}</h1><div style="display:flex;align-items:center;gap:24px;justify-content:center;margin-bottom:48px;"><div style="font-size:1.5rem;font-weight:700;color:#047857;">Health Score: ${recipe.health_score}/10</div><div style="font-size:1.5rem;color:#6b7280;">${recipe.prep_time}</div></div><div style="background:#f0fdf4;padding:48px;border-radius:40px;display:flex;justify-content:space-around;text-align:center;">${(recipe.nutrition||'').split('|').map(i=>{const p=i.trim().split(' ');return `<div><p style="font-size:2.5rem;font-weight:800;color:#064e3b;margin:0 0 4px;">${p[0]}</p><p style="font-size:1rem;color:#047857;font-weight:700;margin:0;">${p.slice(1).join(' ')}</p></div>`;}).join('')}</div><div style="margin-top:80px;font-size:0.9rem;color:#9ca3af;">Generated by RECAI</div></div>`), 'Cover');

      add(await cap(`<div style="padding:60px 80px;background:white;font-family:system-ui,sans-serif;"><h2 style="font-size:2.5rem;font-weight:800;margin-bottom:60px;text-align:center;border-bottom:2px solid #f3f4f6;padding-bottom:32px;">Ingredients &amp; Swaps</h2><div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-bottom:60px;">${recipe.ingredients.map(i=>`<span style="padding:16px 24px;background:#f9fafb;border-radius:16px;border:1px solid #e5e7eb;font-size:1.2rem;">${i}</span>`).join('')}</div>${recipe.local_swaps&&recipe.local_swaps.length>0?`<div style="padding:40px;background:#f0fdf4;border-radius:40px;"><h3 style="margin-bottom:32px;text-align:center;font-size:1.8rem;">Local Substitutions</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;">${recipe.local_swaps.map(s=>`<div style="background:white;padding:32px;border-radius:24px;"><p style="font-weight:700;color:#6b7280;margin:0 0 8px;">Instead of ${s.original}</p><p style="font-size:1.4rem;font-weight:800;color:#10b981;margin:0;">Use ${s.substitute}</p></div>`).join('')}</div></div>`:''}</div>`), 'Ingredients');

      add(await cap(`<div style="padding:60px 80px;background:white;font-family:system-ui,sans-serif;"><h2 style="font-size:2.5rem;font-weight:800;margin-bottom:60px;text-align:center;border-bottom:2px solid #f3f4f6;padding-bottom:32px;">Preparation</h2><div style="display:flex;flex-direction:column;gap:48px;">${recipe.steps.map((s,i)=>`<div style="display:flex;gap:32px;align-items:flex-start;"><span style="font-size:3.5rem;font-weight:900;color:#d1fae5;line-height:1;min-width:60px;">${i+1}</span><p style="font-size:1.3rem;color:#374151;line-height:1.8;margin:0;">${s}</p></div>`).join('')}</div></div>`), 'Preparation');

      if (recipe.cooking_timeline?.length > 0) {
        const mx = Math.max(...recipe.cooking_timeline.map(t => (t.start_time + t.duration) * 60));
        add(await cap(`<div style="padding:60px 80px;background:white;font-family:system-ui,sans-serif;"><h2 style="font-size:2.5rem;font-weight:800;margin-bottom:60px;text-align:center;border-bottom:2px solid #f3f4f6;padding-bottom:32px;">Cooking Timeline</h2><div style="display:flex;flex-direction:column;gap:20px;">${recipe.cooking_timeline.map(t=>`<div style="display:flex;align-items:center;gap:16px;"><div style="width:140px;font-size:0.9rem;font-weight:700;color:#6b7280;">${t.task}</div><div style="flex:1;position:relative;height:18px;background:#f3f4f6;border-radius:100px;overflow:hidden;"><div style="position:absolute;left:${(t.start_time*60/mx)*100}%;width:${(t.duration*60/mx)*100}%;height:100%;background:#10b981;opacity:0.6;border-radius:100px;"></div></div><div style="width:50px;font-size:0.8rem;font-weight:800;color:#6b7280;">${t.duration}m</div></div>`).join('')}</div></div>`), 'Timeline');
      }

      const safeTitle = recipe.title?.replace(/[^a-z0-9]/gi, '_') || 'Recipe';
      const filename = `${safeTitle}_RECAI.pdf`;
      const pdfBuf = pdf.output('arraybuffer');
      const blob = new Blob([pdfBuf], { type: 'application/pdf' });
      saveAs(blob, filename);
    } catch (err) { console.error('PDF ERROR:', err); alert('PDF generation failed.'); }
    finally { setIsExporting(false); }
  };

  return (
    <div style={{ background: '#f0fdf4', minHeight: '100vh', padding: '50px 20px', display: 'flex', justifyContent: 'center' }}>
      {/* Exporting Overlay */}
      <AnimatePresence>
        {(loading || isExporting) && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}
          >
            <Loader2 className="spin" size={48} color="var(--primary)" />
            <p style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{isExporting ? "Generating PDF..." : "Loading Recipe..."}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {recipe && (
        <div className="recipe-card-glass" style={{ maxWidth: '900px', width: '100%' }}>
          <button onClick={exportPDF} data-html2canvas-ignore="true" className="btn btn-ghost" style={{ position: 'absolute', top: '24px', right: '24px', padding: '12px' }}>
            {isExporting ? <Loader2 className="spin" size={22} /> : <Download size={22} />}
          </button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '48px', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {recipe.dietary_labels?.map(label => (
                  <span key={label} style={{ background: 'var(--primary-glow)', color: 'var(--primary-dark)', padding: '6px 14px', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                ))}
              </div>
              <h1 className="serif recipe-title" style={{ fontSize: '3.5rem', marginBottom: '24px', lineHeight: 1.1, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{recipe.title}</h1>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div className="recipe-stat-pill">
                  <ShieldCheck size={20} /> Health Score: {recipe.health_score}/10
                </div>
                <div className="recipe-stat-pill" style={{ background: 'rgba(0,0,0,0.03)', color: 'var(--text-muted)', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <Clock size={20} /> {recipe.prep_time}
                </div>
              </div>
            </div>
          </div>

          <div className="nutrition-box" style={{ marginBottom: '48px' }}>
            {recipe.nutrition?.split('|').map((item, i) => {
              const parts = item.trim().split(' ');
              return (
                <div key={i} style={{ padding: '0 16px' }}>
                  <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '4px' }}>{parts[0]}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{parts.slice(1).join(' ')}</p>
                </div>
              );
            })}
          </div>

          <div className="recipe-content-grid" style={{ marginBottom: '48px' }}>
            <div>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
                <Zap size={24} color="var(--accent-gold)" /> Ingredients
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recipe.ingredients.map((ing, i) => (
                  <div key={i} style={{ padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', fontSize: '1.05rem', color: 'var(--text-muted)' }}>{ing}</div>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
                <Flame size={24} color="var(--primary)" /> Preparation
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {recipe.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '24px' }}>
                    <span className="serif" style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary-light)', opacity: 0.4, lineHeight: 0.8, marginTop: '8px' }}>{i+1}</span>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-main)', lineHeight: 1.8 }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {recipe.local_swaps && recipe.local_swaps.length > 0 && (
            <div className="local-swaps-box" style={{ marginBottom: '48px' }}>
              <h4 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary-dark)' }}>
                <ArrowRightLeft size={24} /> Smart Local Substitutions
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {recipe.local_swaps.map((s, i) => (
                  <div key={i} style={{ background: 'var(--glass-strong)', padding: '24px', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: 'var(--shadow-sm)' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Instead of <span style={{ textDecoration: 'line-through' }}>{s.original}</span></p>
                    <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '8px' }}>Use {s.substitute}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <TimelineVisualizer timeline={recipe.cooking_timeline} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [shareId, setShareId] = useState(null);

  useEffect(() => {
    const handleRoute = () => {
      const path = window.location.pathname;
      if (path.startsWith('/share/')) setShareId(path.split('/share/')[1]);
      else setShareId(null);
    };
    handleRoute();
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  if (shareId) return <PublicRecipe id={shareId} />;
  if (!session) return <Auth onAuthSuccess={(user) => setSession({ user })} />;
  return <Dashboard session={session} onLogout={() => supabase.auth.signOut()} />;
}

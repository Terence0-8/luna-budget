import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  LayoutDashboard, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Repeat,
  Receipt,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Menu,
  PieChart as PieChartIcon,
  X,
  LogOut,
  UserCircle2,
  Loader2,
  KeyRound,
  Wallet,
  Plane,
  Pencil,
  Save,
  Target,
  Trash2,
  Archive,
  History,
  Undo2,
  CalendarDays,
  AlertTriangle,
  Check,
  Download,
  Share,
  Smartphone
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  deleteDoc,
  query, 
  where,
  updateDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';

// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDBDhOTlBdKDSpM2M0fy8L0N7LyRQzf0Mk",
  authDomain: "luna-budget.firebaseapp.com",
  projectId: "luna-budget",
  storageBucket: "luna-budget.firebasestorage.app",
  messagingSenderId: "1008826442724",
  appId: "1:1008826442724:web:724fb2669678cadac41df1"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'luna-budget-app';

// LOGO
const LOGO_URL = "logo.png";

// --- CONSTANTES ---
const DEFAULT_CATEGORIES = [
  { id: 'alim', label: 'Alimentation', color: '#10b981' },
  { id: 'log', label: 'Logement', color: '#8b5cf6' },
  { id: 'trans', label: 'Transport', color: '#f59e0b' },
  { id: 'lois', label: 'Loisirs', color: '#ec4899' },
  { id: 'sant', label: 'Santé', color: '#ef4444' },
  { id: 'shop', label: 'Shopping', color: '#6366f1' },
  { id: 'autre', label: 'Autre', color: '#64748b' }
];

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// --- UTILS ---
const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  return { days, firstDay: adjustedFirstDay };
};

const generateColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 50%)`;
};

// --- COMPOSANTS UI ---

const GlassCard = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-5 md:p-6 transition-all duration-300 hover:bg-white/60 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] hover:scale-[1.01] active:scale-[0.99] ${className}`}
  >
    {children}
  </div>
);

const ProgressBar = ({ current, max, label = "Budget consommé", colorClass = "from-blue-400 via-purple-400 to-pink-400" }) => {
  const safeMax = max || 1;
  const percentage = Math.min(100, Math.max(0, (current / safeMax) * 100));
  const isOver = current > safeMax;
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        <span>{label}</span>
        <span className={isOver ? "text-red-500" : "text-purple-600"}>{percentage.toFixed(0)}%</span>
      </div>
      <div className="relative h-3 w-full bg-white/50 rounded-full overflow-hidden border border-white/40 shadow-inner">
        <div 
          className={`h-full transition-all duration-1000 ease-out rounded-full bg-gradient-to-r ${isOver ? 'from-red-400 to-red-600' : colorClass}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const CustomSelect = ({ options, value, onChange, placeholder = "Sélectionner" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/40 p-3 rounded-xl border border-white/60 focus:ring-2 ring-pink-200 cursor-pointer flex justify-between items-center transition-all hover:bg-white/60"
      >
        <div className="flex items-center gap-2">
           {selectedOption?.color && (
             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedOption.color }}></div>
           )}
           <span className={`font-medium text-sm ${selectedOption ? 'text-slate-700' : 'text-slate-400'}`}>
             {selectedOption ? selectedOption.label : placeholder}
           </span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl border border-white/60 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 animate-in slide-in-from-top-2 duration-200 custom-scrollbar">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`p-3 text-sm font-medium cursor-pointer transition-colors flex items-center gap-2
                ${value === option.value ? 'bg-pink-50 text-pink-600' : 'text-slate-600 hover:bg-slate-100'}
              `}
            >
              {option.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: option.color }}></div>}
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SimplePieChart = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  if (total === 0) return (
    <div className="flex flex-col items-center justify-center h-48 text-slate-400 opacity-60">
      <PieChartIcon size={48} className="mb-2 text-slate-300"/>
      <p className="text-sm font-medium">Pas de données</p>
    </div>
  );

  let cumulativePercent = 0;
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = data.map((slice, index) => {
    const startPercent = cumulativePercent;
    const slicePercent = slice.value / total;
    cumulativePercent += slicePercent;
    const endPercent = cumulativePercent;
    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);
    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
    const pathData = [
      `M 0 0`,
      `L ${startX} ${startY}`,
      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `L 0 0`,
    ].join(' ');

    return (
      <path key={index} d={pathData} fill={slice.color} className="transition-opacity hover:opacity-80" />
    );
  });

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
      <div className="w-32 h-32 md:w-40 md:h-40 relative flex-shrink-0">
        <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full overflow-visible drop-shadow-xl">
           {slices}
        </svg>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-2">
         {data.sort((a,b) => b.value - a.value).map((item, idx) => (
           <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <div className="w-2 h-2 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: item.color }}></div>
              <span className="truncate max-w-[80px] md:max-w-none">{item.label}</span>
              <span className="text-slate-400 font-normal">({Math.round((item.value/total)*100)}%)</span>
           </div>
         ))}
      </div>
    </div>
  );
};

// --- MODAL CONFIRMATION ---
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirmer", confirmColor = "bg-red-500", icon: Icon = AlertTriangle }) => {
    if (!isOpen) return null;
    const isDestructive = confirmColor.includes('red');
    const iconBg = isDestructive ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500';

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${iconBg}`}>
                        <Icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                    <p className="text-sm text-slate-500">{message}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors">
                        Annuler
                    </button>
                    <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl text-white font-bold shadow-lg transition-transform active:scale-95 ${confirmColor}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MODAL INSTALLATION PWA ---
const InstallHelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div onClick={onClose} className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
       <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-sm p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-300 pb-safe">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-black text-slate-800">Installer l'app</h3>
             <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
          </div>
          <div className="space-y-4">
             <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                  <Share className="text-blue-500" size={20} />
                </div>
                <p className="text-sm text-slate-600 font-medium">1. Appuyez sur le bouton <span className="font-bold">Partager</span> dans la barre de votre navigateur.</p>
             </div>
             <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                   <div className="border-2 border-slate-400 rounded w-5 h-5 flex items-center justify-center">
                      <Plus size={12} className="text-slate-400" />
                   </div>
                </div>
                <p className="text-sm text-slate-600 font-medium">2. Cherchez et sélectionnez <span className="font-bold">Sur l'écran d'accueil</span>.</p>
             </div>
             <div className="text-center pt-2">
               <p className="text-xs text-slate-400">Cela installera Luna comme une vraie application sur votre iPhone.</p>
             </div>
          </div>
          <div className="h-6 md:hidden"></div>
       </div>
    </div>
  );
};

// --- CALENDRIER ELEGANT ---
const CalendarPopup = ({ selectedDate, onChange, onClose }) => {
    const [viewDate, setViewDate] = useState(new Date(selectedDate));
    const { days, firstDay } = getDaysInMonth(viewDate);
    const today = new Date();
    const wrapperRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const handleDayClick = (day) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const offsetDate = new Date(newDate.getTime() - (newDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        onChange(offsetDate);
        onClose();
    };

    const changeMonth = (delta) => {
        const newDate = new Date(viewDate.setMonth(viewDate.getMonth() + delta));
        setViewDate(new Date(newDate));
    };

    return (
        <div ref={wrapperRef} className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-2xl border border-white/60 p-4 rounded-3xl shadow-2xl z-50 w-72 animate-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={(e) => {e.preventDefault(); changeMonth(-1)}} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft size={16} /></button>
                <span className="font-bold text-slate-800 capitalize">{MONTHS_FR[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                <button type="button" onClick={(e) => {e.preventDefault(); changeMonth(1)}} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ChevronRight size={16} /></button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {DAYS_FR.map(d => <span key={d} className="text-[10px] font-bold text-slate-400 uppercase">{d}</span>)}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
                {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                {Array(days).fill(null).map((_, i) => {
                    const day = i + 1;
                    const isSelected = new Date(selectedDate).getDate() === day && new Date(selectedDate).getMonth() === viewDate.getMonth();
                    const isToday = today.getDate() === day && today.getMonth() === viewDate.getMonth() && today.getFullYear() === viewDate.getFullYear();
                    
                    return (
                        <button 
                            key={day} 
                            onClick={(e) => {e.preventDefault(); handleDayClick(day)}}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                                ${isSelected ? 'bg-purple-500 text-white shadow-lg shadow-purple-200 scale-110' : 'text-slate-700 hover:bg-slate-100'}
                                ${isToday && !isSelected ? 'border border-purple-200 text-purple-600' : ''}
                            `}
                        >
                            {day}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

// --- LOGIN SCREEN ---
const LoginScreen = ({ onLogin, deferredPrompt, isIOS, onShowInstallHelp }) => {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setTimeout(() => {
      onLogin(key.trim().toLowerCase());
      setLoading(false);
    }, 800);
  };

  const handleInstallClick = () => {
      if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
              if (choiceResult.outcome === 'accepted') {
                  console.log('User accepted the install prompt');
              }
          });
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden font-sans">
       <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[90px] animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-pink-300/40 rounded-full mix-blend-multiply filter blur-[90px] animate-blob animation-delay-2000"></div>
       </div>

       <div className="w-full max-w-sm bg-white/60 backdrop-blur-xl border border-white/80 shadow-2xl rounded-3xl p-8 relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center mb-8">
             <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4">
               <img src={LOGO_URL} alt="Luna" className="w-10 h-10 object-contain" />
             </div>
             <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">LUNA</h1>
             <p className="text-slate-500 font-medium text-sm text-center">Votre budget partagé</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Identifiant Unique</label>
                <div className="bg-white/50 border border-white/60 rounded-xl px-3 py-3 flex items-center gap-3 focus-within:ring-2 ring-purple-200 transition-all">
                  <KeyRound size={20} className="text-purple-500" />
                  <input 
                    type="text" 
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    required 
                    className="w-full bg-transparent outline-none font-bold text-slate-800 placeholder:font-normal"
                    placeholder="ex: budget-famille"
                    autoCapitalize="none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 px-1 leading-tight">
                  Créez ou entrez un identifiant. Partagez ce même mot-clé avec vos proches pour voir le même budget.
                </p>
             </div>

             <button 
               type="submit" 
               disabled={loading || !key}
               className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {loading ? <Loader2 size={20} className="animate-spin" /> : "Accéder au budget"}
             </button>
          </form>

          {/* INSTALL PROMPTS */}
          <div className="mt-8 pt-6 border-t border-slate-200/50">
             {deferredPrompt && (
                 <button onClick={handleInstallClick} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all">
                     <Download size={16} /> Installer l'application
                 </button>
             )}
             {isIOS && !deferredPrompt && (
                 <button onClick={onShowInstallHelp} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
                     <Smartphone size={16} /> Installer sur iPhone
                 </button>
             )}
          </div>
       </div>
    </div>
  );
};

// --- FORMULAIRES ---

const ExpenseForm = ({ onSubmit, categories, defaultCategory, initialData = null, buttonLabel = "Ajouter" }) => {
  const isInitialCustom = initialData?.category && !categories.some(c => c.label === initialData.category);
  const [expenseCategory, setExpenseCategory] = useState(
    isInitialCustom ? 'custom' : (initialData?.category || defaultCategory)
  );
  const [isCustomCategory, setIsCustomCategory] = useState(isInitialCustom);
  const [customCategoryName, setCustomCategoryName] = useState(isInitialCustom ? initialData.category : '');
  const [dateVal, setDateVal] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.set('date', dateVal);
    const category = isCustomCategory ? customCategoryName : expenseCategory;
    if (isCustomCategory && !customCategoryName.trim()) {
        alert("Veuillez entrer un nom de catégorie.");
        return;
    }
    onSubmit(formData, category);
    if (!initialData) {
        e.target.reset();
        setExpenseCategory(categories[0]?.label || 'Autre');
        setIsCustomCategory(false);
        setCustomCategoryName('');
        setDateVal(new Date().toISOString().split('T')[0]);
    }
  };

  const categoryOptions = [
    ...categories.map(c => ({ value: c.label, label: c.label, color: c.color })),
    { value: 'custom', label: '✨ Créer une catégorie...', color: null }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 relative">
      <div className="bg-white/40 p-2 rounded-xl border border-white/60 focus-within:ring-2 ring-pink-200">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Montant</label>
          <div className="flex items-center">
            <input name="amount" type="number" step="0.01" required defaultValue={initialData?.amount} placeholder="0.00" className="w-full bg-transparent p-1 px-2 outline-none font-black text-2xl text-slate-800" autoFocus={!initialData} />
            <span className="text-slate-400 font-bold mr-2">€</span>
          </div>
      </div>
      <div className="bg-white/40 p-1 rounded-xl border border-white/60 focus-within:ring-2 ring-pink-200">
          <input name="name" required defaultValue={initialData?.name} placeholder="Quoi ? (ex: Carrefour)" className="w-full bg-transparent p-3 outline-none font-medium placeholder:text-slate-400 text-sm" />
      </div>
      
      <div className="grid grid-cols-2 gap-3 relative">
          <div className="relative">
              <CustomSelect 
                options={categoryOptions}
                value={isCustomCategory ? 'custom' : expenseCategory}
                onChange={(val) => {
                    if (val === 'custom') {
                        setIsCustomCategory(true);
                    } else {
                        setIsCustomCategory(false);
                        setExpenseCategory(val);
                    }
                }}
                placeholder="Catégorie"
              />
          </div>
          <div className="relative">
              <button 
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full h-full bg-white/40 p-3 rounded-xl border border-white/60 focus:ring-2 ring-pink-200 text-left font-medium text-slate-700 text-sm flex items-center justify-between"
              >
                  <span>{new Date(dateVal).toLocaleDateString('fr-FR')}</span>
                  <CalendarIcon size={16} className="text-slate-400" />
              </button>
              {showCalendar && (
                  <CalendarPopup 
                    selectedDate={dateVal} 
                    onChange={setDateVal} 
                    onClose={() => setShowCalendar(false)} 
                  />
              )}
          </div>
      </div>

      {isCustomCategory && (
        <div className="bg-white/40 p-1 rounded-xl border border-white/60 focus-within:ring-2 ring-pink-200 animate-in fade-in slide-in-from-top-2">
            <input type="text" value={customCategoryName} onChange={(e) => setCustomCategoryName(e.target.value)} placeholder="Nom de la nouvelle catégorie" className="w-full bg-transparent p-3 outline-none font-medium text-slate-800 text-sm" autoFocus />
            <p className="text-[10px] text-slate-400 px-3 pb-1">Cette catégorie sera sauvegardée pour le futur.</p>
        </div>
      )}
      
      <button className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all text-sm">
        {buttonLabel}
      </button>
    </form>
  );
};

const RecurringForm = ({ onSubmit }) => {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.target)); e.target.reset(); }} className="space-y-4">
      <div className="bg-white/40 p-1 rounded-xl border border-white/60 focus-within:ring-2 ring-purple-200">
          <input name="name" required placeholder="Nom (ex: Loyer)" className="w-full bg-transparent p-3 outline-none font-medium placeholder:text-slate-400" />
      </div>
      <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/40 p-1 rounded-xl border border-white/60 focus-within:ring-2 ring-purple-200">
            <input name="amount" type="number" step="0.01" required placeholder="Montant" className="w-full bg-transparent p-3 outline-none font-bold text-slate-800" />
          </div>
          <div className="bg-white/40 p-1 rounded-xl border border-white/60 focus-within:ring-2 ring-purple-200">
            <input name="day" type="number" min="1" max="31" required placeholder="Jour" className="w-full bg-transparent p-3 outline-none font-medium" />
          </div>
      </div>
      <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all text-sm">
        Sauvegarder
      </button>
      <p className="text-[10px] text-center text-slate-400">À partir de ce mois.</p>
    </form>
  );
};

const ProjectForm = ({ onSubmit, initialData, buttonLabel = "Créer le projet" }) => {
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.target)); if(!initialData) e.target.reset(); }} className="space-y-4">
             <div className="bg-white/40 p-1 rounded-xl border border-white/60 focus-within:ring-2 ring-blue-200">
                <input name="name" required defaultValue={initialData?.name} placeholder="Nom du projet (ex: Vacances Été)" className="w-full bg-transparent p-3 outline-none font-medium placeholder:text-slate-400" />
            </div>
            <div className="bg-white/40 p-2 rounded-xl border border-white/60 focus-within:ring-2 ring-blue-200">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Budget Total Prévu</label>
                <div className="flex items-center">
                    <input name="totalBudget" type="number" step="1" required defaultValue={initialData?.totalBudget} placeholder="0" className="w-full bg-transparent p-1 px-2 outline-none font-black text-2xl text-slate-800" />
                    <span className="text-slate-400 font-bold mr-2">€</span>
                </div>
            </div>
            <button className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all text-sm">
                {buttonLabel}
            </button>
        </form>
    );
}

// --- UI COMPONENTS ---

const TransactionRow = ({ day, month, title, amount, subtitle, onDelete, onEdit, isFuture, badgeColor }) => (
  <div className={`group flex items-center p-3 rounded-2xl transition-all hover:bg-white/60 border border-transparent hover:border-white/60 hover:shadow-sm ${isFuture ? 'opacity-70 grayscale-[0.3]' : ''}`}>
    <div className="flex-shrink-0 w-12 h-12 bg-white/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center mr-4 shadow-sm border border-white/50 transition-transform group-hover:scale-105">
      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{month}</span>
      <span className="text-lg font-black text-slate-700 leading-none">{day}</span>
    </div>
    <div className="flex-grow min-w-0">
      <h4 className="font-bold text-slate-800 text-sm truncate">{title}</h4>
      <div className="flex items-center gap-2">
          {badgeColor && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: badgeColor}}></div>}
          <p className="text-xs text-slate-500 font-medium truncate">{subtitle}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 pl-2">
      <span className="font-bold text-slate-800 whitespace-nowrap text-sm md:text-base mr-1">-{amount} €</span>
      {onEdit && (
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all opacity-100 lg:opacity-0 group-hover:opacity-100">
              <Pencil size={16} />
          </button>
      )}
      {onDelete && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-100 lg:opacity-0 group-hover:opacity-100">
          <Trash2 size={16} />
        </button>
      )}
    </div>
  </div>
);

const ProjectCard = ({ project, onClick, onDelete, onArchive }) => {
    const spent = (project.expenses || []).reduce((acc, curr) => acc + curr.amount, 0);
    return (
      <GlassCard onClick={onClick} className="cursor-pointer relative group overflow-hidden h-full flex flex-col justify-between transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
           <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl transition-transform duration-300 group-hover:scale-110">
                   <Plane size={24} />
               </div>
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   {onArchive && (
                       <button onClick={(e) => { e.stopPropagation(); onArchive(project); }} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all" title={project.archived ? "Désarchiver" : "Archiver"}>
                           {project.archived ? <Undo2 size={16} /> : <Archive size={16} />}
                       </button>
                   )}
                   {onDelete && (
                       <button onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all" title="Supprimer">
                           <Trash2 size={16} />
                       </button>
                   )}
               </div>
           </div>
           <div className={project.archived ? "opacity-60 grayscale-[0.5]" : ""}>
             <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-lg text-slate-800">{project.name}</h3>
                {project.archived && <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">ARCHIVÉ</span>}
             </div>
             <p className="text-xs text-slate-500 font-bold uppercase mb-4">Budget: {project.totalBudget}€</p>
             <ProgressBar current={spent} max={project.totalBudget} label="Consommé" colorClass="from-blue-400 to-cyan-400" />
           </div>
      </GlassCard>
    );
}

// --- APP PRINCIPALE ---

const App = () => {
  const [user, setUser] = useState(null);
  const [budgetKey, setBudgetKey] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // PWA & INSTALL
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  
  const [activeTab, setActiveTab] = useState('summary');
  const [currentDate, setCurrentDate] = useState(new Date()); 
  
  // States Modal & Popups
  const [showMobileAdd, setShowMobileAdd] = useState(false);
  const [mobileAddType, setMobileAddType] = useState('expense'); 
  const [editingExpense, setEditingExpense] = useState(null); 
  const [editingProjectExpense, setEditingProjectExpense] = useState(null);

  const [activeProject, setActiveProject] = useState(null); 
  const [isClosingProject, setIsClosingProject] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [showArchives, setShowArchives] = useState(false);

  // Confirmation State
  const [confirmation, setConfirmation] = useState(null);

  // Data
  const [recurringBills, setRecurringBills] = useState([]); 
  const [variableExpenses, setVariableExpenses] = useState([]); 
  const [monthIncome, setMonthIncome] = useState(0); 
  const [projects, setProjects] = useState([]); 
  const [customCategories, setCustomCategories] = useState([]);

  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const viewMonthEnd = useMemo(() => {
    const d = new Date(currentDate);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }, [currentDate]);
  
  const isFutureMonth = useMemo(() => {
    const today = new Date();
    return currentDate.getFullYear() > today.getFullYear() || (currentDate.getFullYear() === today.getFullYear() && currentDate.getMonth() > today.getMonth());
  }, [currentDate]);
  const isCurrentMonth = useMemo(() => {
    const today = new Date();
    return currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  }, [currentDate]);

  // Merge Default & Custom Categories
  const allCategories = useMemo(() => {
    const merged = [...DEFAULT_CATEGORIES];
    customCategories.forEach(custom => {
      if (!merged.some(c => c.label.toLowerCase() === custom.label.toLowerCase())) {
        merged.push(custom);
      }
    });
    return merged;
  }, [customCategories]);

  // Auth & Sync
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const savedKey = localStorage.getItem('luna_budget_key');
    if (savedKey) setBudgetKey(savedKey);
    return onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
  }, []);

  // PWA Install Prompt Listener & iOS Detection
  useEffect(() => {
      // Android / PC detection
      const handleBeforeInstallPrompt = (e) => {
          e.preventDefault();
          setDeferredPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // iOS Detection
      const checkIsIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      setIsIOS(checkIsIOS);

      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Listeners
  useEffect(() => {
    if (!user || !budgetKey) return;

    // Recurring
    const unsubRecurring = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'luna_shared_recurring'), where('budgetKey', '==', budgetKey)), (snapshot) => {
      setRecurringBills(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Month History
    const docId = `${budgetKey}_${monthKey}`;
    const unsubMonth = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'luna_shared_history', docId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMonthIncome(data.income || 0);
        setVariableExpenses(data.expenses || []);
      } else {
        setMonthIncome(0);
        setVariableExpenses([]);
      }
    });

    // Projects
    const unsubProjects = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'luna_shared_projects'), where('budgetKey', '==', budgetKey)), (snapshot) => {
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Custom Categories
    const unsubCategories = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'luna_shared_categories'), where('budgetKey', '==', budgetKey)), (snapshot) => {
        setCustomCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubRecurring(); unsubMonth(); unsubProjects(); unsubCategories(); };
  }, [user, budgetKey, monthKey]);

  // --- Handlers ---

  const handleLogin = (key) => { setBudgetKey(key); localStorage.setItem('luna_budget_key', key); };
  const handleLogout = () => { setBudgetKey(null); localStorage.removeItem('luna_budget_key'); setRecurringBills([]); setVariableExpenses([]); setMonthIncome(0); setProjects([]); setCustomCategories([]); };

  const closeProject = () => {
      setIsClosingProject(true);
      setTimeout(() => { setActiveProject(null); setIsClosingProject(false); setIsEditingProject(false); }, 300);
  };

  // PWA Install Handler (Called from Menu or Button)
  const handleInstallApp = () => {
      if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
              if (choiceResult.outcome === 'accepted') {
                  console.log('User accepted the install prompt');
              }
              setDeferredPrompt(null);
          });
      } else if (isIOS) {
          setShowInstallHelp(true);
      }
  };

  // --- CONFIRMATION HANDLERS ---
  const requestDelete = (type, id, data = null) => {
      let title = "Supprimer ?";
      let message = "Cette action est irréversible.";
      let confirmColor = "bg-red-500";
      let icon = AlertTriangle;

      if(type === 'expense') message = "Voulez-vous vraiment supprimer cette dépense ?";
      if(type === 'recurring') message = "Cela arrêtera cette mensualité définitivement.";
      if(type === 'project') message = "Tout l'historique de ce projet sera perdu.";
      
      if(type === 'archive') {
          title = "Archiver le projet ?";
          message = "Le projet sera déplacé dans les archives. Vous pourrez le retrouver plus tard.";
          confirmColor = "bg-slate-600"; 
          icon = Archive;
      }
      if(type === 'unarchive') {
          title = "Restaurer le projet ?";
          message = "Le projet reviendra dans votre liste active.";
          confirmColor = "bg-blue-500";
          icon = Undo2;
      }

      setConfirmation({ type, id, data, title, message, confirmColor, icon });
  };

  const executeConfirm = async () => {
      if (!confirmation) return;
      const { type, id, data } = confirmation;
      
      if (type === 'expense') await deleteVariable(id);
      if (type === 'recurring') await deleteRecurring(id);
      if (type === 'project') await deleteProject(id);
      if (type === 'project_expense') await deleteProjectExpense(id);
      if (type === 'archive' || type === 'unarchive') await toggleArchiveProject(data);

      setConfirmation(null);
  };

  const saveCustomCategory = async (label) => {
      if (!user || !budgetKey || !label) return;
      const exists = allCategories.some(c => c.label.toLowerCase() === label.toLowerCase());
      if (exists) return;

      const newCat = {
          budgetKey,
          label,
          id: label.toLowerCase().replace(/\s+/g, '_'),
          color: generateColor(label)
      };
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'luna_shared_categories'), newCat);
  };

  const addRecurring = async (formData) => {
    if (!user || !budgetKey) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'luna_shared_recurring'), {
      budgetKey: budgetKey, name: formData.get('name'), amount: Number(formData.get('amount')), day: Number(formData.get('day')), createdAt: Date.now()
    });
    setShowMobileAdd(false);
  };
  const deleteRecurring = async (id) => { if (user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'luna_shared_recurring', id)); };

  const addVariableExpense = async (formData, category) => {
    if (!user || !budgetKey) return;
    if (!DEFAULT_CATEGORIES.some(c => c.label === category)) {
        await saveCustomCategory(category);
    }
    const newExp = {
      id: Date.now().toString(), name: formData.get('name'), amount: Number(formData.get('amount')), date: formData.get('date'), category: category || 'Autre'
    };
    const docId = `${budgetKey}_${monthKey}`;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'luna_shared_history', docId), { 
      budgetKey: budgetKey, income: monthIncome, expenses: [...variableExpenses, newExp] 
    }, { merge: true });
    setShowMobileAdd(false);
  };

  const updateVariableExpense = async (formData, category) => {
      if (!user || !budgetKey || !editingExpense) return;
      if (!DEFAULT_CATEGORIES.some(c => c.label === category)) {
        await saveCustomCategory(category);
      }
      const updatedExp = { ...editingExpense, name: formData.get('name'), amount: Number(formData.get('amount')), date: formData.get('date'), category: category || 'Autre' };
      const newExpenses = variableExpenses.map(e => e.id === editingExpense.id ? updatedExp : e);
      const docId = `${budgetKey}_${monthKey}`;
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'luna_shared_history', docId), { expenses: newExpenses }, { merge: true });
      setEditingExpense(null);
  };

  const deleteVariable = async (expId) => {
    if (!user || !budgetKey) return;
    const updated = variableExpenses.filter(e => e.id !== expId);
    const docId = `${budgetKey}_${monthKey}`;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'luna_shared_history', docId), { expenses: updated }, { merge: true });
  };

  const updateIncome = async (val) => {
    if (!user || !budgetKey) return;
    const numVal = val === '' ? 0 : parseFloat(val);
    setMonthIncome(numVal);
    const docId = `${budgetKey}_${monthKey}`;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'luna_shared_history', docId), { budgetKey: budgetKey, income: numVal, expenses: variableExpenses }, { merge: true });
  };

  const addProject = async (formData) => {
      if (!user || !budgetKey) return;
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'luna_shared_projects'), {
          budgetKey: budgetKey, name: formData.get('name'), totalBudget: Number(formData.get('totalBudget')), expenses: [], createdAt: Date.now(), archived: false
      });
      setShowMobileAdd(false);
  };

  const updateProjectDetails = async (formData, shouldClose = true) => {
      if (!user || !activeProject) return;
      const updatedData = { name: formData.get('name'), totalBudget: Number(formData.get('totalBudget')) };
      setActiveProject({ ...activeProject, ...updatedData });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'luna_shared_projects', activeProject.id), updatedData);
      if (shouldClose) setIsEditingProject(false);
  };

  const toggleArchiveProject = async (project) => {
      if (!user) return;
      if(activeProject && activeProject.id === project.id) closeProject();
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'luna_shared_projects', project.id), { archived: !project.archived });
  };

  const deleteProject = async (id) => { if(user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'luna_shared_projects', id)); };

  const addProjectExpense = async (formData, category) => {
      if (!user || !activeProject) return;
      if (!DEFAULT_CATEGORIES.some(c => c.label === category)) {
        await saveCustomCategory(category);
      }
      const newExp = { id: Date.now().toString(), name: formData.get('name'), amount: Number(formData.get('amount')), date: formData.get('date'), category: category || 'Autre' };
      const updatedExpenses = [...(activeProject.expenses || []), newExp];
      setActiveProject({ ...activeProject, expenses: updatedExpenses }); 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'luna_shared_projects', activeProject.id), { expenses: updatedExpenses });
  };

  const updateProjectExpense = async (formData, category) => {
      if (!user || !activeProject || !editingProjectExpense) return;
      if (!DEFAULT_CATEGORIES.some(c => c.label === category)) {
        await saveCustomCategory(category);
      }
      const updatedExp = { ...editingProjectExpense, name: formData.get('name'), amount: Number(formData.get('amount')), date: formData.get('date'), category: category || 'Autre' };
      const updatedExpenses = activeProject.expenses.map(e => e.id === editingProjectExpense.id ? updatedExp : e);
      setActiveProject({ ...activeProject, expenses: updatedExpenses });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'luna_shared_projects', activeProject.id), { expenses: updatedExpenses });
      setEditingProjectExpense(null);
  }

  const deleteProjectExpense = async (expId) => {
      if (!user || !activeProject) return;
      const updatedExpenses = activeProject.expenses.filter(e => e.id !== expId);
      setActiveProject({ ...activeProject, expenses: updatedExpenses });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'luna_shared_projects', activeProject.id), { expenses: updatedExpenses });
  };

  // Calculations
  const activeRecurringBills = useMemo(() => recurringBills.filter(bill => !bill.createdAt || bill.createdAt <= viewMonthEnd.getTime()), [recurringBills, viewMonthEnd]);
  const totalFixedBill = activeRecurringBills.reduce((sum, item) => sum + item.amount, 0);
  const totalVariableSpent = variableExpenses.reduce((sum, item) => sum + item.amount, 0);
  const upcomingBills = useMemo(() => {
    const todayDay = new Date().getDate();
    return activeRecurringBills.filter(bill => {
      if (isFutureMonth) return true; 
      if (!isCurrentMonth) return false; 
      return bill.day >= todayDay; 
    }).sort((a,b) => a.day - b.day);
  }, [activeRecurringBills, isFutureMonth, isCurrentMonth]);
  const paidBillsAmount = totalFixedBill - upcomingBills.reduce((sum, item) => sum + item.amount, 0);
  const remainingBudget = monthIncome - totalFixedBill - totalVariableSpent;
  const pieChartData = useMemo(() => {
    const stats = {};
    variableExpenses.forEach(exp => { const cat = exp.category || 'Autre'; stats[cat] = (stats[cat] || 0) + exp.amount; });
    return Object.entries(stats).map(([label, value], index) => {
        const predefined = allCategories.find(c => c.label === label);
        return { label, value, color: predefined ? predefined.color : generateColor(label) };
    });
  }, [variableExpenses, allCategories]);

  // --- SUB-COMPONENTS FOR LAYOUT ---
  const UpcomingWidget = () => (
      <GlassCard className="h-full flex flex-col">
          <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
            <CalendarIcon className="text-purple-500" size={20}/> À venir
          </h3>
          <div className="mb-4 md:mb-6"><ProgressBar current={paidBillsAmount} max={totalFixedBill || 1} label="Charges payées" /></div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[300px] md:max-h-[400px] custom-scrollbar">
            {upcomingBills.length > 0 ? upcomingBills.map(bill => (
                 <div key={bill.id} className="group flex items-center p-3 rounded-2xl transition-all hover:bg-white/60 border border-transparent hover:border-white/60 hover:shadow-sm">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-50 rounded-xl flex flex-col items-center justify-center mr-4 shadow-sm border border-purple-100 transition-transform group-hover:scale-105">
                       <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Le</span>
                       <span className="text-lg font-black text-purple-700 leading-none">{bill.day}</span>
                    </div>
                    <div className="flex-grow min-w-0">
                       <h4 className="font-bold text-slate-800 text-sm truncate">{bill.name}</h4>
                       <p className="text-xs text-slate-500 font-medium truncate">Mensualité</p>
                    </div>
                    <span className="font-bold text-slate-900">{bill.amount}€</span>
                 </div>
               )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-60 min-h-[100px]">
                <CheckCircle2 size={32} className="text-emerald-500"/><p className="text-xs font-medium text-center">Rien à signaler !</p>
              </div>
            )}
          </div>
        </GlassCard>
  );

  const ActiveProjectWidget = () => (
    projects.filter(p => !p.archived).length > 0 ? (
        <div onClick={() => setActiveProject(projects.filter(p => !p.archived)[projects.filter(p => !p.archived).length - 1])} className="cursor-pointer group">
            <GlassCard className="flex items-center justify-between border-blue-100 hover:bg-blue-50/50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform">
                        <Plane size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projet en cours</p>
                        <h4 className="font-bold text-slate-800 text-lg">{projects.filter(p => !p.archived)[projects.filter(p => !p.archived).length - 1].name}</h4>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-sm font-bold text-blue-600">Voir le budget</span>
                    <ArrowRight size={16} className="inline ml-1 text-blue-400" />
                </div>
            </GlassCard>
        </div>
    ) : null
  );

  // --- RENDER ---
  if (authLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>;
  
  if (!budgetKey) return (
      <LoginScreen 
        onLogin={handleLogin} 
        deferredPrompt={deferredPrompt} 
        isIOS={isIOS}
        onShowInstallHelp={() => setShowInstallHelp(true)}
      />
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative overflow-x-hidden pb-32 md:pb-8">
      
      {/* CONFIRMATION & INSTALL HELP MODALS */}
      <ConfirmModal 
        isOpen={!!confirmation} 
        title={confirmation?.title} 
        message={confirmation?.message} 
        onConfirm={executeConfirm}
        onCancel={() => setConfirmation(null)}
        confirmText={confirmation?.type === 'unarchive' ? 'Restaurer' : 'Confirmer'}
        confirmColor={confirmation?.confirmColor}
        icon={confirmation?.icon}
      />
      <InstallHelpModal isOpen={showInstallHelp} onClose={() => setShowInstallHelp(false)} />

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[90px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-yellow-200/40 rounded-full mix-blend-multiply filter blur-[90px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[60vw] bg-pink-300/40 rounded-full mix-blend-multiply filter blur-[90px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <header className="flex flex-row justify-between items-center mb-6 gap-3 md:gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/40 p-1.5 md:p-2 rounded-2xl border border-white/50 shadow-sm backdrop-blur-md">
               <img src={LOGO_URL} alt="Luna" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl md:text-3xl font-black tracking-tighter bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">LUNA</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 bg-white/30 backdrop-blur-xl border border-white/50 p-1 md:p-1.5 rounded-full shadow-lg">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 md:p-3 hover:bg-white/60 rounded-full transition-colors text-slate-600"><ChevronLeft size={16} className="md:w-5 md:h-5"/></button>
            <div className="px-2 md:px-4 text-center">
              <span className="hidden md:block text-xs font-bold text-slate-400 uppercase tracking-widest">Mois de</span>
              <span className="block font-bold text-slate-800 capitalize w-24 md:w-32 text-sm md:text-base truncate">{monthName}</span>
            </div>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 md:p-3 hover:bg-white/60 rounded-full transition-colors text-slate-600"><ChevronRight size={16} className="md:w-5 md:h-5"/></button>
          </div>

          <div className="flex items-center gap-2">
             {/* PWA INSTALL BUTTON (DESKTOP/ANDROID) */}
             {deferredPrompt && (
                 <button onClick={handleInstallApp} className="flex items-center justify-center p-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow-md animate-in fade-in zoom-in" title="Installer l'application">
                    <Download size={18} />
                 </button>
             )}
             
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/40 rounded-xl border border-white/50 text-xs font-medium text-slate-500">
               <KeyRound size={14} /> {budgetKey}
             </div>
             <button onClick={handleLogout} className="flex items-center justify-center p-2 bg-white/40 hover:bg-red-50 text-slate-600 hover:text-red-500 rounded-xl transition-all border border-white/50" title="Changer de compte">
               <LogOut size={18} />
             </button>
          </div>
        </header>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-4 mb-8">
          {[
            { id: 'summary', icon: LayoutDashboard, label: 'Synthèse' },
            { id: 'expenses', icon: Receipt, label: 'Dépenses' },
            { id: 'fixed', icon: Repeat, label: 'Mensualités' },
            { id: 'projects', icon: Plane, label: 'Projets Ponctuels' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300 font-bold text-sm ${activeTab === tab.id ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg' : 'bg-white/40 text-slate-600 hover:bg-white/60 border border-white/50'}`}>
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          
          {/* SUMMARY TAB */}
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                <GlassCard className="relative overflow-hidden group !p-6 md:!p-8">
                  <h2 className="text-slate-500 font-bold mb-1 uppercase tracking-wider text-[10px] md:text-xs">Reste à vivre</h2>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className={`text-5xl md:text-7xl font-black tracking-tighter ${remainingBudget < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                      {remainingBudget.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-2xl md:text-3xl text-slate-400 font-light">€</span>
                  </div>
                  <div className="flex items-center gap-4 mb-6 bg-white/30 p-2 md:p-3 rounded-xl w-fit border border-white/40">
                      <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Revenus:</span>
                      <div className="flex items-center gap-1">
                         <input type="number" inputMode="decimal" value={monthIncome === 0 ? '' : monthIncome} onChange={(e) => updateIncome(e.target.value)} placeholder="0" className="bg-transparent font-bold text-base md:text-lg text-emerald-600 w-20 md:w-24 outline-none placeholder:text-emerald-600/30 text-right"/>
                         <span className="text-emerald-600 font-bold text-sm">€</span>
                       </div>
                  </div>
                  <ProgressBar current={totalFixedBill + totalVariableSpent} max={monthIncome || 1} />
                </GlassCard>

                {/* MOBILE: Afficher "À venir" ici au lieu d'en bas */}
                <div className="block lg:hidden">
                    <UpcomingWidget />
                </div>

                {/* DESKTOP: Afficher "Projet en cours" ici */}
                <div className="hidden lg:block">
                    <ActiveProjectWidget />
                </div>

                <GlassCard>
                   <h3 className="font-bold text-base md:text-lg text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
                      <PieChartIcon className="text-pink-500" size={20}/> Répartition
                   </h3>
                   <SimplePieChart data={pieChartData} />
                </GlassCard>

                {/* MOBILE: Afficher "Projet en cours" ici (en bas) */}
                <div className="block lg:hidden">
                    <ActiveProjectWidget />
                </div>
              </div>

              {/* DESKTOP SIDEBAR */}
              <div className="lg:col-span-1 hidden lg:block">
                <UpcomingWidget />
              </div>
            </div>
          )}

          {/* MENSUALITES TAB */}
          {activeTab === 'fixed' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                 <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 md:p-6 text-white shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-white/20 rounded-lg"><Repeat size={20} /></div>
                       <div><span className="font-bold tracking-wide text-xs md:text-sm opacity-80 uppercase block">Total Mensuel</span></div>
                    </div>
                    <div className="text-2xl md:text-3xl font-black">{totalFixedBill.toFixed(2)} €</div>
                 </div>
                 <div className="space-y-2 md:space-y-3 pb-20 lg:pb-0">
                    {activeRecurringBills.sort((a,b) => a.day - b.day).map(bill => (
                      <GlassCard key={bill.id} className="!p-2"><TransactionRow day={bill.day} month="Mois" title={bill.name} subtitle="Fixe" amount={bill.amount} onDelete={() => requestDelete('recurring', bill.id)} /></GlassCard>
                    ))}
                    {activeRecurringBills.length === 0 && <div className="text-center py-10 text-slate-400 bg-white/20 rounded-2xl border border-dashed border-slate-300 text-sm">Aucune mensualité.</div>}
                 </div>
              </div>
              <div className="hidden lg:block h-fit sticky top-6">
                 <GlassCard>
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2"><Plus className="text-purple-500" size={20}/> Ajouter Mensualité</h3>
                    <RecurringForm onSubmit={addRecurring} />
                 </GlassCard>
              </div>
            </div>
          )}

          {/* DEPENSES TAB */}
          {activeTab === 'expenses' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
               <div className="lg:col-span-2 space-y-4 md:space-y-6">
                 <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-4 md:p-6 text-white shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-white/20 rounded-lg"><Receipt size={20} /></div>
                       <div><span className="font-bold tracking-wide text-xs md:text-sm opacity-80 uppercase block">Total Variables</span></div>
                    </div>
                    <div className="text-2xl md:text-3xl font-black">{totalVariableSpent.toFixed(2)} €</div>
                 </div>
                 <div className="space-y-2 md:space-y-3 pb-20 lg:pb-0">
                    {variableExpenses.sort((a,b) => new Date(b.date) - new Date(a.date)).map(exp => {
                       const d = new Date(exp.date);
                       const catColor = allCategories.find(c => c.label === exp.category)?.color || '#64748b';
                       return (
                        <GlassCard key={exp.id} className="!p-2">
                          <TransactionRow 
                            day={d.getDate()} 
                            month={d.toLocaleDateString('fr-FR', {month: 'short'})} 
                            title={exp.name} 
                            subtitle={exp.category} 
                            badgeColor={catColor} 
                            amount={exp.amount} 
                            onEdit={() => setEditingExpense(exp)}
                            onDelete={() => requestDelete('expense', exp.id)} 
                          />
                        </GlassCard>
                       )
                    })}
                     {variableExpenses.length === 0 && <div className="text-center py-12 text-slate-400 italic text-sm">Aucune dépense.</div>}
                 </div>
               </div>
               <div className="hidden lg:block h-fit sticky top-6">
                 <GlassCard>
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2"><Plus className="text-pink-500" size={20}/> Ajouter Dépense</h3>
                    <ExpenseForm onSubmit={addVariableExpense} categories={allCategories} defaultCategory="Autre" />
                 </GlassCard>
               </div>
            </div>
          )}

          {/* PROJETS TAB */}
          {activeTab === 'projects' && (
             <div className="space-y-8 pb-24">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {projects.filter(p => !p.archived).map(project => (
                         <ProjectCard key={project.id} project={project} onClick={() => setActiveProject(project)} onArchive={() => requestDelete('archive', null, project)} onDelete={() => requestDelete('project', project.id)} />
                     ))}

                     <div onClick={() => { setShowMobileAdd(true); setMobileAddType('project'); }} className="border-2 border-dashed border-slate-300 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 min-h-[200px] group hover:scale-[1.02]">
                         <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                             <Plus size={32} />
                         </div>
                         <p className="font-bold text-slate-500 group-hover:text-blue-500">Nouveau Projet</p>
                     </div>
                 </div>

                 {/* Section Archives */}
                 {projects.some(p => p.archived) && (
                     <div className="mt-12">
                         <button onClick={() => setShowArchives(!showArchives)} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-xs hover:text-slate-600 transition-colors mb-4">
                             <Archive size={16} /> {showArchives ? 'Masquer les archives' : 'Voir les archives'} ({projects.filter(p => p.archived).length})
                         </button>
                         
                         {showArchives && (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60 hover:opacity-100 transition-opacity">
                                 {projects.filter(p => p.archived).map(project => (
                                     <ProjectCard key={project.id} project={project} onClick={() => setActiveProject(project)} onArchive={() => requestDelete('unarchive', null, project)} />
                                 ))}
                             </div>
                         )}
                     </div>
                 )}
             </div>
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-white/60 p-2 px-6 flex justify-between items-center z-40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-3xl">
          <button onClick={() => setActiveTab('summary')} className={`p-3 rounded-2xl transition-all ${activeTab === 'summary' ? 'text-purple-600 bg-purple-50' : 'text-slate-400'}`}><LayoutDashboard size={24} strokeWidth={activeTab === 'summary' ? 2.5 : 2} /></button>
          <button onClick={() => setActiveTab('expenses')} className={`p-3 rounded-2xl transition-all ${activeTab === 'expenses' ? 'text-purple-600 bg-purple-50' : 'text-slate-400'}`}><Receipt size={24} strokeWidth={activeTab === 'expenses' ? 2.5 : 2} /></button>
          
          <div className="relative -top-6">
             <button onClick={() => { 
                 setShowMobileAdd(true); 
                 if (activeTab === 'projects') setMobileAddType('project');
                 else if (activeTab === 'fixed') setMobileAddType('recurring');
                 else setMobileAddType('expense');
             }} className="bg-slate-900 text-white p-4 rounded-full shadow-xl shadow-slate-900/40 active:scale-90 transition-transform"><Plus size={28} /></button>
          </div>

          <button onClick={() => setActiveTab('fixed')} className={`p-3 rounded-2xl transition-all ${activeTab === 'fixed' ? 'text-purple-600 bg-purple-50' : 'text-slate-400'}`}><Repeat size={24} strokeWidth={activeTab === 'fixed' ? 2.5 : 2} /></button>
          <button onClick={() => setActiveTab('projects')} className={`p-3 rounded-2xl transition-all ${activeTab === 'projects' ? 'text-blue-500 bg-blue-50' : 'text-slate-400'}`}><Plane size={24} strokeWidth={activeTab === 'projects' ? 2.5 : 2} /></button>
      </div>

      {/* MOBILE ADD MODAL */}
      {showMobileAdd && (
        <div onClick={() => setShowMobileAdd(false)} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div onClick={(e) => e.stopPropagation()} className="bg-white/80 backdrop-blur-2xl w-full max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-300 border-t border-white/50 relative">
              <button onClick={() => setShowMobileAdd(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">Ajouter...</h3>
              
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6 overflow-x-auto">
                 <button onClick={() => setMobileAddType('expense')} className={`flex-1 py-2 px-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${mobileAddType === 'expense' ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-400'}`}>Dépense</button>
                 <button onClick={() => setMobileAddType('recurring')} className={`flex-1 py-2 px-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${mobileAddType === 'recurring' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}>Mensualité</button>
                 <button onClick={() => setMobileAddType('project')} className={`flex-1 py-2 px-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${mobileAddType === 'project' ? 'bg-white text-blue-500 shadow-sm' : 'text-slate-400'}`}>Projet</button>
              </div>

              {mobileAddType === 'expense' && <ExpenseForm onSubmit={addVariableExpense} categories={allCategories} defaultCategory="Autre" />}
              {mobileAddType === 'recurring' && <RecurringForm onSubmit={addRecurring} />}
              {mobileAddType === 'project' && <ProjectForm onSubmit={addProject} />}
              <div className="h-6 md:hidden"></div>
           </div>
        </div>
      )}

      {/* MODAL EDIT EXPENSE (MAIN) */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white/95 backdrop-blur-2xl w-full max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-300 border-t border-white/50 relative">
              <button onClick={() => setEditingExpense(null)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">Modifier</h3>
              <ExpenseForm 
                onSubmit={updateVariableExpense} 
                categories={allCategories} 
                defaultCategory="Autre" 
                initialData={editingExpense} 
                buttonLabel="Sauvegarder les modifications"
              />
              <div className="h-6 md:hidden"></div>
           </div>
        </div>
      )}

      {/* MODAL EDIT PROJECT EXPENSE */}
      {editingProjectExpense && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white/95 backdrop-blur-2xl w-full max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-300 border-t border-white/50 relative">
              <button onClick={() => setEditingProjectExpense(null)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X size={20}/></button>
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">Modifier dépense projet</h3>
              <ExpenseForm 
                onSubmit={updateProjectExpense} 
                categories={allCategories} 
                defaultCategory="Autre" 
                initialData={editingProjectExpense} 
                buttonLabel="Sauvegarder les modifications"
              />
              <div className="h-6 md:hidden"></div>
           </div>
        </div>
      )}

      {/* FULLSCREEN PROJECT VIEW (Hero Animation) */}
      {activeProject && (
          <div className={`fixed inset-0 z-50 bg-slate-50 flex flex-col ${isClosingProject ? 'animate-out zoom-out-95 duration-200 opacity-0' : 'animate-in zoom-in-95 duration-300'} fill-mode-forwards origin-center`}>
              {/* Project Header */}
              <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 p-4 pt-safe-top sticky top-0 z-10 transition-all duration-300 shadow-sm">
                  <div className="max-w-3xl mx-auto flex items-center gap-4">
                      <button onClick={closeProject} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft size={24} /></button>
                      
                      <div className="flex-1">
                          {isEditingProject ? (
                              <input 
                                  id="project-name-input"
                                  type="text" 
                                  defaultValue={activeProject.name} 
                                  className="text-xl font-black text-slate-800 bg-transparent border-b border-slate-300 w-full outline-none"
                                  autoFocus
                                  onBlur={(e) => {
                                      const shouldClose = e.relatedTarget?.id !== 'project-budget-input';
                                      const formData = new FormData();
                                      formData.set('name', e.target.value);
                                      formData.set('totalBudget', activeProject.totalBudget);
                                      updateProjectDetails(formData, shouldClose);
                                  }}
                              />
                          ) : (
                              <div className="flex items-center gap-2" onClick={() => !activeProject.archived && setIsEditingProject(true)}>
                                  <h2 className="text-xl font-black text-slate-800">{activeProject.name}</h2>
                                  {!activeProject.archived && <Pencil size={14} className="text-slate-300" />}
                              </div>
                          )}
                          <p className="text-xs font-bold text-slate-400 uppercase">Budget Ponctuel {activeProject.archived ? '(Archivé)' : ''}</p>
                      </div>

                      <div className="text-right">
                          {isEditingProject ? (
                              <div className="flex items-center gap-1">
                                  <input 
                                      id="project-budget-input"
                                      type="number" 
                                      defaultValue={activeProject.totalBudget} 
                                      className="font-black text-lg text-blue-600 bg-transparent border-b border-blue-200 w-20 outline-none text-right"
                                      onBlur={(e) => {
                                          const shouldClose = e.relatedTarget?.id !== 'project-name-input';
                                          const formData = new FormData();
                                          formData.set('name', activeProject.name);
                                          formData.set('totalBudget', e.target.value);
                                          updateProjectDetails(formData, shouldClose);
                                      }}
                                  />
                                  <span className="text-blue-600">€</span>
                              </div>
                          ) : (
                              <div onClick={() => !activeProject.archived && setIsEditingProject(true)}>
                                  <span className="block text-xs font-bold text-slate-400 uppercase">Total</span>
                                  <span className="block font-black text-lg text-blue-600">{activeProject.totalBudget}€</span>
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Project Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                  <div className="max-w-3xl mx-auto space-y-6">
                      <GlassCard className="!p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                          <div className="flex justify-between items-end mb-4">
                              <div>
                                  <p className="text-slate-500 text-xs font-bold uppercase mb-1">Reste disponible</p>
                                  <h3 className="text-4xl font-black text-slate-800">
                                      {(activeProject.totalBudget - (activeProject.expenses || []).reduce((acc, curr) => acc + curr.amount, 0)).toFixed(2)} €
                                  </h3>
                              </div>
                              <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-500">
                                  <Wallet size={24} />
                              </div>
                          </div>
                          <ProgressBar 
                              current={(activeProject.expenses || []).reduce((acc, curr) => acc + curr.amount, 0)} 
                              max={activeProject.totalBudget} 
                              colorClass="from-blue-400 to-indigo-500"
                          />
                      </GlassCard>

                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                  <Receipt size={20} className="text-slate-400" /> Dépenses du projet
                              </h3>
                              <button onClick={() => requestDelete(activeProject.archived ? 'unarchive' : 'archive', null, activeProject)} className="text-xs font-bold text-slate-400 hover:text-purple-500 flex items-center gap-1 transition-colors">
                                  <Archive size={14} /> {activeProject.archived ? 'Désarchiver' : 'Archiver le projet'}
                              </button>
                          </div>
                          
                          {/* Add Expense Inline Form */}
                          {!activeProject.archived && (
                              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                  <p className="text-xs font-bold text-slate-400 uppercase mb-3">Ajouter une dépense rapide</p>
                                  <ExpenseForm 
                                    onSubmit={addProjectExpense} 
                                    categories={allCategories} 
                                    defaultCategory="Autre"
                                    buttonLabel="Ajouter au projet"
                                  />
                              </div>
                          )}

                          <div className="space-y-2 pb-24">
                              {((activeProject.expenses || []).sort((a,b) => new Date(b.date) - new Date(a.date))).map(exp => (
                                  <div key={exp.id} className="bg-white/60 p-4 rounded-2xl border border-white/50 flex items-center justify-between group hover:bg-white/80 transition-all hover:shadow-sm">
                                      <div className="flex items-center gap-4">
                                          <div className="bg-blue-50 text-blue-500 p-2 rounded-xl">
                                              <CalendarDays size={18} />
                                          </div>
                                          <div>
                                              <p className="font-bold text-slate-800">{exp.name}</p>
                                              <p className="text-xs text-slate-500">{exp.category} • {new Date(exp.date).toLocaleDateString('fr-FR')}</p>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                          <span className="font-bold text-slate-800">-{exp.amount}€</span>
                                          {!activeProject.archived && (
                                              <div className="flex gap-1">
                                                <button onClick={() => setEditingProjectExpense(exp)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors">
                                                    <Pencil size={18} />
                                                </button>
                                                <button onClick={() => requestDelete('project_expense', exp.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              ))}
                              {(!activeProject.expenses || activeProject.expenses.length === 0) && (
                                  <div className="text-center py-12 text-slate-400 bg-slate-100/50 rounded-2xl border border-dashed border-slate-200">
                                      Aucune dépense pour ce projet.
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .pt-safe-top { padding-top: max(1rem, env(safe-area-inset-top)); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default App;
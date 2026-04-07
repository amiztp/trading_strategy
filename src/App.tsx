import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Copy, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  LayoutDashboard,
  Settings,
  MoreVertical,
  X,
  Save,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { db, auth } from './firebase';
import { AccuracyChart } from './components/AccuracyChart';
import { Strategy, Rule } from './types';
import { cn } from './lib/utils';

// --- Firestore Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Main Component ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isEditingStrategy, setIsEditingStrategy] = useState<string | null>(null);
  const [isEditingRule, setIsEditingRule] = useState<{ strategyId: string, ruleId: string } | null>(null);
  const [newStrategyName, setNewStrategyName] = useState('');
  const [newRuleText, setNewRuleText] = useState('');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 1. Test Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  // 2. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // 3. Firestore Listener
  useEffect(() => {
    if (!isAuthReady || !user) {
      setStrategies([]);
      return;
    }

    const path = 'strategies';
    const q = query(
      collection(db, path),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Strategy[];
      setStrategies(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  // 4. Initial Selection
  useEffect(() => {
    if (strategies.length > 0 && !activeTab) {
      setActiveTab(strategies[0].id);
    }
  }, [strategies, activeTab]);

  const activeStrategy = useMemo(() => 
    strategies.find(s => s.id === activeTab), 
    [strategies, activeTab]
  );

  const checkedCount = useMemo(() => 
    activeStrategy?.rules.filter(r => r.checked).length || 0,
    [activeStrategy]
  );

  const totalCount = useMemo(() => 
    activeStrategy?.rules.length || 0,
    [activeStrategy]
  );

  // Auth Actions
  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setActiveTab('');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Strategy Actions
  const addStrategy = async () => {
    if (!user) return;
    const path = 'strategies';
    try {
      const newStrategy = {
        name: `Strategy ${strategies.length + 1}`,
        rules: [
          { id: 'r1', text: 'Define Objectives', checked: true },
          { id: 'r2', text: 'Identify Risks', checked: false },
          { id: 'r3', text: 'Allocate Resources', checked: false },
        ],
        createdAt: Date.now(),
        uid: user.uid,
      };
      const docRef = await addDoc(collection(db, path), newStrategy);
      setActiveTab(docRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const removeStrategy = async (id: string) => {
    const path = `strategies/${id}`;
    try {
      await deleteDoc(doc(db, 'strategies', id));
      if (activeTab === id) {
        const remaining = strategies.filter(s => s.id !== id);
        setActiveTab(remaining[0]?.id || '');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const duplicateStrategy = async (strategy: Strategy) => {
    if (!user) return;
    const path = 'strategies';
    try {
      const duplicated = {
        name: `${strategy.name} (Copy)`,
        rules: strategy.rules.map(r => ({ ...r, id: Math.random().toString(36).substr(2, 9) })),
        createdAt: Date.now(),
        uid: user.uid,
      };
      const docRef = await addDoc(collection(db, path), duplicated);
      setActiveTab(docRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateStrategyName = async (id: string, name: string) => {
    const path = `strategies/${id}`;
    try {
      await updateDoc(doc(db, 'strategies', id), { name });
      setIsEditingStrategy(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Rule Actions
  const addRule = async (strategyId: string) => {
    if (!newRuleText.trim() || !activeStrategy) return;
    const path = `strategies/${strategyId}`;
    try {
      const newRule: Rule = {
        id: Math.random().toString(36).substr(2, 9),
        text: newRuleText,
        checked: false,
      };
      await updateDoc(doc(db, 'strategies', strategyId), {
        rules: [...activeStrategy.rules, newRule]
      });
      setNewRuleText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const toggleRule = async (strategyId: string, ruleId: string) => {
    if (!activeStrategy) return;
    const path = `strategies/${strategyId}`;
    try {
      const updatedRules = activeStrategy.rules.map(r => 
        r.id === ruleId ? { ...r, checked: !r.checked } : r
      );
      await updateDoc(doc(db, 'strategies', strategyId), { rules: updatedRules });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const removeRule = async (strategyId: string, ruleId: string) => {
    if (!activeStrategy) return;
    const path = `strategies/${strategyId}`;
    try {
      const updatedRules = activeStrategy.rules.filter(r => r.id !== ruleId);
      await updateDoc(doc(db, 'strategies', strategyId), { rules: updatedRules });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const duplicateRule = async (strategyId: string, rule: Rule) => {
    if (!activeStrategy) return;
    const path = `strategies/${strategyId}`;
    try {
      const duplicated: Rule = {
        ...rule,
        id: Math.random().toString(36).substr(2, 9),
      };
      await updateDoc(doc(db, 'strategies', strategyId), {
        rules: [...activeStrategy.rules, duplicated]
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const updateRuleText = async (strategyId: string, ruleId: string, text: string) => {
    if (!activeStrategy) return;
    const path = `strategies/${strategyId}`;
    try {
      const updatedRules = activeStrategy.rules.map(r => 
        r.id === ruleId ? { ...r, text } : r
      );
      await updateDoc(doc(db, 'strategies', strategyId), { rules: updatedRules });
      setIsEditingRule(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl" />
          <p className="text-slate-400 font-medium">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <LayoutDashboard size={18} strokeWidth={2.5} />
          </div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900">Strategy Builder</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <MoreVertical size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 z-50 transition-transform duration-300 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <LayoutDashboard size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Strategy</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Builder Pro</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
          <div className="flex items-center justify-between px-2 mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Strategies</span>
            <button 
              onClick={addStrategy}
              className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-md transition-colors"
              title="Add Strategy"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>

          {user ? (
            strategies.map(s => (
              <div key={s.id} className="group relative">
                <button
                  onClick={() => {
                    setActiveTab(s.id);
                    setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left",
                    activeTab === s.id 
                      ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  )}
                >
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    activeTab === s.id ? "bg-indigo-600 scale-125" : "bg-slate-300 group-hover:bg-slate-400"
                  )} />
                  <span className="truncate flex-1">{s.name}</span>
                  <span className="text-[10px] font-mono opacity-50">{s.rules.length}</span>
                </button>
                
                {activeTab === s.id && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => duplicateStrategy(s)} className="p-1.5 hover:bg-indigo-100 text-indigo-600 rounded-lg"><Copy size={12} /></button>
                    <button onClick={() => removeStrategy(s.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg"><Trash2 size={12} /></button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-400 italic">Login to see your strategies</p>
            </div>
          )}
        </div>

        {/* User Profile / Auth */}
        <div className="p-4 border-t border-slate-100">
          {user ? (
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-8 h-8 rounded-xl" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xs">
                    {user.displayName?.[0]}
                  </div>
                )}
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-slate-700 truncate">{user.displayName}</span>
                  <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
                </div>
              </div>
              <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={login}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <LogIn size={18} />
              Sign in with Google
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide pt-20 lg:pt-8">
        {activeStrategy ? (
          <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  {isEditingStrategy === activeStrategy.id ? (
                    <input
                      autoFocus
                      className="bg-white border-2 border-indigo-500 text-2xl md:text-3xl font-bold text-slate-900 rounded-xl px-3 py-1 focus:outline-none shadow-xl shadow-indigo-50 w-full max-w-xs"
                      defaultValue={activeStrategy.name}
                      onBlur={(e) => updateStrategyName(activeStrategy.id, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && updateStrategyName(activeStrategy.id, e.currentTarget.value)}
                    />
                  ) : (
                    <h2 
                      className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight hover:text-indigo-600 cursor-pointer transition-colors truncate"
                      onClick={() => setIsEditingStrategy(activeStrategy.id)}
                    >
                      {activeStrategy.name}
                    </h2>
                  )}
                  <button onClick={() => setIsEditingStrategy(activeStrategy.id)} className="text-slate-300 hover:text-indigo-500 transition-colors shrink-0">
                    <Edit2 size={20} />
                  </button>
                </div>
                <p className="text-xs md:text-sm font-medium text-slate-400">
                  Created on {new Date(activeStrategy.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => duplicateStrategy(activeStrategy)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <Copy size={16} /> <span className="hidden sm:inline">Duplicate</span>
                </button>
                <button 
                  onClick={() => removeStrategy(activeStrategy.id)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-100 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all shadow-sm"
                >
                  <Trash2 size={16} /> <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Rules List Card */}
              <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                      <Settings size={18} />
                    </div>
                    <h3 className="font-bold text-slate-800">Strategy Rules</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full uppercase tracking-widest">
                    {activeStrategy.rules.length} Total
                  </span>
                </div>

                <div className="flex-1 p-6 space-y-3 overflow-y-auto max-h-[500px] scrollbar-hide">
                  <AnimatePresence mode="popLayout">
                    {activeStrategy.rules.map((rule) => (
                      <motion.div
                        key={rule.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn(
                          "group flex items-center justify-between p-4 rounded-2xl border transition-all",
                          rule.checked 
                            ? "bg-indigo-50/50 border-indigo-100" 
                            : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-md hover:shadow-slate-100"
                        )}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <button 
                            onClick={() => toggleRule(activeStrategy.id, rule.id)}
                            className={cn(
                              "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                              rule.checked 
                                ? "bg-indigo-600 border-indigo-600 text-white" 
                                : "bg-white border-slate-200 text-transparent hover:border-indigo-400"
                            )}
                          >
                            <CheckCircle2 size={16} strokeWidth={3} />
                          </button>
                          
                          {isEditingRule?.ruleId === rule.id ? (
                            <input
                              autoFocus
                              className="flex-1 bg-white border-2 border-indigo-300 rounded-lg px-2 py-1 text-slate-800 focus:outline-none"
                              defaultValue={rule.text}
                              onBlur={(e) => updateRuleText(activeStrategy.id, rule.id, e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && updateRuleText(activeStrategy.id, rule.id, e.currentTarget.value)}
                            />
                          ) : (
                            <span 
                              className={cn(
                                "text-sm font-semibold transition-all cursor-pointer",
                                rule.checked ? "text-slate-400 line-through" : "text-slate-700"
                              )}
                              onClick={() => setIsEditingRule({ strategyId: activeStrategy.id, ruleId: rule.id })}
                            >
                              {rule.text}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => duplicateRule(activeStrategy.id, rule)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-colors">
                            <Copy size={14} />
                          </button>
                          <button onClick={() => removeRule(activeStrategy.id, rule.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Add a new rule..."
                      value={newRuleText}
                      onChange={(e) => setNewRuleText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addRule(activeStrategy.id)}
                      className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                    <button 
                      onClick={() => addRule(activeStrategy.id)}
                      disabled={!newRuleText.trim()}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                    >
                      Add Rule
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="space-y-8">
                <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
                  <AccuracyChart checkedCount={checkedCount} totalCount={totalCount} />
                </div>

                <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={22} />
                      </div>
                      <h3 className="text-lg font-bold">Execution Status</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                        <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Checked</p>
                        <p className="text-3xl font-bold font-mono">{checkedCount}</p>
                      </div>
                      <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                        <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Remaining</p>
                        <p className="text-3xl font-bold font-mono">{totalCount - checkedCount}</p>
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-white"
                          initial={{ width: 0 }}
                          animate={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mt-3 text-center">
                        Overall Strategy Progress
                      </p>
                    </div>
                  </div>
                  
                  {/* Decorative circles */}
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -left-4 -top-4 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[40px] flex items-center justify-center shadow-inner">
              <LayoutDashboard size={48} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">No Strategy Selected</h2>
              <p className="text-slate-400 max-w-xs mx-auto">
                Select an existing strategy from the sidebar or create a new one to start building your rules.
              </p>
            </div>
            <button 
              onClick={addStrategy}
              className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Plus size={20} strokeWidth={3} />
              Create New Strategy
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Sword, 
  Scroll, 
  Zap, 
  Trophy, 
  Heart, 
  ChevronRight, 
  Terminal, 
  BookOpen, 
  CheckCircle, 
  XCircle,
  Brain,
  Rocket,
  Code,
  Map as MapIcon,
  Shield,
  Star,
  User,
  Lock,
  Play,
  Save,
  Trash,
  History,
  Clock,
  Target,
  Award,
  Home,
  Globe,
  Sparkles
} from 'lucide-react';
import { api } from './api/client';
import type { Campaign, Level, UserProgress } from './api/client';

// --- Utilities ---

const usePersistedState = function<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};

// --- Type Definitions ---

// Helper to parse level content
const parseLevelContent = (content: string) => {
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
};

// --- Sub-Components ---

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, size = 'md' }: ButtonProps) => {
  const baseStyle = "rounded-xl font-bold transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2";
  
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3",
    lg: "px-8 py-4 text-lg"
  };

  const variants: Record<string, string> = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 border-b-4 border-indigo-800",
    secondary: "bg-slate-700 hover:bg-slate-600 text-white shadow-lg border-b-4 border-slate-900",
    success: "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30 border-b-4 border-emerald-700",
    danger: "bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/30 border-b-4 border-rose-700",
    outline: "border-2 border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white bg-transparent",
    ghost: "text-slate-400 hover:text-white hover:bg-slate-800"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className = '' }: CardProps) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
}

const Badge = ({ children, color = 'indigo' }: BadgeProps) => (
  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-${color}-500/20 text-${color}-300 border border-${color}-500/30`}>
    {children}
  </span>
);

interface LineNumberedEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const LineNumberedEditor = ({ value, onChange }: LineNumberedEditorProps) => {
  const lines = value.split('\n').length;
  
  return (
    <div className="flex flex-1 overflow-hidden font-mono text-sm bg-slate-950 text-slate-300 relative group">
      {/* Line Numbers */}
      <div className="bg-slate-900 text-slate-600 p-4 text-right select-none border-r border-slate-800 flex flex-col gap-[2px] min-w-[3rem]">
        {Array.from({ length: Math.max(lines, 10) }).map((_, i) => (
          <div key={i} className="leading-6">{i + 1}</div>
        ))}
      </div>
      
      {/* Editor Area */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent p-4 resize-none focus:outline-none leading-6 text-slate-200 z-10"
        spellCheck="false"
        autoCapitalize="off"
        autoComplete="off"
      />
      
      {/* Syntax Highlighting Fake Layer (Simple Keyword Matching) */}
      <div className="absolute top-0 left-[3rem] right-0 bottom-0 p-4 pointer-events-none text-transparent leading-6 whitespace-pre-wrap overflow-hidden z-0 opacity-50">
         {/* This is a visual trick; real syntax highlighting requires a library like Prism or Monaco */}
         {value}
      </div>
    </div>
  );
};

// --- Main Application ---

export default function DocuQuest() {
  const [view, setView] = useState('landing');
  
  // --- Notification Component ---
  const Notification = () => {
    if (!notification) return null;
    
    // Auto-dismiss after 4 seconds
    useEffect(() => {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      
      return () => clearTimeout(timer);
    }, [notification]);
    
    return (
      <div className={`fixed top-4 right-4 z-[200] p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
        notification.type === 'success' 
          ? 'bg-emerald-600 text-white' 
          : 'bg-rose-600 text-white'
      }`}>
        <div className="flex items-center gap-3">
          {notification.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <XCircle size={20} />
          )}
          <span>{notification.message}</span>
        </div>
      </div>
    );
  };
  
  // Persisted State
  const [activeCourseId, setActiveCourseId] = usePersistedState<string | null>('dq_activeCourse', null);
  const [userXP, setUserXP] = usePersistedState('dq_xp', 0);
  const [userLevel, setUserLevel] = usePersistedState('dq_level', 1);
  
  // Session State
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(null);
  const [battleState, setBattleState] = useState('intro');
  const [userCode, setUserCode] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCampaignHistory, setShowCampaignHistory] = useState(false);
  const [deletedCampaigns, setDeletedCampaigns] = useState<Set<string>>(new Set());
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [newCampaignUrl, setNewCampaignUrl] = useState('');
  const [newCampaignPrompt, setNewCampaignPrompt] = useState('');
  const [campaignCreationMode, setCampaignCreationMode] = useState<'url' | 'prompt'>('url');
  const [homePagePrompt, setHomePagePrompt] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);

  const activeCourse = activeCourseId ? campaigns.find(c => c.id === activeCourseId) : undefined;
  const currentLevelData = activeCourse?.levels.find((l: Level) => l.id === currentLevelId);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [campaignsData, progressData] = await Promise.all([
          api.getCampaigns(),
          api.getUserProgress('default-user') // TODO: Replace with actual user ID
        ]);
        setCampaigns(campaignsData);
        setUserProgress(progressData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  // Get completed level IDs from progress
  const completedLevelIds = userProgress
    .filter(p => p.completed)
    .map(p => p.levelId);

  // --- Actions ---

  const handleStartCourse = (courseId: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setActiveCourseId(courseId);
      setView('adventure');
    }, 1500);
  };

  const handleEnterLevel = (levelId: string) => {
    setCurrentLevelId(levelId);
    setBattleState('intro');
    
    // Check if we have a saved draft for this level (advanced feature placeholder)
    const level = activeCourse?.levels.find(l => l.id === levelId);
    const content = level ? parseLevelContent(level.content) : {};
    setUserCode(content.initialCode || '');
    setFeedback(null);
    setView('battle');
  };

  const handleCompleteLevel = (xpEarned: number) => {
    setUserXP(prev => prev + xpEarned);
    
    // Update progress via API
    if (currentLevelId) {
      api.updateUserProgress('default-user', {
        levelId: currentLevelId,
        completed: true
      }).then(() => {
        // Refresh progress data
        api.getUserProgress('default-user').then(setUserProgress);
      }).catch(console.error);
    }

    // Level up logic
    if (userXP + xpEarned >= userLevel * 500) {
        setUserLevel(prev => prev + 1);
    }

    // Small delay to show victory state before moving map
    setTimeout(() => {
      setView('adventure');
    }, 1500);
  };

  const checkCodeSolution = () => {
    if (!currentLevelData) return;
    
    const content = parseLevelContent(currentLevelData.content);
    const keys = Array.isArray(content.solutionKey) 
      ? content.solutionKey 
      : content.solutionKey ? [content.solutionKey] : [];
      
    // Check if ALL keys are present
    const allKeysPresent = keys.every((key: string | undefined) => key ? userCode.includes(key) : false);

    if (allKeysPresent) {
      setBattleState('success');
      setFeedback(content.successMessage || "Compilation Successful! Tests Passed.");
    } else {
      setBattleState('failure');
      setFeedback("Syntax Error: You are missing key concepts. Check the hints!");
    }
  };

  const checkQuizAnswer = (optionId: string) => {
    if (!currentLevelData) return;
    
    const content = parseLevelContent(currentLevelData.content);
    
    if (optionId === content.correct) {
      setBattleState('success');
      setFeedback("Correct! Critical hit on the bug!");
    } else {
      setBattleState('failure');
      setFeedback("Incorrect. You took 5 damage!");
    }
  };

  const resetProgress = () => {
    if (confirm("Are you sure? This will wipe your journey.")) {
        setUserXP(0);
        setUserLevel(1);
        setActiveCourseId(null);
        setView('landing');
        // TODO: Reset progress via API
    }
  };

  const handleDeleteCampaign = (courseId: string) => {
    const campaign = campaigns.find(c => c.id === courseId);
    if (!campaign) return;
    
    if (confirm(`Are you sure you want to delete "${campaign.title}"? This action cannot be undone and will remove all your progress in this campaign.`)) {
      // Delete campaign via API
      api.deleteCampaign(courseId).then(() => {
        // Remove from local state
        setCampaigns(prev => prev.filter(c => c.id !== courseId));
        setDeletedCampaigns(prev => new Set([...prev, courseId]));
        
        // Remove from active course if it's the one being deleted
        if (activeCourseId === courseId) {
          setActiveCourseId(null);
          setView('dashboard');
        }
        
        // Show success message
        setNotification({ type: 'success', message: `Campaign "${campaign.title}" has been deleted successfully.` });
        
        // Close campaign history modal if it's open
        if (showCampaignHistory) {
          setShowCampaignHistory(false);
        }
      }).catch(error => {
        console.error('Failed to delete campaign:', error);
        setNotification({ type: 'error', message: 'Failed to delete campaign. Please try again.' });
      });
    }
  };

  const handleCreateNewCampaign = () => {
    if (campaignCreationMode === 'url') {
      if (!newCampaignUrl.trim()) {
        setNotification({ type: 'error', message: 'Please enter a valid documentation URL.' });
        return;
      }

      // Simple URL validation
      try {
        new URL(newCampaignUrl);
      } catch (e) {
        setNotification({ type: 'error', message: 'Please enter a valid URL (e.g., https://docs.example.com).' });
        return;
      }
    } else {
      if (!newCampaignPrompt.trim()) {
        setNotification({ type: 'error', message: 'Please enter a description of what you want to learn.' });
        return;
      }
    }

    setIsProcessing(true);
    setShowNewCampaignModal(false);
    
    // Generate campaign via API
    const generateData = {
      createdBy: 'cmjxeq5cs000010ctxfe9zu36', // Use actual user ID
      ...(campaignCreationMode === 'url' 
        ? { sourceUrl: newCampaignUrl }
        : { prompt: newCampaignPrompt }
      )
    };
    
    api.generateCampaign(generateData).then((campaign) => {
      // Add to local campaigns state
      setCampaigns(prev => [...prev, campaign]);
      setNewCampaignUrl('');
      setNewCampaignPrompt('');
      
      // Show success message
      setNotification({ type: 'success', message: `Campaign "${campaign.title}" has been generated successfully!` });
      
      // Navigate to dashboard to see the new campaign
      setView('dashboard');
    }).catch(error => {
      console.error('Failed to generate campaign:', error);
      setNotification({ type: 'error', message: 'Failed to generate campaign. Please try again.' });
    }).finally(() => {
      setIsProcessing(false);
    });
  };

  const handleHomePageCampaignCreation = () => {
    if (!homePagePrompt.trim()) {
      setNotification({ type: 'error', message: 'Please enter what you want to learn or a documentation URL.' });
      return;
    }

    setIsProcessing(true);
    
    // Check if it's a URL or prompt
    const isUrl = homePagePrompt.startsWith('http://') || homePagePrompt.startsWith('https://');
    
    // Generate campaign via API
    const generateData = {
      createdBy: 'cmjxeq5cs000010ctxfe9zu36', // Use actual user ID
      ...(isUrl 
        ? { sourceUrl: homePagePrompt }
        : { prompt: homePagePrompt }
      )
    };
    
    api.generateCampaign(generateData).then((campaign) => {
      // Add to local campaigns state
      setCampaigns(prev => [...prev, campaign]);
      setHomePagePrompt('');
      
      // Show success message
      setNotification({ type: 'success', message: `Campaign "${campaign.title}" has been generated successfully!` });
      
      // Navigate to dashboard to see the new campaign
      setView('dashboard');
    }).catch(error => {
      console.error('Failed to generate campaign:', error);
      setNotification({ type: 'error', message: 'Failed to generate campaign. Please try again.' });
    }).finally(() => {
      setIsProcessing(false);
    });
  };

  // --- Views ---

  const ProfileModal = () => (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowProfile(false)}>
      <div className="bg-slate-800 w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl p-8 transform scale-100 transition-all" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-8">
           <div className="flex items-center gap-4">
             <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-slate-700 shadow-xl">
               <User size={40} className="text-white" />
             </div>
             <div>
               <h2 className="text-3xl font-bold text-white">DevAdventurer</h2>
               <p className="text-slate-400">Level {userLevel} Code Warrior</p>
             </div>
           </div>
           <Button variant="ghost" onClick={() => setShowProfile(false)}><XCircle size={24} /></Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700">
             <div className="text-2xl font-bold text-yellow-400">{userXP}</div>
             <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total XP</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700">
             <div className="text-2xl font-bold text-emerald-400">{completedLevelIds.length}</div>
             <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Quests Done</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700">
             <div className="text-2xl font-bold text-purple-400">Top 5%</div>
             <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Global Rank</div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-4">Badges</h3>
        <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
          <div className="w-16 h-16 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center grayscale opacity-50 tooltip" title="Locked">
             <Sword size={24} className="text-slate-500" />
          </div>
          <div className="w-16 h-16 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center grayscale opacity-50">
             <Zap size={24} className="text-slate-500" />
          </div>
          {completedLevelIds.length > 0 && (
             <div className="w-16 h-16 rounded-full bg-indigo-900 border-2 border-indigo-500 flex items-center justify-center animate-pulse">
                <Rocket size={24} className="text-indigo-400" />
             </div>
          )}
        </div>

        <div className="border-t border-slate-700 pt-6 flex justify-between items-center">
           <span className="text-slate-500 text-sm">Member since 2024</span>
           <Button variant="danger" size="sm" onClick={resetProgress}>Reset Save Data</Button>
        </div>
      </div>
    </div>
  );

  const CampaignHistoryModal = () => {
    const campaignStats = campaigns
      .filter(campaign => !deletedCampaigns.has(campaign.id))
      .map((campaign) => {
      const campaignProgress = userProgress.filter(p => p.campaignId === campaign.id && p.completed);
      const courseCompletedCount = campaignProgress.length;
      const progress = (courseCompletedCount / campaign.levels.length) * 100;
      const totalXP = campaign.levels.filter(l => campaignProgress.some(p => p.levelId === l.id)).reduce((sum, l) => sum + l.xp, 0);
      
      return {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        theme: campaign.theme,
        progress,
        completedLevels: courseCompletedCount,
        totalLevels: campaign.levels.length,
        totalXP,
        isActive: activeCourseId === campaign.id
      };
    });

    const totalCampaigns = campaignStats.length;
    const activeCampaigns = campaignStats.filter(c => c.progress > 0).length;
    const completedCampaigns = campaignStats.filter(c => c.progress === 100).length;
    const totalXPFromCampaigns = campaignStats.reduce((sum, c) => sum + c.totalXP, 0);

    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCampaignHistory(false)}>
        <div className="bg-slate-800 w-full max-w-4xl rounded-3xl border border-slate-700 shadow-2xl p-8 transform scale-100 transition-all max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center border-4 border-slate-700 shadow-xl">
                <History size={40} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Campaign History</h2>
                <p className="text-slate-400">Your adventure chronicles</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setShowCampaignHistory(false)}><XCircle size={24} /></Button>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700">
              <div className="text-2xl font-bold text-purple-400">{totalCampaigns}</div>
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Campaigns</div>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700">
              <div className="text-2xl font-bold text-emerald-400">{activeCampaigns}</div>
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">In Progress</div>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700">
              <div className="text-2xl font-bold text-yellow-400">{completedCampaigns}</div>
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Completed</div>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl text-center border border-slate-700">
              <div className="text-2xl font-bold text-indigo-400">{totalXPFromCampaigns}</div>
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">XP Earned</div>
            </div>
          </div>

          {/* Campaign List */}
          <h3 className="text-lg font-bold text-white mb-4">Campaign Details</h3>
          <div className="space-y-4">
            {campaignStats.map((campaign) => (
              <div key={campaign.id} className={`bg-slate-900 rounded-xl p-6 border ${campaign.isActive ? 'border-indigo-500 bg-indigo-950/20' : 'border-slate-700'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-${campaign.theme}-500/20 text-${campaign.theme}-400`}>
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white flex items-center gap-2">
                        {campaign.title}
                        {campaign.isActive && <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>}
                      </h4>
                      <p className="text-slate-400 text-sm">{campaign.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{Math.round(campaign.progress)}%</div>
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Complete</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e?.stopPropagation();
                        handleDeleteCampaign(campaign.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Target size={16} />
                    <span className="text-sm">{campaign.completedLevels}/{campaign.totalLevels} Quests</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Award size={16} />
                    <span className="text-sm">{campaign.totalXP} XP Earned</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={16} />
                    <span className="text-sm">Last played recently</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full bg-${campaign.theme}-500 transition-all duration-1000`} style={{ width: `${campaign.progress}%` }}></div>
                    </div>
                  </div>
                  <Button 
                    variant={campaign.progress > 0 ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => {
                      handleStartCourse(campaign.id);
                      setShowCampaignHistory(false);
                    }}
                  >
                    {campaign.progress > 0 ? 'Resume' : 'Start'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

      const NewCampaignModal = () => (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNewCampaignModal(false)}>
      <div className="bg-slate-800 w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl p-8 transform scale-100 transition-all" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-8">
           <div>
             <h2 className="text-3xl font-bold text-white mb-2">Create New Campaign</h2>
             <p className="text-slate-400">Generate an interactive learning campaign from documentation or a custom prompt</p>
           </div>
           <Button variant="ghost" onClick={() => setShowNewCampaignModal(false)}><XCircle size={24} /></Button>
        </div>

        {/* Mode Selection */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={campaignCreationMode === 'url' ? 'primary' : 'outline'}
            onClick={() => setCampaignCreationMode('url')}
            className="flex-1"
          >
            <Globe size={18} /> From Documentation URL
          </Button>
          <Button
            variant={campaignCreationMode === 'prompt' ? 'primary' : 'outline'}
            onClick={() => setCampaignCreationMode('prompt')}
            className="flex-1"
          >
            <Brain size={18} /> From Custom Prompt
          </Button>
        </div>

        {/* Input Fields */}
        {campaignCreationMode === 'url' ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Documentation URL</label>
              <input
                type="url"
                value={newCampaignUrl}
                onChange={(e) => setNewCampaignUrl(e.target.value)}
                placeholder="https://docs.example.com"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-2">Enter a documentation URL to generate a campaign from its content</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Learning Prompt</label>
              <textarea
                value={newCampaignPrompt}
                onChange={(e) => setNewCampaignPrompt(e.target.value)}
                placeholder="I want to learn about React hooks and state management..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">Describe what you want to learn and we'll create a custom campaign for you</p>
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={() => setShowNewCampaignModal(false)} className="flex-1">Cancel</Button>
          <Button onClick={handleCreateNewCampaign} className="flex-1">
            <Sparkles size={18} /> Generate Campaign
          </Button>
        </div>
      </div>
    </div>
  );

  const LandingView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 max-w-4xl mx-auto relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="mb-8 relative group cursor-pointer hover:scale-110 transition-transform duration-500">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-slate-900 rounded-full p-6 ring-1 ring-white/10">
          <Sword size={64} className="text-indigo-400" />
        </div>
      </div>
      
      <h1 className="text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-6 tracking-tight">
        DocuQuest
      </h1>
      <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl leading-relaxed">
        Stop reading boring documentation. Start playing it. <br/>
        Turn any technical doc into an interactive RPG adventure.
      </p>

      <div className="w-full max-w-xl bg-slate-800 p-2 rounded-2xl border border-slate-700 shadow-2xl flex flex-col md:flex-row gap-2 mb-8">
        <div className="flex-1 relative">
           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon /></div>
           <input 
             type="text" 
             value={homePagePrompt}
             onChange={(e) => setHomePagePrompt(e.target.value)}
             placeholder="Paste documentation URL or describe what you want to learn..." 
             className="w-full bg-slate-900 text-white pl-12 pr-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-700"
             onKeyPress={(e) => {
               if (e.key === 'Enter') {
                 handleHomePageCampaignCreation();
               }
             }}
           />
        </div>
        <Button onClick={handleHomePageCampaignCreation} className="md:w-auto w-full">
          <Zap size={20} />
          Gamify Docs
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline" 
          onClick={() => setShowCampaignHistory(true)}
          className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400"
        >
          <History size={20} />
          View Campaign History
        </Button>
        <div className="text-slate-500 text-sm">
          {completedLevelIds.length} quests completed • {userXP} XP earned
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
        {[
          { icon: Scroll, title: "Story Mode", desc: "AI turns dry paragraphs into epic quests." },
          { icon: Trophy, title: "Loot & XP", desc: "Earn badges and level up your dev profile." },
          { icon: Brain, title: "Active Recall", desc: "Interactive puzzles reinforce your memory." }
        ].map((item, i) => (
          <div key={i} className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 backdrop-blur hover:bg-slate-800 transition-colors">
            <item.icon className="text-indigo-400 mb-4" size={32} />
            <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
            <p className="text-slate-400 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={() => setView('landing')}>
             <Home size={18} /> Home
          </Button>
          <h2 className="text-3xl font-bold text-white">Campaign Select</h2>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={() => setShowProfile(true)}>
             <User size={18} /> Profile
          </Button>
          <div className="flex items-center gap-4 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
            <div className="text-right hidden md:block">
              <div className="text-xs text-slate-400 uppercase font-bold">Level {userLevel}</div>
              <div className="text-indigo-400 font-bold">{userXP} XP</div>
            </div>
            <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-indigo-400">
              <Shield size={20} className="text-white" />
            </div>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
        {campaigns
          .filter(campaign => !deletedCampaigns.has(campaign.id))
          .map((campaign) => {
           const campaignProgress = userProgress.filter(p => p.campaignId === campaign.id && p.completed);
           const courseCompletedCount = campaignProgress.length;
           const progress = (courseCompletedCount / campaign.levels.length) * 100;
           
           return (
            <Card key={campaign.id} className="group hover:-translate-y-2 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full">
              <div className={`absolute top-0 left-0 w-2 h-full bg-${campaign.theme}-500 transition-all group-hover:w-3`} />
              
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-xl bg-${campaign.theme}-500/20 text-${campaign.theme}-400 ring-1 ring-${campaign.theme}-500/30`}>
                  <BookOpen size={28} />
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={campaign.theme}>{Math.round(progress)}%</Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e?.stopPropagation();
                      handleDeleteCampaign(campaign.id);
                    }}
                    className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                {campaign.title}
              </h3>
              <p className="text-slate-400 mb-8 flex-1">{campaign.description}</p>
              
              <div className="space-y-4">
                 <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full bg-${campaign.theme}-500 transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
                 </div>
                 <Button 
                  className="w-full" 
                  variant={progress > 0 ? "primary" : "secondary"}
                  onClick={() => handleStartCourse(campaign.id)}
                >
                  {progress > 0 ? 'Resume Journey' : 'Start Adventure'} <ChevronRight size={18} />
                </Button>
              </div>
            </Card>
          );
        })}
        
        <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-800/30 transition-colors cursor-pointer min-h-[300px] group" onClick={() => setShowNewCampaignModal(true)}>
          <div className="bg-slate-800 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform">
            <MapIcon size={32} className="text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Discover New Lands</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">Paste a new documentation URL to generate a procedurally tailored campaign.</p>
        </div>
      </div>
    </div>
  );

  const AdventureMapView = () => {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 h-screen flex flex-col">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => setView('landing')} size="sm">
               <Home size={18} /> Home
            </Button>
            <Button variant="secondary" onClick={() => setView('dashboard')} size="sm">
               <ChevronRight className="rotate-180" size={18} /> Map
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-white">{activeCourse?.title || 'Unknown Course'}</h2>
              <p className="text-slate-400 text-sm">Campaign Progress</p>
            </div>
          </div>
          <div className="text-slate-400 text-sm font-mono">
             World: {activeCourseId?.toUpperCase() || 'UNKNOWN'}
          </div>
        </header>

        <div className="flex-1 relative bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col">
          {/* Map Background Pattern */}
          <div className="absolute inset-0 opacity-20" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, #4f46e5 1px, transparent 0)', 
            backgroundSize: '40px 40px' 
          }}></div>

          <div className="flex-1 overflow-y-auto p-12 scrollbar-thin scrollbar-thumb-slate-700">
            <div className="flex flex-col items-center gap-16 relative z-10 min-h-full justify-center">
              {/* Connecting Line */}
              <div className="absolute top-10 bottom-10 w-2 bg-slate-800 -z-10 left-1/2 -translate-x-1/2 rounded-full"></div>
              
              {activeCourse?.levels.map((level: Level, index: number) => {
                const isCompleted = completedLevelIds.includes(level.id);
                const isLocked = index > 0 && activeCourse && !completedLevelIds.includes(activeCourse.levels[index - 1].id);
                const isCurrent = !isCompleted && !isLocked;
                
                // Stagger nodes slightly
                const offset = index % 2 === 0 ? '-translate-x-0' : 'translate-x-0';

                return (
                  <div key={level.id} className={`relative flex items-center ${offset} ${isLocked ? 'opacity-40 grayscale' : ''}`}>
                    
                    {/* Left/Right Text depending on index */}
                    <div className={`absolute ${index % 2 === 0 ? 'right-28 text-right' : 'left-28 text-left'} w-64 top-1/2 -translate-y-1/2 hidden md:block transition-all duration-300 ${isCurrent ? 'scale-110' : ''}`}>
                       <h4 className={`font-bold ${isCurrent ? 'text-indigo-400' : 'text-slate-300'}`}>{level.title}</h4>
                       <div className="text-xs text-slate-500 font-mono mt-1">{level.type.toUpperCase()} • {level.xp} XP</div>
                    </div>

                    {/* Node Circle */}
                    <button 
                      onClick={() => !isLocked && handleEnterLevel(level.id)}
                      disabled={isLocked}
                      className={`
                        w-24 h-24 rounded-full flex items-center justify-center border-4 transform transition-all duration-300 z-10
                        ${isCompleted ? 'bg-emerald-600 border-emerald-400' : 
                          isCurrent ? 'bg-indigo-600 border-indigo-400 scale-125 shadow-xl shadow-indigo-500/50 animate-pulse ring-4 ring-indigo-500/20' : 
                          'bg-slate-800 border-slate-600 hover:border-slate-500'}
                      `}
                    >
                      {isCompleted ? <CheckCircle size={40} className="text-white" /> : 
                       level.type === 'boss' ? <Sword size={40} className="text-rose-400" /> :
                       level.type === 'quiz' ? <Brain size={40} className="text-purple-300" /> :
                       <Code size={40} className="text-blue-300" />
                      }
                      
                      {isLocked && <div className="absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center"><Lock size={24} className="text-slate-500"/></div>}
                    </button>
                    
                    {isCurrent && (
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider shadow-lg whitespace-nowrap">
                            Current Quest
                        </div>
                    )}
                  </div>
                );
              })}
              
              {/* Mastery Node */}
              <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-700 border-dashed flex items-center justify-center relative opacity-50">
                 <Trophy size={48} className="text-slate-600" />
                 <div className="absolute -bottom-8 whitespace-nowrap text-slate-500 text-sm font-bold uppercase tracking-widest">Mastery Locked</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BattleView = () => {
    if (!currentLevelData) {
      return (
        <div className="h-screen flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Level Not Found</h2>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => setView('landing')}>
                <Home size={18} /> Home
              </Button>
              <Button onClick={() => setView('adventure')}>Back to Map</Button>
            </div>
          </div>
        </div>
      );
    }

    const content = parseLevelContent(currentLevelData.content);
    const isCodeChallenge = currentLevelData.type === 'challenge' || currentLevelData.type === 'boss';
    const isBoss = currentLevelData.type === 'boss';
    const isQuiz = currentLevelData.type === 'quiz';
    const isLesson = currentLevelData.type === 'lesson';

    return (
      <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
        {/* Battle Header */}
        <div className={`border-b p-4 flex justify-between items-center shadow-md z-20 ${isBoss ? 'bg-rose-950/30 border-rose-900' : 'bg-slate-800 border-slate-700'}`}>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setView('landing')} className="py-2 px-3 text-sm">
              <Home size={16} /> Home
            </Button>
            <Button variant="ghost" onClick={() => setView('adventure')} className="py-2 px-3 text-sm">
              <ChevronRight className="rotate-180" size={16} /> Retreat
            </Button>
            <div>
              <h2 className={`font-bold text-lg flex items-center gap-2 ${isBoss ? 'text-rose-400' : 'text-white'}`}>
                {isBoss && <Sword size={20} />}
                {currentLevelData.title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-lg border border-white/10">
                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                <span className="text-white font-mono font-bold">{currentLevelData.xp} XP</span>
             </div>
             <div className="flex items-center gap-2">
                <Heart className="text-rose-500 fill-rose-500" size={20} />
                <div className="w-32 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                  <div className={`h-full ${isBoss ? 'bg-rose-500 w-1/2' : 'bg-emerald-500 w-full'}`}></div>
                </div>
             </div>
          </div>
        </div>

        {/* Main Content Split */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANEL: The "Scroll" */}
          <div className="w-1/3 min-w-[350px] bg-slate-900 border-r border-slate-700 flex flex-col z-10 shadow-2xl">
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
              <div className="mb-6">
                 <h3 className="text-indigo-400 font-bold uppercase text-xs mb-2 tracking-widest flex items-center gap-2">
                  <Scroll size={14} /> Quest Brief
                </h3>
                {isLesson ? (
                  <div className="prose prose-invert prose-sm">
                    <p className="text-lg leading-relaxed text-white font-medium">{content.intro}</p>
                    <p className="text-slate-400">{content.text}</p>
                    {content.snippet && (
                       <div className="my-4 bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto text-emerald-400 shadow-inner">
                         <pre>{content.snippet}</pre>
                       </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                     <p className="text-lg text-white font-medium leading-relaxed">{content.instruction || content.question}</p>
                     
                     {content.hint && (
                       <div className="bg-indigo-900/10 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                         <h4 className="text-indigo-400 font-bold text-xs uppercase mb-1">Hint from the Oracle</h4>
                         <p className="text-indigo-200 text-sm italic">{content.hint}</p>
                       </div>
                     )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Panel */}
            <div className="p-4 border-t border-slate-800 bg-slate-900">
               {isLesson ? (
                  <Button variant="success" className="w-full" onClick={() => handleCompleteLevel(currentLevelData.xp)}>
                    <CheckCircle size={18} /> Mark Learned
                  </Button>
               ) : isCodeChallenge ? (
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-slate-500">Auto-saves locally</div>
                    <Button onClick={checkCodeSolution} variant={isBoss ? "danger" : "primary"}>
                      <Play size={18} /> {isBoss ? "Cast Spell" : "Run Code"}
                    </Button>
                  </div>
               ) : null}
            </div>
          </div>

          {/* RIGHT PANEL: The "Workspace" */}
          <div className="flex-1 bg-slate-950 relative flex flex-col">
            
            {/* Feedback Overlay / Modal */}
            {battleState !== 'intro' && battleState !== 'fighting' && (
               <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                 <div className="bg-slate-800 p-8 rounded-2xl max-w-md w-full border border-slate-600 shadow-2xl text-center transform scale-100 animate-in zoom-in-95 duration-200">
                    {battleState === 'success' ? (
                      <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/50 animate-bounce">
                          <Trophy size={48} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Victory!</h2>
                        <p className="text-slate-300 mb-8 text-lg">{feedback}</p>
                        <Button variant="success" size="lg" onClick={() => handleCompleteLevel(currentLevelData.xp)} className="w-full">
                          Collect {currentLevelData.xp} XP
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-rose-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-rose-500/50">
                          <XCircle size={40} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Compilation Failed</h2>
                        <p className="text-slate-300 mb-6">{feedback}</p>
                        <Button variant="secondary" onClick={() => setBattleState('intro')}>
                          Try Again
                        </Button>
                      </div>
                    )}
                 </div>
               </div>
            )}

            {/* Workspace Content */}
            {isCodeChallenge && (
              <div className="flex-1 flex flex-col h-full">
                <div className="bg-slate-900 text-slate-400 text-xs py-2 px-4 flex justify-between select-none border-b border-slate-800">
                  <span className="flex items-center gap-2"><Terminal size={12}/> script.js</span>
                  <span className="flex items-center gap-1 text-emerald-500"><Save size={12}/> Saved</span>
                </div>
                <LineNumberedEditor 
                  value={userCode} 
                  onChange={setUserCode} 
                />
              </div>
            )}

            {isQuiz && (
              <div className="flex-1 flex items-center justify-center p-12 bg-slate-900 relative">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="grid grid-cols-1 gap-4 w-full max-w-2xl z-10">
                  {content.options?.map((option: { id: string; text: string }, idx: number) => (
                    <button
                      key={option.id}
                      onClick={() => checkQuizAnswer(option.id)}
                      className="group p-6 rounded-xl bg-slate-800 border-2 border-slate-700 hover:border-indigo-500 hover:bg-slate-750 transition-all text-left flex items-center gap-6 relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-transparent group-hover:bg-indigo-500 transition-colors"></div>
                      <div className="w-12 h-12 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-inner">
                        {['A', 'B', 'C', 'D'][idx]}
                      </div>
                      <span className="text-lg text-slate-200 group-hover:text-white font-medium">{option.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLesson && (
               <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-slate-500 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                     <Code size={400} />
                  </div>
                  <div className="bg-slate-900/80 backdrop-blur p-8 rounded-3xl border border-slate-800 shadow-2xl max-w-md">
                     <Rocket size={64} className="text-indigo-400 mx-auto mb-6 animate-pulse" />
                     <h3 className="text-white text-xl font-bold mb-2">Interactive Preview</h3>
                     <p>In the full version, this panel renders a live preview of the code snippet as you modify it.</p>
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Helper Icon Component
  const SearchIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  );

  const LoadingOverlay = () => (
    <div className="fixed inset-0 z-[60] bg-slate-900 flex flex-col items-center justify-center">
      <div className="relative mb-8">
         <div className="w-24 h-24 border-4 border-indigo-500/30 rounded-full"></div>
         <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Zap className="text-white animate-pulse" size={32} />
         </div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">Generating World...</h2>
      <p className="text-slate-400">Parsing syntax spells and compiling logic loops.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Notification />
      {isProcessing && <LoadingOverlay />}
      {showProfile && <ProfileModal />}
      {showCampaignHistory && <CampaignHistoryModal />}
      {showNewCampaignModal && <NewCampaignModal />}
      
      {view === 'landing' && <LandingView />}
      {view === 'dashboard' && <DashboardView />}
      {view === 'adventure' && <AdventureMapView />}
      {view === 'battle' && <BattleView />}
    </div>
  );
}

import React from 'react'
import { 
  Trophy, 
  Clock, 
  TrendingUp, 
  Award, 
  Calendar,
  Zap,
  Star,
  Flame,
  Medal,
  Target as TargetIcon,
  BarChart3
} from 'lucide-react'
import type { User, UserProgress, Campaign } from '../api/client'

interface UserProfileProps {
  user: User
  userProgress: UserProgress[]
  campaigns: Campaign[]
  onClose: () => void
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  userProgress, 
  campaigns, 
  onClose 
}) => {
  // Calculate statistics
  const completedLevels = userProgress.filter(p => p.completed).length
  const totalXP = user.xp
  const userLevel = user.level
  
  // Calculate campaign-specific stats
  const campaignStats = campaigns.map(campaign => {
    const campaignProgress = userProgress.filter(p => p.campaignId === campaign.id)
    const completedCount = campaignProgress.filter(p => p.completed).length
    const totalCount = campaign.levels.length
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
    
    return {
      campaign,
      completedCount,
      totalCount,
      progressPercentage,
      totalXP: campaignProgress.filter(p => p.completed).reduce((sum, p) => sum + (campaign.levels.find(l => l.id === p.levelId)?.xp || 0), 0)
    }
  })

  // Calculate learning streak (simplified - would need date tracking in real app)
  const learningStreak = Math.floor(Math.random() * 30) + 1 // Mock data
  
  // Calculate achievements
  const achievements = [
    { 
      id: 'first_campaign', 
      name: 'First Adventure', 
      description: 'Complete your first campaign level',
      icon: <Trophy size={20} />,
      unlocked: completedLevels > 0,
      color: 'text-yellow-400'
    },
    { 
      id: 'persistent', 
      name: 'Persistent Learner', 
      description: 'Complete 10 levels',
      icon: <Flame size={20} />,
      unlocked: completedLevels >= 10,
      color: 'text-orange-400'
    },
    { 
      id: 'expert', 
      name: 'Knowledge Expert', 
      description: 'Complete a full campaign',
      icon: <Medal size={20} />,
      unlocked: campaignStats.some(stat => stat.progressPercentage === 100),
      color: 'text-purple-400'
    },
    { 
      id: 'high_achiever', 
      name: 'High Achiever', 
      description: 'Reach level 10',
      icon: <Star size={20} />,
      unlocked: userLevel >= 10,
      color: 'text-blue-400'
    },
    { 
      id: 'xp_master', 
      name: 'XP Master', 
      description: 'Earn 5000 total XP',
      icon: <Award size={20} />,
      unlocked: totalXP >= 5000,
      color: 'text-green-400'
    }
  ]

  const unlockedAchievements = achievements.filter(a => a.unlocked).length

  // Calculate learning insights
  const averageCompletionTime = 15 // Mock: average minutes per level
  const totalTimeSpent = completedLevels * averageCompletionTime
  const mostActiveDay = 'Monday' // Mock data
  const preferredDifficulty = 'Beginner' // Mock data

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-slate-700">
                <Trophy size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user.username}</h2>
                <p className="text-slate-400">Level {userLevel} Adventurer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-indigo-400">{totalXP}</div>
              <div className="text-sm text-slate-400">Total XP</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{completedLevels}</div>
              <div className="text-sm text-slate-400">Completed</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">{campaigns.length}</div>
              <div className="text-sm text-slate-400">Campaigns</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-orange-400">{learningStreak}</div>
              <div className="text-sm text-slate-400">Day Streak</div>
            </div>
          </div>

          {/* Progress Chart */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-400" />
              Campaign Progress
            </h3>
            <div className="space-y-3">
              {campaignStats.map((stat) => (
                <div key={stat.campaign.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{stat.campaign.title}</span>
                    <span className="text-slate-400">{stat.completedCount}/{stat.totalCount} levels</span>
                  </div>
                  <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-${stat.campaign.theme}-500 transition-all duration-1000`} 
                      style={{ width: `${stat.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award size={20} className="text-yellow-400" />
              Achievements ({unlockedAchievements}/{achievements.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {achievements.map(achievement => (
                <div 
                  key={achievement.id}
                  className={`p-4 rounded-lg border ${
                    achievement.unlocked 
                      ? 'bg-slate-700/50 border-slate-600' 
                      : 'bg-slate-900/50 border-slate-800 opacity-50'
                  }`}
                >
                  <div className={`flex items-center gap-2 mb-2 ${achievement.unlocked ? achievement.color : 'text-slate-500'}`}>
                    {achievement.icon}
                    <span className="font-medium text-white">{achievement.name}</span>
                  </div>
                  <p className="text-xs text-slate-400">{achievement.description}</p>
                  {achievement.unlocked && (
                    <div className="mt-2 text-xs text-green-400">✓ Unlocked</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Learning Insights */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-400" />
              Learning Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="text-slate-400" size={16} />
                  <div>
                    <div className="text-sm text-white">Total Learning Time</div>
                    <div className="text-xs text-slate-400">{totalTimeSpent} minutes</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="text-slate-400" size={16} />
                  <div>
                    <div className="text-sm text-white">Most Active Day</div>
                    <div className="text-xs text-slate-400">{mostActiveDay}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <TargetIcon className="text-slate-400" size={16} />
                  <div>
                    <div className="text-sm text-white">Preferred Difficulty</div>
                    <div className="text-xs text-slate-400">{preferredDifficulty}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="text-slate-400" size={16} />
                  <div>
                    <div className="text-sm text-white">Avg. XP per Level</div>
                    <div className="text-xs text-slate-400">{completedLevels > 0 ? Math.round(totalXP / completedLevels) : 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

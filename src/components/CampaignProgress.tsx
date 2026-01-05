import { useState, useEffect } from 'react'
import { api } from '../api/client'
import type { UserProgress, Campaign, User } from '../api/client'

interface CampaignProgressData {
  campaign: Campaign
  progress: UserProgress[]
  totalLevels: number
  completedLevels: number
  progressPercentage: number
  totalXP: number
  averageXPPerLevel: number
  estimatedTimeRemaining: string
  lastActivity: string | null
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

interface UserStats {
  user: User
  totalCampaigns: number
  activeCampaigns: number
  completedCampaigns: number
  totalXP: number
}

export default function CampaignProgress() {
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [campaignsData, setCampaignsData] = useState<CampaignProgressData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProgressData()
  }, [])

  const fetchProgressData = async () => {
    try {
      setLoading(true)
      
      // Get default user
      const user = await api.getDefaultUser()
      
      // Get user progress
      const userProgress = await api.getUserProgress(user.id)
      
      // Get all campaigns
      const campaigns = await api.getCampaigns()
      
      // Process campaign data
      const campaignsProgressData = campaigns.map(campaign => {
        const campaignProgress = userProgress.filter(p => p.campaignId === campaign.id)
        const totalLevels = campaign.levels.length
        const completedLevels = campaignProgress.filter(p => p.completed).length
        const progressPercentage = totalLevels > 0 ? (completedLevels / totalLevels) * 100 : 0
        const totalXP = campaignProgress.reduce((sum, p) => sum + (p.completed ? p.level.xp : 0), 0)
        const averageXPPerLevel = totalLevels > 0 ? campaign.levels.reduce((sum, l) => sum + l.xp, 0) / totalLevels : 0
        
        // Calculate difficulty based on average XP
        let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy'
        if (averageXPPerLevel > 500) difficulty = 'Hard'
        else if (averageXPPerLevel > 250) difficulty = 'Medium'
        
        // Estimate time remaining (rough calculation: 15 minutes per XP)
        const remainingXP = campaign.levels.reduce((sum, l) => sum + l.xp, 0) - totalXP
        const estimatedMinutes = Math.max(0, remainingXP * 15)
        const hours = Math.floor(estimatedMinutes / 60)
        const minutes = Math.floor(estimatedMinutes % 60)
        const estimatedTimeRemaining = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
        
        // Get last activity
        const lastActivity = campaignProgress.length > 0 
          ? new Date(Math.max(...campaignProgress.map(p => new Date(p.updatedAt).getTime()))).toLocaleDateString()
          : null
        
        return {
          campaign,
          progress: campaignProgress,
          totalLevels,
          completedLevels,
          progressPercentage,
          totalXP,
          averageXPPerLevel,
          estimatedTimeRemaining,
          lastActivity,
          difficulty
        }
      })
      
      // Calculate user stats
      const totalCampaigns = campaigns.length
      const activeCampaigns = campaignsProgressData.filter(d => d.progressPercentage > 0 && d.progressPercentage < 100).length
      const completedCampaigns = campaignsProgressData.filter(d => d.progressPercentage === 100).length
      const totalXP = campaignsProgressData.reduce((sum, d) => sum + d.totalXP, 0)
      
      setUserStats({
        user,
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        totalXP
      })
      
      setCampaignsData(campaignsProgressData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch progress data')
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 50) return 'bg-blue-500'
    if (percentage >= 25) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading progress data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchProgressData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!userStats) {
    return null
  }

  const overallProgress = userStats.totalCampaigns > 0 
    ? (userStats.completedCampaigns / userStats.totalCampaigns) * 100 
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => window.history.back()}
                className="mr-4 p-2 rounded hover:bg-gray-100"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Campaign Progress</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Level {userStats.user.level} • {userStats.user.xp} XP
              </div>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {userStats.user.username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{userStats.totalCampaigns}</div>
            <div className="text-sm text-gray-600 mt-1">Total Campaigns</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">{userStats.activeCampaigns}</div>
            <div className="text-sm text-gray-600 mt-1">Active Campaigns</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{userStats.completedCampaigns}</div>
            <div className="text-sm text-gray-600 mt-1">Completed Campaigns</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">{userStats.totalXP}</div>
            <div className="text-sm text-gray-600 mt-1">Total XP Earned</div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Progress</h2>
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Campaign Completion</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(overallProgress)}`}
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Campaign Details */}
        <div className="space-y-6">
          {campaignsData.map((campaignData) => (
            <div key={campaignData.campaign.id} className="bg-white rounded-lg shadow p-6">
              {/* Campaign Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{campaignData.campaign.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{campaignData.campaign.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(campaignData.difficulty)}`}>
                      {campaignData.difficulty}
                    </span>
                    <span className="text-sm text-gray-500">
                      {campaignData.completedLevels}/{campaignData.totalLevels} levels
                    </span>
                    {campaignData.lastActivity && (
                      <span className="text-sm text-gray-500">
                        Last activity: {campaignData.lastActivity}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{Math.round(campaignData.progressPercentage)}%</div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(campaignData.progressPercentage)}`}
                    style={{ width: `${campaignData.progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Campaign Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">XP Earned</div>
                  <div className="text-lg font-semibold text-gray-900">{campaignData.totalXP}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Avg XP/Level</div>
                  <div className="text-lg font-semibold text-gray-900">{Math.round(campaignData.averageXPPerLevel)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Est. Time Left</div>
                  <div className="text-lg font-semibold text-gray-900">{campaignData.estimatedTimeRemaining}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="text-lg font-semibold">
                    {campaignData.progressPercentage === 100 ? (
                      <span className="text-green-600">Completed</span>
                    ) : campaignData.progressPercentage > 0 ? (
                      <span className="text-blue-600">In Progress</span>
                    ) : (
                      <span className="text-gray-600">Not Started</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Level Progress */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Level Progress</h4>
                <div className="space-y-1">
                  {campaignData.campaign.levels.map((level) => {
                    const levelProgress = campaignData.progress.find(p => p.levelId === level.id)
                    const isCompleted = levelProgress?.completed || false
                    
                    return (
                      <div key={level.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                            {isCompleted && (
                              <svg className="w-3 h-3 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                            {level.order}. {level.title}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{level.xp} XP</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            level.type === 'boss' ? 'bg-red-100 text-red-800' :
                            level.type === 'challenge' ? 'bg-orange-100 text-orange-800' :
                            level.type === 'quiz' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {level.type}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {campaignsData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600">Start your learning journey by exploring available campaigns.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react';
import { Award, Trophy, Star, Lock, CheckCircle, Calendar } from 'lucide-react';
import { api } from '../api/client';
import type { Badge, UserBadge, Milestone, UserMilestone } from '../api/client';

interface BadgesAndMilestonesProps {
  userId: string;
  className?: string;
}

export const BadgesAndMilestones: React.FC<BadgesAndMilestonesProps> = ({ userId, className = '' }) => {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [userMilestones, setUserMilestones] = useState<UserMilestone[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [allMilestones, setAllMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'badges' | 'milestones'>('badges');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [badgesData, userBadgesData, milestonesData, userMilestonesData] = await Promise.all([
          api.getBadges(),
          api.getUserBadges(userId),
          api.getMilestones(),
          api.getUserMilestones(userId)
        ]);

        setAllBadges(badgesData);
        setUserBadges(userBadgesData);
        setAllMilestones(milestonesData);
        setUserMilestones(userMilestonesData);
      } catch (error) {
        console.error('Failed to load badges and milestones:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
  const earnedMilestoneIds = new Set(userMilestones.filter(um => um.completed).map(um => um.milestoneId));

  const getBadgeCategoryColor = (category: string) => {
    switch (category) {
      case 'achievement': return 'blue';
      case 'milestone': return 'purple';
      case 'skill': return 'green';
      case 'special': return 'yellow';
      default: return 'gray';
    }
  };

  const getMilestoneProgress = (milestone: Milestone) => {
    const userMilestone = userMilestones.find(um => um.milestoneId === milestone.id);
    if (!userMilestone) return 0;
    return Math.min(userMilestone.currentValue / milestone.targetValue, 1);
  };

  if (loading) {
    return (
      <div className={`bg-slate-800 rounded-2xl border border-slate-700 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 rounded-2xl border border-slate-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Award className="text-indigo-400" size={24} />
          Achievements
        </h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'badges'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Badges ({userBadges.length})
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'milestones'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Milestones ({userMilestones.filter(um => um.completed).length}/{allMilestones.length})
          </button>
        </div>
      </div>

      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allBadges.map((badge) => {
              const isEarned = earnedBadgeIds.has(badge.id);
              const userBadge = userBadges.find(ub => ub.badgeId === badge.id);
              
              return (
                <div
                  key={badge.id}
                  className={`relative p-4 rounded-xl border transition-all ${
                    isEarned
                      ? 'bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-indigo-500/50'
                      : 'bg-slate-900/50 border-slate-600/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`text-3xl ${!isEarned && 'grayscale'}`}>
                      {badge.isSecret && !isEarned ? '❓' : badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-white truncate">
                          {badge.isSecret && !isEarned ? '???' : badge.name}
                        </h4>
                        {isEarned && <CheckCircle size={16} className="text-green-400" />}
                        {badge.isSecret && !isEarned && <Lock size={16} className="text-slate-400" />}
                      </div>
                      <p className="text-xs text-slate-400 mb-2">
                        {badge.isSecret && !isEarned ? 'Complete secret objectives to unlock' : badge.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`px-2 py-1 rounded-full bg-${getBadgeCategoryColor(badge.category)}-500/20 text-${getBadgeCategoryColor(badge.category)}-300 border border-${getBadgeCategoryColor(badge.category)}-500/30`}>
                          {badge.category}
                        </span>
                        {badge.xpReward > 0 && (
                          <span className="text-yellow-400 flex items-center gap-1">
                            <Star size={12} />
                            {badge.xpReward} XP
                          </span>
                        )}
                        {isEarned && userBadge && (
                          <span className="text-slate-500 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(userBadge.earnedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {userBadges.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Lock size={48} className="mx-auto mb-4 opacity-50" />
              <p>No badges earned yet. Complete quests to unlock achievements!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="space-y-4">
          {allMilestones.map((milestone) => {
            const isCompleted = earnedMilestoneIds.has(milestone.id);
            const progress = getMilestoneProgress(milestone);
            const userMilestone = userMilestones.find(um => um.milestoneId === milestone.id);
            
            return (
              <div
                key={milestone.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/50'
                    : 'bg-slate-900/50 border-slate-600/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`text-2xl ${!isCompleted && 'opacity-50'}`}>
                    {milestone.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-white">{milestone.title}</h4>
                      {isCompleted && <CheckCircle size={16} className="text-green-400" />}
                    </div>
                    <p className="text-sm text-slate-400 mb-3">{milestone.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{userMilestone?.currentValue || 0} / {milestone.targetValue}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isCompleted ? 'bg-green-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-1 rounded-full bg-${milestone.color}-500/20 text-${milestone.color}-300 border border-${milestone.color}-500/30`}>
                        {milestone.category}
                      </span>
                      <span className="text-yellow-400 flex items-center gap-1">
                        <Trophy size={12} />
                        {JSON.parse(milestone.rewards).xp} XP
                      </span>
                      {isCompleted && userMilestone?.completedAt && (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(userMilestone.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

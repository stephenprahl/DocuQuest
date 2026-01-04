import React, { useState, useEffect } from 'react'
import { 
  Search, 
  TrendingUp, 
  Star, 
  Users, 
  Clock, 
  Eye,
  Heart,
  Bookmark,
  Globe,
  Zap,
  Target,
  Award,
  Calendar,
  BarChart3,
  Grid,
  List
} from 'lucide-react'
import type { Campaign } from '../api/client'

interface PublicCampaign extends Campaign {
  author: {
    username: string
    avatar?: string
  }
  stats: {
    views: number
    forks: number
    likes: number
    comments: number
    rating: number
  }
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number // in minutes
  createdAt: string
  featured: boolean
}

interface CampaignBrowserProps {
  onCampaignSelect: (campaign: PublicCampaign) => void
}

export const CampaignBrowser: React.FC<CampaignBrowserProps> = ({ onCampaignSelect }) => {
  const [campaigns, setCampaigns] = useState<PublicCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [sortBy, setSortBy] = useState('trending')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [likedCampaigns, setLikedCampaigns] = useState<Set<string>>(new Set())
  const [bookmarkedCampaigns, setBookmarkedCampaigns] = useState<Set<string>>(new Set())

  const categories = [
    { id: 'all', name: 'All Categories', icon: <Globe size={16} /> },
    { id: 'programming', name: 'Programming', icon: <Target size={16} /> },
    { id: 'web-dev', name: 'Web Development', icon: <Zap size={16} /> },
    { id: 'data-science', name: 'Data Science', icon: <BarChart3 size={16} /> },
    { id: 'mobile', name: 'Mobile Dev', icon: <Users size={16} /> },
    { id: 'design', name: 'Design', icon: <Award size={16} /> },
    { id: 'devops', name: 'DevOps', icon: <Clock size={16} /> }
  ]

  const sortOptions = [
    { id: 'trending', name: 'Trending', icon: <TrendingUp size={16} /> },
    { id: 'popular', name: 'Most Popular', icon: <Star size={16} /> },
    { id: 'newest', name: 'Newest', icon: <Calendar size={16} /> },
    { id: 'rating', name: 'Highest Rated', icon: <Heart size={16} /> }
  ]

  useEffect(() => {
    loadPublicCampaigns()
  }, [])

  useEffect(() => {
    filterAndSortCampaigns()
  }, [searchQuery, selectedCategory, selectedDifficulty, sortBy])

  const loadPublicCampaigns = async () => {
    setLoading(true)
    try {
      // Mock data - in real app, this would fetch from API
      const mockCampaigns: PublicCampaign[] = [
        {
          id: '1',
          title: 'React Mastery Course',
          description: 'Complete React development from basics to advanced concepts including hooks, state management, and performance optimization.',
          theme: 'blue',
          sourceUrl: 'https://react.dev/learn',
          isPublic: true,
          createdBy: 'user1',
          levels: [],
          creator: { id: 'user1', username: 'ReactExpert' },
          author: { username: 'ReactExpert' },
          stats: {
            views: 1234,
            forks: 89,
            likes: 234,
            comments: 45,
            rating: 4.8
          },
          tags: ['react', 'javascript', 'frontend', 'hooks'],
          difficulty: 'intermediate',
          estimatedTime: 180,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          featured: true
        },
        {
          id: '2',
          title: 'Python for Data Science',
          description: 'Learn Python programming with a focus on data science applications including pandas, numpy, and machine learning basics.',
          theme: 'green',
          sourceUrl: 'https://docs.python.org/3/',
          isPublic: true,
          createdBy: 'user2',
          levels: [],
          creator: { id: 'user2', username: 'DataScientist' },
          author: { username: 'DataScientist' },
          stats: {
            views: 987,
            forks: 67,
            likes: 189,
            comments: 32,
            rating: 4.6
          },
          tags: ['python', 'data-science', 'pandas', 'numpy'],
          difficulty: 'beginner',
          estimatedTime: 240,
          createdAt: '2024-01-10T14:00:00Z',
          updatedAt: '2024-01-10T14:00:00Z',
          featured: false
        },
        {
          id: '3',
          title: 'Advanced TypeScript Patterns',
          description: 'Deep dive into TypeScript advanced patterns, generics, decorators, and type-safe programming practices.',
          theme: 'indigo',
          sourceUrl: 'https://www.typescriptlang.org/docs/',
          isPublic: true,
          createdBy: 'user3',
          levels: [],
          creator: { id: 'user3', username: 'TypeScriptGuru' },
          author: { username: 'TypeScriptGuru' },
          stats: {
            views: 756,
            forks: 45,
            likes: 156,
            comments: 28,
            rating: 4.9
          },
          tags: ['typescript', 'javascript', 'types', 'generics'],
          difficulty: 'advanced',
          estimatedTime: 150,
          createdAt: '2024-01-08T09:00:00Z',
          updatedAt: '2024-01-08T09:00:00Z',
          featured: false
        },
        {
          id: '4',
          title: 'Node.js Backend Development',
          description: 'Build scalable backend applications with Node.js, Express, MongoDB, and modern JavaScript features.',
          theme: 'purple',
          sourceUrl: 'https://nodejs.org/docs',
          isPublic: true,
          createdBy: 'user4',
          levels: [],
          creator: { id: 'user4', username: 'BackendMaster' },
          author: { username: 'BackendMaster' },
          stats: {
            views: 543,
            forks: 34,
            likes: 98,
            comments: 19,
            rating: 4.5
          },
          tags: ['nodejs', 'backend', 'express', 'mongodb'],
          difficulty: 'intermediate',
          estimatedTime: 200,
          createdAt: '2024-01-05T16:00:00Z',
          updatedAt: '2024-01-05T16:00:00Z',
          featured: false
        },
        {
          id: '5',
          title: 'CSS Grid and Flexbox Mastery',
          description: 'Master modern CSS layout techniques with Grid and Flexbox. Create responsive, beautiful layouts with ease.',
          theme: 'pink',
          sourceUrl: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
          isPublic: true,
          createdBy: 'user5',
          levels: [],
          creator: { id: 'user5', username: 'CSSWizard' },
          author: { username: 'CSSWizard' },
          stats: {
            views: 432,
            forks: 28,
            likes: 87,
            comments: 15,
            rating: 4.7
          },
          tags: ['css', 'frontend', 'layout', 'responsive'],
          difficulty: 'beginner',
          estimatedTime: 90,
          createdAt: '2024-01-03T11:00:00Z',
          updatedAt: '2024-01-03T11:00:00Z',
          featured: false
        }
      ]
      
      setCampaigns(mockCampaigns)
    } catch (error) {
      console.error('Failed to load campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortCampaigns = () => {
    let filtered = campaigns.filter(campaign => {
      const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          campaign.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          campaign.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'all' || campaign.tags.includes(selectedCategory)
      const matchesDifficulty = selectedDifficulty === 'all' || campaign.difficulty === selectedDifficulty
      
      return matchesSearch && matchesCategory && matchesDifficulty
    })

    // Sort campaigns
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'trending':
          return (b.stats.views + b.stats.likes) - (a.stats.views + a.stats.likes)
        case 'popular':
          return b.stats.likes - a.stats.likes
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'rating':
          return b.stats.rating - a.stats.rating
        default:
          return 0
      }
    })

    return filtered
  }

  const handleLike = (campaignId: string) => {
    setLikedCampaigns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId)
      } else {
        newSet.add(campaignId)
      }
      return newSet
    })
  }

  const handleBookmark = (campaignId: string) => {
    setBookmarkedCampaigns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId)
      } else {
        newSet.add(campaignId)
      }
      return newSet
    })
  }

  const filteredCampaigns = filterAndSortCampaigns()

  const CampaignCard = ({ campaign }: { campaign: PublicCampaign }) => (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-indigo-500 transition-all group cursor-pointer">
      {/* Featured Badge */}
      {campaign.featured && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Star size={10} fill="currentColor" />
            Featured
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg bg-${campaign.theme}-500/20 text-${campaign.theme}-400 ring-1 ring-${campaign.theme}-500/30`}>
            <Target size={20} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleLike(campaign.id) }}
              className={`p-2 rounded-lg transition-colors ${
                likedCampaigns.has(campaign.id)
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-slate-700 text-slate-400 hover:text-rose-400'
              }`}
            >
              <Heart size={16} fill={likedCampaigns.has(campaign.id) ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleBookmark(campaign.id) }}
              className={`p-2 rounded-lg transition-colors ${
                bookmarkedCampaigns.has(campaign.id)
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-slate-700 text-slate-400 hover:text-indigo-400'
              }`}
            >
              <Bookmark size={16} fill={bookmarkedCampaigns.has(campaign.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
          {campaign.title}
        </h3>
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{campaign.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {campaign.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
              {tag}
            </span>
          ))}
          {campaign.tags.length > 3 && (
            <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
              +{campaign.tags.length - 3}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye size={14} />
              {campaign.stats.views}
            </div>
            <div className="flex items-center gap-1">
              <Heart size={14} />
              {campaign.stats.likes}
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              {campaign.stats.forks}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star size={14} className="text-yellow-400" />
            {campaign.stats.rating.toFixed(1)}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center">
              <Users size={12} className="text-slate-300" />
            </div>
            <span className="text-sm text-slate-300">{campaign.author.username}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock size={12} />
            {campaign.estimatedTime}min
            <span className={`px-2 py-1 rounded ${
              campaign.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
              campaign.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {campaign.difficulty}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const CampaignListItem = ({ campaign }: { campaign: PublicCampaign }) => (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-indigo-500 transition-all group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-lg bg-${campaign.theme}-500/20 text-${campaign.theme}-400 ring-1 ring-${campaign.theme}-500/30`}>
          <Target size={24} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                {campaign.title}
              </h3>
              <p className="text-slate-400 text-sm line-clamp-1">{campaign.description}</p>
            </div>
            
            {campaign.featured && (
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Star size={8} fill="currentColor" />
                Featured
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-slate-600 rounded-full flex items-center justify-center">
                <Users size={10} className="text-slate-300" />
              </div>
              {campaign.author.username}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye size={12} />
                {campaign.stats.views}
              </div>
              <div className="flex items-center gap-1">
                <Heart size={12} />
                {campaign.stats.likes}
              </div>
              <div className="flex items-center gap-1">
                <Star size={12} className="text-yellow-400" />
                {campaign.stats.rating.toFixed(1)}
              </div>
              <Clock size={12} />
              {campaign.estimatedTime}min
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleLike(campaign.id) }}
            className={`p-2 rounded-lg transition-colors ${
              likedCampaigns.has(campaign.id)
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-slate-700 text-slate-400 hover:text-rose-400'
            }`}
          >
            <Heart size={16} fill={likedCampaigns.has(campaign.id) ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleBookmark(campaign.id) }}
            className={`p-2 rounded-lg transition-colors ${
              bookmarkedCampaigns.has(campaign.id)
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-slate-700 text-slate-400 hover:text-indigo-400'
            }`}
          >
            <Bookmark size={16} fill={bookmarkedCampaigns.has(campaign.id) ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Explore Campaigns</h1>
        <p className="text-slate-400">Discover and learn from campaigns shared by the community</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search campaigns, tags, or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              {sortOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white hover:bg-slate-600 transition-colors"
            >
              {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-slate-400">
          {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''} found
        </p>
        {filteredCampaigns.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Sort by:</span>
            <span className="text-white font-medium">
              {sortOptions.find(o => o.id === sortBy)?.name}
            </span>
          </div>
        )}
      </div>

      {/* Campaign Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading campaigns...</p>
          </div>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No campaigns found</h3>
          <p className="text-slate-400">Try adjusting your search or filters</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map(campaign => (
            <div key={campaign.id} onClick={() => onCampaignSelect(campaign)}>
              <CampaignCard campaign={campaign} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map(campaign => (
            <div key={campaign.id} onClick={() => onCampaignSelect(campaign)}>
              <CampaignListItem campaign={campaign} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

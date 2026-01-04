const API_BASE_URL = 'http://localhost:3000'

export interface Campaign {
  id: string
  title: string
  description: string
  theme: string
  sourceUrl?: string
  isPublic: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  levels: Level[]
  creator: {
    id: string
    username: string
  }
}

export interface Level {
  id: string
  campaignId: string
  title: string
  type: 'lesson' | 'quiz' | 'challenge' | 'boss'
  xp: number
  order: number
  content: string // JSON string
}

export interface User {
  id: string
  email: string
  username: string
  level: number
  xp: number
  createdAt: string
  updatedAt: string
}

export interface UserProgress {
  id: string
  userId: string
  campaignId: string
  levelId: string
  completed: boolean
  completedAt?: string
  attempts: number
  createdAt: string
  updatedAt: string
  level: Level
  campaign: Campaign
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  category: 'achievement' | 'milestone' | 'skill' | 'special'
  requirement: string // JSON string
  xpReward: number
  isSecret: boolean
  createdAt: string
}

export interface UserBadge {
  id: string
  userId: string
  badgeId: string
  earnedAt: string
  progress: number
  badge: Badge
}

export interface Milestone {
  id: string
  title: string
  description: string
  targetValue: number
  category: 'level' | 'xp' | 'campaigns' | 'quests' | 'streak'
  icon: string
  color: string
  rewards: string // JSON string
  createdAt: string
}

export interface UserMilestone {
  id: string
  userId: string
  milestoneId: string
  completed: boolean
  completedAt?: string
  currentValue: number
  milestone: Milestone
}

export interface ScrapingOptions {
  maxDepth?: number
  maxPages?: number
  followExternalLinks?: boolean
  selectors?: {
    content?: string
    title?: string
    description?: string
    navigation?: string
  }
}

export interface GenerationOptions {
  ollamaUrl?: string
  model?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  focusAreas?: string[]
  includeCodeExamples?: boolean
  includeQuizzes?: boolean
  includeProjects?: boolean
}

export interface ScrapedPage {
  url: string
  title: string
  content: string
  metadata: {
    description?: string
    headings: string[]
    links: string[]
    images: string[]
  }
}

export interface OllamaStatus {
  connected: boolean
  models: string[]
  defaultModel: string
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return this.request<Campaign[]>('/api/campaigns')
  }

  async getCampaign(id: string): Promise<Campaign> {
    return this.request<Campaign>(`/api/campaigns/${id}`)
  }

  async createCampaign(data: {
    title: string
    description: string
    theme: string
    sourceUrl?: string
    createdBy: string
  }): Promise<Campaign> {
    return this.request<Campaign>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async generateCampaign(data: {
    sourceUrl?: string
    prompt?: string
    createdBy: string
    scrapingOptions?: ScrapingOptions
    generationOptions?: GenerationOptions
  }): Promise<Campaign> {
    return this.request<Campaign>('/api/campaigns/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteCampaign(id: string): Promise<void> {
    return this.request<void>(`/api/campaigns/${id}`, {
      method: 'DELETE',
    })
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/api/users')
  }

  async getDefaultUser(): Promise<User> {
    return this.request<User>('/api/users/default')
  }

  // Progress
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return this.request<UserProgress[]>(`/api/users/${userId}/progress`)
  }

  async updateUserProgress(userId: string, data: {
    levelId: string
    completed: boolean
  }): Promise<UserProgress> {
    return this.request<UserProgress>(`/api/users/${userId}/progress`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health')
  }

  // Scraping
  async scrapeWebsite(url: string, options?: ScrapingOptions): Promise<{
    success: boolean
    pages: ScrapedPage[]
    count: number
  }> {
    return this.request<{
      success: boolean
      pages: ScrapedPage[]
      count: number
    }>('/api/scrape', {
      method: 'POST',
      body: JSON.stringify({ url, options }),
    })
  }

  // Ollama
  async getOllamaStatus(): Promise<OllamaStatus> {
    return this.request<OllamaStatus>('/api/ollama/status')
  }

  // Badges
  async getBadges(): Promise<Badge[]> {
    return this.request<Badge[]>('/api/badges')
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.request<UserBadge[]>(`/api/users/${userId}/badges`)
  }

  async createBadge(data: {
    name: string
    description: string
    icon: string
    color: string
    category: 'achievement' | 'milestone' | 'skill' | 'special'
    requirement: any
    xpReward?: number
    isSecret?: boolean
  }): Promise<Badge> {
    return this.request<Badge>('/api/badges', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Milestones
  async getMilestones(): Promise<Milestone[]> {
    return this.request<Milestone[]>('/api/milestones')
  }

  async getUserMilestones(userId: string): Promise<UserMilestone[]> {
    return this.request<UserMilestone[]>(`/api/users/${userId}/milestones`)
  }

  async createMilestone(data: {
    title: string
    description: string
    targetValue: number
    category: 'level' | 'xp' | 'campaigns' | 'quests' | 'streak'
    icon: string
    color: string
    rewards?: any
  }): Promise<Milestone> {
    return this.request<Milestone>('/api/milestones', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const api = new ApiClient()

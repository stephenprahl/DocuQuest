const API_BASE_URL = 'http://localhost:3001'

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
}

export const api = new ApiClient()

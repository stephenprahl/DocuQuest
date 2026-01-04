import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { prisma } from './lib/prisma'
import { scrapeWebsite } from './lib/scraper'
import { OllamaAgent } from './lib/ollama-agent'
import { CourseValidator } from './lib/course-validator'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Ollama status check
app.get('/api/ollama/status', async (c) => {
  const agent = new OllamaAgent()
  const isConnected = await agent.checkOllamaConnection()
  const models = await agent.getAvailableModels()
  
  return c.json({
    connected: isConnected,
    models,
    defaultModel: 'gpt-oss:120b-cloud'
  })
})

// Scrape website endpoint
app.post('/api/scrape', async (c) => {
  try {
    const body = await c.req.json()
    const { url, options } = body
    
    if (!url) {
      return c.json({ error: 'URL is required' }, 400)
    }

    const scrapedPages = await scrapeWebsite(url, options)
    
    return c.json({
      success: true,
      pages: scrapedPages,
      count: scrapedPages.length
    })
  } catch (error) {
    console.error('Error scraping website:', error)
    return c.json({ 
      error: 'Failed to scrape website',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Validate campaign endpoint
app.post('/api/campaigns/validate', async (c) => {
  try {
    const body = await c.req.json()
    const { campaign } = body
    
    if (!campaign) {
      return c.json({ error: 'Campaign data is required' }, 400)
    }

    const validator = new CourseValidator()
    const validation = validator.validateCampaign(campaign)
    
    return c.json(validation)
  } catch (error) {
    console.error('Error validating campaign:', error)
    return c.json({ 
      error: 'Failed to validate campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Get campaigns with quality filters
app.get('/api/campaigns/quality', async (c) => {
  try {
    const minScore = parseInt(c.req.query('minScore') || '0')
    const validated = c.req.query('validated') === 'true'
    
    const campaigns = await prisma.campaign.findMany({
      where: {
        qualityScore: minScore > 0 ? { gte: minScore } : undefined,
        isValidated: validated ? true : undefined
      },
      include: {
        levels: {
          orderBy: { order: 'asc' }
        },
        creator: {
          select: { id: true, username: true }
        }
      },
      orderBy: {
        qualityScore: 'desc'
      }
    })
    
    return c.json(campaigns)
  } catch (error) {
    console.error('Error fetching quality campaigns:', error)
    return c.json({ error: 'Failed to fetch campaigns' }, 500)
  }
})

// Routes
app.get('/api/users', async (c) => {
  const users = await prisma.user.findMany({
    include: {
      campaigns: true,
      userProgress: true
    }
  })
  return c.json(users)
})

app.get('/api/campaigns', async (c) => {
  const campaigns = await prisma.campaign.findMany({
    include: {
      levels: {
        orderBy: { order: 'asc' }
      },
      creator: {
        select: { id: true, username: true }
      }
    }
  })
  return c.json(campaigns)
})

app.get('/api/campaigns/:id', async (c) => {
  const id = c.req.param('id')
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      levels: {
        orderBy: { order: 'asc' }
      },
      creator: {
        select: { id: true, username: true }
      }
    }
  })
  
  if (!campaign) {
    return c.json({ error: 'Campaign not found' }, 404)
  }
  
  return c.json(campaign)
})

app.post('/api/campaigns', async (c) => {
  try {
    const body = await c.req.json()
    const { title, description, theme, sourceUrl, createdBy } = body
    
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: createdBy }
    })
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        theme,
        sourceUrl,
        createdBy
      },
      include: {
        levels: true,
        creator: {
          select: { id: true, username: true }
        }
      }
    })
    
    return c.json(campaign, 201)
  } catch (error) {
    console.error('Error creating campaign:', error)
    return c.json({ error: 'Failed to create campaign' }, 500)
  }
})

app.delete('/api/campaigns/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    await prisma.campaign.delete({
      where: { id }
    })
    
    return c.json({ message: 'Campaign deleted successfully' })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return c.json({ error: 'Failed to delete campaign' }, 500)
  }
})

app.get('/api/users/:userId/progress', async (c) => {
  const userId = c.req.param('userId')
  const progress = await prisma.userProgress.findMany({
    where: { userId },
    include: {
      level: true,
      campaign: true
    }
  })
  return c.json(progress)
})

app.post('/api/campaigns/generate', async (c) => {
  try {
    const body = await c.req.json()
    const { sourceUrl, createdBy, prompt, scrapingOptions, generationOptions } = body
    
    if (!createdBy) {
      return c.json({ error: 'createdBy is required' }, 400)
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: createdBy }
    })
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    let generatedCampaign
    
    if (sourceUrl) {
      // Use new scraping + Ollama approach
      generatedCampaign = await generateCampaignFromScraping(sourceUrl, createdBy, scrapingOptions, generationOptions)
    } else if (prompt) {
      // For prompt-only generation, still use Ollama but without scraping
      generatedCampaign = await generateCampaignFromPromptWithOllama(prompt, createdBy, generationOptions)
    } else {
      return c.json({ error: 'Either sourceUrl or prompt is required' }, 400)
    }
    
    return c.json(generatedCampaign, 201)
  } catch (error) {
    console.error('Error generating campaign:', error)
    return c.json({ 
      error: 'Failed to generate campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

async function generateCampaignFromScraping(
  sourceUrl: string, 
  createdBy: string, 
  scrapingOptions: any = {},
  generationOptions: any = {}
) {
  // Step 1: Scrape the website
  console.log(`Starting to scrape: ${sourceUrl}`)
  const scrapedPages = await scrapeWebsite(sourceUrl, {
    maxDepth: scrapingOptions.maxDepth || 2,
    maxPages: scrapingOptions.maxPages || 30,
    ...scrapingOptions
  })

  if (scrapedPages.length === 0) {
    throw new Error('No content could be scraped from the provided URL')
  }

  console.log(`Scraped ${scrapedPages.length} pages`)

  // Step 2: Generate course with Ollama
  const agent = new OllamaAgent(
    generationOptions.ollamaUrl,
    generationOptions.model
  )

  const isOllamaAvailable = await agent.checkOllamaConnection()
  if (!isOllamaAvailable) {
    console.warn('Ollama not available, falling back to template generation')
    return await generateCampaignFromUrl(sourceUrl, createdBy)
  }

  console.log('Generating course with Ollama...')
  const generatedCourse = await agent.generateCourse(scrapedPages, {
    difficulty: generationOptions.difficulty || 'beginner',
    focusAreas: generationOptions.focusAreas,
    includeCodeExamples: generationOptions.includeCodeExamples !== false,
    includeQuizzes: generationOptions.includeQuizzes !== false,
    includeProjects: generationOptions.includeProjects !== false
  })

  // Step 3: Create campaign in database
  const campaign = await prisma.campaign.create({
    data: {
      title: generatedCourse.title,
      description: generatedCourse.description,
      theme: generatedCourse.theme,
      sourceUrl,
      createdBy,
      qualityScore: generatedCourse.validation?.score.overall,
      isValidated: generatedCourse.validation?.passed || false,
      validationData: JSON.stringify(generatedCourse.validation),
      levels: {
        create: generatedCourse.levels.map(level => ({
          title: level.title,
          type: level.type,
          xp: level.xp,
          order: level.order,
          content: JSON.stringify(level.content)
        }))
      }
    },
    include: {
      levels: {
        orderBy: { order: 'asc' }
      },
      creator: {
        select: { id: true, username: true }
      }
    }
  })

  return campaign
}

async function generateCampaignFromPromptWithOllama(
  prompt: string, 
  createdBy: string, 
  generationOptions: any = {}
) {
  const agent = new OllamaAgent(
    generationOptions.ollamaUrl,
    generationOptions.model
  )

  const isOllamaAvailable = await agent.checkOllamaConnection()
  if (!isOllamaAvailable) {
    console.warn('Ollama not available, falling back to template generation')
    return await generateCampaignFromPrompt(prompt, createdBy)
  }

  // Create a mock scraped page from the prompt
  const mockPages = [{
    url: 'prompt://user-input',
    title: 'Custom Learning Request',
    content: prompt,
    metadata: {
      headings: ['Custom Learning Path'],
      links: [],
      images: []
    }
  }]

  const generatedCourse = await agent.generateCourse(mockPages, {
    difficulty: generationOptions.difficulty || 'beginner',
    focusAreas: generationOptions.focusAreas,
    includeCodeExamples: generationOptions.includeCodeExamples !== false,
    includeQuizzes: generationOptions.includeQuizzes !== false,
    includeProjects: generationOptions.includeProjects !== false
  })

  const campaign = await prisma.campaign.create({
    data: {
      title: generatedCourse.title,
      description: generatedCourse.description,
      theme: generatedCourse.theme,
      sourceUrl: null,
      createdBy,
      qualityScore: generatedCourse.validation?.score.overall,
      isValidated: generatedCourse.validation?.passed || false,
      validationData: JSON.stringify(generatedCourse.validation),
      levels: {
        create: generatedCourse.levels.map(level => ({
          title: level.title,
          type: level.type,
          xp: level.xp,
          order: level.order,
          content: JSON.stringify(level.content)
        }))
      }
    },
    include: {
      levels: {
        orderBy: { order: 'asc' }
      },
      creator: {
        select: { id: true, username: true }
      }
    }
  })

  return campaign
}

async function generateCampaignFromPrompt(prompt: string, createdBy: string) {
  // Extract key concepts from the prompt
  const words = prompt.toLowerCase().split(' ')
  const mainTopic = words.find(w => w.length > 4) || 'coding'
  
  // Generate campaign based on prompt
  const campaignData = {
    title: `The ${mainTopic.charAt(0).toUpperCase() + mainTopic.slice(1)} Adventure`,
    description: `Learn ${mainTopic} through interactive quests and challenges based on your request.`,
    theme: getRandomTheme(),
    sourceUrl: null,
    createdBy,
    levels: generateLevelsForTopic(mainTopic, prompt)
  }

  // Create campaign with levels
  const campaign = await prisma.campaign.create({
    data: {
      ...campaignData,
      levels: {
        create: campaignData.levels
      }
    },
    include: {
      levels: {
        orderBy: { order: 'asc' }
      },
      creator: {
        select: { id: true, username: true }
      }
    }
  })

  return campaign
}

function generateLevelsForTopic(topic: string, prompt: string) {
  const baseLevels = [
    {
      title: `Introduction to ${topic}`,
      type: 'lesson',
      xp: 100,
      order: 1,
      content: JSON.stringify({
        intro: `Welcome to your personalized ${topic} adventure!`,
        text: `Based on your request: "${prompt}", we've created this custom learning journey for you.`,
        snippet: `// Your first ${topic} code\nconsole.log('Learning ${topic}!');`
      })
    },
    {
      title: `${topic} Fundamentals Quiz`,
      type: 'quiz',
      xp: 150,
      order: 2,
      content: JSON.stringify({
        question: `What do you want to learn about ${topic}?`,
        options: [
          { id: 'a', text: "Basic concepts" },
          { id: 'b', text: "Advanced techniques" },
          { id: 'c', text: "Best practices" },
          { id: 'd', text: "Real-world applications" }
        ],
        correct: 'a',
        explanation: `Starting with basics is the best way to master ${topic}.`
      })
    },
    {
      title: `Your First ${topic} Project`,
      type: 'challenge',
      xp: 300,
      order: 3,
      content: JSON.stringify({
        instruction: `Create your first ${topic} project based on your interests.`,
        hint: `Think about what you want to build with ${topic}.`,
        initialCode: `// Your custom ${topic} project\n\n`,
        solutionKey: ["function", "return", "console.log"],
        successMessage: `Great! You've started your ${topic} journey!`
      })
    },
    {
      title: `${topic} Mastery Challenge`,
      type: 'boss',
      xp: 1000,
      order: 4,
      content: JSON.stringify({
        instruction: `BOSS BATTLE: Apply everything you've learned about ${topic}!`,
        hint: `Use all the concepts and techniques from this campaign.`,
        initialCode: `// Master level ${topic} challenge\n\n`,
        solutionKey: ["function", "const", "let", "return", "console.log"],
        successMessage: `LEGENDARY! You've mastered ${topic}!`
      })
    }
  ]

  return baseLevels
}
  async function generateCampaignFromUrl(sourceUrl: string, createdBy: string) {
  // Extract domain for campaign title
  const url = new URL(sourceUrl)
  const domain = url.hostname.replace('www.', '').replace('.com', '').replace('.org', '').replace('.dev', '')
  
  // Generate campaign based on domain
  const campaignData = {
    title: `The ${domain.charAt(0).toUpperCase() + domain.slice(1)} Chronicles`,
    description: `Master the art of ${domain} through interactive quests and challenges.`,
    theme: getRandomTheme(),
    sourceUrl,
    createdBy,
    levels: generateLevelsForDomain(domain)
  }

  // Create campaign with levels
  const campaign = await prisma.campaign.create({
    data: {
      ...campaignData,
      levels: {
        create: campaignData.levels
      }
    },
    include: {
      levels: {
        orderBy: { order: 'asc' }
      },
      creator: {
        select: { id: true, username: true }
      }
    }
  })

  return campaign
}

function getRandomTheme(): string {
  const themes = ['blue', 'green', 'purple', 'red', 'yellow', 'indigo', 'pink', 'orange']
  return themes[Math.floor(Math.random() * themes.length)]
}

function generateLevelsForDomain(domain: string) {
  const baseLevels = [
    {
      title: `Introduction to ${domain}`,
      type: 'lesson',
      xp: 100,
      order: 1,
      content: JSON.stringify({
        intro: `Welcome to the world of ${domain}!`,
        text: `This campaign will teach you the fundamentals of ${domain} through interactive learning.`,
        snippet: `// Your first ${domain} code\nconsole.log('Hello, ${domain}!');`
      })
    },
    {
      title: `${domain} Basics Quiz`,
      type: 'quiz',
      xp: 150,
      order: 2,
      content: JSON.stringify({
        question: `What is the primary purpose of ${domain}?`,
        options: [
          { id: 'a', text: "Web Development" },
          { id: 'b', text: "Mobile Development" },
          { id: 'c', text: "Data Science" },
          { id: 'd', text: "Game Development" }
        ],
        correct: 'a',
        explanation: `${domain} is primarily used for web development.`
      })
    },
    {
      title: `Your First ${domain} Project`,
      type: 'challenge',
      xp: 300,
      order: 3,
      content: JSON.stringify({
        instruction: `Create your first ${domain} project by completing the code below.`,
        hint: `Use the ${domain} syntax you've learned.`,
        initialCode: `// Complete this ${domain} code\n\n`,
        solutionKey: ["function", "return", "console.log"],
        successMessage: `Excellent! You've created your first ${domain} project!`
      })
    },
    {
      title: `${domain} Mastery Challenge`,
      type: 'boss',
      xp: 1000,
      order: 4,
      content: JSON.stringify({
        instruction: `BOSS BATTLE: Master ${domain} by combining all concepts you've learned!`,
        hint: `Use functions, variables, and proper ${domain} syntax.`,
        initialCode: `// Create a complete ${domain} application\n\n`,
        solutionKey: ["function", "const", "let", "return", "console.log"],
        successMessage: `LEGENDARY! You've mastered ${domain}!`
      })
    }
  ]

  return baseLevels
}

// Get or create default user
app.get('/api/users/default', async (c) => {
  try {
    let user = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' }
    })
    
    if (!user) {
      // Create default user if none exists
      user = await prisma.user.create({
        data: {
          email: 'dev@docuquest.local',
          username: 'DevAdventurer'
        }
      })
    }
    
    return c.json(user)
  } catch (error) {
    console.error('Error getting default user:', error)
    return c.json({ error: 'Failed to get default user' }, 500)
  }
})

// Debug endpoint to check existing data
app.get('/api/debug/data', async (c) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        levels: {
          select: {
            id: true,
            title: true,
            type: true,
            order: true
          }
        },
        creator: {
          select: { id: true, username: true }
        }
      }
    })
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true
      }
    })
    
    return c.json({
      campaigns: campaigns.length,
      users: users.length,
      campaignData: campaigns.map(campaign => ({
        id: campaign.id,
        title: campaign.title,
        levels: campaign.levels.length,
        levelIds: campaign.levels.map(l => l.id)
      })),
      userData: users
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return c.json({ error: 'Debug endpoint failed' }, 500)
  }
})

// Validate progress request endpoint
app.post('/api/debug/validate-progress', async (c) => {
  try {
    const body = await c.req.json()
    const { userId, levelId } = body
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    })
    
    const level = await prisma.level.findUnique({
      where: { id: levelId },
      select: { 
        id: true, 
        title: true, 
        campaignId: true,
        campaign: {
          select: { id: true, title: true }
        }
      }
    })
    
    return c.json({
      valid: !!(user && level),
      user: user ? { id: user.id, username: user.username } : null,
      level: level ? {
        id: level.id,
        title: level.title,
        campaign: level.campaign
      } : null,
      error: !user ? 'User not found' : !level ? 'Level not found' : null
    })
  } catch (error) {
    console.error('Validation error:', error)
    return c.json({ error: 'Validation failed' }, 500)
  }
})

app.post('/api/users/:userId/progress', async (c) => {
  try {
    const userId = c.req.param('userId')
    const body = await c.req.json()
    const { levelId, completed } = body
    
    if (!levelId) {
      return c.json({ error: 'levelId is required' }, 400)
    }
    
    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    // Get the campaignId from the level
    const level = await prisma.level.findUnique({
      where: { id: levelId },
      select: { campaignId: true }
    })
    
    if (!level) {
      console.error(`Level not found: ${levelId}`)
      return c.json({ error: 'Level not found' }, 404)
    }
    
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_levelId: {
          userId,
          levelId
        }
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
        attempts: { increment: 1 }
      },
      create: {
        userId,
        levelId,
        campaignId: level.campaignId,
        completed,
        completedAt: completed ? new Date() : null,
        attempts: 1
      },
      include: {
        level: true,
        campaign: true
      }
    })
    
    // Check for badge awards and milestone completion
    if (completed) {
      await checkAndAwardBadges(userId, levelId)
      await checkAndUpdateMilestones(userId)
    }
    
    return c.json(progress)
  } catch (error) {
    console.error('Error updating progress:', error)
    
    // Handle specific Prisma errors
    if (error instanceof Error && 'code' in error) {
      const prismaError = error as any
      if (prismaError.code === 'P2003') {
        return c.json({ 
          error: 'Foreign key constraint failed - the level or user may not exist', 
          details: prismaError.meta 
        }, 400)
      }
    }
    
    return c.json({ error: 'Failed to update progress' }, 500)
  }
})

// Badge endpoints
app.get('/api/badges', async (c) => {
  const badges = await prisma.badge.findMany({
    orderBy: { category: 'asc' }
  })
  return c.json(badges)
})

app.get('/api/users/:userId/badges', async (c) => {
  const userId = c.req.param('userId')
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: {
      badge: true
    },
    orderBy: { earnedAt: 'desc' }
  })
  return c.json(userBadges)
})

app.post('/api/badges', async (c) => {
  try {
    const body = await c.req.json()
    const { name, description, icon, color, category, requirement, xpReward, isSecret } = body
    
    const badge = await prisma.badge.create({
      data: {
        name,
        description,
        icon,
        color,
        category,
        requirement: JSON.stringify(requirement),
        xpReward: xpReward || 0,
        isSecret: isSecret || false
      }
    })
    
    return c.json(badge, 201)
  } catch (error) {
    console.error('Error creating badge:', error)
    return c.json({ error: 'Failed to create badge' }, 500)
  }
})

// Milestone endpoints
app.get('/api/milestones', async (c) => {
  const milestones = await prisma.milestone.findMany({
    orderBy: { targetValue: 'asc' }
  })
  return c.json(milestones)
})

app.get('/api/users/:userId/milestones', async (c) => {
  const userId = c.req.param('userId')
  const userMilestones = await prisma.userMilestone.findMany({
    where: { userId },
    include: {
      milestone: true
    },
    orderBy: { completedAt: 'desc' }
  })
  return c.json(userMilestones)
})

app.post('/api/milestones', async (c) => {
  try {
    const body = await c.req.json()
    const { title, description, targetValue, category, icon, color, rewards } = body
    
    const milestone = await prisma.milestone.create({
      data: {
        title,
        description,
        targetValue,
        category,
        icon,
        color,
        rewards: JSON.stringify(rewards || {})
      }
    })
    
    return c.json(milestone, 201)
  } catch (error) {
    console.error('Error creating milestone:', error)
    return c.json({ error: 'Failed to create milestone' }, 500)
  }
})

// Helper functions for badge and milestone logic
async function checkAndAwardBadges(userId: string, levelId: string) {
  try {
    // Get user's current stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userProgress: {
          where: { completed: true }
        },
        userBadges: {
          include: { badge: true }
        }
      }
    })
    
    if (!user) return
    
    const completedLevels = user.userProgress.length
    const totalXP = user.xp
    const currentLevel = user.level
    
    // Get all available badges
    const allBadges = await prisma.badge.findMany()
    const earnedBadgeIds = user.userBadges.map(ub => ub.badgeId)
    
    // Check each badge
    for (const badge of allBadges) {
      if (earnedBadgeIds.includes(badge.id)) continue // Already earned
      
      let shouldAward = false
      const requirement = JSON.parse(badge.requirement)
      
      // Check different badge types
      switch (badge.category) {
        case 'achievement':
          if (requirement.type === 'first_quest' && completedLevels === 1) {
            shouldAward = true
          } else if (requirement.type === 'level_10' && currentLevel >= 10) {
            shouldAward = true
          } else if (requirement.type === 'xp_1000' && totalXP >= 1000) {
            shouldAward = true
          }
          break
          
        case 'milestone':
          if (requirement.type === 'quests_10' && completedLevels >= 10) {
            shouldAward = true
          } else if (requirement.type === 'quests_50' && completedLevels >= 50) {
            shouldAward = true
          } else if (requirement.type === 'quests_100' && completedLevels >= 100) {
            shouldAward = true
          }
          break
          
        case 'skill':
          // Check for specific skill-based achievements
          if (requirement.type === 'code_master' && completedLevels >= 25) {
            shouldAward = true
          }
          break
      }
      
      if (shouldAward) {
        // Award the badge
        await prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
            progress: 1.0
          }
        })
        
        // Award XP if badge has XP reward
        if (badge.xpReward > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: { xp: { increment: badge.xpReward } }
          })
        }
        
        console.log(`Awarded badge "${badge.name}" to user ${userId}`)
      }
    }
  } catch (error) {
    console.error('Error checking badges:', error)
  }
}

async function checkAndUpdateMilestones(userId: string) {
  try {
    // Get user's current stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userProgress: {
          where: { completed: true }
        },
        userMilestones: {
          include: { milestone: true }
        }
      }
    })
    
    if (!user) return
    
    const completedLevels = user.userProgress.length
    const totalXP = user.xp
    const currentLevel = user.level
    const completedMilestoneIds = user.userMilestones.map((um: any) => um.milestoneId)
    
    // Get all milestones
    const allMilestones = await prisma.milestone.findMany()
    
    // Check each milestone
    for (const milestone of allMilestones) {
      if (completedMilestoneIds.includes(milestone.id)) continue // Already completed
      
      let currentValue = 0
      let isCompleted = false
      
      switch (milestone.category) {
        case 'level':
          currentValue = currentLevel
          isCompleted = currentLevel >= milestone.targetValue
          break
        case 'xp':
          currentValue = totalXP
          isCompleted = totalXP >= milestone.targetValue
          break
        case 'quests':
          currentValue = completedLevels
          isCompleted = completedLevels >= milestone.targetValue
          break
        case 'campaigns':
          // Count unique campaigns completed
          const uniqueCampaigns = new Set(user.userProgress.map(p => p.campaignId))
          currentValue = uniqueCampaigns.size
          isCompleted = uniqueCampaigns.size >= milestone.targetValue
          break
      }
      
      // Update or create milestone progress
      await prisma.userMilestone.upsert({
        where: {
          userId_milestoneId: {
            userId,
            milestoneId: milestone.id
          }
        },
        update: {
          currentValue,
          completed: isCompleted,
          completedAt: isCompleted ? new Date() : null
        },
        create: {
          userId,
          milestoneId: milestone.id,
          currentValue,
          completed: isCompleted,
          completedAt: isCompleted ? new Date() : null
        }
      })
      
      if (isCompleted && !completedMilestoneIds.includes(milestone.id)) {
        // Award milestone rewards
        const rewards = JSON.parse(milestone.rewards)
        if (rewards.xp) {
          await prisma.user.update({
            where: { id: userId },
            data: { xp: { increment: rewards.xp } }
          })
        }
        
        console.log(`Completed milestone "${milestone.title}" for user ${userId}`)
      }
    }
  } catch (error) {
    console.error('Error checking milestones:', error)
  }
}

// Start server
const port = Number(process.env.PORT) || 3001
console.log(`🚀 DocuQuest API server running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})

export { app }

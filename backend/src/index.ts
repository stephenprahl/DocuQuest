import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { prisma } from './lib/prisma'

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
    const { sourceUrl, createdBy, prompt } = body
    
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
    if (prompt) {
      generatedCampaign = await generateCampaignFromPrompt(prompt, createdBy)
    } else if (sourceUrl) {
      generatedCampaign = await generateCampaignFromUrl(sourceUrl, createdBy)
    } else {
      return c.json({ error: 'Either sourceUrl or prompt is required' }, 400)
    }
    
    return c.json(generatedCampaign, 201)
  } catch (error) {
    console.error('Error generating campaign:', error)
    return c.json({ error: 'Failed to generate campaign' }, 500)
  }
})

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

app.post('/api/users/:userId/progress', async (c) => {
  try {
    const userId = c.req.param('userId')
    const body = await c.req.json()
    const { levelId, completed } = body
    
    // Get the campaignId from the level
    const level = await prisma.level.findUnique({
      where: { id: levelId },
      select: { campaignId: true }
    })
    
    if (!level) {
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
    
    return c.json(progress)
  } catch (error) {
    console.error('Error updating progress:', error)
    return c.json({ error: 'Failed to update progress' }, 500)
  }
})

// Start server
const port = Number(process.env.PORT) || 3001
console.log(`🚀 DocuQuest API server running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})

export { app }

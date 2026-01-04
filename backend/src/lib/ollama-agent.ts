import { ScrapedPage } from './scraper'

export interface CourseGenerationOptions {
  model?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  focusAreas?: string[]
  includeCodeExamples?: boolean
  includeQuizzes?: boolean
  includeProjects?: boolean
}

export interface GeneratedLevel {
  title: string
  type: 'lesson' | 'quiz' | 'challenge' | 'boss'
  xp: number
  order: number
  content: any
}

export interface GeneratedCampaign {
  title: string
  description: string
  theme: string
  levels: GeneratedLevel[]
}

export class OllamaAgent {
  private baseUrl: string
  private model: string

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'gpt-oss:120b-cloud') {
    this.baseUrl = baseUrl
    this.model = model
  }

  async generateCourse(scrapedPages: ScrapedPage[], options: CourseGenerationOptions = {}): Promise<GeneratedCampaign> {
    const allContent = scrapedPages.map(page => ({
      title: page.title,
      url: page.url,
      content: page.content.substring(0, 2000), // Limit content length
      headings: page.metadata.headings
    }))

    const systemPrompt = this.buildSystemPrompt(options)
    const userPrompt = this.buildUserPrompt(allContent, options)

    try {
      const response = await this.callOllama(systemPrompt, userPrompt)
      const campaignData = this.parseCampaignResponse(response)
      
      return campaignData
    } catch (error) {
      console.error('Error generating course:', error)
      throw new Error('Failed to generate course with Ollama')
    }
  }

  private buildSystemPrompt(options: CourseGenerationOptions): string {
    const difficulty = options.difficulty || 'beginner'
    const includeCode = options.includeCodeExamples !== false
    const includeQuizzes = options.includeQuizzes !== false
    const includeProjects = options.includeProjects !== false

    return `You are an expert educational content designer who creates engaging, gamified learning experiences. 

Your task is to analyze scraped web content and generate a structured course that teaches the material effectively.

Course Requirements:
- Difficulty Level: ${difficulty}
- Include Code Examples: ${includeCode ? 'Yes' : 'No'}
- Include Quizzes: ${includeQuizzes ? 'Yes' : 'No'}
- Include Projects: ${includeProjects ? 'Yes' : 'No'}

Course Structure:
Generate 4-6 levels that progress logically:
1. Introduction/Lesson (100 XP)
2. Quiz/Assessment (150 XP) 
3. Challenge/Practice (300 XP)
4. Boss Battle/Mastery (1000 XP)
5. Additional levels as needed

Response Format:
Return ONLY valid JSON with this exact structure:
{
  "title": "Course Title",
  "description": "Course description",
  "theme": "blue|green|purple|red|yellow|indigo|pink|orange",
  "levels": [
    {
      "title": "Level Title",
      "type": "lesson|quiz|challenge|boss",
      "xp": 100,
      "order": 1,
      "content": {
        // For lessons: {intro, text, snippet}
        // For quizzes: {question, options[], correct, explanation}
        // For challenges: {instruction, hint, initialCode, solutionKey[], successMessage}
        // For boss: {instruction, hint, initialCode, solutionKey[], successMessage}
      }
    }
  ]
}

Content Guidelines:
- Make content engaging and gamified
- Use RPG-style language ("quest", "battle", "adventure")
- Include practical examples when relevant
- Ensure progressive difficulty
- Focus on key concepts from the source material`
  }

  private buildUserPrompt(contentPages: any[], options: CourseGenerationOptions): string {
    const focusAreas = options.focusAreas?.join(', ') || ''
    
    let prompt = `Generate a gamified course from the following scraped content:\n\n`
    
    contentPages.forEach((page, index) => {
      prompt += `--- Page ${index + 1} ---\n`
      prompt += `Title: ${page.title}\n`
      prompt += `URL: ${page.url}\n`
      prompt += `Headings: ${page.headings.join(', ')}\n`
      prompt += `Content: ${page.content}\n\n`
    })

    if (focusAreas) {
      prompt += `Special focus on: ${focusAreas}\n`
    }

    prompt += `Create an engaging learning experience that teaches the key concepts from this material.`
    
    return prompt
  }

  private async callOllama(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        system: systemPrompt,
        prompt: userPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 4000
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as { response: string }
    return data.response
  }

  private parseCampaignResponse(response: string): GeneratedCampaign {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const campaignData = JSON.parse(jsonMatch[0])
      
      // Validate required fields
      if (!campaignData.title || !campaignData.description || !campaignData.levels) {
        throw new Error('Invalid campaign structure')
      }

      // Ensure levels have required fields and proper order
      campaignData.levels = campaignData.levels.map((level: any, index: number) => ({
        ...level,
        order: index + 1,
        xp: level.xp || this.getDefaultXp(level.type),
        content: this.sanitizeContent(level.content, level.type)
      }))

      return campaignData
    } catch (error) {
      console.error('Error parsing campaign response:', error)
      throw new Error('Failed to parse generated campaign')
    }
  }

  private getDefaultXp(levelType: string): number {
    const xpMap = {
      'lesson': 100,
      'quiz': 150,
      'challenge': 300,
      'boss': 1000
    }
    return xpMap[levelType as keyof typeof xpMap] || 100
  }

  private sanitizeContent(content: any, levelType: string): any {
    // Ensure content has the right structure based on level type
    switch (levelType) {
      case 'lesson':
        return {
          intro: content.intro || 'Welcome to this lesson!',
          text: content.text || 'In this lesson, you will learn important concepts.',
          snippet: content.snippet || '// Example code\nconsole.log("Hello World");'
        }
      
      case 'quiz':
        return {
          question: content.question || 'What have you learned?',
          options: Array.isArray(content.options) ? content.options : [
            { id: 'a', text: 'Option A' },
            { id: 'b', text: 'Option B' },
            { id: 'c', text: 'Option C' },
            { id: 'd', text: 'Option D' }
          ],
          correct: content.correct || 'a',
          explanation: content.explanation || 'This is the correct answer.'
        }
      
      case 'challenge':
      case 'boss':
        return {
          instruction: content.instruction || 'Complete the challenge below.',
          hint: content.hint || 'Think about what you\'ve learned.',
          initialCode: content.initialCode || '// Your code here\n\n',
          solutionKey: Array.isArray(content.solutionKey) ? content.solutionKey : ['function'],
          successMessage: content.successMessage || 'Great job!'
        }
      
      default:
        return content
    }
  }

  async checkOllamaConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      if (!response.ok) return []
      
      const data = await response.json() as { models: Array<{ name: string }> }
      return data.models?.map((model: { name: string }) => model.name) || []
    } catch {
      return []
    }
  }
}

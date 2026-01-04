import { ScrapedPage } from './scraper'
import { CourseValidator, ValidationResult } from './course-validator'

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
  private validator: CourseValidator

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'gpt-oss:120b-cloud') {
    this.baseUrl = baseUrl
    this.model = model
    this.validator = new CourseValidator()
  }

  async generateCourse(scrapedPages: ScrapedPage[], options: CourseGenerationOptions = {}): Promise<GeneratedCampaign & { validation: ValidationResult }> {
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
      
      // Validate the generated campaign
      const validation = this.validator.validateCampaign(campaignData, scrapedPages)
      
      // If validation fails, try to improve the campaign
      if (!validation.passed && validation.score.overall < 60) {
        console.warn('Generated campaign failed validation, attempting to improve...')
        const improvedCampaign = await this.improveCampaign(campaignData, validation, scrapedPages, options)
        const improvedValidation = this.validator.validateCampaign(improvedCampaign, scrapedPages)
        
        return {
          ...improvedCampaign,
          validation: improvedValidation
        }
      }
      
      return {
        ...campaignData,
        validation
      }
    } catch (error) {
      console.error('Error generating course:', error)
      throw new Error('Failed to generate course with Ollama')
    }
  }

  private async improveCampaign(
    campaign: GeneratedCampaign, 
    validation: ValidationResult, 
    scrapedPages: ScrapedPage[], 
    options: CourseGenerationOptions
  ): Promise<GeneratedCampaign> {
    const improvementPrompt = this.buildImprovementPrompt(campaign, validation, scrapedPages)
    const systemPrompt = this.buildSystemPrompt(options)

    try {
      const response = await this.callOllama(systemPrompt, improvementPrompt)
      const improvedCampaign = this.parseCampaignResponse(response)
      return improvedCampaign
    } catch (error) {
      console.error('Error improving campaign:', error)
      return campaign // Return original if improvement fails
    }
  }

  private buildImprovementPrompt(campaign: GeneratedCampaign, validation: ValidationResult, scrapedPages: ScrapedPage[]): string {
    const issues = validation.issues
      .filter(issue => issue.type === 'error' || issue.severity > 5)
      .map(issue => `- ${issue.message}: ${issue.suggestion || 'Needs improvement'}`)
      .join('\n')

    let prompt = `IMPROVE the following campaign based on these validation issues:\n\n`
    prompt += `ISSUES TO FIX:\n${issues}\n\n`
    prompt += `CURRENT CAMPAIGN:\n${JSON.stringify(campaign, null, 2)}\n\n`
    prompt += `SOURCE MATERIAL:\n${scrapedPages.map(page => page.title + ': ' + page.content.substring(0, 500)).join('\n\n')}\n\n`
    prompt += `IMPROVEMENT REQUIREMENTS:\n`
    prompt += `- Fix all validation errors\n`
    prompt += `- Ensure proper level structure and content\n`
    prompt += `- Maintain the original theme and learning objectives\n`
    prompt += `- Make content more engaging and comprehensive\n`
    prompt += `- Respond with ONLY valid JSON, no markdown or explanations\n`
    
    return prompt
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

CRITICAL INSTRUCTIONS:
- You MUST respond with ONLY valid JSON
- Do NOT include any explanatory text, markdown, or formatting
- Do NOT use triple backticks or code blocks
- Ensure all JSON syntax is correct (quotes, commas, brackets)
- Double-check that all strings are properly quoted
- Make sure the JSON is valid and can be parsed

Response Format (EXACT):
{
  "title": "Course Title",
  "description": "Course description",
  "theme": "blue",
  "levels": [
    {
      "title": "Level Title",
      "type": "lesson",
      "xp": 100,
      "order": 1,
      "content": {
        "intro": "Introduction text",
        "text": "Main content text",
        "snippet": "code snippet"
      }
    }
  ]
}

Content Guidelines:
- Make content engaging and gamified
- Use RPG-style language ("quest", "battle", "adventure")
- Include practical examples when relevant
- Ensure progressive difficulty
- Focus on key concepts from the source material
- Keep content concise but informative`
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

    prompt += `Create an engaging learning experience that teaches the key concepts from this material.\n\n`
    prompt += `IMPORTANT: Respond with ONLY valid JSON. No markdown, no explanations, no formatting. Just the JSON object.`
    
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
      // Try to extract JSON from the response with better error handling
      // Look for JSON that starts with { and ends with }
      const jsonMatch = response.match(/\{[\s\S]*?\}/)
      if (!jsonMatch) {
        // If no JSON found, try to extract from markdown code blocks
        const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
        if (!codeBlockMatch) {
          throw new Error('No JSON found in response')
        }
        const campaignData = JSON.parse(codeBlockMatch[1])
        return this.validateAndProcessCampaign(campaignData)
      }

      const campaignData = JSON.parse(jsonMatch[0])
      return this.validateAndProcessCampaign(campaignData)
    } catch (error) {
      console.error('Error parsing campaign response:', error)
      console.error('Response content:', response.substring(0, 500)) // Log first 500 chars for debugging
      
      // Try to extract JSON with a more permissive approach
      try {
        // Look for any JSON-like structure
        const jsonStart = response.indexOf('{')
        const jsonEnd = response.lastIndexOf('}')
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          const jsonStr = response.substring(jsonStart, jsonEnd + 1)
          const campaignData = JSON.parse(jsonStr)
          return this.validateAndProcessCampaign(campaignData)
        }
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError)
      }
      
      throw new Error('Failed to parse generated campaign')
    }
  }

  private validateAndProcessCampaign(campaignData: any): GeneratedCampaign {
    // Validate required fields
    if (!campaignData.title || !campaignData.description || !campaignData.levels) {
      throw new Error('Invalid campaign structure')
    }

    // Ensure levels is an array
    if (!Array.isArray(campaignData.levels)) {
      throw new Error('Levels must be an array')
    }

    // Ensure levels have required fields and proper order
    campaignData.levels = campaignData.levels.map((level: any, index: number) => ({
      ...level,
      order: index + 1,
      xp: level.xp || this.getDefaultXp(level.type),
      content: this.sanitizeContent(level.content, level.type)
    }))

    return campaignData
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

export interface QualityScore {
  overall: number
  content: number
  structure: number
  engagement: number
  difficulty: number
  completeness: number
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'suggestion'
  category: 'content' | 'structure' | 'engagement' | 'difficulty' | 'completeness'
  message: string
  severity: number // 1-10 scale
  suggestion?: string
}

export interface ValidationResult {
  score: QualityScore
  issues: ValidationIssue[]
  passed: boolean
  recommendations: string[]
}

export interface LevelValidation {
  level: any
  score: number
  issues: ValidationIssue[]
}

export class CourseValidator {
  private readonly minimumScore = 70
  private readonly weights = {
    content: 0.3,
    structure: 0.25,
    engagement: 0.2,
    difficulty: 0.15,
    completeness: 0.1
  }

  validateCampaign(campaign: any, sourcePages?: any[]): ValidationResult {
    const issues: ValidationIssue[] = []
    const levelValidations: LevelValidation[] = []

    // Validate basic structure
    this.validateBasicStructure(campaign, issues)
    
    // Validate levels
    if (campaign.levels && Array.isArray(campaign.levels)) {
      campaign.levels.forEach((level: any, index: number) => {
        const levelValidation = this.validateLevel(level, index + 1)
        levelValidations.push(levelValidation)
        issues.push(...levelValidation.issues)
      })
    }

    // Validate content quality
    this.validateContentQuality(campaign, sourcePages, issues)
    
    // Validate difficulty progression
    this.validateDifficultyProgression(campaign, issues)
    
    // Validate engagement factors
    this.validateEngagement(campaign, issues)

    // Calculate scores
    const score = this.calculateQualityScore(campaign, levelValidations, issues)
    
    const passed = score.overall >= this.minimumScore && 
                   !issues.some(issue => issue.type === 'error')

    return {
      score,
      issues,
      passed,
      recommendations: this.generateRecommendations(issues, score)
    }
  }

  private validateBasicStructure(campaign: any, issues: ValidationIssue[]): void {
    if (!campaign.title || campaign.title.trim().length < 3) {
      issues.push({
        type: 'error',
        category: 'structure',
        message: 'Campaign title is too short or missing',
        severity: 8,
        suggestion: 'Add a descriptive title (at least 3 characters)'
      })
    }

    if (!campaign.description || campaign.description.trim().length < 10) {
      issues.push({
        type: 'error',
        category: 'structure',
        message: 'Campaign description is too short or missing',
        severity: 7,
        suggestion: 'Add a comprehensive description (at least 10 characters)'
      })
    }

    if (!campaign.levels || !Array.isArray(campaign.levels) || campaign.levels.length < 2) {
      issues.push({
        type: 'error',
        category: 'structure',
        message: 'Campaign must have at least 2 levels',
        severity: 9,
        suggestion: 'Add more levels to create a meaningful learning experience'
      })
    }

    if (campaign.levels && campaign.levels.length > 10) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: 'Campaign has too many levels (over 10)',
        severity: 4,
        suggestion: 'Consider splitting into multiple campaigns for better focus'
      })
    }
  }

  private validateLevel(level: any, levelNumber: number): LevelValidation {
    const issues: ValidationIssue[] = []

    // Basic level structure
    if (!level.title || level.title.trim().length < 3) {
      issues.push({
        type: 'error',
        category: 'structure',
        message: `Level ${levelNumber}: Title is too short or missing`,
        severity: 7
      })
    }

    if (!level.type || !['lesson', 'quiz', 'challenge', 'boss'].includes(level.type)) {
      issues.push({
        type: 'error',
        category: 'structure',
        message: `Level ${levelNumber}: Invalid or missing level type`,
        severity: 8
      })
    }

    if (!level.xp || level.xp < 50 || level.xp > 2000) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: `Level ${levelNumber}: XP value should be between 50-2000`,
        severity: 3
      })
    }

    // Content validation based on type
    const contentScore = this.validateLevelContent(level, levelNumber, issues)

    const score = Math.max(0, 100 - (issues.reduce((sum, issue) => sum + issue.severity, 0) / issues.length))

    return {
      level,
      score,
      issues
    }
  }

  private validateLevelContent(level: any, levelNumber: number, issues: ValidationIssue[]): number {
    let contentScore = 100

    if (!level.content) {
      issues.push({
        type: 'error',
        category: 'content',
        message: `Level ${levelNumber}: Missing content`,
        severity: 9
      })
      return 0
    }

    switch (level.type) {
      case 'lesson':
        contentScore = this.validateLessonContent(level.content, levelNumber, issues)
        break
      case 'quiz':
        contentScore = this.validateQuizContent(level.content, levelNumber, issues)
        break
      case 'challenge':
      case 'boss':
        contentScore = this.validateChallengeContent(level.content, levelNumber, issues)
        break
    }

    return contentScore
  }

  private validateLessonContent(content: any, levelNumber: number, issues: ValidationIssue[]): number {
    let score = 100

    if (!content.intro || content.intro.length < 20) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: `Level ${levelNumber}: Lesson introduction is too short`,
        severity: 4,
        suggestion: 'Add a more engaging introduction (at least 20 characters)'
      })
      score -= 10
    }

    if (!content.text || content.text.length < 50) {
      issues.push({
        type: 'error',
        category: 'content',
        message: `Level ${levelNumber}: Lesson content is too short`,
        severity: 6,
        suggestion: 'Add comprehensive lesson content (at least 50 characters)'
      })
      score -= 20
    }

    if (content.snippet && content.snippet.length < 10) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: `Level ${levelNumber}: Code snippet is too short`,
        severity: 3
      })
      score -= 5
    }

    return Math.max(0, score)
  }

  private validateQuizContent(content: any, levelNumber: number, issues: ValidationIssue[]): number {
    let score = 100

    if (!content.question || content.question.length < 10) {
      issues.push({
        type: 'error',
        category: 'content',
        message: `Level ${levelNumber}: Quiz question is too short or missing`,
        severity: 7
      })
      score -= 25
    }

    if (!content.options || !Array.isArray(content.options) || content.options.length < 2) {
      issues.push({
        type: 'error',
        category: 'content',
        message: `Level ${levelNumber}: Quiz needs at least 2 options`,
        severity: 8
      })
      score -= 30
    }

    if (!content.correct || !content.options.find((opt: any) => opt.id === content.correct)) {
      issues.push({
        type: 'error',
        category: 'content',
        message: `Level ${levelNumber}: Invalid correct answer specified`,
        severity: 9
      })
      score -= 35
    }

    if (!content.explanation || content.explanation.length < 10) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: `Level ${levelNumber}: Quiz explanation is missing or too short`,
        severity: 4
      })
      score -= 10
    }

    return Math.max(0, score)
  }

  private validateChallengeContent(content: any, levelNumber: number, issues: ValidationIssue[]): number {
    let score = 100

    if (!content.instruction || content.instruction.length < 15) {
      issues.push({
        type: 'error',
        category: 'content',
        message: `Level ${levelNumber}: Challenge instructions are too short`,
        severity: 6
      })
      score -= 20
    }

    if (!content.initialCode) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: `Level ${levelNumber}: No initial code provided`,
        severity: 3
      })
      score -= 10
    }

    if (!content.solutionKey || !Array.isArray(content.solutionKey) || content.solutionKey.length === 0) {
      issues.push({
        type: 'error',
        category: 'content',
        message: `Level ${levelNumber}: Missing solution validation keys`,
        severity: 7
      })
      score -= 25
    }

    if (!content.successMessage || content.successMessage.length < 5) {
      issues.push({
        type: 'warning',
        category: 'engagement',
        message: `Level ${levelNumber}: Missing success message`,
        severity: 2
      })
      score -= 5
    }

    return Math.max(0, score)
  }

  private validateContentQuality(campaign: any, sourcePages: any[] | undefined, issues: ValidationIssue[]): void {
    if (!sourcePages || sourcePages.length === 0) return

    const totalContent = campaign.levels?.reduce((sum: number, level: any) => {
      const content = level.content
      if (typeof content === 'string') {
        return sum + content.length
      } else if (typeof content === 'object') {
        return sum + JSON.stringify(content).length
      }
      return sum
    }, 0) || 0

    const sourceContent = sourcePages.reduce((sum: number, page: any) => sum + (page.content?.length || 0), 0)

    if (totalContent < sourceContent * 0.1) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: 'Generated content seems too short compared to source material',
        severity: 5,
        suggestion: 'Consider generating more comprehensive content'
      })
    }

    if (totalContent > sourceContent * 2) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: 'Generated content might be too verbose',
        severity: 3,
        suggestion: 'Consider making content more concise'
      })
    }
  }

  private validateDifficultyProgression(campaign: any, issues: ValidationIssue[]): void {
    if (!campaign.levels || campaign.levels.length < 2) return

    const typeOrder = { 'lesson': 1, 'quiz': 2, 'challenge': 3, 'boss': 4 }
    let lastTypeOrder = 0

    campaign.levels.forEach((level: any, index: number) => {
      const currentTypeOrder = typeOrder[level.type as keyof typeof typeOrder] || 0
      
      if (currentTypeOrder < lastTypeOrder && index > 0) {
        issues.push({
          type: 'warning',
          category: 'difficulty',
          message: `Level ${index + 1}: Difficulty regression detected`,
          severity: 4,
          suggestion: 'Consider reordering levels for better progression'
        })
      }
      
      lastTypeOrder = currentTypeOrder
    })
  }

  private validateEngagement(campaign: any, issues: ValidationIssue[]): void {
    const levelTypes = campaign.levels?.reduce((counts: any, level: any) => {
      counts[level.type] = (counts[level.type] || 0) + 1
      return counts
    }, {}) || {}

    if (!levelTypes.quiz || levelTypes.quiz === 0) {
      issues.push({
        type: 'suggestion',
        category: 'engagement',
        message: 'No quiz levels found - consider adding assessments',
        severity: 3,
        suggestion: 'Add quiz levels to test understanding'
      })
    }

    if (!levelTypes.challenge && !levelTypes.boss) {
      issues.push({
        type: 'suggestion',
        category: 'engagement',
        message: 'No practical challenges found - consider adding hands-on exercises',
        severity: 4,
        suggestion: 'Add challenge levels for practical application'
      })
    }

    const totalXP = campaign.levels?.reduce((sum: number, level: any) => sum + (level.xp || 0), 0) || 0
    if (totalXP < 500) {
      issues.push({
        type: 'warning',
        category: 'engagement',
        message: 'Total XP seems low for a complete campaign',
        severity: 3
      })
    }
  }

  private calculateQualityScore(campaign: any, levelValidations: LevelValidation[], issues: ValidationIssue[]): QualityScore {
    const errorCount = issues.filter(i => i.type === 'error').length
    const warningCount = issues.filter(i => i.type === 'warning').length
    const suggestionCount = issues.filter(i => i.type === 'suggestion').length

    const content = Math.max(0, 100 - (errorCount * 15) - (warningCount * 5) - (suggestionCount * 2))
    const structure = levelValidations.length > 0 
      ? levelValidations.reduce((sum, lv) => sum + lv.score, 0) / levelValidations.length 
      : 100
    const engagement = Math.max(0, 100 - (suggestionCount * 8))
    const difficulty = Math.max(0, 100 - (issues.filter(i => i.category === 'difficulty').length * 10))
    const completeness = Math.max(0, 100 - (errorCount * 20))

    const overall = 
      content * this.weights.content +
      structure * this.weights.structure +
      engagement * this.weights.engagement +
      difficulty * this.weights.difficulty +
      completeness * this.weights.completeness

    return {
      overall: Math.round(overall),
      content: Math.round(content),
      structure: Math.round(structure),
      engagement: Math.round(engagement),
      difficulty: Math.round(difficulty),
      completeness: Math.round(completeness)
    }
  }

  private generateRecommendations(issues: ValidationIssue[], score: QualityScore): string[] {
    const recommendations: string[] = []

    if (score.overall < 60) {
      recommendations.push('Course needs significant improvements before publishing')
    } else if (score.overall < 80) {
      recommendations.push('Course has good foundation but needs some refinements')
    } else {
      recommendations.push('Course quality is good - consider minor enhancements')
    }

    const topIssues = issues
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 3)
      .filter(issue => issue.suggestion)

    topIssues.forEach(issue => {
      if (issue.suggestion) {
        recommendations.push(issue.suggestion)
      }
    })

    if (score.engagement < 70) {
      recommendations.push('Add more interactive elements to improve engagement')
    }

    if (score.content < 70) {
      recommendations.push('Enhance content depth and quality')
    }

    return recommendations
  }
}

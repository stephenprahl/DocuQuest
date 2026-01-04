import React, { useState } from 'react'
import { 
  Zap, 
  Code, 
  Database, 
  Globe, 
  Smartphone, 
  Palette, 
  Server, 
  Shield, 
  Cloud,
  Rocket,
  Clock,
  Star,
  TrendingUp,
  Play,
  X
} from 'lucide-react'
import { api } from '../api/client'
import type { User } from '../api/client'

interface CampaignTemplate {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number
  icon: React.ReactNode
  tags: string[]
  preview: {
    title: string
    description: string
    levels: number
    xp: number
  }
  prompt: string
  sourceUrl?: string
  popular?: boolean
  featured?: boolean
}

interface CampaignTemplatesProps {
  user: User | null
  onTemplateSelect: (template: CampaignTemplate) => void
  onCustomCreate: () => void
}

export const CampaignTemplates: React.FC<CampaignTemplatesProps> = ({ 
  user, 
  onTemplateSelect, 
  onCustomCreate 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const categories = [
    { id: 'all', name: 'All Templates', icon: <Rocket size={16} /> },
    { id: 'web-dev', name: 'Web Development', icon: <Globe size={16} /> },
    { id: 'mobile', name: 'Mobile Dev', icon: <Smartphone size={16} /> },
    { id: 'backend', name: 'Backend', icon: <Server size={16} /> },
    { id: 'data-science', name: 'Data Science', icon: <Database size={16} /> },
    { id: 'design', name: 'Design', icon: <Palette size={16} /> },
    { id: 'devops', name: 'DevOps', icon: <Cloud size={16} /> },
    { id: 'security', name: 'Security', icon: <Shield size={16} /> }
  ]

  const templates: CampaignTemplate[] = [
    // Web Development Templates
    {
      id: 'react-basics',
      name: 'React Fundamentals',
      description: 'Learn React from scratch - components, props, state, and hooks',
      category: 'web-dev',
      difficulty: 'beginner',
      estimatedTime: 120,
      icon: <Code size={24} />,
      tags: ['react', 'javascript', 'frontend', 'hooks'],
      preview: {
        title: 'React Adventure',
        description: 'Master React basics through interactive quests',
        levels: 5,
        xp: 1500
      },
      prompt: 'Create a comprehensive beginner-friendly React tutorial covering components, props, state management with useState and useEffect, and modern React hooks. Include practical examples and mini-projects.',
      featured: true
    },
    {
      id: 'typescript-mastery',
      name: 'TypeScript Mastery',
      description: 'Advanced TypeScript patterns, generics, and type-safe programming',
      category: 'web-dev',
      difficulty: 'advanced',
      estimatedTime: 180,
      icon: <Code size={24} />,
      tags: ['typescript', 'javascript', 'types', 'generics'],
      preview: {
        title: 'TypeScript Quest',
        description: 'Master advanced TypeScript concepts',
        levels: 6,
        xp: 2000
      },
      prompt: 'Create an advanced TypeScript course covering generics, utility types, conditional types, decorators, and type-safe programming patterns. Include complex real-world examples and best practices.',
      popular: true
    },
    {
      id: 'css-modern',
      name: 'Modern CSS Layouts',
      description: 'Master CSS Grid, Flexbox, and modern layout techniques',
      category: 'web-dev',
      difficulty: 'intermediate',
      estimatedTime: 90,
      icon: <Palette size={24} />,
      tags: ['css', 'frontend', 'layout', 'responsive'],
      preview: {
        title: 'CSS Layout Mastery',
        description: 'Build beautiful, responsive layouts',
        levels: 4,
        xp: 1200
      },
      prompt: 'Create a comprehensive CSS course focusing on modern layout techniques with Grid and Flexbox. Include responsive design principles, animations, and practical layout challenges.'
    },

    // Backend Templates
    {
      id: 'nodejs-backend',
      name: 'Node.js Backend',
      description: 'Build scalable backend applications with Node.js and Express',
      category: 'backend',
      difficulty: 'intermediate',
      estimatedTime: 200,
      icon: <Server size={24} />,
      tags: ['nodejs', 'backend', 'express', 'api'],
      preview: {
        title: 'Backend Development',
        description: 'Create RESTful APIs and services',
        levels: 6,
        xp: 1800
      },
      prompt: 'Create a Node.js backend development course covering Express.js, RESTful APIs, middleware, authentication, database integration with MongoDB, and deployment strategies.',
      featured: true
    },
    {
      id: 'python-data',
      name: 'Python for Data Science',
      description: 'Learn Python with focus on data analysis and machine learning',
      category: 'data-science',
      difficulty: 'beginner',
      estimatedTime: 240,
      icon: <Database size={24} />,
      tags: ['python', 'data-science', 'pandas', 'numpy'],
      preview: {
        title: 'Data Science with Python',
        description: 'Analyze data and build ML models',
        levels: 8,
        xp: 2500
      },
      prompt: 'Create a Python data science course covering NumPy, Pandas, data visualization, basic machine learning concepts, and practical data analysis projects.',
      popular: true
    },

    // Mobile Templates
    {
      id: 'react-native',
      name: 'React Native Basics',
      description: 'Build mobile apps with React Native for iOS and Android',
      category: 'mobile',
      difficulty: 'intermediate',
      estimatedTime: 160,
      icon: <Smartphone size={24} />,
      tags: ['react-native', 'mobile', 'ios', 'android'],
      preview: {
        title: 'Mobile App Development',
        description: 'Create cross-platform mobile apps',
        levels: 5,
        xp: 1600
      },
      prompt: 'Create a React Native course covering components, navigation, state management, platform-specific code, and building a complete mobile application.'
    },

    // DevOps Templates
    {
      id: 'docker-devops',
      name: 'Docker & DevOps',
      description: 'Containerization and deployment strategies for modern applications',
      category: 'devops',
      difficulty: 'advanced',
      estimatedTime: 180,
      icon: <Cloud size={24} />,
      tags: ['docker', 'devops', 'deployment', 'ci-cd'],
      preview: {
        title: 'DevOps Mastery',
        description: 'Containerize and deploy applications',
        levels: 6,
        xp: 2000
      },
      prompt: 'Create a comprehensive DevOps course covering Docker, containerization, CI/CD pipelines, cloud deployment, and infrastructure as code concepts.'
    },

    // Security Templates
    {
      id: 'web-security',
      name: 'Web Security Basics',
      description: 'Essential security practices for web developers',
      category: 'security',
      difficulty: 'intermediate',
      estimatedTime: 140,
      icon: <Shield size={24} />,
      tags: ['security', 'web', 'owasp', 'authentication'],
      preview: {
        title: 'Web Security Essentials',
        description: 'Secure your web applications',
        levels: 5,
        xp: 1700
      },
      prompt: 'Create a web security course covering common vulnerabilities, authentication best practices, HTTPS, secure coding practices, and OWASP top 10 security risks.'
    },

    // Quick Start Templates
    {
      id: 'quick-start',
      name: 'Quick Start Guide',
      description: 'Get started with any technology in just 30 minutes',
      category: 'all',
      difficulty: 'beginner',
      estimatedTime: 30,
      icon: <Zap size={24} />,
      tags: ['beginner', 'quick', 'tutorial'],
      preview: {
        title: 'Quick Start',
        description: 'Learn the basics in 30 minutes',
        levels: 3,
        xp: 300
      },
      prompt: 'Create a quick-start template that provides a gentle introduction to any technology. Include basic concepts, simple examples, and a small practical exercise.',
      featured: true
    }
  ]

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory)

  const handleTemplateSelect = async (template: CampaignTemplate) => {
    if (!user) {
      alert('Please log in to use templates')
      return
    }

    setSelectedTemplate(template)
    setShowTemplateModal(true)
  }

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !user) return

    setIsCreating(true)
    try {
      const campaign = await api.generateCampaign({
        prompt: selectedTemplate.prompt,
        createdBy: user.id,
        generationOptions: {
          difficulty: selectedTemplate.difficulty,
          includeCodeExamples: true,
          includeQuizzes: true,
          includeProjects: true
        }
      })

      // Update the campaign with template metadata
      await api.deleteCampaign(campaign.id)
      
      onTemplateSelect(selectedTemplate)
      setShowTemplateModal(false)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Failed to create campaign from template:', error)
      alert('Failed to create campaign. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const TemplateCard = ({ template }: { template: CampaignTemplate }) => (
    <div 
      className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-indigo-500 transition-all cursor-pointer group"
      onClick={() => handleTemplateSelect(template)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${template.difficulty === 'beginner' ? 'green' : template.difficulty === 'intermediate' ? 'yellow' : 'red'}-500/20 text-${template.difficulty === 'beginner' ? 'green' : template.difficulty === 'intermediate' ? 'yellow' : 'red'}-400 ring-1 ring-${template.difficulty === 'beginner' ? 'green' : template.difficulty === 'intermediate' ? 'yellow' : 'red'}-500/30`}>
          {template.icon}
        </div>
        <div className="flex items-center gap-2">
          {template.featured && (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Star size={8} fill="currentColor" />
              Featured
            </div>
          )}
          {template.popular && (
            <div className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <TrendingUp size={8} />
              Popular
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
        {template.name}
      </h3>
      <p className="text-slate-400 text-sm mb-4">{template.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {template.tags.slice(0, 3).map(tag => (
          <span key={tag} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
            {tag}
          </span>
        ))}
        {template.tags.length > 3 && (
          <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">
            +{template.tags.length - 3}
          </span>
        )}
      </div>

      {/* Preview Info */}
      <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
        <div className="text-sm text-slate-300 mb-1">
          <span className="font-medium text-white">{template.preview.title}</span>
        </div>
        <div className="text-xs text-slate-400 mb-2">{template.preview.description}</div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{template.preview.levels} levels</span>
          <span>{template.preview.xp} XP</span>
          <span>{template.estimatedTime} min</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock size={12} />
          <span className={`px-2 py-1 rounded ${
            template.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
            template.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {template.difficulty}
          </span>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium flex items-center gap-2 transition-colors">
          <Play size={16} />
          Use Template
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Campaign Templates</h1>
        <p className="text-slate-400">Start learning faster with expert-designed campaign templates</p>
      </div>

      {/* Custom Creation Option */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl border border-indigo-500 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Rocket className="text-yellow-300" />
              Create Custom Campaign
            </h3>
            <p className="text-indigo-100">Build a personalized learning path from any documentation or topic</p>
          </div>
          <button
            onClick={onCustomCreate}
            className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2"
          >
            <Zap size={20} />
            Create Custom
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === category.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {category.icon}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {/* Template Preview Modal */}
      {showTemplateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    {selectedTemplate.icon}
                    {selectedTemplate.name}
                  </h2>
                  <p className="text-slate-400 mt-1">{selectedTemplate.description}</p>
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-slate-800 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Campaign Preview</h3>
                <div className="space-y-2">
                  <div>
                    <div className="text-white font-medium">{selectedTemplate.preview.title}</div>
                    <div className="text-slate-400 text-sm">{selectedTemplate.preview.description}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>{selectedTemplate.preview.levels} levels</span>
                    <span>•</span>
                    <span>{selectedTemplate.preview.xp} total XP</span>
                    <span>•</span>
                    <span>{selectedTemplate.estimatedTime} minutes</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">What You'll Learn</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Difficulty:</span>
                    <span className={`px-2 py-1 rounded ${
                      selectedTemplate.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                      selectedTemplate.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {selectedTemplate.difficulty}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Time:</span>
                    <span className="text-white">{selectedTemplate.estimatedTime} minutes</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFromTemplate}
                  disabled={isCreating}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Rocket size={16} />
                      Create Campaign
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { 
  Globe, 
  Brain, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ChevronDown,
  Zap,
  Target,
  Code,
  GraduationCap,
  Sparkles
} from 'lucide-react'
import { api } from '../api/client'
import type { ScrapingOptions, GenerationOptions, OllamaStatus } from '../api/client'

interface EnhancedCampaignCreatorProps {
  isOpen: boolean
  onClose: () => void
  onCampaignCreated: (campaign: any) => void
  initialMode?: 'url' | 'prompt'
}

export const EnhancedCampaignCreator: React.FC<EnhancedCampaignCreatorProps> = ({
  isOpen,
  onClose,
  onCampaignCreated,
  initialMode = 'url'
}) => {
  const [mode, setMode] = useState<'url' | 'prompt'>(initialMode)
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Advanced options
  const [scrapingOptions, setScrapingOptions] = useState<ScrapingOptions>({
    maxDepth: 2,
    maxPages: 30,
    followExternalLinks: false
  })
  
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    difficulty: 'beginner',
    includeCodeExamples: true,
    includeQuizzes: true,
    includeProjects: true
  })
  
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null)
  const [previewPages, setPreviewPages] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      checkOllamaStatus()
    }
  }, [isOpen])

  const checkOllamaStatus = async () => {
    try {
      const status = await api.getOllamaStatus()
      setOllamaStatus(status)
    } catch (error) {
      console.error('Failed to check Ollama status:', error)
      setOllamaStatus({
        connected: false,
        models: [],
        defaultModel: 'llama3.2'
      })
    }
  }

  const handlePreviewScraping = async () => {
    if (mode !== 'url' || !input.trim()) return

    try {
      setIsProcessing(true)
      const result = await api.scrapeWebsite(input, {
        maxDepth: 1, // Shallow preview
        maxPages: 5  // Limited preview
      })
      setPreviewPages(result.pages.slice(0, 3)) // Show first 3 pages
    } catch (error) {
      console.error('Preview failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!input.trim()) return

    setIsProcessing(true)
    
    try {
      const generateData = {
        createdBy: 'cmjxeq5cs000010ctxfe9zu36', // Use actual user ID
        ...(mode === 'url' 
          ? { sourceUrl: input, scrapingOptions }
          : { prompt: input }
        ),
        generationOptions
      }
      
      const campaign = await api.generateCampaign(generateData)
      onCampaignCreated(campaign)
      onClose()
      
      // Reset form
      setInput('')
      setPreviewPages([])
    } catch (error) {
      console.error('Failed to generate campaign:', error)
      // Handle error with notification
    } finally {
      setIsProcessing(false)
    }
  }

  const isUrlMode = mode === 'url'
  const isValid = input.trim().length > 0 && 
    (!isUrlMode || (input.startsWith('http://') || input.startsWith('https://')))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Brain className="w-6 h-6 text-indigo-400" />
                AI-Powered Campaign Creator
              </h2>
              <p className="text-slate-400 mt-1">
                Transform documentation into interactive learning adventures
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Ollama Status */}
          {ollamaStatus && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              ollamaStatus.connected 
                ? 'bg-emerald-500/20 border border-emerald-500/30' 
                : 'bg-amber-500/20 border border-amber-500/30'
            }`}>
              {ollamaStatus.connected ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-sm">
                {ollamaStatus.connected 
                  ? `Ollama connected (${ollamaStatus.models.length} models available)`
                  : 'Ollama not connected - using template generation'
                }
              </span>
            </div>
          )}
        </div>

        {/* Mode Selection */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('url')}
              className={`flex-1 p-3 rounded-lg border transition-all ${
                mode === 'url'
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              <Globe className="w-5 h-5 mx-auto mb-1" />
              <span className="block text-sm font-medium">Web Scrape</span>
              <span className="block text-xs opacity-75">Extract from documentation</span>
            </button>
            
            <button
              onClick={() => setMode('prompt')}
              className={`flex-1 p-3 rounded-lg border transition-all ${
                mode === 'prompt'
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              <Brain className="w-5 h-5 mx-auto mb-1" />
              <span className="block text-sm font-medium">AI Prompt</span>
              <span className="block text-xs opacity-75">Describe what to learn</span>
            </button>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              {isUrlMode ? 'Documentation URL' : 'Learning Prompt'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isUrlMode 
                  ? 'https://docs.example.com or https://github.com/user/repo/wiki'
                  : 'I want to learn React hooks and state management'
              }
              className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              rows={isUrlMode ? 2 : 4}
            />
            
            {isUrlMode && input && (
              <button
                onClick={handlePreviewScraping}
                disabled={isProcessing}
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                Preview scraped content
              </button>
            )}
          </div>

          {/* Preview */}
          {previewPages.length > 0 && (
            <div className="mt-4 p-3 bg-slate-800 rounded-lg">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Preview</h4>
              <div className="space-y-2">
                {previewPages.map((page, index) => (
                  <div key={index} className="text-xs text-slate-400">
                    <div className="font-medium text-slate-300">{page.title}</div>
                    <div className="truncate">{page.content.substring(0, 100)}...</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Advanced Options */}
        <div className="p-6 border-b border-slate-700">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Advanced Options</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              {isUrlMode && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Max Depth
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={scrapingOptions.maxDepth}
                      onChange={(e) => setScrapingOptions(prev => ({
                        ...prev,
                        maxDepth: parseInt(e.target.value) || 2
                      }))}
                      className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Max Pages
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={scrapingOptions.maxPages}
                      onChange={(e) => setScrapingOptions(prev => ({
                        ...prev,
                        maxPages: parseInt(e.target.value) || 30
                      }))}
                      className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={generationOptions.difficulty}
                    onChange={(e) => setGenerationOptions(prev => ({
                      ...prev,
                      difficulty: e.target.value as any
                    }))}
                    className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                {ollamaStatus?.connected && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Model
                    </label>
                    <select
                      value={generationOptions.model || ollamaStatus.defaultModel}
                      onChange={(e) => setGenerationOptions(prev => ({
                        ...prev,
                        model: e.target.value
                      }))}
                      className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white"
                    >
                      {ollamaStatus.models.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Include Content Types
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={generationOptions.includeCodeExamples}
                      onChange={(e) => setGenerationOptions(prev => ({
                        ...prev,
                        includeCodeExamples: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <Code className="w-4 h-4" />
                    Code Examples
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={generationOptions.includeQuizzes}
                      onChange={(e) => setGenerationOptions(prev => ({
                        ...prev,
                        includeQuizzes: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <Target className="w-4 h-4" />
                    Quizzes
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={generationOptions.includeProjects}
                      onChange={(e) => setGenerationOptions(prev => ({
                        ...prev,
                        includeProjects: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <GraduationCap className="w-4 h-4" />
                    Projects
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateCampaign}
            disabled={!isValid || isProcessing}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Create Campaign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

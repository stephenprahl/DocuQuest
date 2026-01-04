import React, { useState } from 'react'
import { 
  Edit3, 
  Copy, 
  Download, 
  Share2, 
  Trash2, 
  MoreVertical,
  Check,
  Loader2
} from 'lucide-react'
import { api } from '../api/client'
import type { Campaign } from '../api/client'

interface CampaignManagementProps {
  campaign: Campaign
  onUpdate?: (campaign: Campaign) => void
  onDelete?: (campaignId: string) => void
}

export const CampaignManagement: React.FC<CampaignManagementProps> = ({ 
  campaign, 
  onUpdate, 
  onDelete 
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [editTitle, setEditTitle] = useState(campaign.title)
  const [editDescription, setEditDescription] = useState(campaign.description)
  const [duplicateTitle, setDuplicateTitle] = useState(`Copy of ${campaign.title}`)

  const handleEdit = async () => {
    if (!editTitle.trim() || !editDescription.trim()) return

    setIsProcessing(true)
    try {
      const updatedCampaign = await api.createCampaign({
        title: editTitle,
        description: editDescription,
        theme: campaign.theme,
        sourceUrl: campaign.sourceUrl,
        createdBy: campaign.createdBy
      })
      
      // Delete the old campaign
      await api.deleteCampaign(campaign.id)
      
      onUpdate?.(updatedCampaign)
      setShowEditModal(false)
    } catch (error) {
      console.error('Failed to edit campaign:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDuplicate = async () => {
    if (!duplicateTitle.trim()) return

    setIsProcessing(true)
    try {
      const duplicatedCampaign = await api.createCampaign({
        title: duplicateTitle,
        description: campaign.description,
        theme: campaign.theme,
        sourceUrl: campaign.sourceUrl,
        createdBy: campaign.createdBy
      })
      
      onUpdate?.(duplicatedCampaign)
      setShowDuplicateModal(false)
    } catch (error) {
      console.error('Failed to duplicate campaign:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExport = () => {
    const exportData = {
      campaign: {
        title: campaign.title,
        description: campaign.description,
        theme: campaign.theme,
        sourceUrl: campaign.sourceUrl,
        levels: campaign.levels.map(level => ({
          title: level.title,
          type: level.type,
          xp: level.xp,
          order: level.order,
          content: JSON.parse(level.content)
        }))
      },
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaign.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_campaign.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/campaign/${campaign.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.title,
          text: campaign.description,
          url: shareUrl
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Campaign link copied to clipboard!')
      })
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${campaign.title}"? This action cannot be undone.`)) {
      return
    }

    setIsProcessing(true)
    try {
      await api.deleteCampaign(campaign.id)
      onDelete?.(campaign.id)
    } catch (error) {
      console.error('Failed to delete campaign:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <MoreVertical size={16} />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
            <button
              onClick={() => { setShowEditModal(true); setShowMenu(false) }}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors"
            >
              <Edit3 size={14} />
              Edit Campaign
            </button>
            
            <button
              onClick={() => { setShowDuplicateModal(true); setShowMenu(false) }}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors"
            >
              <Copy size={14} />
              Duplicate
            </button>
            
            <button
              onClick={() => { handleExport(); setShowMenu(false) }}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors"
            >
              <Download size={14} />
              Export
            </button>
            
            <button
              onClick={() => { handleShare(); setShowMenu(false) }}
              className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors"
            >
              <Share2 size={14} />
              Share
            </button>
            
            <div className="border-t border-slate-700 my-1"></div>
            
            <button
              onClick={() => { handleDelete(); setShowMenu(false) }}
              className="w-full px-4 py-2 text-left text-sm text-rose-400 hover:bg-slate-700 hover:text-rose-300 flex items-center gap-2 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Edit Campaign</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={isProcessing || !editTitle.trim() || !editDescription.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Duplicate Campaign</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">New Campaign Title</label>
              <input
                type="text"
                value={duplicateTitle}
                onChange={(e) => setDuplicateTitle(e.target.value)}
                className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white"
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="flex-1 px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicate}
                disabled={isProcessing || !duplicateTitle.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                Duplicate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

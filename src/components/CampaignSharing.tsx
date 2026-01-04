import React, { useState, useEffect } from 'react'
import { 
  Share2, 
  Users, 
  Globe, 
  Copy, 
  QrCode, 
  Mail, 
  MessageCircle,
  UserPlus,
  Trash2,
  Check,
  X,
  Loader2,
  Link,
  TrendingUp,
  User as UserIcon
} from 'lucide-react'
import { api } from '../api/client'
import type { Campaign, User } from '../api/client'

interface CampaignSharingProps {
  campaign: Campaign
  currentUser: User
  onUpdate?: (campaign: Campaign) => void
}

interface Collaboration {
  id: string
  userId: string
  username: string
  permission: 'view' | 'edit' | 'admin'
  joinedAt: string
  lastActive: string
}

export const CampaignSharing: React.FC<CampaignSharingProps> = ({ 
  campaign, 
  currentUser, 
  onUpdate 
}) => {
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareSettings, setShareSettings] = useState({
    isPublic: campaign.isPublic,
    allowComments: true,
    allowForks: true,
    requireApproval: false
  })
  const [collaborators, setCollaborators] = useState<Collaboration[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePermission, setInvitePermission] = useState<'view' | 'edit'>('view')
  const [isProcessing, setIsProcessing] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [showQrCode, setShowQrCode] = useState(false)
  const [publicStats, setPublicStats] = useState({
    views: 0,
    forks: 0,
    likes: 0,
    comments: 0
  })

  useEffect(() => {
    if (showShareModal) {
      loadCollaborators()
      generateShareLink()
      loadPublicStats()
    }
  }, [showShareModal])

  const loadCollaborators = async () => {
    // Mock data - in real app, this would fetch from API
    setCollaborators([
      {
        id: '1',
        userId: 'user1',
        username: 'Alice Johnson',
        permission: 'edit',
        joinedAt: '2024-01-15T10:00:00Z',
        lastActive: '2024-01-20T15:30:00Z'
      },
      {
        id: '2', 
        userId: 'user2',
        username: 'Bob Smith',
        permission: 'view',
        joinedAt: '2024-01-16T09:00:00Z',
        lastActive: '2024-01-19T14:20:00Z'
      }
    ])
  }

  const generateShareLink = () => {
    const baseUrl = window.location.origin
    const link = `${baseUrl}/campaign/${campaign.id}`
    setShareLink(link)
  }

  const loadPublicStats = async () => {
    // Mock data - in real app, this would fetch from API
    setPublicStats({
      views: Math.floor(Math.random() * 1000) + 50,
      forks: Math.floor(Math.random() * 50) + 5,
      likes: Math.floor(Math.random() * 200) + 10,
      comments: Math.floor(Math.random() * 30) + 2
    })
  }

  const handleUpdateShareSettings = async () => {
    setIsProcessing(true)
    try {
      // Update campaign sharing settings
      const updatedCampaign = await api.createCampaign({
        title: campaign.title,
        description: campaign.description,
        theme: campaign.theme,
        sourceUrl: campaign.sourceUrl,
        createdBy: campaign.createdBy
      })
      
      // Delete old campaign and create new one with updated settings
      await api.deleteCampaign(campaign.id)
      onUpdate?.(updatedCampaign)
      
      setNotification({ type: 'success', message: 'Sharing settings updated!' })
    } catch (error) {
      console.error('Failed to update sharing settings:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setNotification({ type: 'success', message: 'Link copied to clipboard!' })
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleInviteCollaborator = async () => {
    if (!inviteEmail.trim()) return

    setIsProcessing(true)
    try {
      // Mock collaboration invite - in real app, this would send email/invite
      const newCollaborator: Collaboration = {
        id: Date.now().toString(),
        userId: 'new-user',
        username: inviteEmail.split('@')[0],
        permission: invitePermission,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      }
      
      setCollaborators(prev => [...prev, newCollaborator])
      setInviteEmail('')
      setNotification({ type: 'success', message: 'Invitation sent!' })
    } catch (error) {
      console.error('Failed to send invite:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId))
      setNotification({ type: 'success', message: 'Collaborator removed' })
    } catch (error) {
      console.error('Failed to remove collaborator:', error)
    }
  }

  const handleUpdatePermission = async (collaboratorId: string, permission: 'view' | 'edit') => {
    try {
      setCollaborators(prev => 
        prev.map(c => c.id === collaboratorId ? { ...c, permission } : c)
      )
      setNotification({ type: 'success', message: 'Permission updated' })
    } catch (error) {
      console.error('Failed to update permission:', error)
    }
  }

  const setNotification = (notification: { type: 'success' | 'error'; message: string }) => {
    // This would integrate with the main app's notification system
    console.log(notification.message)
  }

  return (
    <>
      <button
        onClick={() => setShowShareModal(true)}
        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        title="Share Campaign"
      >
        <Share2 size={16} />
      </button>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Share2 className="text-indigo-400" />
                    Share & Collaborate
                  </h2>
                  <p className="text-slate-400 mt-1">Manage sharing settings and invite collaborators</p>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Public Sharing Settings */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Globe className="text-green-400" />
                  Public Sharing
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">Make Public</div>
                      <div className="text-sm text-slate-400">Anyone can view and fork this campaign</div>
                    </div>
                    <button
                      onClick={() => setShareSettings(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        shareSettings.isPublic ? 'bg-indigo-600' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          shareSettings.isPublic ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {shareSettings.isPublic && (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Allow Comments</div>
                          <div className="text-sm text-slate-400">Users can comment on this campaign</div>
                        </div>
                        <button
                          onClick={() => setShareSettings(prev => ({ ...prev, allowComments: !prev.allowComments }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            shareSettings.allowComments ? 'bg-indigo-600' : 'bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              shareSettings.allowComments ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Allow Forks</div>
                          <div className="text-sm text-slate-400">Users can create copies of this campaign</div>
                        </div>
                        <button
                          onClick={() => setShareSettings(prev => ({ ...prev, allowForks: !prev.allowForks }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            shareSettings.allowForks ? 'bg-indigo-600' : 'bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              shareSettings.allowForks ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </>
                  )}

                  <button
                    onClick={handleUpdateShareSettings}
                    disabled={isProcessing}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Save Settings
                  </button>
                </div>
              </div>

              {/* Share Link */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Link className="text-blue-400" />
                  Share Link
                </h3>
                
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded text-slate-300"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center gap-2 transition-colors"
                    >
                      <Copy size={16} />
                      Copy
                    </button>
                    <button
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center gap-2 transition-colors"
                    >
                      <QrCode size={16} />
                      QR
                    </button>
                  </div>

                  {showQrCode && (
                    <div className="p-4 bg-slate-700 rounded-lg text-center">
                      <div className="w-32 h-32 bg-white rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <QrCode size={64} className="text-slate-800" />
                      </div>
                      <p className="text-sm text-slate-400">Scan to open campaign</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm flex items-center justify-center gap-2 transition-colors">
                      <Mail size={14} />
                      Email
                    </button>
                    <button className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm flex items-center justify-center gap-2 transition-colors">
                      <MessageCircle size={14} />
                      Social
                    </button>
                  </div>
                </div>
              </div>

              {/* Public Stats */}
              {shareSettings.isPublic && (
                <div className="bg-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="text-purple-400" />
                    Public Statistics
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{publicStats.views}</div>
                      <div className="text-sm text-slate-400">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{publicStats.forks}</div>
                      <div className="text-sm text-slate-400">Forks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{publicStats.likes}</div>
                      <div className="text-sm text-slate-400">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{publicStats.comments}</div>
                      <div className="text-sm text-slate-400">Comments</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Collaborators */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="text-indigo-400" />
                  Collaborators ({collaborators.length})
                </h3>
                
                {/* Invite Collaborator */}
                <div className="mb-4 p-4 bg-slate-700 rounded-lg">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 p-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-400"
                    />
                    <select
                      value={invitePermission}
                      onChange={(e) => setInvitePermission(e.target.value as 'view' | 'edit')}
                      className="px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
                    >
                      <option value="view">Can View</option>
                      <option value="edit">Can Edit</option>
                    </select>
                    <button
                      onClick={handleInviteCollaborator}
                      disabled={isProcessing || !inviteEmail.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                      Invite
                    </button>
                  </div>
                </div>

                {/* Collaborators List */}
                <div className="space-y-2">
                  {collaborators.map(collaborator => (
                    <div key={collaborator.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                          <UserIcon size={16} className="text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{collaborator.username}</div>
                          <div className="text-xs text-slate-400">
                            Last active {new Date(collaborator.lastActive).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <select
                          value={collaborator.permission}
                          onChange={(e) => handleUpdatePermission(collaborator.id, e.target.value as 'view' | 'edit')}
                          className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-sm text-white"
                        >
                          <option value="view">View</option>
                          <option value="edit">Edit</option>
                        </select>
                        
                        {collaborator.userId !== currentUser.id && (
                          <button
                            onClick={() => handleRemoveCollaborator(collaborator.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

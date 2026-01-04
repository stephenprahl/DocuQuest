import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Users, 
  Wifi, 
  WifiOff, 
  Send, 
  MessageSquare, 
  Edit3,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Copy,
  X,
  AlertCircle,
  Zap,
  Activity
} from 'lucide-react'
import type { Campaign, User } from '../api/client'

interface RealtimeCollaborationProps {
  campaign: Campaign
  currentUser: User
  onClose: () => void
}

interface CollaborationSession {
  id: string
  campaignId: string
  participants: {
    id: string
    username: string
    avatar?: string
    isOnline: boolean
    isEditing: boolean
    permissions: 'view' | 'edit' | 'admin'
    joinedAt: string
    lastSeen: string
  }[]
  messages: {
    id: string
    userId: string
    username: string
    content: string
    timestamp: string
    type: 'text' | 'system' | 'edit'
  }[]
  changes: {
    id: string
    userId: string
    username: string
    type: 'content' | 'settings' | 'structure'
    description: string
    timestamp: string
  }[]
}

export const RealtimeCollaboration: React.FC<RealtimeCollaborationProps> = ({ 
  campaign, 
  currentUser, 
  onClose 
}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [isWebRTCSupported, setIsWebRTCSupported] = useState(true)
  const [session, setSession] = useState<CollaborationSession | null>(null)
  const [activeTab, setActiveTab] = useState<'participants' | 'chat' | 'changes'>('participants')
  const [message, setMessage] = useState('')
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  
  const wsRef = useRef<WebSocket | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  // Initialize WebRTC support check
  useEffect(() => {
    const checkWebRTCSupport = () => {
      const isSupported = !!(
        window.RTCPeerConnection &&
        window.RTCDataChannel &&
        navigator.mediaDevices
      )
      setIsWebRTCSupported(isSupported)
      
      if (!isSupported) {
        console.warn('WebRTC is not supported in this browser')
      }
    }
    
    checkWebRTCSupport()
  }, [])
  
  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(async () => {
    try {
      setConnectionStatus('connecting')
      
      // Mock WebSocket connection for demo
      setTimeout(() => {
        setConnectionStatus('connected')
        setIsConnected(true)
        
        // Create mock session data
        const mockSession: CollaborationSession = {
          id: 'session-1',
          campaignId: campaign.id,
          participants: [
            {
              id: currentUser.id,
              username: currentUser.username,
              isOnline: true,
              isEditing: false,
              permissions: 'admin',
              joinedAt: new Date().toISOString(),
              lastSeen: new Date().toISOString()
            },
            {
              id: 'user-2',
              username: 'Alice Johnson',
              isOnline: true,
              isEditing: true,
              permissions: 'edit',
              joinedAt: new Date().toISOString(),
              lastSeen: new Date().toISOString()
            },
            {
              id: 'user-3',
              username: 'Bob Smith',
              isOnline: false,
              isEditing: false,
              permissions: 'view',
              joinedAt: new Date().toISOString(),
              lastSeen: new Date(Date.now() - 300000).toISOString()
            }
          ],
          messages: [
            {
              id: 'msg-1',
              userId: 'user-2',
              username: 'Alice Johnson',
              content: 'Hey! I\'m working on the React hooks section.',
              timestamp: new Date(Date.now() - 60000).toISOString(),
              type: 'text'
            },
            {
              id: 'msg-2',
              userId: currentUser.id,
              username: currentUser.username,
              content: 'Great! Let me know if you need any help.',
              timestamp: new Date(Date.now() - 30000).toISOString(),
              type: 'text'
            }
          ],
          changes: [
            {
              id: 'change-1',
              userId: 'user-2',
              username: 'Alice Johnson',
              type: 'content',
              description: 'Updated React hooks section',
              timestamp: new Date(Date.now() - 120000).toISOString()
            },
            {
              id: 'change-2',
              userId: 'user-2',
              username: 'Alice Johnson',
              type: 'content',
              description: 'Added useState example',
              timestamp: new Date(Date.now() - 60000).toISOString()
            }
          ]
        }
        
        setSession(mockSession)
      }, 1000)
      
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error)
      setConnectionStatus('disconnected')
    }
  }, [campaign.id, currentUser.id, currentUser.username])
  
  // Send message via WebSocket
  const sendMessage = useCallback((content: string) => {
    if (!session || !content.trim()) return
    
    const newMessage = {
      id: `msg-${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      type: 'text' as const
    }
    
    setSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMessage]
    } : null)
    
    // Scroll to bottom of chat
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
      }
    }, 100)
    
    setMessage('')
  }, [session, currentUser])
  
  // Toggle video
  const toggleVideo = useCallback(() => {
    setIsVideoEnabled(!isVideoEnabled)
  }, [isVideoEnabled])
  
  // Toggle audio
  const toggleAudio = useCallback(() => {
    setIsAudioEnabled(!isAudioEnabled)
  }, [isAudioEnabled])
  
  // Toggle screen sharing
  const toggleScreenShare = useCallback(() => {
    setIsScreenSharing(!isScreenSharing)
  }, [isScreenSharing])
  
  // Copy session link
  const copySessionLink = useCallback(() => {
    const link = `${window.location.origin}/campaign/${campaign.id}/collaborate`
    navigator.clipboard.writeText(link).then(() => {
      alert('Session link copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy link')
    })
  }, [campaign.id])
  
  // Initialize collaboration
  useEffect(() => {
    initializeWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [initializeWebSocket])
  
  const onlineParticipants = session?.participants.filter(p => p.isOnline) || []
  const editingParticipants = session?.participants.filter(p => p.isEditing) || []
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`} />
            <div>
              <h2 className="text-xl font-bold text-white">Real-time Collaboration</h2>
              <p className="text-slate-400 text-sm">
                {campaign.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="text-green-400" size={16} />
                  <span className="text-green-400">Connected</span>
                </>
              ) : connectionStatus === 'connecting' ? (
                <>
                  <WifiOff className="text-yellow-400" size={16} />
                  <span className="text-yellow-400">Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="text-red-400" size={16} />
                  <span className="text-red-400">Disconnected</span>
                </>
              )}
            </div>
            <div className="text-sm text-slate-400">
              {onlineParticipants.length} online • {editingParticipants.length} editing
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={copySessionLink}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Copy session link"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={toggleVideo}
              className={`p-2 rounded transition-colors ${
                isVideoEnabled 
                  ? 'text-green-400 hover:bg-green-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title="Toggle video"
            >
              {isVideoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
            </button>
            <button
              onClick={toggleAudio}
              className={`p-2 rounded transition-colors ${
                isAudioEnabled 
                  ? 'text-green-400 hover:bg-green-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title="Toggle audio"
            >
              {isAudioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
            <button
              onClick={toggleScreenShare}
              className={`p-2 rounded transition-colors ${
                isScreenSharing 
                  ? 'text-green-400 hover:bg-green-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title="Toggle screen sharing"
            >
              <Monitor size={16} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-slate-700 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-slate-700">
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'participants'
                    ? 'bg-slate-700 text-white border-b-2 border-indigo-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users size={16} className="mr-2" />
                Participants
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-slate-700 text-white border-b-2 border-indigo-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <MessageSquare size={16} className="mr-2" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('changes')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'changes'
                    ? 'bg-slate-700 text-white border-b-2 border-indigo-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Activity size={16} className="mr-2" />
                Changes
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'participants' && (
                <div className="p-4 space-y-3">
                  {session?.participants.map(participant => (
                    <div key={participant.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        participant.isOnline ? 'bg-green-500' : 'bg-slate-600'
                      }`}>
                        <Users size={16} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{participant.username}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            participant.isEditing 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-slate-600 text-slate-400'
                          }`}>
                            {participant.isEditing ? 'Editing' : 'Viewing'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {participant.permissions}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {participant.isOnline && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                        {participant.isEditing && (
                          <Edit3 size={12} className="text-blue-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {activeTab === 'chat' && (
                <div className="flex flex-col h-full">
                  {/* Messages */}
                  <div 
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-3"
                  >
                    {session?.messages.map(message => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg max-w-[80%] ${
                          message.userId === currentUser.id
                            ? 'bg-indigo-600 text-white ml-auto'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.username}
                          </span>
                          <span className="text-xs opacity-70">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Message Input */}
                  <div className="border-t border-slate-700 p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage(message)
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        onClick={() => sendMessage(message)}
                        disabled={!message.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'changes' && (
                <div className="p-4 space-y-3">
                  {session?.changes.slice().reverse().map(change => (
                    <div key={change.id} className="p-3 bg-slate-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{change.username}</span>
                          <span className="text-xs text-slate-400">
                            {new Date(change.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          change.type === 'content' ? 'bg-blue-500/20 text-blue-400' :
                          change.type === 'settings' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {change.type}
                        </span>
                      </div>
                      <div className="text-sm text-slate-300">
                        {change.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1 flex flex-col">
            {/* Campaign Preview */}
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Campaign Preview</h3>
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">{campaign.title}</h4>
                <p className="text-slate-400 text-sm mb-4">{campaign.description}</p>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>Theme: {campaign.theme}</span>
                  <span>Levels: {campaign.levels.length}</span>
                  <span>Created by: {campaign.createdBy}</span>
                </div>
              </div>
            </div>

            {/* Collaboration Status */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Collaboration Status</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isConnected 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {isConnected ? 'Active Session' : 'Not Connected'}
                </div>
              </div>
              
              {isWebRTCSupported ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 rounded-lg p-4 text-center">
                      <Video size={24} className="text-slate-400 mx-auto mb-2" />
                      <div className="text-sm text-white">Video Call</div>
                      <div className="text-xs text-slate-400">
                        {isVideoEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-4 text-center">
                      <Mic size={24} className="text-slate-400 mx-auto mb-2" />
                      <div className="text-sm text-white">Audio Call</div>
                      <div className="text-xs text-slate-400">
                        {isAudioEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800 rounded-lg p-4 text-center">
                    <Monitor size={24} className="text-slate-400 mx-auto mb-2" />
                    <div className="text-sm text-white">Screen Sharing</div>
                    <div className="text-xs text-slate-400">
                      {isScreenSharing ? 'Sharing' : 'Not Sharing'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <AlertCircle size={24} className="text-amber-400 mx-auto mb-2" />
                  <div className="text-sm text-white">WebRTC Not Available</div>
                  <div className="text-xs text-slate-400">
                    Your browser doesn't support real-time collaboration
                  </div>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-slate-800 rounded-lg">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Zap className="text-yellow-400" />
                  Real-time Features
                </h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Live cursor tracking</li>
                  <li>• Real-time text editing</li>
                  <li>• Video and audio calls</li>
                  <li>• Screen sharing</li>
                  <li>• Change notifications</li>
                  <li>• Participant cursors</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

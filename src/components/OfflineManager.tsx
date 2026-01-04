import React, { useState, useEffect } from 'react'
import { 
  Wifi, 
  WifiOff, 
  Download, 
  HardDrive, 
  Cloud, 
  Check, 
  X, 
  AlertCircle, 
  RefreshCw,
  Database,
  Trash2,
  Info,
  Zap
} from 'lucide-react'
import { api } from '../api/client'
import type { Campaign, UserProgress, User } from '../api/client'

interface OfflineStorage {
  campaigns: Campaign[]
  userProgress: UserProgress[]
  user: User | null
  lastSync: string
  version: string
}

interface OfflineManagerProps {
  user: User | null
  campaigns: Campaign[]
  userProgress: UserProgress[]
  onSyncComplete?: () => void
}

export const OfflineManager: React.FC<OfflineManagerProps> = ({ 
  user, 
  campaigns, 
  userProgress, 
  onSyncComplete 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showOfflineModal, setShowOfflineModal] = useState(false)
  const [storageInfo, setStorageInfo] = useState({
    usedSpace: 0,
    availableSpace: 0,
    cachedCampaigns: 0,
    lastSync: null as string | null
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')

  // Storage key for offline data
  const STORAGE_KEY = 'docuquest_offline_data'
  const STORAGE_VERSION = '1.0'

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Load storage info
    updateStorageInfo()
    
    // Auto-sync when coming back online
    if (isOnline && syncStatus === 'idle') {
      autoSync()
    }
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isOnline])

  const updateStorageInfo = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data: OfflineStorage = JSON.parse(stored)
        const usedSpace = new Blob([stored]).size
        const availableSpace = 5 * 1024 * 1024 * 1024 // 5GB estimate
        
        setStorageInfo({
          usedSpace,
          availableSpace: availableSpace - usedSpace,
          cachedCampaigns: data.campaigns.length,
          lastSync: data.lastSync
        })
      }
    } catch (error) {
      console.error('Failed to get storage info:', error)
    }
  }

  const saveToLocalStorage = (data: OfflineStorage) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      updateStorageInfo()
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      // Handle storage quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        alert('Storage quota exceeded. Please clear some cached campaigns.')
      }
    }
  }

  const loadFromLocalStorage = (): OfflineStorage | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data: OfflineStorage = JSON.parse(stored)
        
        // Check version compatibility
        if (data.version !== STORAGE_VERSION) {
          console.log('Storage version mismatch, clearing cache')
          localStorage.removeItem(STORAGE_KEY)
          return null
        }
        
        return data
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      localStorage.removeItem(STORAGE_KEY)
    }
    return null
  }

  const cacheForOffline = async () => {
    if (!user) {
      alert('Please log in to enable offline mode')
      return
    }

    setIsSyncing(true)
    setSyncStatus('syncing')

    try {
      const offlineData: OfflineStorage = {
        campaigns,
        userProgress,
        user,
        lastSync: new Date().toISOString(),
        version: STORAGE_VERSION
      }

      saveToLocalStorage(offlineData)
      setSyncStatus('success')
      
      // Show success message
      setTimeout(() => setSyncStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to cache for offline:', error)
      setSyncStatus('error')
      setTimeout(() => setSyncStatus('idle'), 3000)
    } finally {
      setIsSyncing(false)
    }
  }

  const clearOfflineCache = () => {
    if (confirm('Are you sure you want to clear all offline data? This will remove all cached campaigns and progress.')) {
      try {
        localStorage.removeItem(STORAGE_KEY)
        updateStorageInfo()
        alert('Offline cache cleared successfully')
      } catch (error) {
        console.error('Failed to clear cache:', error)
        alert('Failed to clear cache')
      }
    }
  }

  const autoSync = async () => {
    if (!user || !isOnline) return

    const offlineData = loadFromLocalStorage()
    if (!offlineData) return

    setIsSyncing(true)
    setSyncStatus('syncing')

    try {
      // Sync campaigns (check for updates)
      const syncedCampaigns = await Promise.all(
        offlineData.campaigns.map(async (campaign) => {
          try {
            // Try to fetch latest version
            const latest = await api.getCampaign(campaign.id)
            return latest
          } catch (error) {
            // Campaign might be deleted or unavailable, keep cached version
            return campaign
          }
        })
      )

      // Sync user progress
      const syncedProgress = await Promise.all(
        offlineData.userProgress.map(async (progress) => {
          try {
            // Update progress on server
            return await api.updateUserProgress(progress.userId, {
              levelId: progress.levelId,
              completed: progress.completed
            })
          } catch (error) {
            // Keep local progress if sync fails
            return progress
          }
        })
      )

      // Update local storage with synced data
      const updatedData: OfflineStorage = {
        ...offlineData,
        campaigns: syncedCampaigns,
        userProgress: syncedProgress,
        lastSync: new Date().toISOString()
      }

      saveToLocalStorage(updatedData)
      setSyncStatus('success')
      onSyncComplete?.()
      
      setTimeout(() => setSyncStatus('idle'), 2000)
    } catch (error) {
      console.error('Auto-sync failed:', error)
      setSyncStatus('error')
      setTimeout(() => setSyncStatus('idle'), 3000)
    } finally {
      setIsSyncing(false)
    }
  }

  const getOfflineData = (): OfflineStorage | null => {
    return loadFromLocalStorage()
  }

  const isOfflineAvailable = (): boolean => {
    const data = loadFromLocalStorage()
    return data !== null && data.campaigns.length > 0
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Expose offline functionality to parent components
  useEffect(() => {
    // Make offline functions available globally
    (window as any).docuquestOffline = {
      getData: getOfflineData,
      isAvailable: isOfflineAvailable,
      cache: cacheForOffline,
      sync: autoSync
    }
  }, [])

  return (
    <>
      {/* Offline Status Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
          isOnline 
            ? 'bg-green-500/20 border-green-500/30 text-green-400' 
            : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
        }`}>
          {isOnline ? (
            <>
              <Wifi size={16} />
              <span className="text-sm font-medium">Online</span>
            </>
          ) : (
            <>
              <WifiOff size={16} />
              <span className="text-sm font-medium">Offline</span>
              {isOfflineAvailable() && (
                <span className="text-xs ml-2">({storageInfo.cachedCampaigns} cached)</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Offline Manager Button */}
      <button
        onClick={() => setShowOfflineModal(true)}
        className="fixed bottom-4 left-4 z-50 p-3 bg-slate-800 border border-slate-700 rounded-full hover:bg-slate-700 transition-colors"
        title="Offline Manager"
      >
        <Database size={20} className="text-slate-300" />
      </button>

      {/* Offline Manager Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Database className="text-indigo-400" />
                    Offline Manager
                  </h2>
                  <p className="text-slate-400 mt-1">Manage offline access and cached data</p>
                </div>
                <button
                  onClick={() => setShowOfflineModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Connection Status */}
              <div className={`p-4 rounded-lg border ${
                isOnline 
                  ? 'bg-green-500/20 border-green-500/30' 
                  : 'bg-amber-500/20 border-amber-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  {isOnline ? <Wifi className="text-green-400" /> : <WifiOff className="text-amber-400" />}
                  <div>
                    <div className="text-white font-medium">
                      {isOnline ? 'Connected to Server' : 'Offline Mode'}
                    </div>
                    <div className="text-sm text-slate-400">
                      {isOnline 
                        ? 'All features available, auto-sync enabled'
                        : 'Using cached data, limited functionality'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Storage Information */}
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <HardDrive size={16} className="text-blue-400" />
                  Storage Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Cached Campaigns:</span>
                    <span className="text-white">{storageInfo.cachedCampaigns}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Storage Used:</span>
                    <span className="text-white">{formatBytes(storageInfo.usedSpace)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Available:</span>
                    <span className="text-white">{formatBytes(storageInfo.availableSpace)}</span>
                  </div>
                  {storageInfo.lastSync && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Last Sync:</span>
                      <span className="text-white">
                        {new Date(storageInfo.lastSync).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sync Status */}
              {syncStatus !== 'idle' && (
                <div className={`p-4 rounded-lg border ${
                  syncStatus === 'success' 
                    ? 'bg-green-500/20 border-green-500/30' 
                    : syncStatus === 'error'
                    ? 'bg-rose-500/20 border-rose-500/30'
                    : 'bg-blue-500/20 border-blue-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {syncStatus === 'success' ? (
                      <Check className="text-green-400" />
                    ) : syncStatus === 'error' ? (
                      <AlertCircle className="text-rose-400" />
                    ) : (
                      <RefreshCw className="text-blue-400 animate-spin" />
                    )}
                    <div>
                      <div className="text-white font-medium">
                        {syncStatus === 'success' 
                          ? 'Sync Completed' 
                          : syncStatus === 'error'
                          ? 'Sync Failed'
                          : 'Syncing...'
                        }
                      </div>
                      <div className="text-sm text-slate-400">
                        {syncStatus === 'success' 
                          ? 'All data synchronized successfully'
                          : syncStatus === 'error'
                          ? 'Please check your connection and try again'
                          : 'Updating cached data...'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {isOnline && (
                  <button
                    onClick={cacheForOffline}
                    disabled={isSyncing || !user}
                    className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    {isSyncing ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    Cache for Offline Use
                  </button>
                )}

                {isOnline && isOfflineAvailable() && (
                  <button
                    onClick={autoSync}
                    disabled={isSyncing}
                    className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    {isSyncing ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Cloud size={16} />
                    )}
                    Sync with Server
                  </button>
                )}

                {!isOnline && isOfflineAvailable() && (
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3 text-slate-300">
                      <Info size={16} className="text-blue-400" />
                      <div className="text-sm">
                        <div className="font-medium">Offline Mode Active</div>
                        <div>You have {storageInfo.cachedCampaigns} campaigns available for offline learning.</div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={clearOfflineCache}
                  className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={16} />
                  Clear Offline Cache
                </button>
              </div>

              {/* Tips */}
              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Zap size={16} className="text-yellow-400" />
                  Offline Tips
                </h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Cache campaigns before going offline for uninterrupted learning</li>
                  <li>• Your progress is automatically synced when you reconnect</li>
                  <li>• Offline mode supports all campaign types except real-time features</li>
                  <li>• Clear cache periodically to free up storage space</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

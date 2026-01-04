import React from 'react'
import { CheckCircle, AlertTriangle, XCircle, Star, TrendingUp } from 'lucide-react'

interface QualityBadgeProps {
  score?: number
  isValidated?: boolean
  showDetails?: boolean
  validationData?: any
  size?: 'sm' | 'md' | 'lg'
}

export const QualityBadge: React.FC<QualityBadgeProps> = ({
  score,
  isValidated,
  showDetails = false,
  validationData,
  size = 'md'
}) => {
  if (!score) {
    return (
      <div className={`flex items-center gap-2 text-slate-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        <AlertTriangle className={`w-${size === 'sm' ? '3' : '4'} h-${size === 'sm' ? '3' : '4'}`} />
        <span>Not Validated</span>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 bg-emerald-400/20 border-emerald-400/30'
    if (score >= 80) return 'text-green-400 bg-green-400/20 border-green-400/30'
    if (score >= 70) return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30'
    if (score >= 60) return 'text-orange-400 bg-orange-400/20 border-orange-400/30'
    return 'text-red-400 bg-red-400/20 border-red-400/30'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Star className={`w-${size === 'sm' ? '3' : '4'} h-${size === 'sm' ? '3' : '4'}`} />
    if (score >= 60) return <CheckCircle className={`w-${size === 'sm' ? '3' : '4'} h-${size === 'sm' ? '3' : '4'}`} />
    return <XCircle className={`w-${size === 'sm' ? '3' : '4'} h-${size === 'sm' ? '3' : '4'}`} />
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 70) return 'Fair'
    if (score >= 60) return 'Poor'
    return 'Very Poor'
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <div className="space-y-2">
      <div className={`inline-flex items-center gap-2 rounded-lg border ${getScoreColor(score)} ${sizeClasses[size]}`}>
        {getScoreIcon(score)}
        <span className="font-medium">{score}%</span>
        <span className="opacity-75">{getScoreLabel(score)}</span>
        {isValidated && (
          <CheckCircle className={`w-${size === 'sm' ? '3' : '4'} h-${size === 'sm' ? '3' : '4'} ml-1`} />
        )}
      </div>

      {showDetails && validationData && (
        <div className="mt-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Quality Breakdown
          </h4>
          
          <div className="space-y-2">
            {Object.entries(validationData.score).map(([category, value]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-xs text-slate-400 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-700 rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full bg-emerald-400"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-300 w-8 text-right">
                    {value as number}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {validationData.issues && validationData.issues.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <h5 className="text-xs font-medium text-slate-300 mb-2">Issues Found</h5>
              <div className="space-y-1">
                {validationData.issues.slice(0, 3).map((issue: any, index: number) => (
                  <div key={index} className="text-xs text-slate-400 flex items-start gap-1">
                    {issue.type === 'error' && <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />}
                    {issue.type === 'warning' && <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />}
                    {issue.type === 'suggestion' && <AlertTriangle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />}
                    <span>{issue.message}</span>
                  </div>
                ))}
                {validationData.issues.length > 3 && (
                  <div className="text-xs text-slate-500">
                    +{validationData.issues.length - 3} more issues
                  </div>
                )}
              </div>
            </div>
          )}

          {validationData.recommendations && validationData.recommendations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <h5 className="text-xs font-medium text-slate-300 mb-2">Recommendations</h5>
              <ul className="space-y-1">
                {validationData.recommendations.slice(0, 2).map((rec: string, index: number) => (
                  <li key={index} className="text-xs text-slate-400 flex items-start gap-1">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

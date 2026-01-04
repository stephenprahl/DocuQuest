import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Lightbulb, 
  RotateCcw, 
  Copy,
  Eye,
  EyeOff,
  Code,
  BookOpen,
  TestTube
} from 'lucide-react';
import { EnhancedCodeEditor } from './EnhancedCodeEditor';
import { codeExecutor } from '../lib/codeExecutor';
import { testValidator, type TestCase, type ValidationReport } from '../lib/testValidator';

interface ChallengePlaygroundProps {
  challenge: {
    title: string;
    description: string;
    instruction: string;
    initialCode: string;
    solutionCode?: string;
    hints: string[];
    solutionKeys: string[];
    testCases?: TestCase[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    timeLimit?: number;
    points: number;
  };
  onComplete?: (score: number, timeSpent: number) => void;
  onProgress?: (progress: number) => void;
}

export const ChallengePlayground: React.FC<ChallengePlaygroundProps> = ({
  challenge,
  onComplete,
  onProgress
}) => {
  const [userCode, setUserCode] = useState(challenge.initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [testResults, setTestResults] = useState<ValidationReport | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'tests' | 'hints'>('editor');
  const progressTimeoutRef = useRef<number | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: number;
    
    if (startTime && !testResults?.score) {
      interval = window.setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    
    return () => window.clearInterval(interval);
  }, [startTime, testResults]);

  // Generate test cases if not provided
  const testCases = challenge.testCases || testValidator.generateTestCases(
    challenge.instruction,
    challenge.difficulty
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
      }
    };
  }, []);

  // Handle code change with debounced progress checking
  const handleCodeChange = useCallback((code: string) => {
    setUserCode(code);
    setTestResults(null);
    
    // Debounced progress calculation
    if (progressTimeoutRef.current) {
      clearTimeout(progressTimeoutRef.current);
    }
    
    progressTimeoutRef.current = window.setTimeout(() => {
      const keyCheck = codeExecutor.checkSolutionKeys(code, challenge.solutionKeys);
      const progress = (keyCheck.found.length / challenge.solutionKeys.length) * 100;
      onProgress?.(progress);
    }, 300); // 300ms delay for progress calculation
    
    // Start timer on first change
    if (!startTime) {
      setStartTime(Date.now());
    }
  }, [challenge.solutionKeys, startTime, onProgress]);

  // Run code
  const handleRunCode = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setAttempts(prev => prev + 1);
    
    try {
      await codeExecutor.executeCode(userCode);
    } catch (error) {
      console.error('Code execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [userCode, isRunning]);

  // Run tests
  const handleRunTests = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setAttempts(prev => prev + 1);
    
    try {
      const report = await testValidator.validateCode(
        userCode,
        testCases,
        challenge.solutionKeys
      );
      
      setTestResults(report);
      
      // Check if challenge is completed
      if (report.score >= 80) {
        const finalTime = timeSpent;
        onComplete?.(report.score, finalTime);
      }
    } catch (error) {
      console.error('Test validation failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [userCode, testCases, challenge.solutionKeys, timeSpent, onComplete, isRunning]);

  // Get next hint
  const getNextHint = useCallback(() => {
    if (currentHintIndex < challenge.hints.length - 1) {
      setCurrentHintIndex(prev => prev + 1);
    }
  }, [currentHintIndex, challenge.hints.length]);

  // Reset challenge
  const handleReset = useCallback(() => {
    setUserCode(challenge.initialCode);
    setTestResults(null);
    setStartTime(null);
    setTimeSpent(0);
    setAttempts(0);
    setCurrentHintIndex(0);
    setShowSolution(false);
  }, [challenge.initialCode]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-emerald-400 bg-emerald-500/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20';
      case 'advanced': return 'text-rose-400 bg-rose-500/20';
      default: return 'text-blue-400 bg-blue-500/20';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{challenge.title}</h2>
            <p className="text-slate-400">{challenge.description}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-slate-400">Difficulty</div>
              <div className={`text-sm font-semibold px-2 py-1 rounded ${getDifficultyColor(challenge.difficulty)}`}>
                {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-slate-400">Points</div>
              <div className="text-lg font-bold text-yellow-400">{challenge.points}</div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-slate-400">Time</div>
              <div className="text-lg font-mono text-indigo-400">{formatTime(timeSpent)}</div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-slate-400">Attempts</div>
              <div className="text-lg font-mono text-purple-400">{attempts}</div>
            </div>
          </div>
        </div>

        {/* Challenge Instructions */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-indigo-400 mb-2 flex items-center gap-2">
            <BookOpen size={16} />
            Challenge Instructions
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">{challenge.instruction}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'editor'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            <Code size={16} className="inline mr-2" />
            Code Editor
          </button>
          
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'tests'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            <TestTube size={16} className="inline mr-2" />
            Test Cases ({testCases.length})
          </button>
          
          <button
            onClick={() => setActiveTab('hints')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'hints'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            <Lightbulb size={16} className="inline mr-2" />
            Hints ({currentHintIndex + 1}/{challenge.hints.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Editor */}
        {activeTab === 'editor' && (
          <div className="flex-1 flex flex-col">
            <EnhancedCodeEditor
              value={userCode}
              onChange={handleCodeChange}
              language="javascript"
              theme="dark"
              onRun={async (code) => {
                const result = await codeExecutor.executeCode(code);
                return {
                  success: result.success,
                  output: result.consoleOutput?.join('\n') || result.output,
                  error: result.error
                };
              }}
              onValidate={(code) => codeExecutor.validateCode(code)}
              hints={codeExecutor.generateHints(userCode, challenge.solutionKeys)}
              initialCode={challenge.initialCode}
              solutionCode={challenge.solutionCode || ''}
              placeholder="// Write your solution here..."
            />
            
            {/* Action Buttons */}
            <div className="bg-slate-900 border-t border-slate-800 p-4">
              <div className="flex gap-3">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                >
                  {isRunning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Run Code
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleRunTests}
                  disabled={isRunning}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                >
                  {isRunning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube size={16} />
                      Run Tests
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test Cases Panel */}
        {activeTab === 'tests' && (
          <div className="flex-1 bg-slate-900 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TestTube size={20} />
              Test Cases
            </h3>
            
            <div className="space-y-4">
              {testCases.map((testCase, index) => (
                <div key={testCase.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Test {index + 1}: {testCase.description}</h4>
                    <span className="text-sm text-slate-400">{testCase.points || 10} pts</span>
                  </div>
                  
                  <div className="text-sm text-slate-400 space-y-1">
                    {testCase.input !== undefined && (
                      <div>Input: <code className="text-emerald-400">{JSON.stringify(testCase.input)}</code></div>
                    )}
                    {testCase.expectedOutput !== undefined && (
                      <div>Expected: <code className="text-blue-400">{JSON.stringify(testCase.expectedOutput)}</code></div>
                    )}
                    {testCase.expectedError && (
                      <div>Expected Error: <code className="text-rose-400">{testCase.expectedError}</code></div>
                    )}
                  </div>
                  
                  {testResults && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      {testResults.results[index]?.passed ? (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle size={16} />
                          <span className="text-sm">Passed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-rose-400">
                          <XCircle size={16} />
                          <span className="text-sm">{testResults.results[index]?.message || 'Failed'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {testResults && (
              <div className="mt-6 bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h4 className="font-semibold text-white mb-3">Test Results</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">{testResults.passedTests}</div>
                    <div className="text-xs text-slate-400">Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-rose-400">{testResults.failedTests}</div>
                    <div className="text-xs text-slate-400">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">{testResults.score.toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">{testResults.earnedPoints}/{testResults.totalPoints}</div>
                    <div className="text-xs text-slate-400">Points</div>
                  </div>
                </div>
                
                {testResults.feedback.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <h5 className="text-sm font-semibold text-indigo-400 mb-2">Feedback</h5>
                    <ul className="text-sm text-slate-300 space-y-1">
                      {testResults.feedback.map((feedback: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-indigo-400 mt-1">•</span>
                          <span>{feedback}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hints Panel */}
        {activeTab === 'hints' && (
          <div className="flex-1 bg-slate-900 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lightbulb size={20} />
              Progressive Hints
            </h3>
            
            <div className="space-y-4">
              {challenge.hints.slice(0, currentHintIndex + 1).map((hint, index) => (
                <div key={index} className="bg-slate-800 rounded-lg p-4 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-yellow-400">Hint {index + 1}</h4>
                    {index === currentHintIndex && (
                      <span className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded">Current</span>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm">{hint}</p>
                </div>
              ))}
              
              {currentHintIndex < challenge.hints.length - 1 && (
                <button
                  onClick={getNextHint}
                  className="w-full py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg font-medium transition-colors"
                >
                  Get Next Hint
                </button>
              )}
              
              {challenge.solutionCode && (
                <div className="pt-4 border-t border-slate-700">
                  <button
                    onClick={() => setShowSolution(!showSolution)}
                    className="w-full py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg font-medium transition-colors"
                  >
                    {showSolution ? <EyeOff size={16} className="inline mr-2" /> : <Eye size={16} className="inline mr-2" />}
                    {showSolution ? 'Hide' : 'Show'} Solution
                  </button>
                  
                  {showSolution && (
                    <div className="mt-4 bg-slate-800 rounded-lg p-4">
                      <h4 className="font-medium text-rose-400 mb-2">Solution Code</h4>
                      <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">
                        {challenge.solutionCode}
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(challenge.solutionCode || '');
                        }}
                        className="mt-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
                      >
                        <Copy size={14} className="inline mr-1" />
                        Copy Solution
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

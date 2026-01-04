import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Lightbulb, 
  RotateCcw, 
  Copy,
  Eye,
  EyeOff,
  Settings,
  Terminal
} from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: 'dark' | 'light';
  fontSize?: number;
  wordWrap?: boolean;
  showLineNumbers?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  onRun?: (code: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  onValidate?: (code: string) => { isValid: boolean; errors?: string[]; warnings?: string[] };
  hints?: string[];
  initialCode?: string;
  solutionCode?: string;
  showSolution?: boolean;
  onToggleSolution?: () => void;
}

interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
}

export const EnhancedCodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'javascript',
  theme = 'dark',
  fontSize = 14,
  wordWrap = true,
  showLineNumbers = true,
  readOnly = false,
  placeholder = '// Write your code here...',
  onRun,
  onValidate,
  hints = [],
  initialCode = '',
  solutionCode = '',
  showSolution = false,
  onToggleSolution
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(fontSize);
  const [wordWrapEnabled, setWordWrapEnabled] = useState(wordWrap);
  const [showLineNumbersState, setShowLineNumbersState] = useState(showLineNumbers);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const validationTimeoutRef = useRef<number | null>(null);

  // Simple syntax highlighting for JavaScript
  const highlightSyntax = useCallback((code: string) => {
    if (language !== 'javascript') return code;
    
    const keywords = [
      'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'do', 
      'switch', 'case', 'break', 'continue', 'return', 'try', 'catch', 'finally',
      'throw', 'new', 'class', 'extends', 'super', 'this', 'typeof', 'instanceof',
      'in', 'of', 'async', 'await', 'import', 'export', 'from', 'default'
    ];
    
    const builtins = [
      'console', 'Math', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date',
      'RegExp', 'Error', 'Promise', 'Map', 'Set', 'JSON', 'parseInt', 'parseFloat',
      'isNaN', 'isFinite', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'
    ];
    
    let highlighted = code;
    
    // Highlight strings
    highlighted = highlighted.replace(/(["'`])([^'"`]*)\1/g, '<span class="text-emerald-400">$1$2$1</span>');
    
    // Highlight comments
    highlighted = highlighted.replace(/\/\/(.*)$/gm, '<span class="text-slate-500 italic">//$1</span>');
    highlighted = highlighted.replace(/\/\*([\s\S]*?)\*\//g, '<span class="text-slate-500 italic">/*$1*/</span>');
    
    // Highlight keywords
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="text-purple-400 font-semibold">${keyword}</span>`);
    });
    
    // Highlight builtins
    builtins.forEach(builtin => {
      const regex = new RegExp(`\\b${builtin}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="text-blue-400">${builtin}</span>`);
    });
    
    // Highlight numbers
    highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-orange-400">$1</span>');
    
    return highlighted;
  }, [language]);

  // Debounced validation function
  const validateCodeDebounced = useCallback((code: string) => {
    if (!onValidate) return;
    
    // Clear existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Set new timeout for validation
    validationTimeoutRef.current = window.setTimeout(() => {
      try {
        const validation = onValidate(code);
        const errors: ValidationError[] = [];
        
        if (validation.errors) {
          validation.errors.forEach((error) => {
            errors.push({
              line: 1,
              column: 1,
              message: error,
              severity: 'error'
            });
          });
        }
        
        if (validation.warnings) {
          validation.warnings.forEach((warning) => {
            errors.push({
              line: 1,
              column: 1,
              message: warning,
              severity: 'warning'
            });
          });
        }
        
        setValidationErrors(errors);
      } catch (error) {
        console.error('Validation error:', error);
      }
    }, 500); // 500ms delay
  }, [onValidate]);

  // Immediate validation for critical errors
  const validateCodeImmediate = useCallback((code: string) => {
    if (!onValidate) return;
    
    try {
      const validation = onValidate(code);
      const criticalErrors: ValidationError[] = [];
      
      // Only check for syntax errors immediately
      if (validation.errors) {
        validation.errors.forEach((error) => {
          // Consider syntax errors as critical
          if (error.toLowerCase().includes('syntax') || error.toLowerCase().includes('unexpected')) {
            criticalErrors.push({
              line: 1,
              column: 1,
              message: error,
              severity: 'error'
            });
          }
        });
      }
      
      if (criticalErrors.length > 0) {
        setValidationErrors(criticalErrors);
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  }, [onValidate]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  // Handle code change
  const handleCodeChange = useCallback((newValue: string) => {
    onChange(newValue);
    validateCodeImmediate(newValue); // Check for critical syntax errors immediately
    validateCodeDebounced(newValue); // Debounced full validation
    setExecutionResult(null);
  }, [onChange, validateCodeImmediate, validateCodeDebounced]);

  // Run code
  const handleRun = useCallback(async () => {
    if (!onRun || isRunning) return;
    
    setIsRunning(true);
    setExecutionResult(null);
    
    try {
      const result = await onRun(value);
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsRunning(false);
    }
  }, [onRun, value, isRunning]);

  // Reset code
  const handleReset = useCallback(() => {
    handleCodeChange(initialCode);
    setExecutionResult(null);
    setValidationErrors([]);
  }, [handleCodeChange, initialCode]);

  // Copy code
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [value]);

  // Get next hint
  const getNextHint = useCallback(() => {
    if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex(prev => prev + 1);
    }
  }, [currentHintIndex, hints.length]);

  // Calculate line numbers
  const lines = value.split('\n');
  const lineCount = Math.max(lines.length, 10);

  return (
    <div className={`flex flex-col h-full bg-slate-950 border border-slate-700 rounded-xl overflow-hidden ${theme === 'light' ? 'bg-white' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-slate-400" />
          <span className="text-sm text-slate-300 font-mono">
            {language === 'javascript' ? 'script.js' : 'code.txt'}
          </span>
          {validationErrors.length > 0 && (
            <span className="text-xs text-rose-400 bg-rose-500/20 px-2 py-1 rounded">
              {validationErrors.filter(e => e.severity === 'error').length} errors
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hints.length > 0 && (
            <button
              onClick={() => setShowHints(!showHints)}
              className="p-1.5 text-slate-400 hover:text-yellow-400 hover:bg-slate-800 rounded transition-colors"
              title="Hints"
            >
              <Lightbulb size={16} />
            </button>
          )}
          
          {solutionCode && onToggleSolution && (
            <button
              onClick={onToggleSolution}
              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
              title="Toggle Solution"
            >
              {showSolution ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
            title="Copy Code"
          >
            {copiedCode ? <CheckCircle size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>
          
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-orange-400 hover:bg-slate-800 rounded transition-colors"
            title="Reset Code"
          >
            <RotateCcw size={16} />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers */}
        {showLineNumbersState && (
          <div 
            ref={lineNumbersRef}
            className="bg-slate-900 text-slate-600 p-4 text-right select-none border-r border-slate-800 flex flex-col gap-[2px] min-w-[3rem] font-mono text-sm"
            style={{ fontSize: `${fontSize}px` }}
          >
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i} className="leading-6">{i + 1}</div>
            ))}
          </div>
        )}
        
        {/* Code Editor */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            className="absolute inset-0 bg-transparent p-4 resize-none focus:outline-none font-mono text-sm leading-6 text-slate-200 z-10"
            style={{ 
              fontSize: `${editorFontSize}px`,
              whiteSpace: wordWrapEnabled ? 'pre-wrap' : 'pre',
              overflowWrap: wordWrapEnabled ? 'break-word' : 'normal'
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
          />
          
          {/* Syntax Highlighting Overlay */}
          <div 
            className="absolute inset-0 p-4 pointer-events-none font-mono text-sm leading-6 whitespace-pre-wrap overflow-hidden z-0 opacity-80"
            style={{ fontSize: `${editorFontSize}px` }}
            dangerouslySetInnerHTML={{ __html: highlightSyntax(value) }}
          />
        </div>
      </div>

      {/* Hints Panel */}
      {showHints && hints.length > 0 && (
        <div className="border-t border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-yellow-400 flex items-center gap-2">
              <Lightbulb size={16} />
              Hints ({currentHintIndex + 1}/{hints.length})
            </h4>
            <button
              onClick={getNextHint}
              disabled={currentHintIndex >= hints.length - 1}
              className="text-xs px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next Hint
            </button>
          </div>
          <p className="text-sm text-slate-300 italic">
            {hints[currentHintIndex]}
          </p>
        </div>
      )}

      {/* Execution Result */}
      {executionResult && (
        <div className={`border-t border-slate-800 p-4 ${executionResult.success ? 'bg-emerald-950/20' : 'bg-rose-950/20'}`}>
          <div className="flex items-center gap-2 mb-2">
            {executionResult.success ? (
              <CheckCircle size={16} className="text-emerald-400" />
            ) : (
              <XCircle size={16} className="text-rose-400" />
            )}
            <span className={`text-sm font-semibold ${executionResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
              {executionResult.success ? 'Success!' : 'Error'}
            </span>
            {executionResult.executionTime && (
              <span className="text-xs text-slate-500">
                ({executionResult.executionTime}ms)
              </span>
            )}
          </div>
          <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">
            {executionResult.output || executionResult.error}
          </pre>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="border-t border-slate-800 bg-rose-950/20 p-4">
          <h4 className="text-sm font-semibold text-rose-400 mb-2">Validation Errors</h4>
          <div className="space-y-1">
            {validationErrors.map((error, index) => (
              <div key={index} className="text-sm text-slate-300">
                <span className="text-rose-400">Line {error.line}:</span> {error.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-12 right-4 bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl z-20 min-w-[200px]">
          <h4 className="text-sm font-semibold text-white mb-3">Editor Settings</h4>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Font Size</label>
              <input
                type="range"
                min="12"
                max="20"
                value={editorFontSize}
                onChange={(e) => setEditorFontSize(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-slate-500">{editorFontSize}px</span>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400">Word Wrap</label>
              <input
                type="checkbox"
                checked={wordWrapEnabled}
                onChange={(e) => setWordWrapEnabled(e.target.checked)}
                className="rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400">Line Numbers</label>
              <input
                type="checkbox"
                checked={showLineNumbersState}
                onChange={(e) => setShowLineNumbersState(e.target.checked)}
                className="rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Run Button */}
      {onRun && (
        <div className="border-t border-slate-800 p-4 bg-slate-900">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors"
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
        </div>
      )}
    </div>
  );
};

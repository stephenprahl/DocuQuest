interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  consoleOutput?: string[];
}

interface CodeValidation {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export class CodeExecutor {
  private static instance: CodeExecutor;
  
  static getInstance(): CodeExecutor {
    if (!CodeExecutor.instance) {
      CodeExecutor.instance = new CodeExecutor();
    }
    return CodeExecutor.instance;
  }

  async executeCode(code: string, language: string = 'javascript'): Promise<ExecutionResult> {
    const startTime = performance.now();
    
    try {
      if (language !== 'javascript') {
        return {
          success: false,
          error: `Language '${language}' is not supported yet. Only JavaScript is currently supported.`
        };
      }

      // Create a sandboxed execution environment
      const result = await this.executeInSandbox(code);
      
      const endTime = performance.now();
      
      return {
        success: true,
        output: result.returnValue,
        consoleOutput: result.consoleOutput,
        executionTime: Math.round(endTime - startTime)
      };
    } catch (error) {
      const endTime = performance.now();
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: Math.round(endTime - startTime)
      };
    }
  }

  private async executeInSandbox(code: string): Promise<{ returnValue: any; consoleOutput: string[] }> {
    const consoleOutput: string[] = [];
    
    // Create a custom console object to capture output
    const customConsole = {
      log: (...args: any[]) => {
        consoleOutput.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      },
      error: (...args: any[]) => {
        consoleOutput.push(`ERROR: ${args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')}`);
      },
      warn: (...args: any[]) => {
        consoleOutput.push(`WARNING: ${args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')}`);
      },
      info: (...args: any[]) => {
        consoleOutput.push(`INFO: ${args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')}`);
      }
    };

    // Create a safe evaluation context
    const sandbox = {
      console: customConsole,
      // Provide safe built-in objects and functions
      Math: Math,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      Date: Date,
      RegExp: RegExp,
      JSON: JSON,
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      isFinite: isFinite,
      // Common utility functions
      setTimeout: () => { throw new Error('setTimeout is not allowed in this environment'); },
      setInterval: () => { throw new Error('setInterval is not allowed in this environment'); },
      fetch: () => { throw new Error('fetch is not allowed in this environment'); },
      XMLHttpRequest: () => { throw new Error('XMLHttpRequest is not allowed in this environment'); },
      require: () => { throw new Error('require is not allowed in this environment'); },
      process: undefined,
      global: undefined,
      window: undefined,
      document: undefined
    };

    // Create the sandboxed function
    const sandboxedFunction = new Function(
      ...Object.keys(sandbox),
      `
      try {
        ${code}
        return undefined; // Return undefined if no explicit return
      } catch (error) {
        throw error;
      }
      `
    );

    // Execute the code in the sandbox
    const returnValue = sandboxedFunction(...Object.values(sandbox));
    
    return {
      returnValue: returnValue === undefined ? 'Code executed successfully' : String(returnValue),
      consoleOutput
    };
  }

  validateCode(code: string, language: string = 'javascript'): CodeValidation {
    if (language !== 'javascript') {
      return {
        isValid: false,
        errors: [`Language '${language}' is not supported yet.`]
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic syntax validation
      new Function(code);
      
      // Check for common issues
      this.checkCommonIssues(code, warnings);
      
      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Syntax error']
      };
    }
  }

  private checkCommonIssues(code: string, warnings: string[]): void {
    // Check for potential issues
    if (code.includes('var ')) {
      warnings.push('Consider using "let" or "const" instead of "var" for better scoping.');
    }
    
    if (code.includes('==') && !code.includes('===')) {
      warnings.push('Consider using "===" instead of "==" for strict equality comparison.');
    }
    
    if (code.includes('console.log') && !code.includes('return')) {
      warnings.push('Consider adding a return statement to see the result of your code.');
    }
    
    // Check for empty functions
    if (code.includes('function') && code.includes('{}') && !code.includes('// TODO')) {
      warnings.push('Function appears to be empty. Make sure to implement the logic.');
    }
  }

  // Check if code contains required solution keys
  checkSolutionKeys(code: string, solutionKeys: string[]): { found: string[]; missing: string[]; isComplete: boolean } {
    const found: string[] = [];
    const missing: string[] = [];
    
    for (const key of solutionKeys) {
      if (code.includes(key)) {
        found.push(key);
      } else {
        missing.push(key);
      }
    }
    
    return {
      found,
      missing,
      isComplete: missing.length === 0
    };
  }

  // Generate hints based on code analysis
  generateHints(code: string, solutionKeys: string[], maxHints: number = 3): string[] {
    const hints: string[] = [];
    const keyCheck = this.checkSolutionKeys(code, solutionKeys);
    
    if (keyCheck.missing.length > 0) {
      hints.push(`You're missing these key concepts: ${keyCheck.missing.join(', ')}`);
    }
    
    // Check for common patterns
    if (!code.includes('function') && solutionKeys.includes('function')) {
      hints.push('Try defining a function using the "function" keyword.');
    }
    
    if (!code.includes('return') && solutionKeys.includes('return')) {
      hints.push('Make sure your function returns a value using the "return" keyword.');
    }
    
    if (!code.includes('console.log') && keyCheck.found.length === 0) {
      hints.push('Add console.log() statements to debug your code and see intermediate results.');
    }
    
    // Check for syntax issues
    if (code.includes('if') && !code.includes('{')) {
      hints.push('Make sure to use curly braces {} for your if statements.');
    }
    
    if (code.includes('for') && !code.includes(';')) {
      hints.push('Check your for loop syntax - it should have three parts separated by semicolons.');
    }
    
    return hints.slice(0, maxHints);
  }
}

// Export singleton instance
export const codeExecutor = CodeExecutor.getInstance();

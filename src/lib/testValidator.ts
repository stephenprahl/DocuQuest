export interface TestCase {
  id: string;
  description: string;
  input?: any;
  expectedOutput?: any;
  expectedError?: string;
  timeout?: number;
  points?: number;
}

export interface TestResult {
  passed: boolean;
  output?: any;
  error?: string;
  executionTime: number;
  points: number;
  message: string;
}

export interface ValidationReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalPoints: number;
  earnedPoints: number;
  score: number;
  results: TestResult[];
  feedback: string[];
}

export class TestValidator {
  private static instance: TestValidator;
  
  static getInstance(): TestValidator {
    if (!TestValidator.instance) {
      TestValidator.instance = new TestValidator();
    }
    return TestValidator.instance;
  }

  async validateCode(
    code: string, 
    testCases: TestCase[], 
    solutionKeys: string[] = []
  ): Promise<ValidationReport> {
    const results: TestResult[] = [];
    const feedback: string[] = [];
    let totalPoints = 0;
    let earnedPoints = 0;

    // Check solution keys first
    const keyValidation = this.checkSolutionKeys(code, solutionKeys);
    if (!keyValidation.isComplete) {
      feedback.push(`Missing required concepts: ${keyValidation.missing.join(', ')}`);
    }

    // Run each test case
    for (const testCase of testCases) {
      totalPoints += testCase.points || 10;
      
      try {
        const result = await this.runSingleTest(code, testCase);
        results.push(result);
        
        if (result.passed) {
          earnedPoints += result.points;
        } else {
          feedback.push(`Test "${testCase.description}" failed: ${result.message}`);
        }
      } catch (error) {
        const failedResult: TestResult = {
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTime: 0,
          points: 0,
          message: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
        results.push(failedResult);
        feedback.push(`Test "${testCase.description}" crashed: ${failedResult.message}`);
      }
    }

    const passedTests = results.filter(r => r.passed).length;
    const failedTests = results.length - passedTests;
    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    // Generate overall feedback
    if (score === 100) {
      feedback.push('🎉 Perfect! All tests passed!');
    } else if (score >= 80) {
      feedback.push('👍 Great work! Most tests passed.');
    } else if (score >= 60) {
      feedback.push('📚 Good effort! Keep practicing.');
    } else {
      feedback.push('💪 Keep trying! Review the concepts and try again.');
    }

    return {
      totalTests: testCases.length,
      passedTests,
      failedTests,
      totalPoints,
      earnedPoints,
      score,
      results,
      feedback
    };
  }

  private async runSingleTest(code: string, testCase: TestCase): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      // Create a test function that wraps the user's code
      const testFunction = this.createTestFunction(code, testCase);
      
      // Set timeout
      const timeout = testCase.timeout || 5000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Test timed out')), timeout);
      });
      
      // Run the test
      const result = await Promise.race([
        testFunction(),
        timeoutPromise
      ]);
      
      const executionTime = performance.now() - startTime;
      
      // Validate the result
      const validation = this.validateResult(result, testCase);
      
      return {
        passed: validation.passed,
        output: result,
        executionTime,
        points: validation.passed ? (testCase.points || 10) : 0,
        message: validation.message
      };
      
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      // Check if this is an expected error
      if (testCase.expectedError) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const passed = errorMessage.includes(testCase.expectedError);
        
        return {
          passed,
          error: errorMessage,
          executionTime,
          points: passed ? (testCase.points || 10) : 0,
          message: passed ? 'Correctly threw expected error' : `Expected error: ${testCase.expectedError}, got: ${errorMessage}`
        };
      }
      
      return {
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
        points: 0,
        message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private createTestFunction(code: string, testCase: TestCase): () => Promise<any> {
    return async () => {
      // Create a safe execution environment
      const sandbox = {
        console: {
          log: () => {}, // Suppress console.log in tests
          error: () => {},
          warn: () => {},
          info: () => {}
        },
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
        // Test-specific utilities
        expect: (value: any) => ({
          toBe: (expected: any) => {
            if (value !== expected) {
              throw new Error(`Expected ${expected}, but got ${value}`);
            }
          },
          toEqual: (expected: any) => {
            if (JSON.stringify(value) !== JSON.stringify(expected)) {
              throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(value)}`);
            }
          },
          toBeCloseTo: (expected: any, precision = 2) => {
            const factor = Math.pow(10, precision);
            const actual = Math.round(value * factor);
            const exp = Math.round(expected * factor);
            if (actual !== exp) {
              throw new Error(`Expected ${expected}, but got ${value}`);
            }
          },
          toThrow: (expectedError?: string) => {
            if (typeof value !== 'function') {
              throw new Error('Expected a function');
            }
            try {
              value();
              throw new Error('Expected function to throw');
            } catch (error) {
              if (expectedError && error instanceof Error && !error.message.includes(expectedError)) {
                throw new Error(`Expected error "${expectedError}", but got "${error.message}"`);
              }
            }
          }
        }),
        // Test input
        input: testCase.input
      };

      // Create the function with user code and test case
      const userFunction = new Function(
        ...Object.keys(sandbox),
        `
        ${code}
        
        // Auto-detect function name and call it with input
        const functionMatch = code.match(/function\\s+(\\w+)\\s*\\(/);
        const constMatch = code.match(/const\\s+(\\w+)\\s*=\\s*function/);
        const arrowMatch = code.match(/const\\s+(\\w+)\\s*=\\s*\\(/);
        
        const functionName = functionMatch?.[1] || constMatch?.[1] || arrowMatch?.[1];
        
        if (functionName && typeof this[functionName] === 'function') {
          return this[functionName](input);
        }
        
        // If no function found, try to execute the code directly
        return eval(${JSON.stringify(code)});
        `
      );

      return userFunction(...Object.values(sandbox));
    };
  }

  private validateResult(result: any, testCase: TestCase): { passed: boolean; message: string } {
    if (testCase.expectedOutput !== undefined) {
      if (typeof testCase.expectedOutput === 'object') {
        if (JSON.stringify(result) === JSON.stringify(testCase.expectedOutput)) {
          return { passed: true, message: 'Test passed' };
        } else {
          return { 
            passed: false, 
            message: `Expected ${JSON.stringify(testCase.expectedOutput)}, got ${JSON.stringify(result)}` 
          };
        }
      } else {
        if (result === testCase.expectedOutput) {
          return { passed: true, message: 'Test passed' };
        } else {
          return { 
            passed: false, 
            message: `Expected ${testCase.expectedOutput}, got ${result}` 
          };
        }
      }
    }

    // If no expected output defined, just check that it didn't error
    return { passed: true, message: 'Code executed without errors' };
  }

  private checkSolutionKeys(code: string, solutionKeys: string[]): { found: string[]; missing: string[]; isComplete: boolean } {
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

  // Generate test cases based on common patterns
  generateTestCases(functionSignature: string, difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'): TestCase[] {
    const testCases: TestCase[] = [];

    // Basic functionality tests
    if (functionSignature.includes('sum') || functionSignature.includes('add')) {
      testCases.push(
        { id: '1', description: 'Sum of positive numbers', input: [1, 2, 3], expectedOutput: 6, points: 10 },
        { id: '2', description: 'Sum with zero', input: [0, 5, 10], expectedOutput: 15, points: 10 },
        { id: '3', description: 'Sum with negative numbers', input: [-1, 2, -3], expectedOutput: -2, points: 15 }
      );
    }

    if (functionSignature.includes('factorial')) {
      testCases.push(
        { id: '1', description: 'Factorial of 0', input: 0, expectedOutput: 1, points: 10 },
        { id: '2', description: 'Factorial of 5', input: 5, expectedOutput: 120, points: 15 },
        { id: '3', description: 'Factorial of 10', input: 10, expectedOutput: 3628800, points: 20 }
      );
    }

    if (functionSignature.includes('reverse') || functionSignature.includes('palindrome')) {
      testCases.push(
        { id: '1', description: 'Reverse simple string', input: 'hello', expectedOutput: 'olleh', points: 10 },
        { id: '2', description: 'Reverse with spaces', input: 'hello world', expectedOutput: 'dlrow olleh', points: 15 },
        { id: '3', description: 'Empty string', input: '', expectedOutput: '', points: 10 }
      );
    }

    // Add edge cases based on difficulty
    if (difficulty === 'intermediate' || difficulty === 'advanced') {
      testCases.push(
        { id: 'edge1', description: 'Null input handling', input: null, expectedOutput: null, points: 15 },
        { id: 'edge2', description: 'Undefined input handling', input: undefined, expectedOutput: undefined, points: 15 }
      );
    }

    if (difficulty === 'advanced') {
      testCases.push(
        { id: 'perf1', description: 'Large input performance', input: Array(1000).fill(1), expectedOutput: 1000, points: 20, timeout: 1000 },
        { id: 'error1', description: 'Error handling', input: 'invalid', expectedError: 'Error', points: 15 }
      );
    }

    // If no specific pattern found, add generic tests
    if (testCases.length === 0) {
      testCases.push(
        { id: '1', description: 'Basic functionality test', input: 'test', points: 20 },
        { id: '2', description: 'Edge case test', input: '', points: 15 }
      );
    }

    return testCases;
  }
}

// Export singleton instance
export const testValidator = TestValidator.getInstance();

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

// Ensure Jest globals are available in test files
declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toBeDefined(): R;
      toBeUndefined(): R;
      toBeNull(): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toHaveLength(expected: number): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(expected: number): R;
      toThrow(expected?: string | Error | RegExp): R;
      toEqual(expected: any): R;
      toStrictEqual(expected: any): R;
      toContain(expected: any): R;
      toMatch(expected: string | RegExp): R;
      toBeGreaterThan(expected: number): R;
      toBeLessThan(expected: number): R;
      toBeCloseTo(expected: number, precision?: number): R;
      toBeInstanceOf(expected: any): R;
    }
  }

  // Extend expect with custom matchers
  namespace jest {
    interface Expect {
      any(constructor: any): any;
      anything(): any;
      arrayContaining(sample: any[]): any;
      objectContaining(sample: any): any;
      stringContaining(expected: string): any;
      stringMatching(expected: string | RegExp): any;
    }
  }

  // Mock functions
  interface MockedFunction<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T>;
    mockResolvedValue(value: Awaited<ReturnType<T>>): this;
    mockRejectedValue(error: any): this;
    mockReturnValue(value: ReturnType<T>): this;
    mockImplementation(fn: T): this;
    mockClear(): this;
    mockReset(): this;
    mockRestore(): this;
    getMockName(): string;
    mockName(name: string): this;
  }
}

export {}; 
// Manual mock for @google/genai.
// Vitest 4.x requires constructor mock implementations to use 'function' or 'class'
// syntax (not arrow functions). This wrapper calls the implementation as a regular
// function and returns its result, so arrow function implementations work correctly.

/* eslint-disable @typescript-eslint/no-explicit-any */

let _impl: ((...args: any[]) => any) | null = null;

function MockGoogleGenAI(this: any, ...args: any[]) {
  if (_impl) {
    const result = _impl(...args);
    // Returning an object from a constructor overrides `this`
    if (result !== null && typeof result === 'object') {
      return result;
    }
  }
}

(MockGoogleGenAI as any).mockImplementation = function (fn: (...args: any[]) => any) {
  _impl = fn;
  return MockGoogleGenAI;
};
(MockGoogleGenAI as any).mockReturnValue = function (val: any) {
  _impl = () => val;
  return MockGoogleGenAI;
};
(MockGoogleGenAI as any).mockReset = function () {
  _impl = null;
  return MockGoogleGenAI;
};
(MockGoogleGenAI as any).mockRestore = function () {
  _impl = null;
  return MockGoogleGenAI;
};

export const GoogleGenAI = MockGoogleGenAI;

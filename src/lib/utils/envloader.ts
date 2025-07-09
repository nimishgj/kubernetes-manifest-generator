/**
 * Function to fetch environment variable values from .env file
 * @param name - Name of the environment variable to fetch
 * @returns The value of the environment variable or undefined if not found
 */
export function getEnvValue(name: string): string | undefined {
  // In SvelteKit, client-side environment variables must be prefixed with VITE_
  // and are accessed via import.meta.env
  
  // For client-side with VITE_ prefix
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // First check if the variable is directly available (server-side or VITE_ prefixed)
    const value = import.meta.env[name];
    if (value !== undefined) {
      return value;
    }
    
    // Then check if it's available with VITE_ prefix
    const viteValue = import.meta.env[`VITE_${name}`];
    if (viteValue !== undefined) {
      return viteValue;
    }
  }

  // For direct access in development or server-side
  // Note: This won't work in client-side production builds
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development') {
    try {
      // Try to access directly (only works in dev mode)
      // @ts-ignore - Dynamic access
      const devValue = import.meta.env[name];
      if (devValue !== undefined) {
        return devValue;
      }
    } catch (e) {
      // Ignore errors in accessing environment variables
    }
  }

  return undefined;
}

/**
 * Function to fetch environment variable with fallback value
 * @param name - Name of the environment variable to fetch
 * @param defaultValue - Default value to return if env variable is not found
 * @returns The value of the environment variable or the default value
 */
export function getEnvValueWithDefault(name: string, defaultValue: string): string {
  const value = getEnvValue(name);
  return value !== undefined ? value : defaultValue;
}

/**
 * Function to fetch required environment variable
 * @param name - Name of the environment variable to fetch
 * @throws Error if the environment variable is not found
 * @returns The value of the environment variable
 */
export function getRequiredEnvValue(name: string): string {
  const value = getEnvValue(name);
  if (value === undefined) {
    throw new Error(`Required environment variable ${name} is not defined`);
  }
  return value;
}
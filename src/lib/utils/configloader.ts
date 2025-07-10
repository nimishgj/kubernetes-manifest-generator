import { envConfig } from '$lib/config/kubernetesOptions';

/**
 * Function to fetch configuration values from the config file
 * @param name - Name of the configuration value to fetch
 * @returns The value from the config or undefined if not found
 */
export function getConfigValue(name: string): string | undefined {
  // Check if the name exists in our envConfig
  if (name in envConfig) {
    // @ts-ignore - We know the key exists
    return envConfig[name];
  }

  // For backward compatibility with code still using VITE_ prefixed names
  const withoutPrefix = name.replace(/^VITE_/, '');
  if (withoutPrefix in envConfig) {
    // @ts-ignore - We know the key exists
    return envConfig[withoutPrefix];
  }

  return undefined;
}

/**
 * Function to fetch config value with fallback value
 * @param name - Name of the configuration value to fetch
 * @param defaultValue - Default value to return if config value is not found
 * @returns The configuration value or the default value
 */
export function getConfigValueWithDefault(name: string, defaultValue: string): string {
  const value = getConfigValue(name);
  return value !== undefined ? value : defaultValue;
}

/**
 * Function to fetch required configuration value
 * @param name - Name of the configuration value to fetch
 * @throws Error if the configuration value is not found
 * @returns The configuration value
 */
export function getRequiredConfigValue(name: string): string {
  const value = getConfigValue(name);
  if (value === undefined) {
    throw new Error(`Required configuration value ${name} is not defined`);
  }
  return value;
}

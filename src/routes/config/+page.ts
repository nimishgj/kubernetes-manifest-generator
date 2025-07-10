import type { PageLoad } from './$types';
import { getEnvValue } from '$lib/utils/envloader';

// We're disabling prerendering for this route to avoid base path issues
export const prerender = false;

export const load: PageLoad = async () => {
  // Load the ROLE_APIVERSION environment variable
  const roleApiVersion = getEnvValue('ROLE_APIVERSION');
  
  return {
    roleApiVersion
  };
};

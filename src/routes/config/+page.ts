import type { PageLoad } from './$types';
import { getEnvValue } from '$lib/utils/envloader';

export const load: PageLoad = async () => {
  // Load the ROLE_APIVERSION environment variable
  const roleApiVersion = getEnvValue('ROLE_APIVERSION');
  
  return {
    roleApiVersion
  };
};

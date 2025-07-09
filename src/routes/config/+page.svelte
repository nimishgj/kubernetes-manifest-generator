<script lang="ts">
  import { getEnvValue } from '$lib/utils/envloader';
  export let data;
  
  // Initialize with one empty entry for service accounts
  let serviceAccounts = [
    { id: 1, name: '', namespace: '' }
  ];
  
  // Initialize with one empty entry for roles
  let roles = [
    { 
      id: 1, 
      name: '', 
      namespace: '', 
      apiGroups: [],
      resources: [],
      verbs: [],
      serviceAccountIds: [] 
    }
  ];
  
  // Cluster configuration
  let clusterName = 'kubernetes';
  let serverUrl = 'https://kubernetes.default.svc';
  let showPreview = false;
  
  // Options for multi-select fields
  const apiGroupOptions = [
    '', 'apps', 'batch', 'extensions', 'networking.k8s.io', 'rbac.authorization.k8s.io', 
    'storage.k8s.io', 'apiextensions.k8s.io', 'policy'
  ];
  
  const resourceOptions = [
    'pods', 'deployments', 'services', 'configmaps', 'secrets', 'namespaces', 
    'persistentvolumes', 'persistentvolumeclaims', 'nodes', 'ingresses', 
    'jobs', 'cronjobs', 'statefulsets', 'daemonsets', 'replicasets'
  ];
  
  const verbOptions = [
    'get', 'list', 'watch', 'create', 'update', 'patch', 'delete'
  ];
  
  // Function to generate YAML for manifest download
  function generateManifestYAML() {
    const yamlParts = [];
    
    // Generate service account YAML
    const validServiceAccounts = serviceAccounts.filter(sa => sa.name && sa.namespace);
    validServiceAccounts.forEach((sa, index) => {
      const serviceAccountYAML = `apiVersion: ${getEnvValue('VITE_SERVICE_ACCOUNT_APIVERSION') || 'v1'}
`+
      `kind: ${getEnvValue('VITE_SERVICE_ACCOUNT_KIND') || 'ServiceAccount'}
`+
      `metadata:
`+
      `  name: ${sa.name}
`+
      `  namespace: ${sa.namespace}`;
      
      yamlParts.push(serviceAccountYAML);
      if (index < validServiceAccounts.length - 1 || roles.some(r => r.name && r.namespace)) {
        yamlParts.push('---');
      }
    });
    
    // Generate role YAML
    const validRoles = roles.filter(role => 
      role.name && role.namespace && role.apiGroups.length > 0 && 
      role.resources.length > 0 && role.verbs.length > 0
    );
    
    validRoles.forEach((role, index) => {
      const roleYAML = `apiVersion: ${getEnvValue('VITE_ROLE_APIVERSION') || 'rbac.authorization.k8s.io/v1'}
`+
      `kind: ${getEnvValue('VITE_ROLE_KIND') || 'Role'}
`+
      `metadata:
`+
      `  name: ${role.name}
`+
      `  namespace: ${role.namespace}
`+
      `rules:
`+
      `- apiGroups: ["${role.apiGroups.join('", "')}"]
`+
      `  resources: ["${role.resources.join('", "')}"]
`+
      `  verbs: ["${role.verbs.join('", "')}"]`;
      
      yamlParts.push(roleYAML);
      
      // Generate role binding YAML for each associated service account
      if (role.serviceAccountIds.length > 0) {
        const associatedSAs = serviceAccounts.filter(sa => role.serviceAccountIds.includes(sa.id));
        associatedSAs.forEach((sa, saIndex) => {
          if (sa.name && sa.namespace) {
            yamlParts.push('---');
            
            const roleBindingYAML = `apiVersion: ${getEnvValue('VITE_ROLE_BINDING_API_VERSION') || 'rbac.authorization.k8s.io/v1'}
`+
            `kind: ${getEnvValue('VITE_ROLE_BINDING_KIND') || 'RoleBinding'}
`+
            `metadata:
`+
            `  name: ${sa.name}-${role.name}
`+
            `  namespace: ${sa.namespace}
`+
            `subjects:
`+
            `- kind: ${getEnvValue('VITE_SERVICE_ACCOUNT_KIND') || 'ServiceAccount'}
`+
            `  name: ${sa.name}
`+
            `  namespace: ${sa.namespace}
`+
            `roleRef:
`+
            `  kind: ${getEnvValue('VITE_ROLE_KIND') || 'Role'}
`+
            `  name: ${role.name}
`+
            `  apiGroup: rbac.authorization.k8s.io`;
            
            yamlParts.push(roleBindingYAML);
          }
        });
      }
      
      if (index < validRoles.length - 1) {
        yamlParts.push('---');
      }
    });
    
    return yamlParts.join('\n');
  }
  
  // Function to download manifest YAML
  function downloadManifest() {
    // Validate service account entries
    const validSAEntries = serviceAccounts.filter(sa => sa.name && sa.namespace);
    if (validSAEntries.length === 0) {
      alert('Please add at least one valid service account entry');
      return;
    }
    
    // Validate role entries
    const validRoleEntries = roles.filter(
      role => role.name && role.namespace && role.apiGroups.length > 0 && 
             role.resources.length > 0 && role.verbs.length > 0 && 
             role.serviceAccountIds.length > 0
    );
    
    if (validRoleEntries.length === 0) {
      alert('Please configure at least one valid role with all required fields and associated service accounts');
      return;
    }
    
    const yaml = generateManifestYAML();
    
    // Create blob and trigger download
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kubernetes-manifest.yaml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  // Service Account functions
  function addServiceAccount() {
    const newId = serviceAccounts.length > 0 
      ? Math.max(...serviceAccounts.map(sa => sa.id)) + 1 
      : 1;
    serviceAccounts = [...serviceAccounts, { id: newId, name: '', namespace: '' }];
  }
  
  function removeServiceAccount(id: number) {
    // Remove the service account from all roles that reference it
    roles = roles.map(role => ({
      ...role,
      serviceAccountIds: role.serviceAccountIds.filter(saId => saId !== id)
    }));
    
    // Remove the service account itself
    serviceAccounts = serviceAccounts.filter(sa => sa.id !== id);
    if (serviceAccounts.length === 0) {
      addServiceAccount(); // Always keep at least one entry
    }
  }
  
  // Role functions
  function addRole() {
    const newId = roles.length > 0 
      ? Math.max(...roles.map(role => role.id)) + 1 
      : 1;
    roles = [...roles, { 
      id: newId, 
      name: '', 
      namespace: '', 
      apiGroups: [],
      resources: [],
      verbs: [],
      serviceAccountIds: [] 
    }];
  }
  
  function removeRole(id: number) {
    roles = roles.filter(role => role.id !== id);
    if (roles.length === 0) {
      addRole(); // Always keep at least one entry
    }
  }
  
  // Toggle selection in multi-select
  function toggleSelection(array: string[], item: string): string[] {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  }
  
  // Toggle service account selection for a role
  function toggleServiceAccountForRole(roleId: number, saId: number) {
    roles = roles.map(role => {
      if (role.id === roleId) {
        return {
          ...role,
          serviceAccountIds: role.serviceAccountIds.includes(saId)
            ? role.serviceAccountIds.filter(id => id !== saId)
            : [...role.serviceAccountIds, saId]
        };
      }
      return role;
    });
  }
  
  // Function to handle form submission
  async function handleSubmit() {
    // Validate service account entries
    const validSAEntries = serviceAccounts.filter(sa => sa.name && sa.namespace);
    if (validSAEntries.length === 0) {
      alert('Please add at least one valid service account entry');
      return;
    }
    
    // Validate role entries
    const validRoleEntries = roles.filter(
      role => role.name && role.namespace && role.apiGroups.length > 0 && 
             role.resources.length > 0 && role.verbs.length > 0 && 
             role.serviceAccountIds.length > 0
    );
    
    if (validRoleEntries.length === 0) {
      alert('Please configure at least one valid role with all required fields and associated service accounts');
      return;
    }
    
    // Check if all selected service account IDs exist
    const allServiceAccountIds = new Set(serviceAccounts.map(sa => sa.id));
    const invalidRoles = validRoleEntries.filter(role => 
      role.serviceAccountIds.some(saId => !allServiceAccountIds.has(saId))
    );
    
    if (invalidRoles.length > 0) {
      alert('Some roles reference non-existent service accounts. Please fix before submitting.');
      return;
    }
    
    // Validate cluster info
    if (!clusterName.trim()) {
      alert('Please enter a cluster name');
      return;
    }
    
    if (!serverUrl.trim() || !serverUrl.startsWith('http')) {
      alert('Please enter a valid server URL (starting with http:// or https://)');
      return;
    }
    
    // Show the preview
    showPreview = true;
  }
  
  // Functions for downloading YAML files will be implemented later
</script>

<svelte:head>
  <title>Kubeconfig Generator - Config</title>
</svelte:head>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Kubeconfig Generator</h1>
  

  
  <form on:submit|preventDefault={handleSubmit} class="space-y-8">
    <!-- Service Accounts Section -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Service Account Configuration</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-6">Add service account details to include in your kubeconfig file.</p>
      
      <div class="space-y-4">
        {#each serviceAccounts as sa (sa.id)}
          <div class="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div class="flex-grow">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1" for={`name-${sa.id}`}>
                Service Account Name
              </label>
              <input 
                type="text" 
                id={`name-${sa.id}`}
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
                bind:value={sa.name} 
                placeholder="service-account-name"
                required
              />
            </div>
            
            <div class="flex-grow">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1" for={`namespace-${sa.id}`}>
                Namespace
              </label>
              <input 
                type="text" 
                id={`namespace-${sa.id}`}
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
                bind:value={sa.namespace} 
                placeholder="default"
                required
              />
            </div>
            
            <div class="flex items-end">
              <button 
                type="button" 
                class="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                on:click={() => removeServiceAccount(sa.id)}
                aria-label="Remove service account"
                disabled={serviceAccounts.length === 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        {/each}
        
        <div class="flex justify-center">
          <button 
            type="button" 
            class="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center"
            on:click={addServiceAccount}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
            </svg>
            Add Service Account
          </button>
        </div>
      </div>
    </div>
    
    <!-- Roles Section -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Role Configuration</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-6">Define roles and associate them with service accounts.</p>
      
      <div class="space-y-8">
        {#each roles as role (role.id)}
          <div class="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Role #{role.id}</h3>
              <button 
                type="button" 
                class="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors"
                on:click={() => removeRole(role.id)}
                disabled={roles.length === 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <!-- Role Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1" for={`role-name-${role.id}`}>
                  Role Name
                </label>
                <input 
                  type="text" 
                  id={`role-name-${role.id}`}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
                  bind:value={role.name} 
                  placeholder="example-role"
                  required
                />
              </div>
              
              <!-- Namespace -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1" for={`role-namespace-${role.id}`}>
                  Namespace
                </label>
                <input 
                  type="text" 
                  id={`role-namespace-${role.id}`}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
                  bind:value={role.namespace} 
                  placeholder="default"
                  required
                />
              </div>
            </div>
            
            <!-- Multi-select fields -->
            <div class="space-y-6 mb-6">
              <!-- API Groups -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  API Groups <span class="text-gray-500 dark:text-gray-400 text-xs">(select multiple)</span>
                </label>
                <div class="flex flex-wrap gap-2">
                  {#each apiGroupOptions as apiGroup}
                    <button
                      type="button"
                      class={`px-3 py-1.5 text-sm rounded-full border ${role.apiGroups.includes(apiGroup) ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-200' : 'bg-gray-50 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200'}`}
                      on:click={() => role.apiGroups = toggleSelection(role.apiGroups, apiGroup)}
                    >
                      {apiGroup || '""'}
                    </button>
                  {/each}
                </div>
                {#if role.apiGroups.length === 0}
                  <p class="text-red-500 text-xs mt-1">Please select at least one API Group</p>
                {/if}
              </div>
              
              <!-- Resources -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Resources <span class="text-gray-500 dark:text-gray-400 text-xs">(select multiple)</span>
                </label>
                <div class="flex flex-wrap gap-2">
                  {#each resourceOptions as resource}
                    <button
                      type="button"
                      class={`px-3 py-1.5 text-sm rounded-full border ${role.resources.includes(resource) ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-200' : 'bg-gray-50 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200'}`}
                      on:click={() => role.resources = toggleSelection(role.resources, resource)}
                    >
                      {resource}
                    </button>
                  {/each}
                </div>
                {#if role.resources.length === 0}
                  <p class="text-red-500 text-xs mt-1">Please select at least one Resource</p>
                {/if}
              </div>
              
              <!-- Verbs -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Verbs <span class="text-gray-500 dark:text-gray-400 text-xs">(select multiple)</span>
                </label>
                <div class="flex flex-wrap gap-2">
                  {#each verbOptions as verb}
                    <button
                      type="button"
                      class={`px-3 py-1.5 text-sm rounded-full border ${role.verbs.includes(verb) ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-200' : 'bg-gray-50 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200'}`}
                      on:click={() => role.verbs = toggleSelection(role.verbs, verb)}
                    >
                      {verb}
                    </button>
                  {/each}
                </div>
                {#if role.verbs.length === 0}
                  <p class="text-red-500 text-xs mt-1">Please select at least one Verb</p>
                {/if}
              </div>
            </div>
            
            <!-- Service Account Association -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Associated Service Accounts <span class="text-gray-500 dark:text-gray-400 text-xs">(select multiple)</span>
              </label>
              
              {#if serviceAccounts.length === 0}
                <p class="text-amber-600 italic">No service accounts defined yet.</p>
              {:else}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {#each serviceAccounts as sa}
                    <div 
                      class={`p-2 border rounded-md cursor-pointer ${role.serviceAccountIds.includes(sa.id) ? 'bg-blue-100 border-blue-500 dark:bg-blue-900 dark:border-blue-600' : 'bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-600'}`}
                      on:click={() => toggleServiceAccountForRole(role.id, sa.id)}
                      role="checkbox"
                      aria-checked={role.serviceAccountIds.includes(sa.id)}
                      tabindex="0"
                      on:keypress={(e) => e.key === 'Enter' && toggleServiceAccountForRole(role.id, sa.id)}
                    >
                      <div class="flex items-center">
                        <input 
                          type="checkbox" 
                          class="mr-2" 
                          checked={role.serviceAccountIds.includes(sa.id)}
                          on:change={() => toggleServiceAccountForRole(role.id, sa.id)}
                        />
                        <span>
                          <span class="dark:text-white">{sa.name || '[Unnamed]'} {sa.namespace ? `(${sa.namespace})` : ''}</span>
                        </span>
                      </div>
                    </div>
                  {/each}
                </div>
                {#if role.serviceAccountIds.length === 0}
                  <p class="text-red-500 text-xs mt-1">Please select at least one Service Account</p>
                {/if}
              {/if}
            </div>
          </div>
        {/each}
        
        <div class="flex justify-center">
          <button 
            type="button" 
            class="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center"
            on:click={addRole}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
            </svg>
            Add Role
          </button>
        </div>
      </div>
    </div>
    
    <!-- Cluster Information Section -->
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 mt-8">
    <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Cluster Information</h2>
    <p class="text-gray-600 dark:text-gray-300 mb-6">Provide information about your Kubernetes cluster.</p>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Cluster Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1" for="cluster-name">
          Cluster Name
        </label>
        <input 
          type="text" 
          id="cluster-name"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
          bind:value={clusterName} 
          placeholder="kubernetes"
          required
        />
      </div>
      
      <!-- Server URL -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1" for="server-url">
          API Server URL
        </label>
        <input 
          type="text" 
          id="server-url"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
          bind:value={serverUrl} 
          placeholder="https://kubernetes.default.svc"
          required
        />
      </div>
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="mt-8 flex gap-4">
    <button 
      type="submit" 
      class="flex-1 px-4 py-3 bg-green-600 dark:bg-green-500 text-white font-medium rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
    >
      Generate Kubeconfig
    </button>
    <button 
      type="button" 
      class="flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
      on:click={downloadManifest}
    >
      Download Manifest
    </button>
  </div>
  </form>

  <!-- YAML Preview Section -->
  {#if showPreview}
    <div class="mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">YAML Generation</h2>
      
      <div class="bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-md p-4 mb-6">
        <h3 class="text-lg font-medium mb-2 text-amber-800 dark:text-amber-200">Coming Soon</h3>
        <p class="text-amber-700 dark:text-amber-300">The YAML generation feature will be implemented in a future update.</p>
      </div>
    </div>
  {/if}
</div>

<script lang="ts">
  import { getConfigValue } from '$lib/utils/configloader';
  import { getEnvValue } from '$lib/utils/envloader';
  import { apiGroups, resources, verbs, resourceGroups, verbGroups, apiGroupGroups } from '$lib/config/kubernetesOptions';
  export let data;
  
  // Add namespaces support
  let namespaces = [
    { id: 1, name: '' }
  ];
  
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
      serviceAccountIds: [],
      generateComments: true  // Adds comments to the generated YAML
    }
  ];
  
  // Track unique role names to support copying roles to different namespaces
  let roleTemplates = {}; // Will store roles by name for easy copying
  
  // Track which roles are collapsed
  let collapsedRoles = new Set();
  
  // Cluster configuration
  let clusterName = 'kubernetes';
  let serverUrl = 'https://kubernetes.default.svc';
  let showPreview = false;
  
  // YAML content variables
  let namespaceYAML = '';
  let serviceAccountYAML = '';
  let roleYAML = '';
  let roleBindingYAML = '';
  
  // Use imported options from the config file
  const apiGroupOptions = apiGroups;
  const resourceOptions = resources;
  const verbOptions = verbs;
  
  // resourceGroups and verbGroups are already imported from the config file
  
  // Function to generate YAML for manifest download
  function generateManifestYAML() {
    const yamlParts = [];
    
    // Reset YAML content variables
    let nsYAML = [];
    let saYAML = [];
    let rYAML = [];
    let rbYAML = [];
    
    // Generate namespace resources only for those with create checkbox checked
    const validNamespaces = namespaces.filter(ns => ns.name);
    validNamespaces.forEach(ns => {
      if (ns.create) {
        const nsYamlPart = `apiVersion: v1
kind: Namespace
metadata:
  name: ${ns.name}`;
        nsYAML.push(nsYamlPart);
        yamlParts.push(nsYamlPart);
        yamlParts.push('---');
      }
    });
    
    // Generate service account YAML
    const validServiceAccounts = serviceAccounts.filter(sa => sa.name && sa.namespace);
    validServiceAccounts.forEach((sa, index) => {
      const saYamlPart = `apiVersion: ${getConfigValue('SERVICE_ACCOUNT_APIVERSION') || 'v1'}
kind: ServiceAccount
metadata:
  name: ${sa.name}
  namespace: ${sa.namespace || 'default'}`;
      saYAML.push(saYamlPart);
      yamlParts.push(saYamlPart);
      
      yamlParts.push('---');
    });
    
    // Generate role YAML
    const validRoles = roles.filter(role => 
      role.name && role.namespace && role.apiGroups.length > 0 && 
      role.resources.length > 0 && role.verbs.length > 0
    );
    
    validRoles.forEach((role, index) => {
      let roleYamlPart = '';
      
      // Add comment if enabled
      if (role.generateComments) {
        roleYamlPart += `# Create a role for ${role.name} in ${role.namespace} namespace
`;
      }
      
      roleYamlPart += `apiVersion: ${getConfigValue('ROLE_APIVERSION') || 'rbac.authorization.k8s.io/v1'}
kind: Role
metadata:
  name: ${role.name}
  namespace: ${role.namespace || 'default'}
rules:
`;
      
      // Format API Groups properly handling wildcards
      const formattedApiGroups = role.apiGroups.includes('*') 
        ? '["*"]'  // If wildcard is selected, use only that
        : `["${role.apiGroups.join('", "')}"]`;
        
      // Format Resources properly handling wildcards  
      const formattedResources = role.resources.includes('*')
        ? '["*"]'  // If wildcard is selected, use only that
        : `["${role.resources.join('", "')}"]`;
        
      // Format Verbs properly handling wildcards
      const formattedVerbs = role.verbs.includes('*')
        ? '["*"]'  // If wildcard is selected, use only that
        : `["${role.verbs.join('", "')}"]`;
      
      roleYamlPart += `- apiGroups: ${formattedApiGroups}
  resources: ${formattedResources}
  verbs: ${formattedVerbs}`;
      rYAML.push(roleYamlPart);
      yamlParts.push(roleYamlPart);
      
      yamlParts.push('---');
      
      // Generate role binding YAML for each associated service account
      if (role.serviceAccountIds.length > 0) {
        const associatedSAs = serviceAccounts.filter(sa => role.serviceAccountIds.includes(sa.id));
        associatedSAs.forEach((sa, saIndex) => {
          if (sa.name && sa.namespace) {
            let localRoleBindingYAML = '';
            
            // Add comment if enabled
            if (role.generateComments) {
              localRoleBindingYAML = `# Bind the ${role.name} role in ${role.namespace} namespace to ${sa.name} service account
`;
            }
            
            localRoleBindingYAML += `apiVersion: ${getConfigValue('ROLE_BINDING_API_VERSION') || 'rbac.authorization.k8s.io/v1'}
kind: RoleBinding
metadata:
  name: ${role.name}-${sa.name}-binding
  namespace: ${role.namespace || 'default'}
subjects:
- kind: ServiceAccount
  name: ${sa.name}
  namespace: ${sa.namespace || 'default'}
roleRef:
  kind: Role
  name: ${role.name}
  apiGroup: rbac.authorization.k8s.io`;
            
            yamlParts.push(localRoleBindingYAML);
            rbYAML.push(localRoleBindingYAML);
          }
        });
      }
      
      if (index < validRoles.length - 1) {
        yamlParts.push('---');
      }
    });
    
    // Update the component variables with the generated YAML
    namespaceYAML = nsYAML.join('\n---\n');
    serviceAccountYAML = saYAML.join('\n---\n');
    roleYAML = rYAML.join('\n---\n');
    roleBindingYAML = rbYAML.join('\n---\n');
    
    return yamlParts.join('\n');
  }
  
  // Function to download manifest YAML
  function downloadManifest() {
    // Validate namespace entries
    const validNamespaces = namespaces.filter(ns => ns.name);
    if (validNamespaces.length === 0) {
      alert('Please add at least one valid namespace');
      return;
    }
    
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
    
    // Check if service accounts and roles reference valid namespaces
    const namespaceNames = new Set(validNamespaces.map(ns => ns.name));
    const invalidServiceAccounts = validSAEntries.filter(sa => !namespaceNames.has(sa.namespace));
    const invalidRoles = validRoleEntries.filter(role => !namespaceNames.has(role.namespace));
    
    if (invalidServiceAccounts.length > 0 || invalidRoles.length > 0) {
      alert('Some service accounts or roles reference namespaces that have not been defined. Please fix before downloading.');
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
  function addRole(templateName = '') {
    const newId = roles.length > 0 
      ? Math.max(...roles.map(role => role.id)) + 1 
      : 1;
    
    // If adding from a template, use that template's data
    let newRole = { 
      id: newId, 
      name: templateName, // Will be empty string if not using template
      namespace: '', 
      apiGroups: [],
      resources: [],
      verbs: [],
      serviceAccountIds: [],
      generateComments: false
    };
    
    // If adding from a template and template exists, copy data from template
    if (templateName && roleTemplates[templateName] && roleTemplates[templateName].length > 0) {
      const sourceRole = roleTemplates[templateName][0]; // Use the first role with this name as template
      newRole = {
        ...newRole,
        apiGroups: [...sourceRole.apiGroups],
        resources: [...sourceRole.resources],
        verbs: [...sourceRole.verbs],
        generateComments: sourceRole.generateComments
      };
    }
    
    roles = [...roles, newRole];
  }
  
  function removeRole(id: number) {
    const roleToRemove = roles.find(r => r.id === id);
    if (roleToRemove) {
      // Remove from role templates if it exists there
      if (roleToRemove.name && roleTemplates[roleToRemove.name]) {
        const roleTemplateIndex = roleTemplates[roleToRemove.name].findIndex(r => r.id === id);
        if (roleTemplateIndex >= 0) {
          roleTemplates[roleToRemove.name].splice(roleTemplateIndex, 1);
        }
        // If no more roles with this template name, remove the template
        if (roleTemplates[roleToRemove.name].length === 0) {
          delete roleTemplates[roleToRemove.name];
        }
      }
    }
    
    roles = roles.filter(r => r.id !== id);
    if (roles.length === 0) {
      addRole(); // Always keep at least one entry
    }
  }
  
  // Namespace functions
  function addNamespace() {
    namespaces = [...namespaces, { id: Date.now().toString(), name: '', create: true }];
  }

  function removeNamespace(id) {
    namespaces = namespaces.filter(ns => ns.id !== id);
  }
  
  // Update role name and track in templates
  function updateRoleName(role, newName) {
    const oldName = role.name;
    
    // If the role had a previous name, remove it from that template group
    if (oldName && roleTemplates[oldName]) {
      const index = roleTemplates[oldName].findIndex(r => r.id === role.id);
      if (index >= 0) {
        roleTemplates[oldName].splice(index, 1);
      }
      // Clean up empty template groups
      if (roleTemplates[oldName].length === 0) {
        delete roleTemplates[oldName];
      }
    }
    
    // Update the role's name
    role.name = newName;
    
    // Add to the new template group if name is not empty
    if (newName) {
      if (!roleTemplates[newName]) {
        roleTemplates[newName] = [];
      }
      
      // Only add if not already in the group
      const alreadyInGroup = roleTemplates[newName].some(r => r.id === role.id);
      if (!alreadyInGroup) {
        roleTemplates[newName].push(role);
      }
    }
  }
  
  // Toggle selection in multi-select
  function toggleSelection(array, item) {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  }
  
  // Toggle role collapse state
  function toggleRoleCollapse(roleId: number) {
    if (collapsedRoles.has(roleId)) {
      collapsedRoles.delete(roleId);
    } else {
      collapsedRoles.add(roleId);
    }
    collapsedRoles = new Set(collapsedRoles); // Force reactivity update
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
    // Validate namespace entries
    const validNamespaces = namespaces.filter(ns => ns.name);
    if (validNamespaces.length === 0) {
      alert('Please add at least one valid namespace');
      return;
    }
    
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
  <title>RBAC Manifest Generator - Configuration</title>
</svelte:head>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">RBAC Manifest Generator</h1>
  

  
  <form on:submit|preventDefault={handleSubmit} class="space-y-8">
    <!-- Namespaces Section -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Namespace Configuration</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-6">Add namespaces that will be created as part of your Kubernetes manifest.</p>
      
      <div class="space-y-4">
        {#each namespaces as ns (ns.id)}
          <div class="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div class="flex-grow">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1" for={`namespace-name-${ns.id}`}>
                Namespace Name
              </label>
              <div class="flex space-x-4">
                <div class="flex-grow">
                  <input
                    type="text" 
                    id={`namespace-name-${ns.id}`}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
                    bind:value={ns.name}
                    placeholder="my-namespace"
                    required
                  />
                </div>
                <div class="flex items-center">
                  <label class="inline-flex items-center cursor-pointer">
                    <input type="checkbox" bind:checked={ns.create} class="sr-only peer">
                    <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Create Namespace</span>
                  </label>
                </div>
              </div>
            </div>
            
            {#if namespaces.length > 1}
              <div class="flex items-end md:pb-2">
                <button 
                  type="button" 
                  class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  on:click={() => removeNamespace(ns.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            {/if}
          </div>
        {/each}
        
        <div class="flex justify-center">
          <button 
            type="button" 
            class="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center"
            on:click={addNamespace}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
            </svg>
            Add Namespace
          </button>
        </div>
      </div>
    </div>
    
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
              <select
                id={`namespace-${sa.id}`}
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                bind:value={sa.namespace}
                required
              >
                <option value="" disabled>Select a namespace</option>
                {#each namespaces as ns}
                  {#if ns.name}
                    <option value={ns.name}>{ns.name}</option>
                  {/if}
                {/each}
              </select>
            </div>
            
            <div class="flex items-end">
              <button 
                type="button" 
                class="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors"
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
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">RBAC Role Configuration</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-6">Define role-based access control permissions for your service accounts.</p>
      
      <!-- Role Templates Section -->
      {#if Object.keys(roleTemplates).length > 0}
        <div class="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
          <h3 class="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Role Templates</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Create a new role based on an existing template:</p>
          
          <div class="flex flex-wrap gap-2">
            {#each Object.keys(roleTemplates) as templateName}
              <button 
                type="button" 
                class="px-3 py-1.5 text-sm font-medium rounded-full border border-green-500 bg-green-100 text-green-800 dark:bg-green-900 dark:border-green-600 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800"
                on:click={() => addRole(templateName)}
              >
                Use "{templateName}" Template
              </button>
            {/each}
          </div>
          
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Using a template will copy all permissions but you'll need to select a namespace and service accounts.</p>
        </div>
      {/if}
      
      <div class="space-y-8">
        {#each roles as role (role.id)}
          <div class="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700">
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center">
                <button 
                  type="button"
                  class="mr-2 focus:outline-none transition-transform duration-200 ease-in-out"
                  on:click={() => toggleRoleCollapse(role.id)}
                  aria-label={collapsedRoles.has(role.id) ? 'Expand role' : 'Collapse role'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400 transform transition-transform duration-200 {collapsedRoles.has(role.id) ? '-rotate-90' : 'rotate-0'}" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">Role #{role.id}</h3>
              </div>
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
            
            {#if !collapsedRoles.has(role.id)}
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
                  value={role.name}
                  on:input={(e) => updateRoleName(role, e.target.value)}
                  placeholder="viewer-role"
                  required
                />
              </div>
              
              <!-- Namespace -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1" for={`role-namespace-${role.id}`}>
                  Namespace
                </label>
                <select
                  id={`role-namespace-${role.id}`}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  bind:value={role.namespace}
                  required
                >
                  <option value="" disabled>Select a namespace</option>
                  {#each namespaces as ns}
                    {#if ns.name}
                      <option value={ns.name}>{ns.name}</option>
                    {/if}
                  {/each}
                </select>
              </div>
            </div>
            
            <!-- Options section -->
            <div class="mb-4">
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id={`generate-comments-${role.id}`}
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" 
                  bind:checked={role.generateComments} 
                />
                <label for={`generate-comments-${role.id}`} class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Generate comments in YAML
                </label>
              </div>
            </div>
            
            <!-- Multi-select fields -->
            <div class="space-y-6 mb-6">
              <!-- API Groups -->
              <div>
                <div class="flex items-center mb-2">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-200">
                    API Groups <span class="text-gray-500 dark:text-gray-400 text-xs">(select multiple)</span>
                  </label>
                  <button 
                    type="button" 
                    class="ml-2 text-red-500 hover:text-red-700"
                    on:click={() => role.apiGroups = []}
                    title="Clear all selected API groups"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div class="flex flex-wrap gap-2 mb-2">
                  <!-- API group quick selection -->
                  {#each Object.entries(apiGroupGroups) as [key, group]}
                    <button 
                      type="button"
                      class="px-3 py-1.5 text-sm font-medium rounded-full border border-purple-500 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:border-purple-600 dark:text-purple-200"
                      on:click={() => role.apiGroups = [...group.values]}
                    >
                      {group.name}
                    </button>
                  {/each}
                </div>
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
                <div class="flex items-center mb-2">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Resources <span class="text-gray-500 dark:text-gray-400 text-xs">(select multiple)</span>
                  </label>
                  <button 
                    type="button" 
                    class="ml-2 text-red-500 hover:text-red-700"
                    on:click={() => role.resources = []}
                    title="Clear all selected resources"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div class="flex flex-wrap gap-2 mb-2">
                  <!-- Resource group quick selection -->
                  {#each Object.entries(resourceGroups) as [key, group]}
                    <button 
                      type="button"
                      class="px-3 py-1.5 text-sm font-medium rounded-full border border-purple-500 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:border-purple-600 dark:text-purple-200"
                      on:click={() => role.resources = [...group.values]}
                    >
                      {group.name}
                    </button>
                  {/each}
                </div>
                <div class="flex flex-wrap gap-2">
                  {#each resourceOptions as resource}
                    <button
                      type="button"
                      class={`px-3 py-1.5 text-sm rounded-full border ${role.resources.includes(resource) ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-200' : 'bg-gray-50 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200'}`}
                      on:click={() => role.resources = toggleSelection(role.resources, resource)}
                    >
                      {resource || '""'}
                    </button>
                  {/each}
                </div>
                {#if role.resources.length === 0}
                  <p class="text-red-500 text-xs mt-1">Please select at least one Resource</p>
                {/if}
              </div>
              
              <!-- Verbs -->
              <div>
                <div class="flex items-center mb-2">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Verbs <span class="text-gray-500 dark:text-gray-400 text-xs">(select multiple)</span>
                  </label>
                  <button 
                    type="button" 
                    class="ml-2 text-red-500 hover:text-red-700"
                    on:click={() => role.verbs = []}
                    title="Clear all selected verbs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div class="flex flex-wrap gap-2 mb-2">
                  <!-- Verb group quick selection -->
                  {#each Object.entries(verbGroups) as [key, group]}
                    <button 
                      type="button"
                      class="px-3 py-1.5 text-sm font-medium rounded-full border border-purple-500 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:border-purple-600 dark:text-purple-200"
                      on:click={() => role.verbs = [...group.values]}
                    >
                      {group.name}
                    </button>
                  {/each}
                </div>
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
            {/if}
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
  <!-- Action Buttons -->
  <div class="mt-8 flex gap-4">
    <button 
      type="button" 
      class="flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
      on:click={downloadManifest}
    >
      Download Manifest
    </button>
  </div>
  </form>

  <!-- YAML Preview Modal -->
  {#if showPreview}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto m-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">YAML Preview</h2>
          <button 
            on:click={() => showPreview = false} 
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="flex justify-between items-center mb-6">
          <button 
            on:click={applyToCluster} 
            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400 dark:bg-green-500 dark:hover:bg-green-600 transition-colors flex items-center"
            disabled={isApplying}
          >
            {#if isApplying}
              <span class="inline-block animate-spin mr-2">⏳</span>
              Applying to Cluster...
            {:else}
              Apply to Cluster
            {/if}
          </button>
          
          {#if kubeconfig}
            <a 
              href={`data:text/yaml;charset=utf-8,${encodeURIComponent(kubeconfig)}`} 
              download={kubeconfigDownloadName}
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              Download Kubeconfig
            </a>
          {/if}
        </div>
        
        {#if applyError}
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 dark:bg-red-900 dark:border-red-700 dark:text-red-100">
            <p><strong>Error:</strong> {applyError}</p>
          </div>
        {/if}
        
        {#if applySuccess}
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 dark:bg-green-900 dark:border-green-700 dark:text-green-100">
            <p><strong>Success:</strong> RBAC resources have been applied to the cluster!</p>
          </div>
        {/if}
        
        <!-- YAML Sections -->
        <div class="space-y-6">
          <!-- Namespaces -->
          <div>
            <h3 class="text-lg font-medium mb-2 text-gray-900 dark:text-white">Namespaces</h3>
            <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-xs">{namespaceYAML}</pre>
          </div>
          
          <!-- Service Accounts -->
          <div>
            <h3 class="text-lg font-medium mb-2 text-gray-900 dark:text-white">Service Accounts</h3>
            <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-xs">{serviceAccountYAML}</pre>
          </div>
          
          <!-- Roles -->
          <div>
            <h3 class="text-lg font-medium mb-2 text-gray-900 dark:text-white">Roles</h3>
            <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-xs">{roleYAML}</pre>
          </div>
          
          <!-- Role Bindings -->
          <div>
            <h3 class="text-lg font-medium mb-2 text-gray-900 dark:text-white">Role Bindings</h3>
            <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-xs">{roleBindingYAML}</pre>
          </div>
        </div>
        
        <!-- Kubeconfig Preview if available -->
        {#if kubeconfig}
          <div class="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600">
            <h3 class="text-lg font-medium mb-2 text-gray-900 dark:text-white">Generated Kubeconfig</h3>
            <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-xs">{kubeconfig}</pre>
          </div>
        {/if}
        
        <div class="text-center mt-6">
          <button 
            on:click={() => showPreview = false}
            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 transition-colors">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

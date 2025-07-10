/**
 * Kubernetes configuration options
 * This file contains all configuration values and options used throughout the application
 */

// API Group Options
export const apiGroups = [
  '*', // Wildcard to select all API groups
  '', 
  'apps', 
  'batch', 
  'extensions', 
  'networking.k8s.io', 
  'rbac.authorization.k8s.io', 
  'storage.k8s.io', 
  'apiextensions.k8s.io', 
  'policy'
];

// Resource Options
export const resources = [
  '*', // Wildcard to select all resources
  'pods', 
  'deployments', 
  'services', 
  'configmaps', 
  'secrets', 
  'namespaces', 
  'persistentvolumes', 
  'persistentvolumeclaims', 
  'nodes', 
  'ingresses', 
  'jobs', 
  'cronjobs', 
  'statefulsets', 
  'daemonsets', 
  'replicasets',
  'componentstatuses', 
  'endpoints', 
  'horizontalpodautoscalers', 
  'limitranges',
  'resourcequotas', 
  'replicationcontrollers', 
  'serviceaccounts', 
  'events'
];

// Verbs Options
export const verbs = [
  'get', 
  'list', 
  'watch', 
  'create', 
  'update', 
  'patch', 
  'delete',
  '*' // Wildcard for all verbs
];

// Resource Groups for quick selection
export const resourceGroups = {
  "readonly": {
    name: "Read Only Resources",
    values: [
      'configmaps', 
      'endpoints', 
      'persistentvolumeclaims', 
      'pods', 
      'secrets', 
      'replicasets', 
      'replicationcontrollers', 
      'serviceaccounts', 
      'services'
    ]
  },
  "full-access": {
    name: "Full Access Resources",
    values: [
      'componentstatuses', 
      'configmaps', 
      'daemonsets', 
      'deployments', 
      'events', 
      'endpoints', 
      'horizontalpodautoscalers', 
      'ingress', 
      'jobs', 
      'limitranges', 
      'pods', 
      'resourcequotas', 
      'replicasets', 
      'replicationcontrollers'
    ]
  }
};

// Verb Groups for quick selection
export const verbGroups = {
  "readonly": {
    name: "Read Only Verbs",
    values: ['get', 'list', 'watch']
  },
  "readwrite": {
    name: "Read/Write Verbs",
    values: ['get', 'list', 'watch', 'create', 'update', 'patch', 'delete']
  }
};

// API Groups categorized for quick selection
export const apiGroupGroups = {
  "core": {
    name: "Core API Groups",
    values: ['', 'apps', 'batch']
  },
  "rbac": {
    name: "RBAC & Security",
    values: ['rbac.authorization.k8s.io', 'policy']
  },
  "infrastructure": {
    name: "Infrastructure & Storage",
    values: ['networking.k8s.io', 'storage.k8s.io', 'extensions']
  }
};

// Environment variables
export const envConfig = {
  ROLE_APIVERSION: 'rbac.authorization.k8s.io/v1',
  ROLE_KIND: 'Role',
  ROLE_BINDING_API_VERSION: 'rbac.authorization.k8s.io/v1',
  ROLE_BINDING_KIND: 'RoleBinding',
  SERVICE_ACCOUNT_APIVERSION: 'v1',
  SERVICE_ACCOUNT_KIND: 'ServiceAccount'
};

<script lang="ts">
	// Add dark mode support
	import { onMount } from 'svelte';
	import { darkMode } from '$lib/stores/theme';

	// Icons for features
	let mounted = false;

	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>Kubernetes Manifest Generator</title>
	<meta name="description" content="A tool for generating Kubernetes RBAC manifest files" />
</svelte:head>

<section class="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
	<div class="text-center mb-16">
		<h1 class="text-4xl md:text-5xl font-bold mb-4 text-blue-600 dark:text-blue-400">
			Kubernetes Manifest Generator
		</h1>
		<p class="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
			Easily generate Kubernetes RBAC manifests with namespaces, service accounts, roles and role bindings
		</p>
	</div>

	<div class="grid md:grid-cols-3 gap-8 mb-16">
		<!-- Feature 1 -->
		<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
			<div class="text-blue-500 dark:text-blue-400 mb-4">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
				</svg>
			</div>
			<h3 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Service Account Management</h3>
			<p class="text-gray-600 dark:text-gray-300">Create and configure multiple service accounts with specific namespaces, then link them to appropriate roles.</p>
		</div>

		<!-- Feature 2 -->
		<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
			<div class="text-blue-500 dark:text-blue-400 mb-4">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
				</svg>
			</div>
			<h3 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white">RBAC Role Configuration</h3>
			<p class="text-gray-600 dark:text-gray-300">Define precise roles with wildcards, resource groups, and template duplication across namespaces to follow the principle of least privilege.</p>
		</div>

		<!-- Feature 3 -->
		<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
			<div class="text-blue-500 dark:text-blue-400 mb-4">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
				</svg>
			</div>
			<h3 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Namespace Management</h3>
			<p class="text-gray-600 dark:text-gray-300">Create and manage namespaces with fine-grained control over which ones to include in your final YAML manifest.</p>
		</div>
	</div>

	<div class="text-center">
		<a href="/config" class="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors dark:bg-blue-700 dark:hover:bg-blue-800 !text-white">
			Start Creating Manifests
		</a>
	</div>
</section>

<style>
	section {
		min-height: calc(100vh - 64px);
	}

	/* Responsive tweaks */
	@media (max-width: 768px) {
		.grid {
			gap: 1rem;
		}
	}
</style>

<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { darkMode } from '$lib/stores/theme';
	import { base } from '$app/paths';
	import '../app.css';

	// Import GitHub Pages SPA redirect handler
	import '$lib/gh-pages-spa-redirect.js';

export const prerender = true;

export const trailingSlash = "always";

	let { children } = $props();

	// Update document class when dark mode changes
	$effect(() => {
		if (typeof document !== 'undefined') {
			if ($darkMode) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	});
</script>

<div class="app dark:bg-gray-900">
	<header class="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-sm">
		<div>
			<h1 class="text-xl font-bold text-gray-900 dark:text-white">Kubernetes Manifest Generator</h1>
		</div>
		<div class="flex items-center gap-4">
			<nav>
				<ul class="flex gap-4">
					<li><a href="{base}/" class="text-blue-600 dark:text-blue-400 hover:underline">Home</a></li>
					<li><a href="{base}/config" class="text-blue-600 dark:text-blue-400 hover:underline">RBAC</a></li>
				</ul>
			</nav>
			<ThemeToggle />
		</div>
	</header>

	<main class="dark:bg-gray-900 dark:text-white">
		{@render children()}
	</main>

	<!-- Footer content removed -->
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	/* Remove unused footer styles to clear warnings */
</style>

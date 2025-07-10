/**
 * GitHub Pages SPA redirect handler
 * 
 * This script handles redirects from the 404.html page for GitHub Pages
 * It must be imported in a client-side component (like +layout.svelte)
 */

// Only run this script in the browser
if (typeof window !== 'undefined') {
  // Check if we have a redirect parameter from our 404.html page
  const url = new URL(window.location.href);
  const redirectTo = url.searchParams.get('redirect');
  
  if (redirectTo) {
    // Remove the redirect parameter from the URL
    url.searchParams.delete('redirect');
    
    // Strip any leading slash
    const cleanRedirect = redirectTo.replace(/^\//, '');
    
    // Update the URL without causing a page reload
    window.history.replaceState(null, null, cleanRedirect || '/');
  }
}

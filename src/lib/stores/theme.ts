import { browser } from '$app/environment';
import { writable } from 'svelte/store';

// Function to get system preference for dark mode
function getSystemPreference(): boolean {
  if (browser) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

// Function to get the stored theme preference
function getStoredThemePreference(): boolean | null {
  if (browser) {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      return stored === 'true';
    }
  }
  return null;
}

// Initialize the dark mode value
function createDarkMode() {
  // Check stored preference first, then system preference
  const initialValue = getStoredThemePreference() ?? getSystemPreference();
  
  const { subscribe, set, update } = writable<boolean>(initialValue);
  
  // Apply initial theme to document
  if (browser && typeof document !== 'undefined') {
    if (initialValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  
  return {
    subscribe,
    toggle: () => update(darkMode => {
      const newValue = !darkMode;
      if (browser) {
        localStorage.setItem('darkMode', String(newValue));
        
        // Apply theme change immediately to document
        if (newValue) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return newValue;
    }),
    set: (value: boolean) => {
      if (browser) {
        localStorage.setItem('darkMode', String(value));
        
        // Apply theme change immediately to document
        if (value) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      set(value);
    }
  };
}

export const darkMode = createDarkMode();

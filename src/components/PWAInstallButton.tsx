import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    // Check if app is already installed (running in standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Debug information
    const userAgent = navigator.userAgent;
    const isHttps = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost';

    setDebugInfo(`HTTPS: ${isHttps}, Localhost: ${isLocalhost}, Standalone: ${standalone}, UA: ${userAgent.includes('Chrome') ? 'Chrome' : 'Other'}`);

    const handler = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show button for testing if on localhost or https and not standalone
    if ((isHttps || isLocalhost) && !standalone) {
      // Give some time for the beforeinstallprompt to fire, if it doesn't, show anyway for testing
      setTimeout(() => {
        if (!deferredPrompt) {
          console.log('No beforeinstallprompt event, but showing button for testing');
          setShowInstallButton(true);
        }
      }, 2000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallButton(false);
      }
    } else {
      // Fallback: provide instructions for manual installation
      alert('To install this app:\n\n• Chrome: Click the three dots menu → "Install Simple POS"\n• Safari: Click share button → "Add to Home Screen"\n• Edge: Click the three dots menu → "Apps" → "Install this site as an app"');
    }
  };

  if (isStandalone) {
    return null; // Don't show if already installed
  }

  if (!showInstallButton) {
    return (
      <div className="text-xs text-gray-500 max-w-xs" title={debugInfo}>
        PWA: {debugInfo.substring(0, 50)}...
      </div>
    );
  }

  return (
    <button
      onClick={() => void handleInstallClick()}
      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
      title="Install app"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m9-9l-9-9-9 9" />
      </svg>
      Install App
    </button>
  );
}

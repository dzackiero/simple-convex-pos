import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAUpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered:', r?.scope || 'No registration')
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error)
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setUpdateAvailable(true);
    }
  }, [needRefresh]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setUpdateAvailable(false);
  };

  const updateApp = () => {
    void updateServiceWorker(true);
  };

  if (!offlineReady && !needRefresh && !updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
      {offlineReady && (
        <div className="mb-2">
          <p className="text-sm font-medium">App ready to work offline</p>
          <button
            onClick={close}
            className="mt-2 text-xs bg-blue-500 hover:bg-blue-400 px-2 py-1 rounded"
          >
            OK
          </button>
        </div>
      )}

      {updateAvailable && (
        <div>
          <p className="text-sm font-medium">New content available</p>
          <p className="text-xs text-blue-100 mb-2">Click reload to update</p>
          <div className="flex gap-2">
            <button
              onClick={updateApp}
              className="text-xs bg-green-600 hover:bg-green-500 px-2 py-1 rounded"
            >
              Reload
            </button>
            <button
              onClick={close}
              className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
            >
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo } from 'react';
import { Navigate, Route, Routes, HashRouter } from 'react-router-dom';
import { retrieveLaunchParams, useSignal, isMiniAppDark } from '@telegram-apps/sdk-react';
import { AppRoot } from '@telegram-apps/telegram-ui';

import { routes } from '@/navigation/routes.tsx';

export function App() {
  const lp = useMemo(() => retrieveLaunchParams(), []);
  const isDark = useSignal(isMiniAppDark);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();       // Tell Telegram we’re ready
      tg.expand();      // Expand to full height (removes bottom padding)
    }
  }, []);

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'}
    >
      <HashRouter>
        <Routes>
          {routes.map((route) => <Route key={route.path} {...route} />)}
          <Route path="*" element={<Navigate to="/"/>}/>
        </Routes>
      </HashRouter>
    </AppRoot>
  );
}

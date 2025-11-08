import React, { createContext, useContext, useMemo, useState } from 'react';

export type Platform = 'instagram' | 'tiktok' | 'linkedin' | 'youtube' | undefined;

type AppState = {
  platform: Platform;
  setPlatform: (p: Platform) => void;
};

const Ctx = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [platform, setPlatform] = useState<Platform>(undefined);
  const value = useMemo(() => ({ platform, setPlatform }), [platform]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useApp = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
};

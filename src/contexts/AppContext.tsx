import React, { createContext, useContext, useMemo } from "react";
type AppUser = { id: string } | null;
const Ctx = createContext<{ user: AppUser }>({ user: null });
export function AppProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => ({ user: { id: "demo" } }), []);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useApp(){ return useContext(Ctx); }
export default AppProvider;

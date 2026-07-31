"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface NavigationGuardContextType {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType>({
  isDirty: false,
  setDirty: () => {},
});

export function NavigationGuardProvider({ children }: { children: React.ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);
  const setDirty = useCallback((dirty: boolean) => setIsDirty(dirty), []);

  return (
    <NavigationGuardContext.Provider value={{ isDirty, setDirty }}>
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}

import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lastGenerated, setLastGenerated] = useState(null);

  return (
    <AppContext.Provider value={{ lastGenerated, setLastGenerated }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

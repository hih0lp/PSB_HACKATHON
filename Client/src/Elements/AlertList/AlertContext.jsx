// contexts/AlertContext.js
import { createContext, useContext, useState } from 'react';

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [isAlertOpened, setIsAlertOpened] = useState(false);

  return (
    <AlertContext.Provider value={{ isAlertOpened, setIsAlertOpened }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
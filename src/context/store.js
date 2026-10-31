import { createContext, useContext } from 'react';

export const DataContext = createContext();
export const useData = () => useContext(DataContext);

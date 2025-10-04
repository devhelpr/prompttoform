import React, {
  createContext,
  useContext,
  useRef,
  ReactNode,
  useCallback,
} from 'react';

interface CalculatedValuesContextValue {
  setCalculatedValue: (fieldId: string, value: any) => void;
  getCalculatedValues: () => Record<string, any>;
  clearCalculatedValues: () => void;
}

const CalculatedValuesContext = createContext<
  CalculatedValuesContextValue | undefined
>(undefined);

export const CalculatedValuesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const calculatedValuesRef = useRef<Record<string, any>>({});

  const setCalculatedValue = useCallback((fieldId: string, value: any) => {
    calculatedValuesRef.current[fieldId] = value;
  }, []);

  const getCalculatedValues = useCallback(() => {
    return { ...calculatedValuesRef.current };
  }, []);

  const clearCalculatedValues = useCallback(() => {
    calculatedValuesRef.current = {};
  }, []);

  const value: CalculatedValuesContextValue = {
    setCalculatedValue,
    getCalculatedValues,
    clearCalculatedValues,
  };

  return (
    <CalculatedValuesContext.Provider value={value}>
      {children}
    </CalculatedValuesContext.Provider>
  );
};

export const useCalculatedValues = (): CalculatedValuesContextValue => {
  const context = useContext(CalculatedValuesContext);
  if (context === undefined) {
    throw new Error(
      'useCalculatedValues must be used within a CalculatedValuesProvider'
    );
  }
  return context;
};

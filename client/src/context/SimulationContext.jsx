import { createContext, useContext, useState, useEffect } from 'react';

const SimulationContext = createContext();

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

export const SimulationProvider = ({ children }) => {
  // Initialize state from sessionStorage if available
  const [simulationState, setSimulationState] = useState(() => {
    try {
      const saved = sessionStorage.getItem('simulationState');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading simulation state:', error);
    }
    return {
      uploadedImage: null,
      resultImage: null,
      haircut: 'Random',
      hairColor: 'Random',
      gender: 'male',
      aiModel: 'replicate',
      useCustomHaircut: false,
      useCustomHairColor: false,
      isSaved: false,
    };
  });

  // Save to sessionStorage whenever state changes
  useEffect(() => {
    try {
      sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
    } catch (error) {
      console.error('Error saving simulation state:', error);
    }
  }, [simulationState]);

  // Update specific fields
  const updateSimulation = (updates) => {
    setSimulationState(prev => ({ ...prev, ...updates }));
  };

  // Clear all simulation state
  const clearSimulation = () => {
    setSimulationState({
      uploadedImage: null,
      resultImage: null,
      haircut: 'Random',
      hairColor: 'Random',
      gender: 'male',
      aiModel: 'replicate',
      useCustomHaircut: false,
      useCustomHairColor: false,
      isSaved: false,
    });
    sessionStorage.removeItem('simulationState');
  };

  return (
    <SimulationContext.Provider value={{ simulationState, updateSimulation, clearSimulation }}>
      {children}
    </SimulationContext.Provider>
  );
};

export default SimulationContext;

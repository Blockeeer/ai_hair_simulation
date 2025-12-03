import { createContext, useContext, useState, useEffect } from 'react';

const SimulationContext = createContext();

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

const defaultState = {
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

export const SimulationProvider = ({ children }) => {
  // Initialize state from sessionStorage if available
  const [simulationState, setSimulationState] = useState(() => {
    try {
      const saved = sessionStorage.getItem('simulationState');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that we have valid data, merge with defaults
        return {
          ...defaultState,
          ...parsed,
          // Ensure images are either valid base64 strings or null
          uploadedImage: parsed.uploadedImage && parsed.uploadedImage.startsWith('data:') ? parsed.uploadedImage : null,
          resultImage: parsed.resultImage && parsed.resultImage.startsWith('data:') ? parsed.resultImage : null,
        };
      }
    } catch (error) {
      console.error('Error loading simulation state:', error);
      // Clear corrupted data
      sessionStorage.removeItem('simulationState');
    }
    return defaultState;
  });

  // Save to sessionStorage whenever state changes
  useEffect(() => {
    try {
      sessionStorage.setItem('simulationState', JSON.stringify(simulationState));
    } catch (error) {
      console.error('Error saving simulation state:', error);
      // If storage is full (quota exceeded), try saving without images
      if (error.name === 'QuotaExceededError') {
        try {
          const stateWithoutImages = {
            ...simulationState,
            uploadedImage: null,
            resultImage: null,
          };
          sessionStorage.setItem('simulationState', JSON.stringify(stateWithoutImages));
        } catch (e) {
          console.error('Could not save even without images:', e);
        }
      }
    }
  }, [simulationState]);

  // Update specific fields
  const updateSimulation = (updates) => {
    setSimulationState(prev => ({ ...prev, ...updates }));
  };

  // Clear all simulation state
  const clearSimulation = () => {
    setSimulationState(defaultState);
    sessionStorage.removeItem('simulationState');
  };

  return (
    <SimulationContext.Provider value={{ simulationState, updateSimulation, clearSimulation }}>
      {children}
    </SimulationContext.Provider>
  );
};

export default SimulationContext;

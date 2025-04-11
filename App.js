import React, { useState } from 'react';
import { 
  Box
} from '@chakra-ui/react';
import Dashboard from './components/Dashboard/Dashboard';
import FileConverter from './components/FileConverter/FileConverter';
import ChemistryLab from './components/ChemistryLab/ChemistryLab';

const App = () => {
  const [activeTool, setActiveTool] = useState(null);

  const handleToolSelect = (tool) => {
    setActiveTool(tool);
  };

  const handleBack = () => {
    setActiveTool(null);
  };

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'fileConverter':
        return <FileConverter onBack={handleBack} />;
      case 'chemistryLab':
        return <ChemistryLab onBack={handleBack} />;
      // Add more tools as they are developed
      default:
        return <Dashboard onToolSelect={handleToolSelect} />;
    }
  };

  return (
    <Box>
      {renderActiveTool()}
    </Box>
  );
};

export default App;
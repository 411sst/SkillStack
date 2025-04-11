// src/components/ChemistryLab/ChemistryLab.js
import React, { useState } from 'react';
import { 
  Box, VStack, Heading, Text, Tabs, TabList, TabPanels, Tab, TabPanel,
  Grid, GridItem, useColorModeValue, Flex, Button
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import PeriodicTable from './PeriodicTable';
import MoleculeViewer from './MoleculeViewer';
import ReactionSimulator from './ReactionSimulator';
import VirtualExperiments from './VirtualExperiments';

const ChemistryLab = ({ onBack }) => {
  const [activeElement, setActiveElement] = useState(null);
  const [activeMolecule, setActiveMolecule] = useState(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const handleElementSelect = (element) => {
    setActiveElement(element);
    console.log(`Selected element: ${element.name} (${element.symbol})`);
  };
  
  const handleMoleculeSelect = (molecule) => {
    setActiveMolecule(molecule);
  };
  
  return (
    <VStack spacing={6} align="stretch">
      <Flex align="center" justify="space-between">
        <Button 
          leftIcon={<ArrowBackIcon />} 
          variant="ghost" 
          onClick={onBack}
        >
          Back to Dashboard
        </Button>
        <Heading size="lg" flex={1} textAlign="center">Virtual Chemistry Lab</Heading>
      </Flex>
      
      <Text px={6}>Explore chemical elements, molecules, and reactions in this interactive lab</Text>
      
      <Tabs variant="enclosed" colorScheme="blue" isLazy>
        <TabList>
          <Tab>Periodic Table</Tab>
          <Tab>Molecule Viewer</Tab>
          <Tab>Reaction Simulator</Tab>
          <Tab>Virtual Experiments</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <Box 
              bg={bgColor}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
              p={4}
              shadow="sm"
            >
              <PeriodicTable onElementSelect={handleElementSelect} />
            </Box>
          </TabPanel>
          
          <TabPanel>
            <Box 
              bg={bgColor}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
              p={4}
              shadow="sm"
            >
              <MoleculeViewer
                molecule={activeMolecule}
                onMoleculeSelect={handleMoleculeSelect}
              />
            </Box>
          </TabPanel>
          
          <TabPanel>
            <Box 
              bg={bgColor}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
              p={4}
              shadow="sm"
            >
              <ReactionSimulator />
            </Box>
          </TabPanel>
          
          <TabPanel>
            <Box 
              bg={bgColor}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
              p={4}
              shadow="sm"
            >
              <VirtualExperiments />
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};

export default ChemistryLab;
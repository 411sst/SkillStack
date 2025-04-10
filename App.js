import React, { useState } from 'react';
import { 
  Box, Flex, VStack, Heading, IconButton, Drawer, 
  DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, 
  DrawerCloseButton, useDisclosure
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import FileConverter from './components/FileConverter/FileConverter';
import ChemistryLab from './components/ChemistryLab/ChemistryLab';
import Navigation from './components/Navigation/Navigation';

const App = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeTool, setActiveTool] = useState('fileConverter');

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'fileConverter':
        return <FileConverter />;
      case 'chemistryLab':
        return <ChemistryLab />;
      // Future tools will be added here
      default:
        return <FileConverter />;
    }
  };

  return (
    <Box h="100vh">
      <Flex as="header" align="center" justify="space-between" p={4} bg="brand.500" color="white">
        <Flex align="center">
          <IconButton
            icon={<HamburgerIcon />}
            variant="outline"
            onClick={onOpen}
            aria-label="Open menu"
            mr={4}
          />
          <Heading size="md">Skill Stack</Heading>
        </Flex>
      </Flex>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Tools</DrawerHeader>
          <DrawerBody>
            <Navigation 
              activeTool={activeTool} 
              setActiveTool={(tool) => {
                setActiveTool(tool);
                onClose();
              }} 
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Box as="main" p={6} h="calc(100vh - 72px)" overflowY="auto">
        {renderActiveTool()}
      </Box>
    </Box>
  );
};

export default App;
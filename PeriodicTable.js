// src/components/ChemistryLab/PeriodicTable.js
import React, { useState } from 'react';
import {
  Box, Grid, GridItem, Text, Flex, Badge, 
  useColorModeValue, Tooltip, HStack, Select,
  Input, InputGroup, InputLeftElement, Card, CardBody,
  CardHeader, Divider, Heading, Stat, StatLabel, 
  StatNumber, StatHelpText, Icon, SimpleGrid, Tag,
  List, ListItem, ListIcon, Tabs, TabList, Tab,
  TabPanels, TabPanel, Accordion, AccordionItem,
  AccordionButton, AccordionPanel, AccordionIcon
} from '@chakra-ui/react';
import { SearchIcon, InfoIcon, StarIcon, AtSignIcon, CheckIcon } from '@chakra-ui/icons';
import { FaAtom, FaThermometerHalf, FaWater, FaWeight, FaFlask, FaLightbulb } from 'react-icons/fa';
import { periodicTableData } from './chemistryData';
import { elementApplications } from './elementApplications';

// Define Element Cell as a separate component
const ElementCell = ({ element, onClick, categoryColors }) => {
  if (!element) return <Box w="100%" h="100%" />;
  
  const bgColor = categoryColors[element.category] || 'gray.500';
  const hoverBgColor = categoryColors[element.category] 
    ? `${categoryColors[element.category].split('.')[0]}.600` 
    : 'gray.600';
  
  return (
    <Tooltip 
      label={`${element.name} (${element.atomicNumber})`}
      placement="top"
      hasArrow
    >
      <Box
        w="100%"
        h="100%"
        bg={bgColor}
        color="white"
        borderRadius="md"
        p={1}
        textAlign="center"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ bg: hoverBgColor, transform: 'scale(1.05)' }}
        onClick={() => onClick(element)}
      >
        <Text fontSize="xs" textAlign="right">{element.atomicNumber}</Text>
        <Text fontSize="xl" fontWeight="bold">{element.symbol}</Text>
        <Text fontSize="xs" noOfLines={1}>{element.name}</Text>
        <Text fontSize="xs">{element.atomicMass?.toFixed(2) || ''}</Text>
      </Box>
    </Tooltip>
  );
};

// Element Details component
const ElementDetails = ({ element, borderColor }) => {
  const statBgColor = useColorModeValue('blue.50', 'blue.900');
  const applicationBgColor = useColorModeValue('green.50', 'green.900');
  const factBgColor = useColorModeValue('purple.50', 'purple.900');
  
  if (!element) return null;
  
  // Format discovery information
  const discoveryInfo = element.discoveryYear 
    ? `Discovered in ${element.discoveryYear} by ${element.discoveredBy}` 
    : `Discovered by ${element.discoveredBy}`;
  
  // Get applications and facts if available
  const elementInfo = elementApplications[element.symbol] || { 
    applications: ["No specific applications data available"],
    facts: ["No specific facts available"] 
  };
  
  return (
    <Box 
      mt={4} 
      p={4} 
      borderWidth="1px"
      borderRadius="md"
      borderColor={borderColor}
    >
      <Flex direction={{ base: "column", md: "row" }} gap={4}>
        <Box w={{ base: "100%", md: "120px" }} h={{ base: "120px", md: "120px" }} flexShrink={0}>
          <Box 
            bg={element.category === 'nonmetal' ? 'blue.500' : 
               element.category === 'noble gas' ? 'purple.500' :
               element.category === 'alkali metal' ? 'red.500' :
               element.category === 'alkaline earth metal' ? 'orange.500' :
               element.category === 'metalloid' ? 'teal.500' :
               element.category === 'halogen' ? 'cyan.500' :
               element.category === 'post-transition metal' ? 'green.500' :
               element.category === 'transition metal' ? 'yellow.500' : 
               element.category === 'lanthanide' ? 'pink.500' :
               element.category === 'actinide' ? 'magenta.500' : 'gray.500'}
            color="white"
            w="100%"
            h="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            borderRadius="md"
            position="relative"
            pb={1}
          >
            <Text fontSize="xs" position="absolute" top={1} right={2}>{element.atomicNumber}</Text>
            <Text fontSize="4xl" fontWeight="bold">{element.symbol}</Text>
            <Text fontSize="xs" mt={1}>{element.name}</Text>
          </Box>
        </Box>
        
        <Box flex={1}>
          <Heading size="md" mb={2}>{element.name} ({element.symbol})</Heading>
          <Badge>{element.category.charAt(0).toUpperCase() + element.category.slice(1)}</Badge>
          <Divider my={2} />
          
          <Tabs variant="soft-rounded" colorScheme="blue" size="sm">
            <TabList>
              <Tab>Basic Info</Tab>
              <Tab>Applications</Tab>
              <Tab>Facts</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mt={1}>
                  <Stat bg={statBgColor} p={2} borderRadius="md">
                    <StatLabel>Atomic Number</StatLabel>
                    <StatNumber>{element.atomicNumber}</StatNumber>
                    <StatHelpText display="flex" alignItems="center">
                      <AtSignIcon mr={1} />Protons in nucleus
                    </StatHelpText>
                  </Stat>
                  
                  <Stat bg={statBgColor} p={2} borderRadius="md">
                    <StatLabel>Atomic Mass</StatLabel>
                    <StatNumber>{element.atomicMass?.toFixed(3) || 'N/A'}</StatNumber>
                    <StatHelpText display="flex" alignItems="center">
                      <Icon as={FaWeight} mr={1} />Atomic mass units
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>
                
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mt={4}>
                  <Stat bg={statBgColor} p={2} borderRadius="md">
                    <StatLabel>Melting Point</StatLabel>
                    <StatNumber>{element.meltingPoint || 'N/A'} K</StatNumber>
                    <StatHelpText display="flex" alignItems="center">
                      <Icon as={FaThermometerHalf} mr={1} />
                      {element.meltingPoint ? `${(element.meltingPoint - 273.15).toFixed(1)}°C` : 'N/A'}
                    </StatHelpText>
                  </Stat>
                  
                  <Stat bg={statBgColor} p={2} borderRadius="md">
                    <StatLabel>Boiling Point</StatLabel>
                    <StatNumber>{element.boilingPoint || 'N/A'} K</StatNumber>
                    <StatHelpText display="flex" alignItems="center">
                      <Icon as={FaThermometerHalf} mr={1} />
                      {element.boilingPoint ? `${(element.boilingPoint - 273.15).toFixed(1)}°C` : 'N/A'}
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>
                
                <Card mt={4}>
                  <CardBody>
                    <Heading size="sm" mb={2}>Electronic Configuration</Heading>
                    <Text fontFamily="monospace">{element.electronConfiguration || 'N/A'}</Text>
                    
                    <Heading size="sm" mt={4} mb={2}>Physical Properties</Heading>
                    <SimpleGrid columns={2} spacing={2}>
                      <Box>
                        <Text fontWeight="bold">Density:</Text>
                        <Text>{element.density || 'N/A'} g/cm³</Text>
                      </Box>
                      
                      <Box>
                        <Text fontWeight="bold">Electronegativity:</Text>
                        <Text>{element.electronegativity || 'N/A'}</Text>
                      </Box>
                    </SimpleGrid>
                    
                    <Heading size="sm" mt={4} mb={2}>Historical Data</Heading>
                    <Text fontSize="sm">{discoveryInfo}</Text>
                  </CardBody>
                </Card>
              </TabPanel>
              
              <TabPanel>
                <Box bg={applicationBgColor} p={4} borderRadius="md">
                  <Heading size="sm" mb={3} display="flex" alignItems="center">
                    <Icon as={FaFlask} mr={2} />Common Applications
                  </Heading>
                  <List spacing={2}>
                    {elementInfo.applications.map((app, index) => (
                      <ListItem key={index} display="flex">
                        <ListIcon as={CheckIcon} color="green.500" mt={1} />
                        <Text>{app}</Text>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </TabPanel>
              
              <TabPanel>
                <Box bg={factBgColor} p={4} borderRadius="md">
                  <Heading size="sm" mb={3} display="flex" alignItems="center">
                    <Icon as={FaLightbulb} mr={2} />Interesting Facts
                  </Heading>
                  <List spacing={2}>
                    {elementInfo.facts.map((fact, index) => (
                      <ListItem key={index} display="flex">
                        <ListIcon as={StarIcon} color="purple.500" mt={1} />
                        <Text>{fact}</Text>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Flex>
    </Box>
  );
};

const PeriodicTable = ({ onElementSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedElement, setSelectedElement] = useState(null);
  
  // Define colors at the component level
  const categoryColors = {
    'alkali metal': 'red.500',
    'alkaline earth metal': 'orange.500',
    'transition metal': 'yellow.500',
    'post-transition metal': 'green.500',
    'metalloid': 'teal.500',
    'nonmetal': 'blue.500',
    'halogen': 'cyan.500',
    'noble gas': 'purple.500',
    'lanthanide': 'pink.500',
    'actinide': 'magenta.500'
  };
  
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const handleElementClick = (element) => {
    setSelectedElement(element);
    if (onElementSelect) {
      onElementSelect(element);
    }
  };
  
  // Filter elements based on search and category
  const filteredElements = periodicTableData.filter(element => {
    const matchesSearch = 
      element.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.atomicNumber?.toString().includes(searchTerm);
    
    const matchesCategory = filterCategory ? element.category === filterCategory : true;
    
    return matchesSearch && matchesCategory;
  });
  
  // Get unique categories for the filter dropdown
  const categories = [...new Set(periodicTableData.map(e => e.category))].sort();
  
  // Create a 2D grid representation for the main periodic table (18 columns, 7 rows)
  const mainTable = Array(7).fill().map(() => Array(18).fill(null));
  
  // Separate arrays for lanthanides and actinides
  let lanthanides = [];
  let actinides = [];
  
  // Place elements in their correct positions
  periodicTableData.forEach(element => {
    if (!element) return;
    
    // Skip non-existent elements
    if (!element.symbol || !element.xpos || !element.ypos) return;
    
    // Handle main table elements (rows 1-7)
    if (element.ypos >= 1 && element.ypos <= 7 && element.xpos >= 1 && element.xpos <= 18) {
      mainTable[element.ypos - 1][element.xpos - 1] = element;
    }
    
    // Collect lanthanides and actinides for separate rows
    if (element.category === 'lanthanide') {
      lanthanides.push(element);
    } else if (element.category === 'actinide') {
      actinides.push(element);
    }
  });
  
  // Sort lanthanides and actinides by atomic number
  lanthanides = lanthanides.sort((a, b) => a.atomicNumber - b.atomicNumber);
  actinides = actinides.sort((a, b) => a.atomicNumber - b.atomicNumber);
  
  return (
    <Box>
      <HStack spacing={4} mb={4}>
        <InputGroup maxW="300px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input 
            placeholder="Search elements..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        
        <Select 
          placeholder="Filter by category" 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          maxW="250px"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </Select>
      </HStack>
      
      {/* Category legend */}
      <Flex wrap="wrap" mb={4} gap={2}>
        {Object.entries(categoryColors).map(([category, color]) => (
          <Badge 
            key={category} 
            bg={color} 
            color="white" 
            px={2} 
            py={1} 
            borderRadius="md"
            fontSize="xs"
            cursor="pointer"
            onClick={() => setFilterCategory(category === filterCategory ? '' : category)}
            opacity={filterCategory && filterCategory !== category ? 0.5 : 1}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Badge>
        ))}
      </Flex>
      
      {searchTerm || filterCategory ? (
        // Display filtered elements in a grid
        <Grid templateColumns="repeat(auto-fill, minmax(80px, 1fr))" gap={2}>
          {filteredElements.map(element => (
            <GridItem key={element.atomicNumber} aspectRatio={1}>
              <ElementCell 
                element={element} 
                onClick={handleElementClick}
                categoryColors={categoryColors}
              />
            </GridItem>
          ))}
        </Grid>
      ) : (
        // Display full periodic table
        <Box overflowX="auto">
          {/* Main periodic table */}
          <Grid templateColumns="repeat(18, minmax(60px, 1fr))" gap={1} mb={4}>
            {mainTable.map((row, rowIndex) => 
              row.map((element, colIndex) => (
                <GridItem key={`${rowIndex}-${colIndex}`} aspectRatio={1}>
                  <ElementCell 
                    element={element} 
                    onClick={handleElementClick}
                    categoryColors={categoryColors}
                  />
                </GridItem>
              ))
            )}
          </Grid>
          
          {/* Lanthanides row */}
          <Box mt={6}>
            <Text ml={3} mb={1} fontSize="sm" color="gray.500">Lanthanides (57-71)</Text>
            <Grid templateColumns="repeat(15, minmax(60px, 1fr))" gap={1} ml="120px">
              {lanthanides.map((element) => (
                <GridItem key={element.atomicNumber} aspectRatio={1}>
                  <ElementCell 
                    element={element} 
                    onClick={handleElementClick}
                    categoryColors={categoryColors}
                  />
                </GridItem>
              ))}
            </Grid>
          </Box>
          
          {/* Actinides row */}
          <Box mt={3}>
            <Text ml={3} mb={1} fontSize="sm" color="gray.500">Actinides (89-103)</Text>
            <Grid templateColumns="repeat(15, minmax(60px, 1fr))" gap={1} ml="120px">
              {actinides.map((element) => (
                <GridItem key={element.atomicNumber} aspectRatio={1}>
                  <ElementCell 
                    element={element} 
                    onClick={handleElementClick}
                    categoryColors={categoryColors}
                  />
                </GridItem>
              ))}
            </Grid>
          </Box>
        </Box>
      )}
      
      {/* Element details section */}
      {selectedElement && <ElementDetails element={selectedElement} borderColor={borderColor} />}
    </Box>
  );
};

export default PeriodicTable;
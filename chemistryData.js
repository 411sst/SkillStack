import React, { useState, useEffect } from 'react';
import {
  Box, Grid, GridItem, Text, Flex, Badge, 
  useColorModeValue, Tooltip, HStack, Select,
  Input, InputGroup, InputLeftElement, Card, CardBody,
  Divider, Heading, Icon, List, ListItem, ListIcon,
  Tabs, TabList, Tab, TabPanels, TabPanel
} from '@chakra-ui/react';
import { SearchIcon, InfoIcon, StarIcon, CheckIcon } from '@chakra-ui/icons';
import { FaAtom, FaThermometerHalf, FaWeight, FaFlask, FaLightbulb } from 'react-icons/fa';

// Define color scheme for element categories
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
  'actinide': 'blue.400', // Changed to blue for better visibility
};

// Element Cell Component
const ElementCell = ({ element, onClick, isDimmed = false }) => {
  if (!element) return <Box w="100%" h="100%" />;
  
  const bgColor = categoryColors[element.category] || 'gray.500';
  const hoverBgColor = `${bgColor.split('.')[0]}.600`;
  const opacity = isDimmed ? 0.6 : 1;
  
  return (
    <Tooltip label={`${element.name} (${element.atomicNumber})`} placement="top" hasArrow>
      <Box
        bg={bgColor}
        color="white"
        borderRadius="md"
        p={1}
        h="100%"
        w="100%"
        textAlign="center"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ bg: hoverBgColor, transform: 'scale(1.05)' }}
        onClick={() => onClick(element)}
        opacity={opacity}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        <Text fontSize="xs" textAlign="right">{element.atomicNumber}</Text>
        <Text fontSize="xl" fontWeight="bold">{element.symbol}</Text>
        <Text fontSize="xs" noOfLines={1}>{element.name}</Text>
        <Text fontSize="xs">{element.atomicMass?.toFixed(1) || ''}</Text>
      </Box>
    </Tooltip>
  );
};

// Element details panel component
const ElementDetails = ({ element }) => {
  if (!element) return null;
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Formatting functions
  const formatTemp = (kelvin) => {
    if (!kelvin) return 'N/A';
    return `${kelvin} K (${(kelvin - 273.15).toFixed(1)}°C)`;
  };
  
  const discoveryInfo = element.discoveryYear 
    ? `Discovered in ${element.discoveryYear} by ${element.discoveredBy}` 
    : `Discovered by ${element.discoveredBy}`;
  
  // Sample applications and facts (would usually come from a database)
  const applications = [
    "Industrial catalysts",
    "Scientific research",
    "Medical imaging",
    "Nuclear applications"
  ];
  
  const facts = [
    "One of the rarest naturally occurring elements",
    "Has several radioactive isotopes",
    "Named after the scientist who discovered it",
    "Used in specialized scientific equipment"
  ];
  
  return (
    <Card mt={4} bg={bgColor} borderColor={borderColor} borderWidth="1px">
      <CardBody>
        <Flex align="center" mb={4}>
          <Box
            bg={categoryColors[element.category] || 'gray.500'}
            borderRadius="md"
            p={3}
            mr={4}
            w="80px"
            h="80px"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            color="white"
          >
            <Text fontSize="3xl" fontWeight="bold">{element.symbol}</Text>
            <Text fontSize="xs">{element.atomicNumber}</Text>
          </Box>
          
          <Box>
            <Heading size="md">{element.name}</Heading>
            <Badge mt={1}>{element.category}</Badge>
          </Box>
        </Flex>
        
        <Tabs colorScheme="blue" size="sm" variant="soft-rounded">
          <TabList>
            <Tab>Basic Info</Tab>
            <Tab>Applications</Tab>
            <Tab>Facts</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text fontWeight="bold">Atomic Number:</Text>
                  <Text>{element.atomicNumber}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Atomic Mass:</Text>
                  <Text>{element.atomicMass?.toFixed(3) || 'N/A'} u</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Electron Configuration:</Text>
                  <Text fontFamily="monospace">{element.electronConfiguration || 'N/A'}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Electronegativity:</Text>
                  <Text>{element.electronegativity || 'N/A'}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Melting Point:</Text>
                  <Text>{formatTemp(element.meltingPoint)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Boiling Point:</Text>
                  <Text>{formatTemp(element.boilingPoint)}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Density:</Text>
                  <Text>{element.density || 'N/A'} g/cm³</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Discovery:</Text>
                  <Text>{discoveryInfo}</Text>
                </Box>
              </Grid>
            </TabPanel>
            
            <TabPanel>
              <List spacing={2}>
                {applications.map((app, i) => (
                  <ListItem key={i} display="flex" alignItems="baseline">
                    <ListIcon as={CheckIcon} color="green.500" />
                    <Text>{app}</Text>
                  </ListItem>
                ))}
              </List>
            </TabPanel>
            
            <TabPanel>
              <List spacing={2}>
                {facts.map((fact, i) => (
                  <ListItem key={i} display="flex" alignItems="baseline">
                    <ListIcon as={StarIcon} color="purple.500" />
                    <Text>{fact}</Text>
                  </ListItem>
                ))}
              </List>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </CardBody>
    </Card>
  );
};

const PeriodicTable = ({ onElementSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedElement, setSelectedElement] = useState(null);
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load the periodic table data
  useEffect(() => {
    // This would normally fetch from an API or import data
    // For this example, we're creating a simplified dataset
    const mockElements = createMockPeriodicTable();
    setElements(mockElements);
    setLoading(false);
  }, []);
  
  const handleElementClick = (element) => {
    setSelectedElement(element);
    if (onElementSelect) {
      onElementSelect(element);
    }
  };
  
  // Filter elements based on search and category
  const filteredElements = elements.filter(element => {
    if (!element) return false;
    
    const matchesSearch = 
      searchTerm === '' ||
      element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.atomicNumber.toString().includes(searchTerm);
    
    const matchesCategory = 
      filterCategory === '' || 
      element.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Get unique categories for the filter dropdown
  const categories = [...new Set(elements.filter(e => e?.category).map(e => e.category))].sort();
  
  // Create the main table grid (18 columns, 7 rows)
  const mainTableGrid = Array(10).fill().map(() => Array(18).fill(null));
  
  // Place elements in their correct positions
  elements.forEach(element => {
    if (!element || !element.tableRow || !element.tableCol) return;
    
    if (element.tableRow <= 7) {
      // Main table
      mainTableGrid[element.tableRow - 1][element.tableCol - 1] = element;
    } else if (element.category === 'lanthanide') {
      // Lanthanides (row 8)
      mainTableGrid[8][element.tableCol - 3] = element;
    } else if (element.category === 'actinide') {
      // Actinides (row 9)
      mainTableGrid[9][element.tableCol - 3] = element;
    }
  });
  
  // Helper to get grid areas for empty spaces
  const getGridArea = (row, col, rowSpan = 1, colSpan = 1) => {
    return `${row} / ${col} / ${row + rowSpan} / ${col + colSpan}`;
  };
  
  if (loading) {
    return <Box textAlign="center" p={10}>Loading Periodic Table...</Box>;
  }
  
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
      
      {/* Element categories legend */}
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
        // Show filtered elements in a simple grid
        <Grid templateColumns="repeat(auto-fill, minmax(80px, 1fr))" gap={2}>
          {filteredElements.map(element => (
            <GridItem key={element.atomicNumber} aspectRatio={1}>
              <ElementCell 
                element={element} 
                onClick={handleElementClick}
              />
            </GridItem>
          ))}
        </Grid>
      ) : (
        // Show full periodic table with correct layout
        <Box overflowX="auto" pb={4}>
          <Grid 
            templateColumns="repeat(18, minmax(60px, 1fr))" 
            templateRows="repeat(10, minmax(60px, auto))"
            gap={1}
            minW="1080px"
          >
            {/* Main table elements */}
            {mainTableGrid.map((row, rowIdx) => 
              row.map((element, colIdx) => {
                // Special case for lanthanides and actinides rows
                if (rowIdx === 8 || rowIdx === 9) {
                  // Labels for lanthanides and actinides
                  if (colIdx === 0) {
                    return (
                      <GridItem 
                        key={`${rowIdx}-${colIdx}`} 
                        gridArea={getGridArea(rowIdx + 1, colIdx + 1, 1, 3)}
                        display="flex"
                        alignItems="center"
                        justifyContent="flex-end"
                        pr={2}
                      >
                        <Text 
                          fontSize="sm" 
                          fontWeight="bold" 
                          color={rowIdx === 8 ? "pink.500" : "blue.500"}
                        >
                          {rowIdx === 8 ? "Lanthanides:" : "Actinides:"}
                        </Text>
                      </GridItem>
                    );
                  }
                  
                  // Skip the first 2 columns as they're used for the label
                  if (colIdx <= 1) return null;
                }
                
                return (
                  <GridItem 
                    key={`${rowIdx}-${colIdx}`} 
                    aspectRatio={1}
                    // Highlight lanthanides/actinides rows
                    border={rowIdx === 8 || rowIdx === 9 ? "1px dashed" : "none"}
                    borderColor={rowIdx === 8 ? "pink.200" : rowIdx === 9 ? "blue.200" : "transparent"}
                    borderRadius="md"
                  >
                    {element && <ElementCell element={element} onClick={handleElementClick} />}
                  </GridItem>
                );
              })
            )}
            
            {/* Spacers and indicators */}
            <GridItem gridArea="3 / 3 / 4 / 13" borderBottom="1px dashed" borderColor="gray.400" />
            
            {/* Row labels */}
            <GridItem gridArea="1 / 19 / 2 / 20" pl={1}>
              <Text fontSize="xs">1</Text>
            </GridItem>
            <GridItem gridArea="2 / 19 / 3 / 20" pl={1}>
              <Text fontSize="xs">2</Text>
            </GridItem>
            <GridItem gridArea="3 / 19 / 4 / 20" pl={1}>
              <Text fontSize="xs">3</Text>
            </GridItem>
            <GridItem gridArea="4 / 19 / 5 / 20" pl={1}>
              <Text fontSize="xs">4</Text>
            </GridItem>
            <GridItem gridArea="5 / 19 / 6 / 20" pl={1}>
              <Text fontSize="xs">5</Text>
            </GridItem>
            <GridItem gridArea="6 / 19 / 7 / 20" pl={1}>
              <Text fontSize="xs">6</Text>
            </GridItem>
            <GridItem gridArea="7 / 19 / 8 / 20" pl={1}>
              <Text fontSize="xs">7</Text>
            </GridItem>
            
            {/* Column group labels */}
            <GridItem gridArea="0 / 1 / 1 / 2" textAlign="center">
              <Text fontSize="xs">1</Text>
            </GridItem>
            <GridItem gridArea="0 / 2 / 1 / 3" textAlign="center">
              <Text fontSize="xs">2</Text>
            </GridItem>
            <GridItem gridArea="0 / 13 / 1 / 14" textAlign="center">
              <Text fontSize="xs">13</Text>
            </GridItem>
            <GridItem gridArea="0 / 14 / 1 / 15" textAlign="center">
              <Text fontSize="xs">14</Text>
            </GridItem>
            <GridItem gridArea="0 / 15 / 1 / 16" textAlign="center">
              <Text fontSize="xs">15</Text>
            </GridItem>
            <GridItem gridArea="0 / 16 / 1 / 17" textAlign="center">
              <Text fontSize="xs">16</Text>
            </GridItem>
            <GridItem gridArea="0 / 17 / 1 / 18" textAlign="center">
              <Text fontSize="xs">17</Text>
            </GridItem>
            <GridItem gridArea="0 / 18 / 1 / 19" textAlign="center">
              <Text fontSize="xs">18</Text>
            </GridItem>
          </Grid>
        </Box>
      )}
      
      {/* Element details */}
      {selectedElement && <ElementDetails element={selectedElement} />}
    </Box>
  );
};

// Mock data generator function for demo purposes
function createMockPeriodicTable() {
  // This would normally be imported from a data source
  return [
    // Period 1
    {
      atomicNumber: 1,
      symbol: "H",
      name: "Hydrogen",
      category: "nonmetal",
      atomicMass: 1.008,
      tableRow: 1,
      tableCol: 1,
      electronConfiguration: "1s¹",
      electronegativity: 2.2,
      density: 0.00008988,
      meltingPoint: 14.01,
      boilingPoint: 20.28,
      discoveredBy: "Henry Cavendish",
      discoveryYear: 1766
    },
    {
      atomicNumber: 2,
      symbol: "He",
      name: "Helium",
      category: "noble gas",
      atomicMass: 4.0026,
      tableRow: 1,
      tableCol: 18,
      electronConfiguration: "1s²",
      density: 0.0001785,
      meltingPoint: 0.95,
      boilingPoint: 4.22,
      discoveredBy: "Pierre Janssen",
      discoveryYear: 1868
    },
    
    // Period 2
    {
      atomicNumber: 3,
      symbol: "Li",
      name: "Lithium",
      category: "alkali metal",
      atomicMass: 6.94,
      tableRow: 2,
      tableCol: 1,
      electronConfiguration: "[He] 2s¹",
      electronegativity: 0.98,
      density: 0.534,
      meltingPoint: 453.69,
      boilingPoint: 1560,
      discoveredBy: "Johan August Arfwedson",
      discoveryYear: 1817
    },
    {
      atomicNumber: 4,
      symbol: "Be",
      name: "Beryllium",
      category: "alkaline earth metal",
      atomicMass: 9.0122,
      tableRow: 2,
      tableCol: 2,
      electronConfiguration: "[He] 2s²",
      electronegativity: 1.57,
      density: 1.85,
      meltingPoint: 1560,
      boilingPoint: 2742,
      discoveredBy: "Louis-Nicolas Vauquelin",
      discoveryYear: 1797
    },
    {
      atomicNumber: 5,
      symbol: "B",
      name: "Boron",
      category: "metalloid",
      atomicMass: 10.81,
      tableRow: 2,
      tableCol: 13,
      electronConfiguration: "[He] 2s² 2p¹",
      electronegativity: 2.04,
      density: 2.34,
      meltingPoint: 2349,
      boilingPoint: 4200,
      discoveredBy: "Joseph Louis Gay-Lussac",
      discoveryYear: 1808
    },
    {
      atomicNumber: 6,
      symbol: "C",
      name: "Carbon",
      category: "nonmetal",
      atomicMass: 12.011,
      tableRow: 2,
      tableCol: 14,
      electronConfiguration: "[He] 2s² 2p²",
      electronegativity: 2.55,
      density: 2.267,
      meltingPoint: 3823,
      boilingPoint: 4300,
      discoveredBy: "Ancient",
      discoveryYear: null
    },
    {
      atomicNumber: 7,
      symbol: "N",
      name: "Nitrogen",
      category: "nonmetal",
      atomicMass: 14.007,
      tableRow: 2,
      tableCol: 15,
      electronConfiguration: "[He] 2s² 2p³",
      electronegativity: 3.04,
      density: 0.001251,
      meltingPoint: 63.15,
      boilingPoint: 77.36,
      discoveredBy: "Daniel Rutherford",
      discoveryYear: 1772
    },
    {
      atomicNumber: 8,
      symbol: "O",
      name: "Oxygen",
      category: "nonmetal",
      atomicMass: 15.999,
      tableRow: 2,
      tableCol: 16,
      electronConfiguration: "[He] 2s² 2p⁴",
      electronegativity: 3.44,
      density: 0.001429,
      meltingPoint: 54.36,
      boilingPoint: 90.20,
      discoveredBy: "Carl Wilhelm Scheele",
      discoveryYear: 1771
    },
    {
      atomicNumber: 9,
      symbol: "F",
      name: "Fluorine",
      category: "halogen",
      atomicMass: 18.998,
      tableRow: 2,
      tableCol: 17,
      electronConfiguration: "[He] 2s² 2p⁵",
      electronegativity: 3.98,
      density: 0.001696,
      meltingPoint: 53.53,
      boilingPoint: 85.03,
      discoveredBy: "André-Marie Ampère",
      discoveryYear: 1810
    },
    {
      atomicNumber: 10,
      symbol: "Ne",
      name: "Neon",
      category: "noble gas",
      atomicMass: 20.180,
      tableRow: 2,
      tableCol: 18,
      electronConfiguration: "[He] 2s² 2p⁶",
      density: 0.0008999,
      meltingPoint: 24.56,
      boilingPoint: 27.07,
      discoveredBy: "William Ramsay",
      discoveryYear: 1898
    },
    
    // Period 3
    {
      atomicNumber: 11,
      symbol: "Na",
      name: "Sodium",
      category: "alkali metal",
      atomicMass: 22.990,
      tableRow: 3,
      tableCol: 1,
      electronConfiguration: "[Ne] 3s¹",
      electronegativity: 0.93,
      density: 0.971,
      meltingPoint: 370.87,
      boilingPoint: 1156,
      discoveredBy: "Humphry Davy",
      discoveryYear: 1807
    },
    {
      atomicNumber: 12,
      symbol: "Mg",
      name: "Magnesium",
      category: "alkaline earth metal",
      atomicMass: 24.305,
      tableRow: 3,
      tableCol: 2,
      electronConfiguration: "[Ne] 3s²",
      electronegativity: 1.31,
      density: 1.738,
      meltingPoint: 923,
      boilingPoint: 1363,
      discoveredBy: "Joseph Black",
      discoveryYear: 1755
    },
    {
      atomicNumber: 13,
      symbol: "Al",
      name: "Aluminum",
      category: "post-transition metal",
      atomicMass: 26.982,
      tableRow: 3,
      tableCol: 13,
      electronConfiguration: "[Ne] 3s² 3p¹",
      electronegativity: 1.61,
      density: 2.698,
      meltingPoint: 933.47,
      boilingPoint: 2792,
      discoveredBy: "Hans Christian Ørsted",
      discoveryYear: 1825
    },
    {
      atomicNumber: 14,
      symbol: "Si",
      name: "Silicon",
      category: "metalloid",
      atomicMass: 28.085,
      tableRow: 3,
      tableCol: 14,
      electronConfiguration: "[Ne] 3s² 3p²",
      electronegativity: 1.90,
      density: 2.3296,
      meltingPoint: 1687,
      boilingPoint: 3538,
      discoveredBy: "Jöns Jacob Berzelius",
      discoveryYear: 1824
    },
    {
      atomicNumber: 15,
      symbol: "P",
      name: "Phosphorus",
      category: "nonmetal",
      atomicMass: 30.974,
      tableRow: 3,
      tableCol: 15,
      electronConfiguration: "[Ne] 3s² 3p³",
      electronegativity: 2.19,
      density: 1.82,
      meltingPoint: 317.3,
      boilingPoint: 550,
      discoveredBy: "Hennig Brand",
      discoveryYear: 1669
    },
    {
      atomicNumber: 16,
      symbol: "S",
      name: "Sulfur",
      category: "nonmetal",
      atomicMass: 32.06,
      tableRow: 3,
      tableCol: 16,
      electronConfiguration: "[Ne] 3s² 3p⁴",
      electronegativity: 2.58,
      density: 2.067,
      meltingPoint: 388.36,
      boilingPoint: 717.87,
      discoveredBy: "Ancient",
      discoveryYear: null
    },
    {
      atomicNumber: 17,
      symbol: "Cl",
      name: "Chlorine",
      category: "halogen",
      atomicMass: 35.45,
      tableRow: 3,
      tableCol: 17,
      electronConfiguration: "[Ne] 3s² 3p⁵",
      electronegativity: 3.16,
      density: 0.003214,
      meltingPoint: 171.6,
      boilingPoint: 239.11,
      discoveredBy: "Carl Wilhelm Scheele",
      discoveryYear: 1774
    },
    {
      atomicNumber: 18,
      symbol: "Ar",
      name: "Argon",
      category: "noble gas",
      atomicMass: 39.948,
      tableRow: 3,
      tableCol: 18,
      electronConfiguration: "[Ne] 3s² 3p⁶",
      density: 0.0017837,
      meltingPoint: 83.80,
      boilingPoint: 87.30,
      discoveredBy: "Lord Rayleigh",
      discoveryYear: 1894
    },
    
    // Period 4 (first row with transition metals)
    {
      atomicNumber: 19,
      symbol: "K",
      name: "Potassium",
      category: "alkali metal",
      atomicMass: 39.098,
      tableRow: 4,
      tableCol: 1,
      electronConfiguration: "[Ar] 4s¹",
      electronegativity: 0.82,
      density: 0.862,
      meltingPoint: 336.53,
      boilingPoint: 1032,
      discoveredBy: "Humphry Davy",
      discoveryYear: 1807
    },
    {
      atomicNumber: 20,
      symbol: "Ca",
      name: "Calcium",
      category: "alkaline earth metal",
      atomicMass: 40.078,
      tableRow: 4,
      tableCol: 2,
      electronConfiguration: "[Ar] 4s²",
      electronegativity: 1.00,
      density: 1.54,
      meltingPoint: 1115,
      boilingPoint: 1757,
      discoveredBy: "Humphry Davy",
      discoveryYear: 1808
    },
    {
      atomicNumber: 21,
      symbol: "Sc",
      name: "Scandium",
      category: "transition metal",
      atomicMass: 44.956,
      tableRow: 4,
      tableCol: 3,
      electronConfiguration: "[Ar] 3d¹ 4s²",
      electronegativity: 1.36,
      density: 2.985,
      meltingPoint: 1814,
      boilingPoint: 3109,
      discoveredBy: "Lars Fredrik Nilson",
      discoveryYear: 1879
    },
    {
      atomicNumber: 22,
      symbol: "Ti",
      name: "Titanium",
      category: "transition metal",
      atomicMass: 47.867,
      tableRow: 4,
      tableCol: 4,
      electronConfiguration: "[Ar] 3d² 4s²",
      electronegativity: 1.54,
      density: 4.507,
      meltingPoint: 1941,
      boilingPoint: 3560,
      discoveredBy: "William Gregor",
      discoveryYear: 1791
    },
    {
      atomicNumber: 23,
      symbol: "V",
      name: "Vanadium",
      category: "transition metal",
      atomicMass: 50.942,
      tableRow: 4,
      tableCol: 5,
      electronConfiguration: "[Ar] 3d³ 4s²",
      electronegativity: 1.63,
      density: 6.11,
      meltingPoint: 2183,
      boilingPoint: 3680,
      discoveredBy: "Andrés Manuel del Río",
      discoveryYear: 1801
    },
    {
      atomicNumber: 24,
      symbol: "Cr",
      name: "Chromium",
      category: "transition metal",
      atomicMass: 51.996,
      tableRow: 4,
      tableCol: 6,
      electronConfiguration: "[Ar] 3d⁵ 4s¹",
      electronegativity: 1.66,
      density: 7.15,
      meltingPoint: 2180,
      boilingPoint: 2944,
      discoveredBy: "Louis-Nicolas Vauquelin",
      discoveryYear: 1794
    },
    {
      atomicNumber: 25,
      symbol: "Mn",
      name: "Manganese",
      category: "transition metal",
      atomicMass: 54.938,
      tableRow: 4,
      tableCol: 7,
      electronConfiguration: "[Ar] 3d⁵ 4s²",
      electronegativity: 1.55,
      density: 7.44,
      meltingPoint: 1519,
      boilingPoint: 2334,
      discoveredBy: "Johann Gottlieb Gahn",
      discoveryYear: 1774
    },
    {
      atomicNumber: 26,
      symbol: "Fe",
      name: "Iron",
      category: "transition metal",
      atomicMass: 55.845,
      tableRow: 4,
      tableCol: 8,
      electronConfiguration: "[Ar] 3d⁶ 4s²",
      electronegativity: 1.83,
      density: 7.874,
      meltingPoint: 1811,
      boilingPoint: 3134,
      discoveredBy: "Ancient",
      discoveryYear: null
    },
    {
      atomicNumber: 27,
      symbol: "Co",
      name: "Cobalt",
      category: "transition metal",
      atomicMass: 58.933,
      tableRow: 4,
      tableCol: 9,
      electronConfiguration: "[Ar] 3d⁷ 4s²",
      electronegativity: 1.88,
      density: 8.90,
      meltingPoint: 1768,
      boilingPoint: 3200,
      discoveredBy: "Georg Brandt",
      discoveryYear: 1735
    },
    {
      atomicNumber: 28,
      symbol: "Ni",
      name: "Nickel",
      category: "transition metal",
      atomicMass: 58.693,
      tableRow: 4,
      tableCol: 10,
      electronConfiguration: "[Ar] 3d⁸ 4s²",
      electronegativity: 1.91,
      density: 8.908,
      meltingPoint: 1728,
      boilingPoint: 3186,
      discoveredBy: "Axel Fredrik Cronstedt",
      discoveryYear: 1751
    },
    {
      atomicNumber: 29,
      symbol: "Cu",
      name: "Copper",
      category: "transition metal",
      atomicMass: 63.546,
      tableRow: 4,
      tableCol: 11,
      electronConfiguration: "[Ar] 3d¹⁰ 4s¹",
      electronegativity: 1.90,
      density: 8.96,
      meltingPoint: 1357.77,
      boilingPoint: 2835,
      discoveredBy: "Ancient",
      discoveryYear: null
    },
    {
      atomicNumber: 30,
      symbol: "Zn",
      name: "Zinc",
      category: "transition metal",
      atomicMass: 65.38,
      tableRow: 4,
      tableCol: 12,
      electronConfiguration: "[Ar] 3d¹⁰ 4s²",
      electronegativity: 1.65,
      density: 7.134,
      meltingPoint: 692.68,
      boilingPoint: 1180,
      discoveredBy: "Ancient",
      discoveryYear: null
    },
    {
      atomicNumber: 31,
      symbol: "Ga",
      name: "Gallium",
      category: "post-transition metal",
      atomicMass: 69.723,
      tableRow: 4,
      tableCol: 13,
      electronConfiguration: "[Ar] 3d¹⁰ 4s² 4p¹",
      electronegativity: 1.81,
      density: 5.91,
      meltingPoint: 302.91,
      boilingPoint: 2673,
      discoveredBy: "Lecoq de Boisbaudran",
      discoveryYear: 1875
    },
    {
      atomicNumber: 32,
      symbol: "Ge",
      name: "Germanium",
      category: "metalloid",
      atomicMass: 72.630,
      tableRow: 4,
      tableCol: 14,
      electronConfiguration: "[Ar] 3d¹⁰ 4s² 4p²",
      electronegativity: 2.01,
      density: 5.323,
      meltingPoint: 1211.40,
      boilingPoint: 3106,
      discoveredBy: "Clemens Winkler",
      discoveryYear: 1886
    },
    {
      atomicNumber: 33,
      symbol: "As",
      name: "Arsenic",
      category: "metalloid",
      atomicMass: 74.922,
      tableRow: 4,
      tableCol: 15,
      electronConfiguration: "[Ar] 3d¹⁰ 4s² 4p³",
      electronegativity: 2.18,
      density: 5.727,
      meltingPoint: 1090,
      boilingPoint: 887,
      discoveredBy: "Ancient",
      discoveryYear: null
    },
    {
      atomicNumber: 34,
      symbol: "Se",
      name: "Selenium",
      category: "nonmetal",
      atomicMass: 78.971,
      tableRow: 4,
      tableCol: 16,
      electronConfiguration: "[Ar] 3d¹⁰ 4s² 4p⁴",
      electronegativity: 2.55,
      density: 4.81,
      meltingPoint: 494,
      boilingPoint: 958,
      discoveredBy: "Jöns Jacob Berzelius",
      discoveryYear: 1817
    },
    {
      atomicNumber: 35,
      symbol: "Br",
      name: "Bromine",
      category: "halogen",
      atomicMass: 79.904,
      tableRow: 4,
      tableCol: 17,
      electronConfiguration: "[Ar] 3d¹⁰ 4s² 4p⁵",
      electronegativity: 2.96,
      density: 3.1028,
      meltingPoint: 265.8,
      boilingPoint: 332.0,
      discoveredBy: "Antoine Jérôme Balard",
      discoveryYear: 1826
    },
    {
      atomicNumber: 36,
      symbol: "Kr",
      name: "Krypton",
      category: "noble gas",
      atomicMass: 83.798,
      tableRow: 4,
      tableCol: 18,
      electronConfiguration: "[Ar] 3d¹⁰ 4s² 4p⁶",
      electronegativity: 3.00,
      density: 0.003733,
      meltingPoint: 115.79,
      boilingPoint: 119.93,
      discoveredBy: "William Ramsay",
      discoveryYear: 1898
    },
    
    // Period 5 (selected elements)
    {
      atomicNumber: 37,
      symbol: "Rb",
      name: "Rubidium",
      category: "alkali metal",
      atomicMass: 85.468,
      tableRow: 5,
      tableCol: 1,
      electronConfiguration: "[Kr] 5s¹",
      electronegativity: 0.82,
      density: 1.532,
      meltingPoint: 312.46,
      boilingPoint: 961,
      discoveredBy: "Robert Bunsen",
      discoveryYear: 1861
    },
    {
      atomicNumber: 38,
      symbol: "Sr",
      name: "Strontium",
      category: "alkaline earth metal",
      atomicMass: 87.62,
      tableRow: 5,
      tableCol: 2,
      electronConfiguration: "[Kr] 5s²",
      electronegativity: 0.95,
      density: 2.64,
      meltingPoint: 1050,
      boilingPoint: 1655,
      discoveredBy: "Adair Crawford",
      discoveryYear: 1790
    },
    {
      atomicNumber: 47,
      symbol: "Ag",
      name: "Silver",
      category: "transition metal",
      atomicMass: 107.87,
      tableRow: 5,
      tableCol: 11,
      electronConfiguration: "[Kr] 4d¹⁰ 5s¹",
      electronegativity: 1.93,
      density: 10.49,
      meltingPoint: 1234.93,
      boilingPoint: 2435,
      discoveredBy: "Ancient",
      discoveryYear: null
    },
    {
      atomicNumber: 53,
      symbol: "I",
      name: "Iodine",
      category: "halogen",
      atomicMass: 126.90,
      tableRow: 5,
      tableCol: 17,
      electronConfiguration: "[Kr] 4d¹⁰ 5s² 5p⁵",
      electronegativity: 2.66,
      density: 4.93,
      meltingPoint: 386.85,
      boilingPoint: 457.4,
      discoveredBy: "Bernard Courtois",
      discoveryYear: 1811
    },
    {
      atomicNumber: 54,
      symbol: "Xe",
      name: "Xenon",
      category: "noble gas",
      atomicMass: 131.29,
      tableRow: 5,
      tableCol: 18,
      electronConfiguration: "[Kr] 4d¹⁰ 5s² 5p⁶",
      electronegativity: 2.6,
      density: 0.005887,
      meltingPoint: 161.4,
      boilingPoint: 165.03,
      discoveredBy: "William Ramsay",
      discoveryYear: 1898
    },
    
    // Period 6 (selected elements)
    {
      atomicNumber: 55,
      symbol: "Cs",
      name: "Cesium",
      category: "alkali metal",
      atomicMass: 132.91,
      tableRow: 6,
      tableCol: 1,
      electronConfiguration: "[Xe] 6s¹",
      electronegativity: 0.79,
      density: 1.873,
      meltingPoint: 301.59,
      boilingPoint: 944,
      discoveredBy: "Robert Bunsen",
      discoveryYear: 1860
    },
    {
      atomicNumber: 56,
      symbol: "Ba",
      name: "Barium",
      category: "alkaline earth metal",
      atomicMass: 137.33,
      tableRow: 6,
      tableCol: 2,
      electronConfiguration: "[Xe] 6s²",
      electronegativity: 0.89,
      density: 3.594,
      meltingPoint: 1000,
      boilingPoint: 2170,
      discoveredBy: "Carl Wilhelm Scheele",
      discoveryYear: 1772
    },
    {
      atomicNumber: 79,
      symbol: "Au",
      name: "Gold",
      category: "transition metal",
      atomicMass: 196.97,
      tableRow: 6,
      tableCol: 11,
      electronConfiguration: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹",
      electronegativity: 2.54,
      density: 19.3,
      meltingPoint: 1337.33,
      boilingPoint: 3129,
      discoveredBy: "Ancient",
      discoveryYear: null
    },
    {
      atomicNumber: 80,
      symbol: "Hg",
      name: "Mercury",
      category: "transition metal",
      atomicMass: 200.59,
      tableRow: 6,
      tableCol: 12,
      electronConfiguration: "[Xe] 4f¹⁴ 5d¹⁰ 6s²",
      electronegativity: 2.00,
      density: 13.546,
      meltingPoint: 234.43,
      boilingPoint: 629.88,
      discoveredBy: "Ancient",
      discoveryYear: null
    },
    {
      atomicNumber: 82,
      symbol: "Pb",
      name: "Lead",
      category: "post-transition metal",
      atomicMass: 207.2,
      tableRow: 6,
      tableCol: 14,
      electronConfiguration: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²",
      electronegativity: 2.33,
      density: 11.34,
      meltingPoint: 600.61,
      boilingPoint: 2022,
      discoveredBy: "Ancient",
      discoveryYear: null
    },
    {
      atomicNumber: 86,
      symbol: "Rn",
      name: "Radon",
      category: "noble gas",
      atomicMass: 222,
      tableRow: 6,
      tableCol: 18,
      electronConfiguration: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶",
      electronegativity: 2.2,
      density: 0.00973,
      meltingPoint: 202,
      boilingPoint: 211.3,
      discoveredBy: "Friedrich Ernst Dorn",
      discoveryYear: 1900
    },
    
    // Period 7 (selected elements)
    {
      atomicNumber: 87,
      symbol: "Fr",
      name: "Francium",
      category: "alkali metal",
      atomicMass: 223,
      tableRow: 7,
      tableCol: 1,
      electronConfiguration: "[Rn] 7s¹",
      electronegativity: 0.7,
      density: 1.87,
      meltingPoint: 300,
      boilingPoint: 950,
      discoveredBy: "Marguerite Perey",
      discoveryYear: 1939
    },
    {
      atomicNumber: 88,
      symbol: "Ra",
      name: "Radium",
      category: "alkaline earth metal",
      atomicMass: 226,
      tableRow: 7,
      tableCol: 2,
      electronConfiguration: "[Rn] 7s²",
      electronegativity: 0.9,
      density: 5.5,
      meltingPoint: 973,
      boilingPoint: 2010,
      discoveredBy: "Marie Curie",
      discoveryYear: 1898
    },
    {
      atomicNumber: 94,
      symbol: "Pu",
      name: "Plutonium",
      category: "actinide",
      atomicMass: 244,
      tableRow: 10,
      tableCol: 8,
      electronConfiguration: "[Rn] 5f⁶ 7s²",
      electronegativity: 1.28,
      density: 19.816,
      meltingPoint: 912.5,
      boilingPoint: 3501,
      discoveredBy: "Glenn T. Seaborg",
      discoveryYear: 1940
    },
    {
      atomicNumber: 118,
      symbol: "Og",
      name: "Oganesson",
      category: "noble gas",
      atomicMass: 294,
      tableRow: 7,
      tableCol: 18,
      electronConfiguration: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶",
      electronegativity: null,
      density: null,
      meltingPoint: null,
      boilingPoint: null,
      discoveredBy: "Joint Institute for Nuclear Research",
      discoveryYear: 2002
    },
    
    // Lanthanides (selected elements from period 6)
    {
      atomicNumber: 57,
      symbol: "La",
      name: "Lanthanum",
      category: "lanthanide",
      atomicMass: 138.91,
      tableRow: 8,
      tableCol: 3,
      electronConfiguration: "[Xe] 5d¹ 6s²",
      electronegativity: 1.10,
      density: 6.145,
      meltingPoint: 1193,
      boilingPoint: 3737,
      discoveredBy: "Carl Gustaf Mosander",
      discoveryYear: 1839
    },
    {
      atomicNumber: 58,
      symbol: "Ce",
      name: "Cerium",
      category: "lanthanide",
      atomicMass: 140.12,
      tableRow: 8,
      tableCol: 4,
      electronConfiguration: "[Xe] 4f¹ 5d¹ 6s²",
      electronegativity: 1.12,
      density: 6.77,
      meltingPoint: 1068,
      boilingPoint: 3716,
      discoveredBy: "Martin Heinrich Klaproth",
      discoveryYear: 1803
    },
    {
      atomicNumber: 59,
      symbol: "Pr",
      name: "Praseodymium",
      category: "lanthanide",
      atomicMass: 140.91,
      tableRow: 8,
      tableCol: 5,
      electronConfiguration: "[Xe] 4f³ 6s²",
      electronegativity: 1.13,
      density: 6.77,
      meltingPoint: 1208,
      boilingPoint: 3793,
      discoveredBy: "Carl Auer von Welsbach",
      discoveryYear: 1885
    },
    {
      atomicNumber: 60,
      symbol: "Nd",
      name: "Neodymium",
      category: "lanthanide",
      atomicMass: 144.24,
      tableRow: 8,
      tableCol: 6,
      electronConfiguration: "[Xe] 4f⁴ 6s²",
      electronegativity: 1.14,
      density: 7.01,
      meltingPoint: 1297,
      boilingPoint: 3347,
      discoveredBy: "Carl Auer von Welsbach",
      discoveryYear: 1885
    },
    {
      atomicNumber: 63,
      symbol: "Eu",
      name: "Europium",
      category: "lanthanide",
      atomicMass: 151.96,
      tableRow: 8,
      tableCol: 9,
      electronConfiguration: "[Xe] 4f⁷ 6s²",
      electronegativity: 1.2,
      density: 5.264,
      meltingPoint: 1099,
      boilingPoint: 1802,
      discoveredBy: "Eugène-Anatole Demarçay",
      discoveryYear: 1901
    },
    {
      atomicNumber: 64,
      symbol: "Gd",
      name: "Gadolinium",
      category: "lanthanide",
      atomicMass: 157.25,
      tableRow: 8,
      tableCol: 10,
      electronConfiguration: "[Xe] 4f⁷ 5d¹ 6s²",
      electronegativity: 1.2,
      density: 7.90,
      meltingPoint: 1585,
      boilingPoint: 3546,
      discoveredBy: "Jean Charles Galissard de Marignac",
      discoveryYear: 1880
    },
    {
      atomicNumber: 71,
      symbol: "Lu",
      name: "Lutetium",
      category: "lanthanide",
      atomicMass: 174.97,
      tableRow: 8,
      tableCol: 17,
      electronConfiguration: "[Xe] 4f¹⁴ 5d¹ 6s²",
      electronegativity: 1.27,
      density: 9.841,
      meltingPoint: 1925,
      boilingPoint: 3675,
      discoveredBy: "Georges Urbain",
      discoveryYear: 1907
    },
    
    // Actinides (selected elements from period 7)
    {
      atomicNumber: 89,
      symbol: "Ac",
      name: "Actinium",
      category: "actinide",
      atomicMass: 227,
      tableRow: 9,
      tableCol: 3,
      electronConfiguration: "[Rn] 6d¹ 7s²",
      electronegativity: 1.1,
      density: 10.07,
      meltingPoint: 1323,
      boilingPoint: 3471,
      discoveredBy: "Friedrich Oskar Giesel",
      discoveryYear: 1902
    },
    {
      atomicNumber: 90,
      symbol: "Th",
      name: "Thorium",
      category: "actinide",
      atomicMass: 232.04,
      tableRow: 9,
      tableCol: 4,
      electronConfiguration: "[Rn] 6d² 7s²",
      electronegativity: 1.3,
      density: 11.72,
      meltingPoint: 2115,
      boilingPoint: 5061,
      discoveredBy: "Jöns Jacob Berzelius",
      discoveryYear: 1829
    },
    {
      atomicNumber: 91,
      symbol: "Pa",
      name: "Protactinium",
      category: "actinide",
      atomicMass: 231.04,
      tableRow: 9,
      tableCol: 5,
      electronConfiguration: "[Rn] 5f² 6d¹ 7s²",
      electronegativity: 1.5,
      density: 15.37,
      meltingPoint: 1841,
      boilingPoint: 4300,
      discoveredBy: "William Crookes",
      discoveryYear: 1913
    },
    {
      atomicNumber: 92,
      symbol: "U",
      name: "Uranium",
      category: "actinide",
      atomicMass: 238.03,
      tableRow: 9,
      tableCol: 6,
      electronConfiguration: "[Rn] 5f³ 6d¹ 7s²",
      electronegativity: 1.38,
      density: 19.1,
      meltingPoint: 1405.3,
      boilingPoint: 4404,
      discoveredBy: "Martin Heinrich Klaproth",
      discoveryYear: 1789
    },
    {
      atomicNumber: 93,
      symbol: "Np",
      name: "Neptunium",
      category: "actinide",
      atomicMass: 237,
      tableRow: 9,
      tableCol: 7,
      electronConfiguration: "[Rn] 5f⁴ 6d¹ 7s²",
      electronegativity: 1.36,
      density: 20.45,
      meltingPoint: 917,
      boilingPoint: 4273,
      discoveredBy: "Edwin McMillan",
      discoveryYear: 1940
    },
    {
      atomicNumber: 102,
      symbol: "No",
      name: "Nobelium",
      category: "actinide",
      atomicMass: 259,
      tableRow: 9,
      tableCol: 16,
      electronConfiguration: "[Rn] 5f¹⁴ 7s²",
      electronegativity: 1.3,
      density: null,
      meltingPoint: 1100,
      boilingPoint: null,
      discoveredBy: "JIBR",
      discoveryYear: 1966
    },
    {
      atomicNumber: 103,
      symbol: "Lr",
      name: "Lawrencium",
      category: "actinide",
      atomicMass: 266,
      tableRow: 9,
      tableCol: 17,
      electronConfiguration: "[Rn] 5f¹⁴ 7s² 7p¹",
      electronegativity: 1.3,
      density: null,
      meltingPoint: 1900,
      boilingPoint: null,
      discoveredBy: "Lawrence Berkeley Laboratory",
      discoveryYear: 1961
    }
];
// src/components/ChemistryLab/VirtualExperiments.js
import React, { useState } from 'react';
import {
  Box, VStack, HStack, Text, Select, Button, Flex, Spacer,
  FormControl, FormLabel, useColorModeValue, Grid, GridItem,
  Card, CardBody, Heading, Divider, Badge, IconButton,
  Image, Accordion, AccordionItem, AccordionButton, AccordionPanel,
  AccordionIcon, OrderedList, ListItem, UnorderedList, Alert, AlertIcon,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, 
  ModalBody, ModalCloseButton, useDisclosure, Input, Textarea
} from '@chakra-ui/react';
import { InfoIcon, CheckIcon, WarningIcon } from '@chakra-ui/icons';

// Virtual experiments data
const experiments = [
  {
    id: 'acid-base-titration',
    name: 'Acid-Base Titration',
    description: 'Determine the concentration of an acid or base by precisely neutralizing it with a standard solution of known concentration.',
    difficulty: 'Intermediate',
    duration: '30-45 minutes',
    safety: [
      'Wear safety goggles and lab coat',
      'Handle acids and bases with care',
      'Know the location of eyewash station',
      'Dispose of chemicals properly'
    ],
    materials: [
      'Burette',
      'Pipette',
      'Erlenmeyer flask',
      'Phenolphthalein indicator',
      'Unknown acid solution',
      'Standard base solution (0.1M NaOH)'
    ],
    procedure: [
      'Set up the burette with NaOH solution',
      'Pipette 25mL of the unknown acid into the flask',
      'Add 2-3 drops of phenolphthalein indicator',
      'Slowly add NaOH from the burette while swirling the flask',
      'Stop when solution turns light pink (endpoint)',
      'Record the volume of NaOH used',
      'Calculate the concentration of the unknown acid'
    ],
    theory: 'In an acid-base titration, an acid reacts with a base to form a salt and water. The point at which the acid is completely neutralized by the base is called the equivalence point. An indicator changes color at this point, signaling that the titration is complete.',
    equations: [
      'HCl + NaOH → NaCl + H₂O',
      'n(acid) = n(base)',
      'C(acid) × V(acid) = C(base) × V(base)'
    ],
    results: {
      expectedColor: 'Light pink at endpoint',
      calculationExample: 'If 22.5mL of 0.1M NaOH neutralizes 25mL of HCl, then:\nC(HCl) = (22.5 × 0.1) ÷ 25 = 0.09M'
    }
  },
  {
    id: 'gas-laws',
    name: 'Investigating Gas Laws',
    description: 'Explore the relationship between pressure, volume, temperature, and amount of gas using a gas syringe setup.',
    difficulty: 'Advanced',
    duration: '45-60 minutes',
    safety: [
      'Ensure proper ventilation',
      'Wear safety goggles and gloves',
      'Handle gas cylinders with care',
      'No open flames nearby'
    ],
    materials: [
      'Gas pressure sensor',
      'Temperature probe',
      'Graduated gas syringe',
      'Water bath',
      'Various weights',
      'Thermometer'
    ],
    procedure: [
      'Fill the gas syringe with air to a specific volume',
      'Record the initial pressure, volume, and temperature',
      'For Boyle\'s Law: Add weights to increase pressure and record new volume',
      'For Charles\'s Law: Place syringe in water baths of different temperatures and record volume changes',
      'For each measurement, ensure one variable is changed while others remain constant',
      'Plot your results and analyze the relationships'
    ],
    theory: 'The ideal gas law PV = nRT combines several gas laws. Boyle\'s law states that pressure and volume are inversely proportional (P ∝ 1/V). Charles\'s law states that volume and temperature are directly proportional (V ∝ T).',
    equations: [
      'PV = nRT (Ideal Gas Law)',
      'P₁V₁ = P₂V₂ (Boyle\'s Law)',
      'V₁/T₁ = V₂/T₂ (Charles\'s Law)'
    ],
    results: {
      expectedTrends: 'For Boyle\'s Law: Hyperbolic curve when plotting P vs V\nFor Charles\'s Law: Linear relationship when plotting V vs T',
      calculationExample: 'If V₁ = 100mL at T₁ = 300K, then at T₂ = 330K:\nV₂ = V₁(T₂/T₁) = 100mL × (330K/300K) = 110mL'
    }
  },
  {
    id: 'flame-test',
    name: 'Flame Test for Metal Ions',
    description: 'Identify metal ions in compounds based on the characteristic colors they produce when burned in a flame.',
    difficulty: 'Beginner',
    duration: '15-30 minutes',
    safety: [
      'Work in a well-ventilated area',
      'Wear safety goggles and heat-resistant gloves',
      'Keep flammable materials away from the flame',
      'Have a fire extinguisher nearby',
      'Never taste or touch chemicals'
    ],
    materials: [
      'Bunsen burner',
      'Platinum or nichrome wire loop',
      'Concentrated HCl',
      'Various metal salt solutions (Li⁺, Na⁺, K⁺, Ca²⁺, Cu²⁺, etc.)',
      'Test tubes and rack',
      'Distilled water'
    ],
    procedure: [
      'Clean the wire loop by dipping in HCl and heating until no color appears in the flame',
      'Dip the clean loop in a test solution',
      'Place the loop in the hottest part of the flame',
      'Observe and record the color produced',
      'Clean the loop thoroughly between tests',
      'Compare your results with reference colors to identify ions'
    ],
    theory: 'When metal ions are heated in a flame, electrons become excited and jump to higher energy levels. When they return to their ground state, they emit photons of specific wavelengths, producing characteristic colors.',
    expectedResults: {
      'Lithium (Li⁺)': 'Crimson red',
      'Sodium (Na⁺)': 'Bright yellow',
      'Potassium (K⁺)': 'Lilac/purple',
      'Calcium (Ca²⁺)': 'Brick red',
      'Barium (Ba²⁺)': 'Pale green',
      'Copper (Cu²⁺)': 'Blue-green'
    }
  }
];

const VirtualExperiments = () => {
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [notes, setNotes] = useState('');
  const [experimentProgress, setExperimentProgress] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [labReport, setLabReport] = useState({
    title: '',
    observations: '',
    results: '',
    conclusions: ''
  });
  
  // Get color mode values
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const calculationBgColor = useColorModeValue("gray.50", "gray.700");
  
  // Handle experiment selection
  const handleExperimentChange = (e) => {
    const experimentId = e.target.value;
    const experiment = experiments.find(exp => exp.id === experimentId);
    setSelectedExperiment(experiment);
    setExperimentProgress([]);
    setNotes('');
  };
  
  // Handle step completion
  const toggleStepCompletion = (index) => {
    setExperimentProgress(prev => {
      const newProgress = [...prev];
      newProgress[index] = !newProgress[index];
      return newProgress;
    });
  };
  
  // Handle note changes
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };
  
  // Handle lab report field changes
  const handleReportChange = (field, value) => {
    setLabReport(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Generate lab report
  const generateLabReport = () => {
    // Pre-fill title from experiment
    if (selectedExperiment && !labReport.title) {
      handleReportChange('title', selectedExperiment.name + ' Lab Report');
    }
    onOpen();
  };
  
  // Export lab report
  const exportLabReport = () => {
    if (!selectedExperiment) return;
    
    const reportText = `# ${labReport.title || selectedExperiment.name + ' Lab Report'}
    
## Experiment
${selectedExperiment.name}

## Materials
${selectedExperiment.materials.map(m => '- ' + m).join('\n')}

## Procedure
${selectedExperiment.procedure.map((p, i) => `${i+1}. ${p}`).join('\n')}

## Observations
${labReport.observations || 'No observations recorded.'}

## Results
${labReport.results || 'No results recorded.'}

## Conclusions
${labReport.conclusions || 'No conclusions drawn.'}

## Notes
${notes || 'No additional notes.'}
`;
    
    // Create a download link
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedExperiment.name.replace(/\s+/g, '_')}_Lab_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    onClose();
  };
  
  return (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <FormLabel>Select Experiment</FormLabel>
        <Select
          placeholder="Choose an experiment"
          value={selectedExperiment?.id || ''}
          onChange={handleExperimentChange}
        >
          {experiments.map(experiment => (
            <option key={experiment.id} value={experiment.id}>
              {experiment.name} ({experiment.difficulty})
            </option>
          ))}
        </Select>
      </FormControl>
      
      {selectedExperiment ? (
        <Box
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          p={5}
          bg={cardBgColor}
        >
          <HStack mb={4}>
            <Heading size="md">{selectedExperiment.name}</Heading>
            <Badge colorScheme={
              selectedExperiment.difficulty === 'Beginner' ? 'green' :
              selectedExperiment.difficulty === 'Intermediate' ? 'blue' : 'purple'
            }>
              {selectedExperiment.difficulty}
            </Badge>
            <Badge colorScheme="orange">{selectedExperiment.duration}</Badge>
            <Spacer />
            <Button colorScheme="blue" onClick={generateLabReport}>
              Generate Lab Report
            </Button>
          </HStack>
          
          <Text mb={4}>{selectedExperiment.description}</Text>
          
          <Alert status="warning" mb={4}>
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Safety Precautions</Text>
              <UnorderedList>
                {selectedExperiment.safety.map((item, index) => (
                  <ListItem key={index}>{item}</ListItem>
                ))}
              </UnorderedList>
            </Box>
          </Alert>
          
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
            <GridItem>
              <Card>
                <CardBody>
                  <Heading size="sm" mb={2}>Materials</Heading>
                  <Divider mb={3} />
                  <UnorderedList>
                    {selectedExperiment.materials.map((material, index) => (
                      <ListItem key={index}>{material}</ListItem>
                    ))}
                  </UnorderedList>
                </CardBody>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card>
                <CardBody>
                  <Heading size="sm" mb={2}>Theory</Heading>
                  <Divider mb={3} />
                  <Text mb={3}>{selectedExperiment.theory}</Text>
                  
                  {selectedExperiment.equations && (
                    <>
                      <Text fontWeight="bold" mt={2}>Key Equations:</Text>
                      {selectedExperiment.equations.map((equation, index) => (
                        <Text key={index} fontFamily="monospace" ml={2}>
                          {equation}
                        </Text>
                      ))}
                    </>
                  )}
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
          
          <Card mt={6}>
            <CardBody>
              <Heading size="sm" mb={2}>Procedure</Heading>
              <Divider mb={3} />
              
              <OrderedList spacing={3}>
                {selectedExperiment.procedure.map((step, index) => (
                  <ListItem key={index} display="flex" alignItems="flex-start">
                    <IconButton
                      icon={experimentProgress[index] ? <CheckIcon /> : <InfoIcon />}
                      size="xs"
                      colorScheme={experimentProgress[index] ? "green" : "gray"}
                      onClick={() => toggleStepCompletion(index)}
                      mr={2}
                      mt={1}
                      aria-label={experimentProgress[index] ? "Completed" : "Not completed"}
                    />
                    <Text>{step}</Text>
                  </ListItem>
                ))}
              </OrderedList>
            </CardBody>
          </Card>
          
          <Card mt={6}>
            <CardBody>
              <Heading size="sm" mb={2}>Expected Results</Heading>
              <Divider mb={3} />
              
              {selectedExperiment.results && (
                <Box>
                  {selectedExperiment.results.expectedColor && (
                    <Text><strong>Expected Color:</strong> {selectedExperiment.results.expectedColor}</Text>
                  )}
                  
                  {selectedExperiment.results.expectedTrends && (
                    <Text><strong>Expected Trends:</strong> {selectedExperiment.results.expectedTrends}</Text>
                  )}
                  
                  {selectedExperiment.results.calculationExample && (
                    <>
                      <Text fontWeight="bold" mt={3}>Calculation Example:</Text>
                      <Box
                        fontFamily="monospace"
                        p={3}
                        bg={calculationBgColor}
                        borderRadius="md"
                        mt={1}
                        whiteSpace="pre-wrap"
                      >
                        {selectedExperiment.results.calculationExample}
                      </Box>
                    </>
                  )}
                </Box>
              )}
              
              {selectedExperiment.expectedResults && (
                <Box mt={3}>
                  <Text fontWeight="bold">Expected Results:</Text>
                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={3} mt={2}>
                    {Object.entries(selectedExperiment.expectedResults).map(([ion, color], index) => (
                      <GridItem key={index}>
                        <HStack>
                          <Box 
                            w="20px" 
                            h="20px" 
                            borderRadius="full" 
                            bg={
                              color.includes('red') ? 'red.400' :
                              color.includes('yellow') ? 'yellow.400' :
                              color.includes('green') ? 'green.400' :
                              color.includes('blue') ? 'blue.400' :
                              color.includes('purple') ? 'purple.400' :
                              'gray.400'
                            }
                          />
                          <Text><strong>{ion}:</strong> {color}</Text>
                        </HStack>
                      </GridItem>
                    ))}
                  </Grid>
                </Box>
              )}
            </CardBody>
          </Card>
          
          <Card mt={6}>
            <CardBody>
              <Heading size="sm" mb={2}>Lab Notes</Heading>
              <Divider mb={3} />
              <Textarea
                placeholder="Record your observations and notes here..."
                value={notes}
                onChange={handleNotesChange}
                minHeight="150px"
              />
            </CardBody>
          </Card>
        </Box>
      ) : (
        <Flex 
          direction="column" 
          align="center" 
          justify="center" 
          h="400px"
          borderWidth="1px"
          borderRadius="md"
          borderStyle="dashed"
          p={8}
        >
          <InfoIcon boxSize={12} color="gray.400" mb={4} />
          <Text fontSize="lg" fontWeight="medium" color="gray.500">
            Select an experiment to begin
          </Text>
          <Text color="gray.400" textAlign="center" mt={2}>
            Choose from our virtual chemistry experiments to learn about different chemical principles
          </Text>
        </Flex>
      )}
      
      {/* Lab Report Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Lab Report Generator</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Report Title</FormLabel>
                <Input
                  value={labReport.title}
                  onChange={(e) => handleReportChange('title', e.target.value)}
                  placeholder="Enter lab report title"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Observations</FormLabel>
                <Textarea
                  value={labReport.observations}
                  onChange={(e) => handleReportChange('observations', e.target.value)}
                  placeholder="Enter your observations"
                  h="100px"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Results</FormLabel>
                <Textarea
                  value={labReport.results}
                  onChange={(e) => handleReportChange('results', e.target.value)}
                  placeholder="Enter your results"
                  h="100px"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Conclusions</FormLabel>
                <Textarea
                  value={labReport.conclusions}
                  onChange={(e) => handleReportChange('conclusions', e.target.value)}
                  placeholder="Enter your conclusions"
                  h="100px"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={exportLabReport}>
              Export Report
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default VirtualExperiments;
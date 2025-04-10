// src/components/ChemistryLab/ReactionSimulator.js
import React, { useState, useRef, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Select, Button, Flex, Spacer,
  FormControl, FormLabel, useColorModeValue, Grid, GridItem,
  Card, CardBody, Heading, Divider, Badge, IconButton,
  Progress, Slider, SliderTrack, SliderFilledTrack, SliderThumb,
  useToast, Alert, AlertIcon, AlertTitle, AlertDescription
} from '@chakra-ui/react';
import { RepeatIcon, InfoIcon, WarningIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { commonReactions, commonMolecules } from './moleculesData';

const ReactionSimulator = () => {
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [reactionProgress, setReactionProgress] = useState(0);
  const [temperature, setTemperature] = useState(25); // Celsius
  const [pressure, setPressure] = useState(1); // atm
  const [isSimulating, setIsSimulating] = useState(false);
  const [reactionComplete, setReactionComplete] = useState(false);
  const [reactionRate, setReactionRate] = useState(1); // 1x speed
  const canvasRef = useRef(null);
  const simulationRef = useRef(null);
  const toast = useToast();
  
  // Move ALL color mode values to component level
  const bgColorCanvas = useColorModeValue('#FFFFFF', '#1A202C');
  const textColor = useColorModeValue('#000000', '#FFFFFF');
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const canvasBgColor = useColorModeValue('gray.50', 'gray.800');
  const progressBgColor = useColorModeValue('#EDF2F7', '#2D3748');
  const reactionTypeColor = useColorModeValue('#4A5568', '#A0AEC0');
  
  // Handle reaction selection from the dropdown
  const handleReactionChange = (e) => {
    const reactionId = e.target.value;
    const reaction = commonReactions.find(r => r.id === reactionId);
    setSelectedReaction(reaction);
    resetSimulation();
  };
  
  // Reset simulation state
  const resetSimulation = () => {
    setReactionProgress(0);
    setIsSimulating(false);
    setReactionComplete(false);
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
  };
  
  // Start the reaction simulation
  const startSimulation = () => {
    if (!selectedReaction) return;
    
    resetSimulation();
    setIsSimulating(true);
    
    // Calculate simulation speed based on conditions
    let simulationSpeed = 50; // Base speed in ms
    
    // Temperature effect (higher temp = faster reaction)
    const tempFactor = temperature > 25 ? 
      1 + ((temperature - 25) / 100) : 
      1 - ((25 - temperature) / 200);
    
    // Pressure effect (higher pressure = faster reaction for gas reactions)
    const pressureFactor = pressure > 1 ? 
      1 + ((pressure - 1) / 10) : 
      1 - ((1 - pressure) / 20);
    
    // Apply factors
    simulationSpeed = simulationSpeed / (tempFactor * pressureFactor * reactionRate);
    
    // Run the simulation with intervals
    simulationRef.current = setInterval(() => {
      setReactionProgress(prev => {
        const next = prev + 0.5;
        if (next >= 100) {
          clearInterval(simulationRef.current);
          setIsSimulating(false);
          setReactionComplete(true);
          
          // Show completion toast
          toast({
            title: 'Reaction Complete',
            description: `${selectedReaction.name} reaction has completed.`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          
          return 100;
        }
        return next;
      });
    }, simulationSpeed);
  };
  
  // Handle speed change
  const handleSpeedChange = (value) => {
    setReactionRate(value);
    
    // If already simulating, restart with new speed
    if (isSimulating) {
      clearInterval(simulationRef.current);
      
      // Calculate new interval
      let simulationSpeed = 50 / value;
      
      simulationRef.current = setInterval(() => {
        setReactionProgress(prev => {
          const next = prev + 0.5;
          if (next >= 100) {
            clearInterval(simulationRef.current);
            setIsSimulating(false);
            setReactionComplete(true);
            return 100;
          }
          return next;
        });
      }, simulationSpeed);
    }
  };
  
  // Stop the simulation
  const stopSimulation = () => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
    setIsSimulating(false);
  };
  
  // Draw the reaction visualization on canvas
  useEffect(() => {
    if (!canvasRef.current || !selectedReaction) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = bgColorCanvas;
    ctx.fillRect(0, 0, width, height);
    
    // Define colors and sizes
    const reactantColor = '#3182CE'; // Blue
    const productColor = '#38A169'; // Green
    const energyColor = selectedReaction.energyChange === 'Exothermic' ? '#E53E3E' : '#805AD5'; // Red or Purple
    
    // Draw reaction progress area
    const progressWidth = (width - 100) * (reactionProgress / 100);
    
    // Draw energy diagram based on reaction type
    if (selectedReaction.energyChange === 'Exothermic') {
      // Exothermic reaction (downhill energy)
      
      // Starting level
      ctx.fillStyle = reactantColor;
      ctx.fillRect(50, 100, 100, 20);
      
      // Activation energy hill
      ctx.beginPath();
      ctx.moveTo(150, 110);
      ctx.lineTo(200, 60); // Peak (transition state)
      ctx.lineTo(250, 130); // Product level
      ctx.lineTo(250, 150);
      ctx.lineTo(150, 130);
      ctx.closePath();
      ctx.fillStyle = energyColor;
      ctx.fill();
      
      // Product level
      ctx.fillStyle = productColor;
      ctx.fillRect(250, 130, 100, 20);
      
      // Energy released arrow
      if (reactionProgress > 60) {
        const arrowOpacity = Math.min(1, (reactionProgress - 60) / 40);
        ctx.fillStyle = `rgba(229, 62, 62, ${arrowOpacity})`;
        ctx.beginPath();
        ctx.moveTo(225, 150);
        ctx.lineTo(245, 180);
        ctx.lineTo(265, 150);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = `rgba(229, 62, 62, ${arrowOpacity})`;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Energy Released', 245, 210);
      }
    } else {
      // Endothermic reaction (uphill energy)
      
      // Starting level
      ctx.fillStyle = reactantColor;
      ctx.fillRect(50, 150, 100, 20);
      
      // Activation energy hill
      ctx.beginPath();
      ctx.moveTo(150, 160);
      ctx.lineTo(200, 60); // Peak (transition state)
      ctx.lineTo(250, 110); // Product level
      ctx.lineTo(250, 130);
      ctx.lineTo(150, 180);
      ctx.closePath();
      ctx.fillStyle = energyColor;
      ctx.fill();
      
      // Product level
      ctx.fillStyle = productColor;
      ctx.fillRect(250, 110, 100, 20);
      
      // Energy absorbed arrow
      if (reactionProgress > 20 && reactionProgress < 80) {
        const arrowOpacity = Math.min(1, (reactionProgress - 20) / 60);
        ctx.fillStyle = `rgba(128, 90, 213, ${arrowOpacity})`;
        ctx.beginPath();
        ctx.moveTo(175, 120);
        ctx.lineTo(175, 80);
        ctx.lineTo(155, 100);
        ctx.moveTo(175, 80);
        ctx.lineTo(195, 100);
        ctx.stroke();
        
        ctx.fillStyle = `rgba(128, 90, 213, ${arrowOpacity})`;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Energy Absorbed', 175, 60);
      }
    }
    
    // Draw reaction progress
    ctx.fillStyle = progressBgColor;
    ctx.fillRect(50, 250, width - 100, 30);
    
    ctx.fillStyle = reactionProgress < 100 ? '#3182CE' : '#38A169';
    ctx.fillRect(50, 250, progressWidth, 30);
    
    // Draw progress label
    ctx.fillStyle = textColor;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(reactionProgress)}%`, width / 2, 270);
    
    // Labels
    ctx.fillStyle = textColor;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Reaction Progress', width / 2, 300);
    
    ctx.textAlign = 'left';
    ctx.fillText('Reactants', 50, 80);
    
    ctx.textAlign = 'right';
    ctx.fillText('Products', width - 50, 80);
    
    ctx.textAlign = 'center';
    ctx.fillText('Energy Diagram', width / 2, 30);
    
    // Reaction arrow
    const arrowY = 330;
    ctx.beginPath();
    ctx.moveTo(100, arrowY);
    ctx.lineTo(width - 100, arrowY);
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(width - 100, arrowY);
    ctx.lineTo(width - 110, arrowY - 5);
    ctx.lineTo(width - 110, arrowY + 5);
    ctx.closePath();
    ctx.fill();
    
    // Draw reactants and products as molecules
    if (selectedReaction.reactants && selectedReaction.products) {
      // Only draw molecules if we have fewer than 3 on each side
      if (selectedReaction.reactants.length <= 2 && selectedReaction.products.length <= 2) {
        // Find molecule data
        const reactants = selectedReaction.reactants
          .map(id => commonMolecules.find(m => m.id === id))
          .filter(Boolean);
          
        const products = selectedReaction.products
          .map(id => commonMolecules.find(m => m.id === id))
          .filter(Boolean);
        
        // Draw reactants
        let reactantX = 100;
        reactants.forEach((molecule, index) => {
          if (!molecule) return;
          
          const y = arrowY + 50;
          
          // Draw circle with label
          ctx.beginPath();
          ctx.arc(reactantX, y, 25, 0, Math.PI * 2);
          ctx.fillStyle = reactantColor;
          ctx.fill();
          
          // Draw label
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(molecule.formula, reactantX, y);
          
          reactantX += 80;
        });
        
        // Draw products
        let productX = width - 100;
        products.forEach((molecule, index) => {
          if (!molecule) return;
          
          const y = arrowY + 50;
          
          // Only show products based on reaction progress
          const opacity = Math.min(1, reactionProgress / 100);
          
          // Draw circle with label
          ctx.beginPath();
          ctx.arc(productX, y, 25, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(56, 161, 105, ${opacity})`;
          ctx.fill();
          
          // Draw label
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(molecule.formula, productX, y);
          
          productX -= 80;
        });
      } else {
        // Just show the reaction equation for complex reactions
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(selectedReaction.equation, width / 2, arrowY + 50);
      }
    }
    
    // Draw reaction type
    if (selectedReaction.type) {
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Key fix: use the precalculated color value instead of useColorModeValue here
      ctx.fillStyle = reactionTypeColor;
      ctx.fillText(selectedReaction.type + ' Reaction', width / 2, arrowY + 120);
    }
    
  }, [selectedReaction, reactionProgress, bgColorCanvas, textColor, progressBgColor, reactionTypeColor]);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, []);
  
  return (
    <VStack spacing={6} align="stretch">
      <HStack spacing={4}>
        <FormControl maxW="350px">
          <FormLabel>Select Chemical Reaction</FormLabel>
          <Select
            placeholder="Choose a reaction"
            value={selectedReaction?.id || ''}
            onChange={handleReactionChange}
          >
            {commonReactions.map(reaction => (
              <option key={reaction.id} value={reaction.id}>
                {reaction.name} - {reaction.equation}
              </option>
            ))}
          </Select>
        </FormControl>
        
        <Spacer />
        
        <VStack spacing={1} width="200px">
          <FormControl>
            <FormLabel fontSize="sm">Temperature (°C)</FormLabel>
            <Slider
              min={0}
              max={100}
              step={5}
              value={temperature}
              onChange={value => setTemperature(value)}
              isDisabled={isSimulating}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={6}>
                <Text fontSize="xs">{temperature}</Text>
              </SliderThumb>
            </Slider>
          </FormControl>
          
          <FormControl>
            <FormLabel fontSize="sm">Pressure (atm)</FormLabel>
            <Slider
              min={0.1}
              max={5}
              step={0.1}
              value={pressure}
              onChange={value => setPressure(value)}
              isDisabled={isSimulating}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={6}>
                <Text fontSize="xs">{pressure.toFixed(1)}</Text>
              </SliderThumb>
            </Slider>
          </FormControl>
        </VStack>
      </HStack>
      
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        p={4}
        bg={cardBgColor}
      >
        {selectedReaction ? (
          <>
            <HStack mb={4}>
              <Heading size="md">{selectedReaction.name}</Heading>
              <Badge colorScheme={selectedReaction.energyChange === 'Exothermic' ? 'red' : 'purple'}>
                {selectedReaction.energyChange}
              </Badge>
              <Spacer />
              <HStack>
                <Text fontSize="sm">Simulation Speed:</Text>
                <Select
                  size="sm"
                  width="100px"
                  value={reactionRate}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={5}>5x</option>
                </Select>
              </HStack>
            </HStack>
            
            <Flex direction={{ base: 'column', md: 'row' }} gap={6}>
              <Box flex="1.5">
                <Box 
                  borderWidth="1px" 
                  borderRadius="md" 
                  overflow="hidden"
                  height="400px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg={canvasBgColor}
                >
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={400}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </Box>
                
                <HStack mt={4} justify="center" spacing={6}>
                  <Button
                    leftIcon={<ArrowForwardIcon />}
                    colorScheme="blue"
                    onClick={startSimulation}
                    isLoading={isSimulating}
                    loadingText="Simulating..."
                    isDisabled={!selectedReaction || reactionComplete}
                  >
                    Start Reaction
                  </Button>
                  
                  <Button
                    colorScheme="gray"
                    onClick={stopSimulation}
                    isDisabled={!isSimulating}
                  >
                    Pause
                  </Button>
                  
                  <Button
                    rightIcon={<RepeatIcon />}
                    variant="outline"
                    onClick={resetSimulation}
                    isDisabled={!selectedReaction || (!reactionProgress && !reactionComplete)}
                  >
                    Reset
                  </Button>
                </HStack>
              </Box>
              
              <Box flex="1">
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={2}>Reaction Information</Heading>
                    <Divider mb={3} />
                    
                    <Text fontWeight="bold">Balanced Equation:</Text>
                    <Text mb={2}>{selectedReaction.equation}</Text>
                    
                    <Text fontWeight="bold">Reaction Type:</Text>
                    <Text mb={2}>{selectedReaction.type}</Text>
                    
                    <Text fontWeight="bold">Energy Change:</Text>
                    <HStack mb={2}>
                      <Badge colorScheme={selectedReaction.energyChange === 'Exothermic' ? 'red' : 'purple'}>
                        {selectedReaction.energyChange}
                      </Badge>
                      <Text>{selectedReaction.energyValue} kJ/mol</Text>
                    </HStack>
                    
                    <Text fontWeight="bold">Reaction Conditions:</Text>
                    <Text mb={2}>{selectedReaction.conditions}</Text>
                    
                    <Text fontWeight="bold">Details:</Text>
                    <Text mb={2}>{selectedReaction.details}</Text>
                    
                    <Heading size="sm" mt={4} mb={2}>Applications</Heading>
                    <Divider mb={3} />
                    <Box>
                      {selectedReaction.applications.map((app, index) => (
                        <Text key={index} fontSize="sm" mb={1}>• {app}</Text>
                      ))}
                    </Box>
                  </CardBody>
                </Card>
                
                {selectedReaction.energyChange === 'Exothermic' && (
                  <Alert status="warning" mt={4} borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Caution: Exothermic Reaction</AlertTitle>
                      <AlertDescription>
                        This reaction releases heat and may cause temperature increases in real laboratory settings.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </Box>
            </Flex>
          </>
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
              Select a reaction to begin simulation
            </Text>
            <Text color="gray.400" textAlign="center" mt={2}>
              Choose from common chemical reactions to visualize their progress and energy changes
            </Text>
          </Flex>
        )}
      </Box>
    </VStack>
  );
};

export default ReactionSimulator;
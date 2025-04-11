// src/components/ChemistryLab/MoleculeViewer.js
import React, { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Select, Button, Flex, Spacer,
  FormControl, FormLabel, useColorModeValue, Grid, GridItem,
  Card, CardBody, Heading, Divider, Badge, IconButton,
  useToast, Image
} from '@chakra-ui/react';
import { DownloadIcon, ViewIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { commonMolecules } from './moleculesData';

// Direct URLs to molecule images - guaranteed to work
const moleculeImageMap = {
  // Ammonia - the one in your screenshots
  'nh3': {
    'ball-and-stick': 'https://upload.wikimedia.org/wikipedia/commons/4/41/Ammonia-3D-balls.png',
    'space-filling': 'https://upload.wikimedia.org/wikipedia/commons/9/97/Ammonia-3D-vdW.png'
  },
  // Water
  'h2o': {
    'ball-and-stick': 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Water-3D-balls-A.png',
    'space-filling': 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Water_molecule_3D.svg'
  },
  // Carbon Dioxide
  'co2': {
    'ball-and-stick': 'https://upload.wikimedia.org/wikipedia/commons/a/af/Carbon_dioxide_3D_ball-and-stick.png',
    'space-filling': 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Carbon_dioxide_3D_spacefill.png'
  },
  // Methane
  'ch4': {
    'ball-and-stick': 'https://upload.wikimedia.org/wikipedia/commons/4/49/Methane-3D-balls.png',
    'space-filling': 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Methane-3D-vdW.png'
  },
  // Add more as needed
};

const MoleculeViewer = ({ molecule: propMolecule, onMoleculeSelect }) => {
  const [selectedMolecule, setSelectedMolecule] = useState(propMolecule || null);
  const [viewType, setViewType] = useState('ball-and-stick');
  const [imageLoaded, setImageLoaded] = useState(false);
  const toast = useToast();
  
  // Color modes
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const canvasBgColor = useColorModeValue('gray.50', 'gray.800');
  
  // Handle molecule selection from dropdown
  const handleMoleculeChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const molecule = commonMolecules.find(m => m.id === selectedId);
      setSelectedMolecule(molecule);
      setImageLoaded(false); // Reset image loaded state
      if (onMoleculeSelect) {
        onMoleculeSelect(molecule);
      }
    } else {
      setSelectedMolecule(null);
    }
  };
  
  // Handle view type change
  const handleViewTypeChange = (e) => {
    setViewType(e.target.value);
    setImageLoaded(false); // Reset image loaded state
  };
  
  // Get the image URL for the selected molecule and view type
  const getMoleculeImageUrl = () => {
    if (!selectedMolecule) return null;
    
    // Check if we have images for this molecule
    if (moleculeImageMap[selectedMolecule.id] && 
        moleculeImageMap[selectedMolecule.id][viewType]) {
      return moleculeImageMap[selectedMolecule.id][viewType];
    }
    
    // If not, return null to show the fallback
    return null;
  };
  
  // Create URL for external 3D viewer (like MolView)
  const getExternalViewerUrl = () => {
    if (!selectedMolecule) return '#';
    
    // Clean formula for URL (replace subscripts with numbers)
    const formula = selectedMolecule.formula.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, 
      digit => '0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(digit)]);
    
    return `https://molview.org/?q=${encodeURIComponent(formula)}`;
  };
  
  // Handle image load success
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  // Handle image load error
  const handleImageError = () => {
    setImageLoaded(false);
  };
  
  return (
    <VStack spacing={6} align="stretch">
      <HStack>
        <FormControl maxW="300px">
          <FormLabel>Select Molecule</FormLabel>
          <Select
            placeholder="Choose a molecule"
            value={selectedMolecule?.id || ''}
            onChange={handleMoleculeChange}
          >
            {commonMolecules.map(molecule => (
              <option key={molecule.id} value={molecule.id}>
                {molecule.name} ({molecule.formula})
              </option>
            ))}
          </Select>
        </FormControl>
        
        <Spacer />
        
        <FormControl maxW="200px">
          <FormLabel>View Type</FormLabel>
          <Select value={viewType} onChange={handleViewTypeChange}>
            <option value="ball-and-stick">Ball and Stick</option>
            <option value="space-filling">Space Filling</option>
          </Select>
        </FormControl>
      </HStack>
      
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        p={4}
        bg={cardBgColor}
      >
        {selectedMolecule ? (
          <>
            <HStack mb={4}>
              <Heading size="md">{selectedMolecule.name}</Heading>
              <Badge colorScheme="blue">{selectedMolecule.type}</Badge>
              <Spacer />
              <Button
                leftIcon={<ExternalLinkIcon />}
                colorScheme="blue"
                size="sm"
                onClick={() => window.open(getExternalViewerUrl(), '_blank')}
              >
                View in 3D
              </Button>
              <IconButton
                icon={<DownloadIcon />}
                aria-label="Download image"
                size="sm"
                isDisabled={!imageLoaded}
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = getMoleculeImageUrl();
                  link.download = `${selectedMolecule.name}-${viewType}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  toast({
                    title: "Image downloaded",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                  });
                }}
              />
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
                  position="relative"
                >
                  {getMoleculeImageUrl() ? (
                    <Image
                      src={getMoleculeImageUrl()}
                      alt={`${selectedMolecule.name} ${viewType} model`}
                      maxH="380px"
                      objectFit="contain"
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                    />
                  ) : (
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      height="100%"
                      width="100%"
                      p={4}
                      color="gray.500"
                    >
                      <ViewIcon boxSize="50px" mb={4} />
                      <Text fontSize="lg" textAlign="center">Molecule Image Not Available</Text>
                      <Text fontSize="sm" mt={2} textAlign="center">
                        Click "View in 3D" for interactive model
                      </Text>
                    </Flex>
                  )}
                  
                  {imageLoaded && (
                    <Text 
                      position="absolute" 
                      bottom="5px" 
                      right="5px" 
                      fontSize="xs" 
                      color="gray.500"
                    >
                      Source: Wikimedia Commons
                    </Text>
                  )}
                </Box>
                
                <Text mt={2} textAlign="center" fontSize="sm" color="gray.500">
                  Current view: {viewType === 'ball-and-stick' ? 'Ball and Stick' : 'Space Filling'}
                </Text>
              </Box>
              
              <Box flex="1">
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={2}>Molecular Information</Heading>
                    <Divider mb={3} />
                    <Grid templateColumns="auto 1fr" gap={2}>
                      <GridItem fontWeight="bold">Formula:</GridItem>
                      <GridItem>{selectedMolecule.formula}</GridItem>
                      
                      <GridItem fontWeight="bold">Molecular Weight:</GridItem>
                      <GridItem>{selectedMolecule.molWeight} g/mol</GridItem>
                      
                      <GridItem fontWeight="bold">State at 25°C:</GridItem>
                      <GridItem>{selectedMolecule.state}</GridItem>
                      
                      <GridItem fontWeight="bold">Melting Point:</GridItem>
                      <GridItem>{selectedMolecule.meltingPoint}°C</GridItem>
                      
                      <GridItem fontWeight="bold">Boiling Point:</GridItem>
                      <GridItem>{selectedMolecule.boilingPoint}°C</GridItem>
                      
                      <GridItem fontWeight="bold">Density:</GridItem>
                      <GridItem>{selectedMolecule.density} g/cm³</GridItem>
                    </Grid>
                    
                    <Heading size="sm" mt={4} mb={2}>Properties</Heading>
                    <Divider mb={3} />
                    <Text>{selectedMolecule.description}</Text>
                    
                    <Heading size="sm" mt={4} mb={2}>Common Uses</Heading>
                    <Divider mb={3} />
                    <Box>
                      {selectedMolecule.uses.map((use, index) => (
                        <Text key={index} fontSize="sm" mb={1}>• {use}</Text>
                      ))}
                    </Box>
                  </CardBody>
                </Card>
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
            <ViewIcon boxSize={12} color="gray.400" mb={4} />
            <Text fontSize="lg" fontWeight="medium" color="gray.500">
              Select a molecule to display
            </Text>
            <Text color="gray.400" textAlign="center" mt={2}>
              Choose from common molecules in the dropdown above
            </Text>
          </Flex>
        )}
      </Box>
      
      {/* View type explanation */}
      <Card>
        <CardBody>
          <Heading size="sm" mb={2}>About Molecular Visualization</Heading>
          <Divider mb={3} />
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
            <Box>
              <Text fontWeight="bold">Ball and Stick Model</Text>
              <Text fontSize="sm">
                This representation shows atoms as small spheres connected by rods (bonds).
                It emphasizes the bond connectivity and molecular geometry while allowing
                a clear view of the overall structure.
              </Text>
            </Box>
            <Box>
              <Text fontWeight="bold">Space Filling Model</Text>
              <Text fontSize="sm">
                Also called CPK model, this shows atoms as spheres with their van der Waals radii,
                representing the space they occupy. It displays the overall shape and size of the
                molecule but may obscure internal structural details.
              </Text>
            </Box>
          </Grid>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default MoleculeViewer;
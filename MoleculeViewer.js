// src/components/ChemistryLab/MoleculeViewer.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, VStack, HStack, Text, Select, Button, Flex, Spacer,
  FormControl, FormLabel, useColorModeValue, Grid, GridItem,
  Card, CardBody, Heading, Divider, Badge, IconButton,
  useToast
} from '@chakra-ui/react';
import { DownloadIcon, ViewIcon, InfoIcon, SmallAddIcon } from '@chakra-ui/icons';
import { commonMolecules } from './moleculesData';

const MoleculeViewer = ({ molecule: propMolecule, onMoleculeSelect }) => {
  const [selectedMolecule, setSelectedMolecule] = useState(propMolecule || null);
  const [viewType, setViewType] = useState('ball-and-stick');
  const canvasRef = useRef(null);
  const toast = useToast();
  
  // Move color mode values to component level
  const bgColorCanvas = useColorModeValue('#FFFFFF', '#1A202C');
  const textColor = useColorModeValue('#000000', '#FFFFFF');
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const canvasBgColor = useColorModeValue('gray.50', 'gray.800');
  
  // Define color scheme for atoms based on element type
  const atomColors = {
    H: '#FFFFFF', // White
    C: '#909090', // Gray
    N: '#3050F8', // Blue
    O: '#FF0D0D', // Red
    F: '#90E050', // Light Green
    Cl: '#1FF01F', // Bright Green
    Br: '#A62929', // Brown
    I: '#940094',  // Dark Purple
    S: '#FFFF30',  // Yellow
    P: '#FF8000',  // Orange
    // Add more elements as needed
  };
  
  // Define van der Waals radii for space-filling model (in Angstroms)
  const atomRadii = {
    H: 1.2,
    C: 1.7,
    N: 1.55,
    O: 1.52,
    F: 1.47,
    Cl: 1.75,
    Br: 1.85,
    I: 1.98,
    S: 1.8,
    P: 1.8,
    // Default for other elements
    default: 1.7
  };
  
  // Handle molecule selection from the dropdown
  const handleMoleculeChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const molecule = commonMolecules.find(m => m.id === selectedId);
      setSelectedMolecule(molecule);
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
  };
  
  // Render molecule on canvas using basic 2D representation
  useEffect(() => {
    if (!selectedMolecule || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = bgColorCanvas;
    ctx.fillRect(0, 0, width, height);
    
    // Draw molecule - simplified 2D representation
    const atoms = selectedMolecule.structure.atoms;
    const bonds = selectedMolecule.structure.bonds;
    
    // Calculate scale and center position
    const padding = 50;
    const scale = Math.min(
      (width - padding * 2) / selectedMolecule.structure.boundingBox.width,
      (height - padding * 2) / selectedMolecule.structure.boundingBox.height
    ) * 0.8;
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Determine if we're using space-filling or ball-and-stick model
    const isSpaceFilling = viewType === 'space-filling';
    
    // Draw bonds first (so they appear behind atoms) but only for ball-and-stick
    if (!isSpaceFilling) {
      ctx.lineWidth = 3; // Thinner bonds for ball-and-stick
      
      bonds.forEach(bond => {
        const atom1 = atoms[bond.from];
        const atom2 = atoms[bond.to];
        
        const x1 = centerX + (atom1.x - selectedMolecule.structure.center.x) * scale;
        const y1 = centerY + (atom1.y - selectedMolecule.structure.center.y) * scale;
        const x2 = centerX + (atom2.x - selectedMolecule.structure.center.x) * scale;
        const y2 = centerY + (atom2.y - selectedMolecule.structure.center.y) * scale;
        
        // Draw bond line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#666666';
        ctx.stroke();
        
        // For double or triple bonds
        if (bond.type >= 2) {
          // Calculate perpendicular vector for offset
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const offsetX = -dy / len * 5;
          const offsetY = dx / len * 5;
          
          // Draw second bond line
          ctx.beginPath();
          ctx.moveTo(x1 + offsetX, y1 + offsetY);
          ctx.lineTo(x2 + offsetX, y2 + offsetY);
          ctx.stroke();
          
          // For triple bonds
          if (bond.type === 3) {
            ctx.beginPath();
            ctx.moveTo(x1 - offsetX, y1 - offsetY);
            ctx.lineTo(x2 - offsetX, y2 - offsetY);
            ctx.stroke();
          }
        }
      });
    }
    
    // Draw atoms
    atoms.forEach(atom => {
      const x = centerX + (atom.x - selectedMolecule.structure.center.x) * scale;
      const y = centerY + (atom.y - selectedMolecule.structure.center.y) * scale;
      
      // Radius depends on view type and element
      let radius;
      if (isSpaceFilling) {
        // Space-filling uses van der Waals radii
        const vdwRadius = atomRadii[atom.element] || atomRadii.default;
        radius = vdwRadius * scale * 10; // Scale up for visibility
      } else {
        // Ball-and-stick uses smaller radii
        radius = atom.element === 'H' ? 6 : 10;
      }
      
      // Draw atom circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = atomColors[atom.element] || '#909090';
      ctx.fill();
      
      // For space-filling, add a subtle outline
      if (isSpaceFilling) {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // Add element symbol for ball-and-stick view
      if (!isSpaceFilling) {
        ctx.fillStyle = atom.element === 'C' ? '#000000' : '#FFFFFF';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(atom.element, x, y);
      }
    });
    
    // Draw molecule name
    ctx.fillStyle = textColor;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(selectedMolecule.name, centerX, height - 20);
    
  }, [selectedMolecule, viewType, bgColorCanvas, textColor, atomColors]);
  
  // Handle download as image
  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    try {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${selectedMolecule?.name || 'molecule'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Image Downloaded',
        description: `Saved ${selectedMolecule?.name || 'molecule'}.png`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not download the molecule image',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
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
              <IconButton
                icon={<DownloadIcon />}
                aria-label="Download as image"
                onClick={handleDownload}
                size="sm"
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
                >
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={380}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
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
              Choose from common molecules in the dropdown above or search for a specific compound
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
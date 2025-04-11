import React, { useState } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Select, 
  Grid, 
  GridItem, 
  Text, 
  useColorModeValue,
  Avatar,
  HStack,
  Button,
  Icon
} from '@chakra-ui/react';
import { 
  ViewIcon, 
  StarIcon,
  InfoIcon,
  AttachmentIcon
} from '@chakra-ui/icons';

// Define subjects and their tools
const STREAMS = {
  utilities: {
    name: 'Utilities',
    tools: [
      { 
        name: 'File Converter', 
        description: 'Convert documents between different formats', 
        icon: AttachmentIcon,
        action: 'fileConverter'
      }
    ]
  },
  stem: {
    name: 'STEM',
    tools: [
      { 
        name: 'Chemistry Lab', 
        description: 'Interactive chemistry experiments and tools', 
        icon: ViewIcon,
        action: 'chemistryLab'
      }
    ]
  },
  humanities: {
    name: 'Humanities',
    tools: [
      { 
        name: 'Timeline Generator', 
        description: 'Create historical event timelines', 
        icon: StarIcon,
        action: 'historyTimeline'
      }
    ]
  },
  socialSciences: {
    name: 'Social Sciences',
    tools: [
      { 
        name: 'Economics Simulator', 
        description: 'Economic scenario and analysis tools', 
        icon: StarIcon,
        action: 'economicsSimulator'
      }
    ]
  }
};

const Dashboard = ({ onToolSelect }) => {
  const [selectedStream, setSelectedStream] = useState('');
  
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const handleStreamChange = (e) => {
    setSelectedStream(e.target.value);
  };
  
  const handleToolClick = (action) => {
    if (onToolSelect) {
      onToolSelect(action);
    } else {
      console.error('onToolSelect is not a function');
    }
  };
  
  return (
    <Box h="100vh" bg={bgColor}>
      <Flex 
        as="header" 
        align="center" 
        justify="space-between" 
        p={4} 
        borderBottomWidth={1}
        borderBottomColor={borderColor}
      >
        <HStack spacing={4} w="300px">
          <Select 
            placeholder="Select Stream" 
            value={selectedStream}
            onChange={handleStreamChange}
            w="full"
          >
            {Object.entries(STREAMS).map(([key, stream]) => (
              <option key={key} value={key}>
                {stream.name}
              </option>
            ))}
          </Select>
        </HStack>
        
        <Heading textAlign="center" flex={1}>
          Skill Stack
        </Heading>
        
        <Avatar 
          size="md" 
          name="User" 
          w="50px" 
          h="50px"
        />
      </Flex>
      
      <Box p={8}>
        {selectedStream ? (
          <Grid 
            templateColumns="repeat(auto-fill, minmax(250px, 1fr))" 
            gap={6}
          >
            {STREAMS[selectedStream].tools.map((tool) => (
              <GridItem key={tool.name}>
                <Box
                  bg={cardBg}
                  borderWidth={1}
                  borderColor={borderColor}
                  borderRadius="lg"
                  p={6}
                  textAlign="center"
                  transition="all 0.2s"
                  _hover={{
                    transform: 'scale(1.05)',
                    boxShadow: 'md'
                  }}
                >
                  <Icon 
                    as={tool.icon} 
                    boxSize={12} 
                    color="blue.500" 
                    mb={4}
                  />
                  <Heading size="md" mb={2}>
                    {tool.name}
                  </Heading>
                  <Text color="gray.500" mb={4}>
                    {tool.description}
                  </Text>
                  <Button 
                    colorScheme="blue" 
                    onClick={() => handleToolClick(tool.action)}
                  >
                    Open Tool
                  </Button>
                </Box>
              </GridItem>
            ))}
          </Grid>
        ) : (
          <Flex 
            direction="column" 
            align="center" 
            justify="center" 
            h="calc(100vh - 200px)"
          >
            <InfoIcon boxSize={20} color="blue.500" />
            <Heading mt={6} mb={4} textAlign="center">
              Welcome to Skill Stack
            </Heading>
            <Text color="gray.500" textAlign="center" maxW="600px">
              Select a stream from the dropdown to explore educational tools 
              designed to enhance your learning experience across various disciplines.
            </Text>
          </Flex>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
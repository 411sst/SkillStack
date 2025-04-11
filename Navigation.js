import React from 'react';
import { VStack, Button, Text } from '@chakra-ui/react';
import { 
  AttachmentIcon, 
  ViewIcon, 
  StarIcon 
} from '@chakra-ui/icons';

const Navigation = ({ activeTool, setActiveTool }) => {
  const tools = [
    { id: 'fileConverter', name: 'File Converter', icon: <AttachmentIcon mr={2} /> },
    { id: 'chemistryLab', name: 'Chemistry Lab', icon: <ViewIcon mr={2} />, disabled: false },
    { id: 'physicsSimulator', name: 'Physics Simulator', icon: <StarIcon mr={2} />, disabled: true },
  ];

  return (
    <VStack spacing={4} align="stretch">
      {tools.map((tool) => (
        <Button
          key={tool.id}
          leftIcon={tool.icon}
          colorScheme={activeTool === tool.id ? 'brand' : 'gray'}
          variant={activeTool === tool.id ? 'solid' : 'ghost'}
          justifyContent="flex-start"
          isDisabled={tool.disabled}
          onClick={() => setActiveTool(tool.id)}
        >
          {tool.name}
          {tool.disabled && (
            <Text as="span" fontSize="xs" ml={2} color="gray.500">
              (Coming Soon)
            </Text>
          )}
        </Button>
      ))}
    </VStack>
  );
};

export default Navigation;
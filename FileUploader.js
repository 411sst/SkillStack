import React, { useRef, useState } from 'react';
import { Box, Button, Center, Icon, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';

const FileUploader = ({ onFileSelect }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };
  
  const openFileDialog = () => {
    fileInputRef.current.click();
  };
  
  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };
  
  const browseFiles = async () => {
  try {
    // Make sure we're accessing the API through window.electronAPI
    const filePaths = await window.electronAPI.openFileDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Documents', extensions: ['docx', 'pdf', 'ppt', 'pptx'] }
      ]
    });
    
    if (filePaths && filePaths.length > 0) {
      const filePath = filePaths[0];
      const fileName = filePath.split('\\').pop().split('/').pop(); // Works for both Windows and Unix paths
      const fileData = await window.electronAPI.readFile(filePath);
      
      // Create a File object with the data
      const file = new File([new Uint8Array(fileData)], fileName, {
        type: getFileType(fileName)
      });
      
      onFileSelect(file);
    }
  } catch (err) {
    console.error('Error selecting file:', err);
    alert(`Error selecting file: ${err.message}`);
  }
};
  
  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'pdf':
        return 'application/pdf';
      case 'ppt':
        return 'application/vnd.ms-powerpoint';
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      default:
        return 'application/octet-stream';
    }
  };
  
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue(
    isDragging ? 'blue.500' : 'gray.200',
    isDragging ? 'blue.500' : 'gray.600'
  );
  
  return (
    <Box>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInput} 
        style={{ display: 'none' }} 
        accept=".docx,.pdf,.ppt,.pptx"
      />
      
      <Box
        border="2px dashed"
        borderColor={borderColor}
        borderRadius="md"
        bg={bgColor}
        p={6}
        transition="all 0.2s"
        _hover={{ borderColor: 'blue.300' }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Center>
          <VStack spacing={3}>
            <Icon as={AttachmentIcon} boxSize={8} color="blue.500" />
            <Text textAlign="center" fontWeight="medium">
              Drag and drop a file here, or click to browse
            </Text>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Supported formats: DOCX, PDF, PPT, PPTX
            </Text>
            <Button 
              size="sm" 
              colorScheme="blue" 
              onClick={browseFiles}
            >
              Browse Files
            </Button>
          </VStack>
        </Center>
      </Box>
    </Box>
  );
};

export default FileUploader;
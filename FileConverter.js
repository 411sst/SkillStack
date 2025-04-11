import React, { useState } from 'react';
import { 
  Box, VStack, Heading, Text, Button, Input,
  FormControl, FormLabel, Select, useToast, Flex,
  Progress
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';

// Map file extensions to PRONOM codes
const extensionToPRONOM = {
  'pdf': 'fmt/276',   // PDF 1.7
  'docx': 'fmt/412',  // DOCX
  'pptx': 'fmt/215'   // PPTX
};

const FileConverter = ({ onBack }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [conversionType, setConversionType] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFile, setConvertedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const toast = useToast();
  
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setConvertedFile(null);
    }
  };
  
  const handleConversionTypeChange = (e) => {
    setConversionType(e.target.value);
    setConvertedFile(null);
  };
  
  const handleConversion = async () => {
    if (!selectedFile || !conversionType) {
      toast({
        title: "Missing information",
        description: "Please select a file and conversion type",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Set up conversion parameters
    const sourceFormat = selectedFile.name.split('.').pop().toLowerCase();
    const targetFormat = conversionType.split('to')[1].toLowerCase();
    
    // Get PRONOM codes
    const sourcePRONOM = extensionToPRONOM[sourceFormat];
    const targetPRONOM = extensionToPRONOM[targetFormat];
    
    if (!sourcePRONOM || !targetPRONOM) {
      toast({
        title: "Unsupported format",
        description: "The selected file format or conversion type is not supported",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Get temporary file paths for input and output
    const inputPath = await window.electronAPI.saveFileDialog({
      title: 'Save input file temporarily',
      defaultPath: selectedFile.path || selectedFile.name,
      buttonLabel: 'Save',
      properties: ['showHiddenFiles']
    });
    
    if (!inputPath) return;
    
    const outputPath = inputPath.replace(`.${sourceFormat}`, `.${targetFormat}`);
    
    setIsConverting(true);
    setProgress(0);
    
    // Read file as array buffer
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // Write input file
        await window.electronAPI.writeFile(inputPath, event.target.result);
        
        // Start progress simulation
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev + 5;
            if (newProgress >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return newProgress;
          });
        }, 200);
        
        // Call C# conversion function
        await window.fileConverter.convertFile(
          inputPath,
          outputPath,
          sourcePRONOM,
          targetPRONOM
        );
        
        clearInterval(progressInterval);
        setProgress(100);
        
        // Get the file data back
        const convertedData = await window.electronAPI.readFile(outputPath);
        
        setConvertedFile({
          name: outputPath.split('\\').pop(),
          path: outputPath,
          data: convertedData
        });
        
        toast({
          title: "Conversion complete",
          description: "Your file has been converted successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: "Conversion failed",
          description: error.message || "An error occurred during conversion",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsConverting(false);
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "Could not read the selected file",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setIsConverting(false);
    };
    
    reader.readAsArrayBuffer(selectedFile);
  };
  
  const handleDownload = async () => {
    if (!convertedFile) return;
    
    const savePath = await window.electronAPI.saveFileDialog({
      title: 'Save converted file',
      defaultPath: convertedFile.name,
      buttonLabel: 'Save',
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!savePath) return;
    
    try {
      // Copy the converted file to the selected location
      await window.electronAPI.writeFile(savePath, convertedFile.data);
      
      toast({
        title: "File saved",
        description: `File saved to ${savePath}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error saving file",
        description: error.message || "Could not save the file",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  return (
    <VStack spacing={6} align="stretch">
      <Flex align="center" justify="space-between">
        <Button 
          leftIcon={<ArrowBackIcon />} 
          variant="ghost" 
          onClick={onBack}
        >
          Back to Dashboard
        </Button>
        <Heading size="lg" flex={1} textAlign="center">File Converter</Heading>
      </Flex>
      
      <Text px={6}>Convert your documents between different formats</Text>
      
      <Box p={6} borderWidth="1px" borderRadius="lg">
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>Select File</FormLabel>
            <Input
              type="file"
              p={1}
              accept=".docx,.pdf,.pptx"
              onChange={handleFileChange}
            />
            {selectedFile && (
              <Text mt={2} fontSize="sm">
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </Text>
            )}
          </FormControl>
          
          <FormControl>
            <FormLabel>Conversion Type</FormLabel>
            <Select
              placeholder="Select conversion type"
              value={conversionType}
              onChange={handleConversionTypeChange}
            >
              <option value="docxtopdf">DOCX to PDF</option>
              <option value="pdftodocx">PDF to DOCX</option>
              <option value="pptxtopdf">PPTX to PDF</option>
            </Select>
          </FormControl>
          
          <Button
            colorScheme="blue"
            isLoading={isConverting}
            loadingText="Converting..."
            onClick={handleConversion}
            isDisabled={!selectedFile || !conversionType}
            mt={4}
          >
            Convert Document
          </Button>
          
          {isConverting && (
            <Box mt={4}>
              <Text mb={2}>Converting... {progress}%</Text>
              <Progress value={progress} size="sm" colorScheme="blue" borderRadius="md" />
            </Box>
          )}
          
          {convertedFile && (
            <Box mt={4} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
              <Text fontWeight="medium">Conversion complete!</Text>
              <Text fontSize="sm" mt={2}>
                Converted file: {convertedFile.name}
              </Text>
              <Button
                colorScheme="green"
                size="sm"
                mt={3}
                onClick={handleDownload}
              >
                Download Converted File
              </Button>
            </Box>
          )}
        </VStack>
      </Box>
    </VStack>
  );
};

export default FileConverter;
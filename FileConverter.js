import React, { useState, useRef } from 'react';
import { 
  Box, VStack, Heading, Text, Button, 
  Input, Select, Progress, useToast,
  Alert, AlertIcon, AlertTitle, AlertDescription,
  Flex, Icon, Card, CardBody, CardHeader,
  Divider, Badge, Tooltip
} from '@chakra-ui/react';
import { DownloadIcon, AttachmentIcon, RepeatIcon, InfoIcon } from '@chakra-ui/icons';
import { FaFileWord, FaFilePdf, FaFilePowerpoint } from 'react-icons/fa';
import FileUploader from './FileUploader';
import { convertDocument } from './converterUtils';

const FileConverter = () => {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [convertedFile, setConvertedFile] = useState(null);
  const [conversionType, setConversionType] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [conversionInfo, setConversionInfo] = useState(null);
  
  const handleFileChange = (selectedFile) => {
    setFile(selectedFile);
    setConvertedFile(null);
    setError(null);
    setConversionInfo(null);
    
    // Automatically select appropriate conversion type based on file extension
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    
    if (extension === 'docx') {
      setConversionType('docx-to-pdf');
      setConversionInfo({
        title: 'DOCX to PDF Conversion',
        description: 'Converts Microsoft Word documents to PDF format, preserving basic formatting.',
        limitations: 'Some advanced formatting features may not be preserved.'
      });
    } else if (extension === 'pdf') {
      setConversionType('pdf-to-docx');
      setConversionInfo({
        title: 'PDF to DOCX Conversion',
        description: 'Converts PDF documents to Microsoft Word format.',
        limitations: 'This is a basic conversion. Text extraction may be limited. Images and complex layouts are not supported in this version.'
      });
    } else if (['ppt', 'pptx'].includes(extension)) {
      setConversionType('ppt-to-pdf');
      setConversionInfo({
        title: 'PowerPoint to PDF Conversion',
        description: 'Converts PowerPoint presentations to PDF format.',
        limitations: 'Basic text extraction only. Formatting, images, and animations are not preserved in this version.'
      });
    } else {
      setError(`Unsupported file type: .${extension}`);
      setConversionType('');
    }
  };

  const handleConversionChange = (e) => {
    setConversionType(e.target.value);
    setConvertedFile(null);
    setError(null);
    
    // Update conversion info based on selected type
    if (e.target.value === 'docx-to-pdf') {
      setConversionInfo({
        title: 'DOCX to PDF Conversion',
        description: 'Converts Microsoft Word documents to PDF format, preserving basic formatting.',
        limitations: 'Some advanced formatting features may not be preserved.'
      });
    } else if (e.target.value === 'pdf-to-docx') {
      setConversionInfo({
        title: 'PDF to DOCX Conversion',
        description: 'Converts PDF documents to Microsoft Word format.',
        limitations: 'This is a basic conversion. Text extraction may be limited. Images and complex layouts are not supported in this version.'
      });
    } else if (e.target.value === 'ppt-to-pdf') {
      setConversionInfo({
        title: 'PowerPoint to PDF Conversion',
        description: 'Converts PowerPoint presentations to PDF format.',
        limitations: 'Basic text extraction only. Formatting, images, and animations are not preserved in this version.'
      });
    }
  };

  const startConversion = async () => {
    if (!file || !conversionType) {
      setError('Please select a file and conversion type');
      return;
    }

    try {
      setIsConverting(true);
      setProgress(0);
      setError(null);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Perform the conversion
      const result = await convertDocument(file, conversionType, (p) => setProgress(p));
      
      clearInterval(progressInterval);
      setProgress(100);
      setConvertedFile(result);
      
      toast({
        title: 'Conversion completed',
        description: 'Your file has been successfully converted',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      setError(`Conversion failed: ${err.message}`);
      
      toast({
        title: 'Conversion failed',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsConverting(false);
    }
  };

  const downloadFile = async () => {
    if (!convertedFile) return;
    
    try {
      const fileName = file.name.split('.')[0];
      const extension = conversionType.split('-to-')[1];
      const saveFilePath = await window.electronAPI.saveFileDialog({
        title: 'Save Converted File',
        defaultPath: `${fileName}.${extension}`,
        filters: [
          { name: extension.toUpperCase(), extensions: [extension] }
        ]
      });
      
      if (saveFilePath) {
        // Pass the ArrayBuffer directly - the main process will handle the conversion
        await window.electronAPI.writeFile(saveFilePath, convertedFile);
        
        toast({
          title: 'File saved',
          description: `File saved to ${saveFilePath}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: 'Error saving file',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const resetConverter = () => {
    setFile(null);
    setConvertedFile(null);
    setConversionType('');
    setError(null);
    setProgress(0);
    setConversionInfo(null);
  };

  const getFileIcon = () => {
    if (!file) return null;
    
    const extension = file.name.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'docx':
        return <Icon as={FaFileWord} boxSize={8} color="blue.500" />;
      case 'pdf':
        return <Icon as={FaFilePdf} boxSize={8} color="red.500" />;
      case 'ppt':
      case 'pptx':
        return <Icon as={FaFilePowerpoint} boxSize={8} color="orange.500" />;
      default:
        return <AttachmentIcon boxSize={8} />;
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg">File Converter</Heading>
      <Text>Convert documents between different formats</Text>
      
      <Card>
        <CardHeader>
          <Heading size="md">Step 1: Select a file</Heading>
        </CardHeader>
        <CardBody>
          <FileUploader onFileSelect={handleFileChange} />
          
          {file && (
            <Flex mt={4} align="center">
              {getFileIcon()}
              <Box ml={3}>
                <Text fontWeight="bold">{file.name}</Text>
                <Text fontSize="sm">{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
              </Box>
            </Flex>
          )}
        </CardBody>
      </Card>
      
      {file && (
        <>
          <Card>
            <CardHeader>
              <Heading size="md">Step 2: Choose conversion type</Heading>
            </CardHeader>
            <CardBody>
              <Select 
                placeholder="Select conversion type" 
                value={conversionType}
                onChange={handleConversionChange}
                isDisabled={isConverting}
              >
                {file.name.endsWith('.docx') && (
                  <option value="docx-to-pdf">DOCX to PDF</option>
                )}
                {file.name.endsWith('.pdf') && (
                  <option value="pdf-to-docx">PDF to DOCX</option>
                )}
                {(file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) && (
                  <option value="ppt-to-pdf">PPT to PDF</option>
                )}
              </Select>
              
              {conversionInfo && (
                <Box mt={4} p={4} borderRadius="md" bg="blue.50">
                  <Flex align="center" mb={2}>
                    <InfoIcon color="blue.500" mr={2} />
                    <Text fontWeight="medium" color="blue.700">{conversionInfo.title}</Text>
                  </Flex>
                  <Text fontSize="sm" mb={2}>{conversionInfo.description}</Text>
                  <Text fontSize="xs" fontStyle="italic" color="gray.600">
                    Note: {conversionInfo.limitations}
                  </Text>
                </Box>
              )}
            </CardBody>
          </Card>
          
          <Card>
            <CardHeader>
              <Heading size="md">Step 3: Convert</Heading>
            </CardHeader>
            <CardBody>
              <Button 
                leftIcon={<RepeatIcon />} 
                colorScheme="blue" 
                onClick={startConversion}
                isLoading={isConverting}
                loadingText="Converting..."
                isDisabled={!conversionType || isConverting}
                width="full"
              >
                Convert Document
              </Button>
              
              {isConverting && (
                <Box mt={4}>
                  <Text mb={2}>Converting... {progress}%</Text>
                  <Progress value={progress} size="sm" colorScheme="blue" />
                </Box>
              )}
              
              {error && (
                <Alert status="error" mt={4} borderRadius="md">
                  <AlertIcon />
                  <AlertTitle mr={2}>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardBody>
          </Card>
          
          {convertedFile && (
            <Card>
              <CardHeader>
                <Heading size="md">Step 4: Download</Heading>
              </CardHeader>
              <CardBody>
                <Button 
                  leftIcon={<DownloadIcon />} 
                  colorScheme="green" 
                  onClick={downloadFile}
                  width="full"
                >
                  Download Converted File
                </Button>
                <Text fontSize="sm" mt={3} textAlign="center">
                  Your file has been converted. Click the button above to save it to your computer.
                </Text>
              </CardBody>
            </Card>
          )}
          
          <Flex justify="center" mt={4}>
            <Button
              variant="ghost"
              onClick={resetConverter}
              size="sm"
            >
              Reset and start over
            </Button>
          </Flex>
        </>
      )}
    </VStack>
  );
};

export default FileConverter;
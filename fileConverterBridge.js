const edge = require('edge-js');
const path = require('path');

// Get the path to your C# assembly
const converterDllPath = path.join(__dirname, '../../FileConverter/bin/Debug/SkillStack.FileConverter.dll');

// Create Edge.js function for file conversion
const convertFileFunc = edge.func({
  assemblyFile: converterDllPath,
  typeName: 'FileConverter.Management.ConversionManager',
  methodName: 'ConvertFileAsync' // Make sure this method exists in your C# code
});

// Export the functions for use in React
module.exports = {
  convertFile: (inputFile, outputFile, sourcePRONOM, targetPRONOM) => {
    return new Promise((resolve, reject) => {
      convertFileFunc({
        inputFile: inputFile,
        outputFile: outputFile,
        sourcePRONOM: sourcePRONOM,
        targetPRONOM: targetPRONOM
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }
};
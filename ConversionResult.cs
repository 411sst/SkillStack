// File: src/FileConverter/Models/ConversionResult.cs
// Purpose: Represents the result of a file conversion in Skill Stack

using System;

namespace FileConverter.Models
{
    /// <summary>
    /// Represents the outcome of a file conversion process
    /// </summary>
    public class ConversionResult
    {
        public bool IsSuccessful { get; set; }
        public string SourceFilePath { get; set; }
        public string OutputFilePath { get; set; }
        public string SourcePRONOM { get; set; }
        public string TargetPRONOM { get; set; }
        public string ConverterName { get; set; }
        public TimeSpan ConversionDuration { get; set; }
        public long OriginalFileSize { get; set; }
        public long ConvertedFileSize { get; set; }
        public string ErrorMessage { get; set; }
        public DateTime ConversionTimestamp { get; set; }

        public static ConversionResult Success(
            string sourcePath, 
            string outputPath, 
            string sourcePRONOM, 
            string targetPRONOM, 
            string converterName, 
            TimeSpan duration)
        {
            var sourceFileInfo = new System.IO.FileInfo(sourcePath);
            var outputFileInfo = new System.IO.FileInfo(outputPath);

            return new ConversionResult
            {
                IsSuccessful = true,
                SourceFilePath = sourcePath,
                OutputFilePath = outputPath,
                SourcePRONOM = sourcePRONOM,
                TargetPRONOM = targetPRONOM,
                ConverterName = converterName,
                ConversionDuration = duration,
                OriginalFileSize = sourceFileInfo.Length,
                ConvertedFileSize = outputFileInfo.Length,
                ConversionTimestamp = DateTime.UtcNow
            };
        }

        public static ConversionResult Failure(
            string sourcePath, 
            string sourcePRONOM, 
            string targetPRONOM, 
            string converterName, 
            string errorMessage)
        {
            return new ConversionResult
            {
                IsSuccessful = false,
                SourceFilePath = sourcePath,
                SourcePRONOM = sourcePRONOM,
                TargetPRONOM = targetPRONOM,
                ConverterName = converterName,
                ErrorMessage = errorMessage,
                ConversionTimestamp = DateTime.UtcNow
            };
        }
    }
}

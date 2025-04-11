using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.IO;

namespace FileConverter.Converters
{
    /// <summary>
    /// Base abstract class for all file converters
    /// </summary>
    public abstract class BaseConverter
    {
        /// <summary>
        /// Name of the converter
        /// </summary>
        public string Name { get; protected set; }

        /// <summary>
        /// Version of the converter
        /// </summary>
        public string Version { get; protected set; }

        /// <summary>
        /// Unique identifier combining name and version
        /// </summary>
        public string NameAndVersion => $"{Name} {Version}";

        /// <summary>
        /// Supported conversion paths
        /// Key: Source PRONOM, Value: List of possible target PRONOMs
        /// </summary>
        public Dictionary<string, List<string>> SupportedConversions { get; protected set; }

        /// <summary>
        /// List of supported operating systems
        /// </summary>
        public List<string> SupportedOperatingSystems { get; protected set; }

        /// <summary>
        /// Checks if all dependencies for the converter exist
        /// </summary>
        public bool DependenciesExist { get; protected set; }

        /// <summary>
        /// Conversions that cannot be multithreaded
        /// </summary>
        public Dictionary<string, List<string>> BlockingConversions { get; protected set; }

        /// <summary>
        /// Determines if the converter supports a specific conversion
        /// </summary>
        /// <param name="sourcePRONOM">Source file format PRONOM</param>
        /// <param name="targetPRONOM">Target file format PRONOM</param>
        /// <returns>True if conversion is supported, false otherwise</returns>
        public bool SupportsConversion(string sourcePRONOM, string targetPRONOM)
        {
            return SupportedConversions != null && 
                   SupportedConversions.TryGetValue(sourcePRONOM, out var targetFormats) && 
                   targetFormats.Contains(targetPRONOM);
        }

        /// <summary>
        /// Converts a file from one format to another
        /// </summary>
        /// <param name="inputFilePath">Path to the input file</param>
        /// <param name="outputFilePath">Path to save the converted file</param>
        /// <param name="targetPRONOM">Target file format PRONOM</param>
        /// <returns>Task representing the conversion operation</returns>
        public abstract Task ConvertFileAsync(
            string inputFilePath, 
            string outputFilePath, 
            string targetPRONOM
        );

        /// <summary>
        /// Retrieves the version of the converter
        /// </summary>
        protected abstract void GetVersion();

        /// <summary>
        /// Checks for system dependencies required for conversion
        /// </summary>
        /// <returns>True if all dependencies are met, false otherwise</returns>
        protected abstract bool CheckDependencies();

        /// <summary>
        /// Logs conversion details
        /// </summary>
        /// <param name="message">Logging message</param>
        /// <param name="isError">Whether the log is an error</param>
        protected virtual void LogConversionDetail(string message, bool isError = false)
        {
            // Implement logging logic - could be file-based, console, or custom logger
            Console.WriteLine($"{(isError ? "ERROR" : "INFO")}: {message}");
        }
    }
}

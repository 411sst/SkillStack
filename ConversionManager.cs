using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IO;
using FileConverter.Converters;

namespace FileConverter.Management
{
    /// <summary>
    /// Manages file conversion processes
    /// </summary>
    public class ConversionManager
    {
        // Singleton instance
        private static ConversionManager _instance;
        public static ConversionManager Instance => 
            _instance ??= new ConversionManager();

        // List of registered converters
        private List<BaseConverter> _converters;

        private ConversionManager()
        {
            InitializeConverters();
        }

        /// <summary>
        /// Initialize available converters
        /// </summary>
        private void InitializeConverters()
        {
            _converters = new List<BaseConverter>
            {
                new PDFConverter(),
                // Add other converters here as they are developed
            };

            // Filter out converters not supported by current OS or missing dependencies
            _converters = _converters
                .Where(c => c.SupportedOperatingSystems.Contains(
                    Environment.OSVersion.Platform.ToString()) && 
                    c.DependenciesExist)
                .ToList();
        }

        /// <summary>
        /// Find a converter that supports the specific conversion
        /// </summary>
        private BaseConverter FindConverter(string sourcePRONOM, string targetPRONOM)
        {
            return _converters.FirstOrDefault(
                converter => converter.SupportsConversion(sourcePRONOM, targetPRONOM)
            );
        }

        /// <summary>
        /// Convert a single file
        /// </summary>
        /// <param name="inputFile">Path to input file</param>
        /// <param name="outputFile">Path to output file</param>
        /// <param name="sourcePRONOM">Source file PRONOM</param>
        /// <param name="targetPRONOM">Target file PRONOM</param>
        /// <returns>Conversion task</returns>
        public async Task ConvertFileAsync(
            string inputFile, 
            string outputFile, 
            string sourcePRONOM, 
            string targetPRONOM)
        {
            if (string.IsNullOrEmpty(inputFile) || 
                string.IsNullOrEmpty(outputFile) || 
                string.IsNullOrEmpty(sourcePRONOM) || 
                string.IsNullOrEmpty(targetPRONOM))
            {
                throw new ArgumentException("Invalid conversion parameters");
            }

            var converter = FindConverter(sourcePRONOM, targetPRONOM);
            
            if (converter == null)
            {
                throw new NotSupportedException(
                    $"No converter found for conversion from {sourcePRONOM} to {targetPRONOM}"
                );
            }

            await converter.ConvertFileAsync(inputFile, outputFile, targetPRONOM);
        }

        /// <summary>
        /// Batch conversion of files
        /// </summary>
        public async Task ConvertFilesAsync(
            IEnumerable<(string InputFile, string OutputFile, string SourcePRONOM, string TargetPRONOM)> conversionTasks)
        {
            var tasks = conversionTasks.Select(task => 
                ConvertFileAsync(
                    task.InputFile, 
                    task.OutputFile, 
                    task.SourcePRONOM, 
                    task.TargetPRONOM
                )
            );

            await Task.WhenAll(tasks);
        }

        /// <summary>
        /// Get all supported conversions across all converters
        /// </summary>
        public Dictionary<string, List<string>> GetAllSupportedConversions()
        {
            var supportedConversions = new Dictionary<string, List<string>>();

            foreach (var converter in _converters)
            {
                foreach (var conversion in converter.SupportedConversions)
                {
                    if (!supportedConversions.ContainsKey(conversion.Key))
                    {
                        supportedConversions[conversion.Key] = conversion.Value;
                    }
                    else
                    {
                        supportedConversions[conversion.Key]
                            .AddRange(conversion.Value.Except(supportedConversions[conversion.Key]));
                    }
                }
            }

            return supportedConversions;
        }
    }
}

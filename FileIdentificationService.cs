// File: src/FileConverter/Management/FileIdentificationService.cs
// Purpose: Service for identifying file types and PRONOM codes in Skill Stack application

using System;
using System.IO;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Diagnostics;

namespace FileConverter.Management
{
    /// <summary>
    /// Service responsible for identifying file types using Siegfried
    /// </summary>
    public class FileIdentificationService
    {
        private static FileIdentificationService _instance;
        public static FileIdentificationService Instance => 
            _instance ??= new FileIdentificationService();

        private FileIdentificationService() { }

        /// <summary>
        /// Identifies the PRONOM code for a given file
        /// </summary>
        /// <param name="filePath">Path to the file to identify</param>
        /// <returns>PRONOM code or null if identification fails</returns>
        public async Task<string> IdentifyFilePronomAsync(string filePath)
        {
            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException("File not found", filePath);
            }

            try
            {
                // Use Siegfried for file identification
                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "sf",
                        Arguments = $"-json \"{filePath}\"",
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        CreateNoWindow = true
                    }
                };

                process.Start();
                string output = await process.StandardOutput.ReadToEndAsync();
                await process.WaitForExitAsync();

                // Parse JSON output to extract PRONOM
                return ExtractPronomFromSiegfriedOutput(output);
            }
            catch (Exception ex)
            {
                LogError($"File identification failed: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Identifies multiple files in a directory
        /// </summary>
        /// <param name="directoryPath">Path to the directory</param>
        /// <returns>Dictionary of file paths and their PRONOM codes</returns>
        public async Task<Dictionary<string, string>> IdentifyDirectoryFilesAsync(string directoryPath)
        {
            if (!Directory.Exists(directoryPath))
            {
                throw new DirectoryNotFoundException($"Directory not found: {directoryPath}");
            }

            var fileIdentifications = new Dictionary<string, string>();
            var files = Directory.GetFiles(directoryPath);

            foreach (var file in files)
            {
                string pronom = await IdentifyFilePronomAsync(file);
                if (pronom != null)
                {
                    fileIdentifications[file] = pronom;
                }
            }

            return fileIdentifications;
        }

        /// <summary>
        /// Extracts PRONOM code from Siegfried JSON output
        /// </summary>
        private string ExtractPronomFromSiegfriedOutput(string jsonOutput)
        {
            // Basic JSON parsing (you might want to use a proper JSON library)
            try
            {
                int pronomIndex = jsonOutput.IndexOf("\"pronom\":");
                if (pronomIndex == -1) return null;

                int startQuote = jsonOutput.IndexOf("\"", pronomIndex + 9);
                int endQuote = jsonOutput.IndexOf("\"", startQuote + 1);

                return jsonOutput.Substring(startQuote + 1, endQuote - startQuote - 1);
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Logs identification errors
        /// </summary>
        private void LogError(string message)
        {
            // TODO: Implement proper logging mechanism
            Console.Error.WriteLine($"[FileIdentification Error] {message}");
        }

        /// <summary>
        /// Checks if Siegfried is installed and working
        /// </summary>
        public bool IsSiegfriedAvailable()
        {
            try
            {
                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "sf",
                        Arguments = "--version",
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        CreateNoWindow = true
                    }
                };

                process.Start();
                process.WaitForExit(5000);  // 5-second timeout
                return process.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }
    }
}

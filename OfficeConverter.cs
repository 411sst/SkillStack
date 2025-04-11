// File: src/FileConverter/Converters/OfficeConverter.cs
// Purpose: Office document conversion implementation for Skill Stack application

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.IO;
using System.Diagnostics;
using iText.Kernel.Pdf;

namespace FileConverter.Converters
{
    /// <summary>
    /// Converter for Microsoft Office and OpenDocument file formats
    /// </summary>
    public class OfficeConverter : BaseConverter
    {
        // Supported Office document PRONOMs
        private static readonly Dictionary<string, string> SupportedFormats = new Dictionary<string, string>
        {
            // Word Documents
            {"x-fmt/329", "DOCX"},   // DOC
            {"fmt/412", "DOCX"},      // DOCX
            
            // Excel Documents
            {"fmt/214", "XLSX"},      // XLSX
            {"fmt/55", "XLSX"},       // XLS
            
            // PowerPoint Documents
            {"fmt/215", "PPTX"},      // PPTX
            {"fmt/181", "PPTX"},      // PPT
            
            // OpenDocument Formats
            {"fmt/136", "ODT"},       // ODT
            {"fmt/137", "ODS"},       // ODS
            {"fmt/138", "ODP"}        // ODP
        };

        // Target PRONOM codes (PDF)
        private static readonly List<string> PDFPronoms = new List<string>
        {
            "fmt/14", "fmt/15", "fmt/16", "fmt/17", 
            "fmt/18", "fmt/19", "fmt/20", "fmt/276", "fmt/1129"
        };

        public OfficeConverter()
        {
            Name = "LibreOffice Converter";
            GetVersion();
            SupportedConversions = InitializeSupportedConversions();
            SupportedOperatingSystems = new List<string> 
            { 
                PlatformID.Win32NT.ToString(), 
                PlatformID.Unix.ToString() 
            };
            DependenciesExist = CheckDependencies();
        }

        private Dictionary<string, List<string>> InitializeSupportedConversions()
        {
            var conversions = new Dictionary<string, List<string>>();
            
            // Support conversion to PDF for all supported formats
            foreach (var format in SupportedFormats.Keys)
            {
                conversions[format] = new List<string>(PDFPronoms);
            }

            return conversions;
        }

        public override async Task ConvertFileAsync(
            string inputFilePath, 
            string outputFilePath, 
            string targetPRONOM)
        {
            try
            {
                // Determine conversion strategy based on OS
                if (Environment.OSVersion.Platform == PlatformID.Win32NT)
                {
                    await ConvertUsingLibreOfficeWindows(inputFilePath, outputFilePath);
                }
                else if (Environment.OSVersion.Platform == PlatformID.Unix)
                {
                    await ConvertUsingLibreOfficeLinux(inputFilePath, outputFilePath);
                }
                else
                {
                    throw new PlatformNotSupportedException("Unsupported operating system");
                }

                LogConversionDetail($"Successfully converted {inputFilePath} to PDF");
            }
            catch (Exception ex)
            {
                LogConversionDetail($"Conversion failed: {ex.Message}", true);
                throw;
            }
        }

        private async Task ConvertUsingLibreOfficeWindows(string inputFilePath, string outputFilePath)
        {
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "soffice.exe",
                    Arguments = $"--headless --convert-to pdf --outdir \"{Path.GetDirectoryName(outputFilePath)}\" \"{inputFilePath}\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                }
            };

            process.Start();
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                throw new Exception("LibreOffice conversion failed");
            }
        }

        private async Task ConvertUsingLibreOfficeLinux(string inputFilePath, string outputFilePath)
        {
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "libreoffice",
                    Arguments = $"--headless --convert-to pdf --outdir \"{Path.GetDirectoryName(outputFilePath)}\" \"{inputFilePath}\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                }
            };

            process.Start();
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                throw new Exception("LibreOffice conversion failed");
            }
        }

        protected override void GetVersion()
        {
            try
            {
                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = Environment.OSVersion.Platform == PlatformID.Win32NT ? "soffice.exe" : "libreoffice",
                        Arguments = "--version",
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        CreateNoWindow = true
                    }
                };

                process.Start();
                Version = process.StandardOutput.ReadToEnd().Trim();
            }
            catch
            {
                Version = "Unknown";
            }
        }

        protected override bool CheckDependencies()
        {
            try
            {
                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = Environment.OSVersion.Platform == PlatformID.Win32NT ? "soffice.exe" : "libreoffice",
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

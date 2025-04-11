// File: src/FileConverter/Converters/EmailConverter.cs
// Continuation of the EmailConverter class

namespace FileConverter.Converters
{
    public partial class EmailConverter
    {
        private async Task ConvertEmlToPdf(string inputFilePath, string outputFilePath)
        {
            // Use Java-based email converter for EML to PDF
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "java",
                    Arguments = $"-jar emailconverter.jar \"{inputFilePath}\" -o \"{outputFilePath}\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                }
            };

            process.Start();
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                throw new Exception("EML to PDF conversion failed");
            }
        }

        private async Task ConvertMsgToPdf(string inputFilePath, string outputFilePath)
        {
            // Platform-specific MSG to PDF conversion
            if (Environment.OSVersion.Platform == PlatformID.Win32NT)
            {
                await ConvertMsgToPdfWindows(inputFilePath, outputFilePath);
            }
            else if (Environment.OSVersion.Platform == PlatformID.Unix)
            {
                await ConvertMsgToPdfLinux(inputFilePath, outputFilePath);
            }
            else
            {
                throw new PlatformNotSupportedException("Unsupported operating system for MSG conversion");
            }
        }

        private async Task ConvertMsgToPdfWindows(string inputFilePath, string outputFilePath)
        {
            // Use Rebex Mail Converter on Windows
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "MailConverter.exe",
                    Arguments = $"convert \"{inputFilePath}\" \"{outputFilePath}\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                }
            };

            process.Start();
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                throw new Exception("MSG to PDF conversion failed on Windows");
            }
        }

        private async Task ConvertMsgToPdfLinux(string inputFilePath, string outputFilePath)
        {
            // Use email-outlook-message-perl on Linux
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "msgconvert",
                    Arguments = $"\"{inputFilePath}\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true,
                    WorkingDirectory = Path.GetDirectoryName(outputFilePath)
                }
            };

            process.Start();
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                throw new Exception("MSG to EML conversion failed on Linux");
            }

            // Convert resulting EML to PDF
            await ConvertEmlToPdf(
                Path.Combine(Path.GetDirectoryName(outputFilePath), 
                Path.GetFileNameWithoutExtension(inputFilePath) + ".eml"), 
                outputFilePath
            );
        }

        protected override void GetVersion()
        {
            // Attempt to get version of email conversion tools
            try 
            {
                Version = Environment.OSVersion.Platform == PlatformID.Win32NT 
                    ? GetWindowsToolVersion() 
                    : GetLinuxToolVersion();
            }
            catch
            {
                Version = "Unknown";
            }
        }

        private string GetWindowsToolVersion()
        {
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "MailConverter.exe",
                    Arguments = "--version",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                }
            };

            process.Start();
            return process.StandardOutput.ReadToEnd().Trim();
        }

        private string GetLinuxToolVersion()
        {
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "msgconvert",
                    Arguments = "--version",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                }
            };

            process.Start();
            return process.StandardOutput.ReadToEnd().Trim();
        }

        protected override bool CheckDependencies()
        {
            try 
            {
                // Check for required conversion tools
                if (Environment.OSVersion.Platform == PlatformID.Win32NT)
                {
                    return File.Exists("MailConverter.exe") && 
                           File.Exists("emailconverter.jar");
                }
                else if (Environment.OSVersion.Platform == PlatformID.Unix)
                {
                    var processMsg = new Process
                    {
                        StartInfo = new ProcessStartInfo
                        {
                            FileName = "which",
                            Arguments = "msgconvert",
                            UseShellExecute = false,
                            RedirectStandardOutput = true,
                            CreateNoWindow = true
                        }
                    };

                    var processJava = new Process
                    {
                        StartInfo = new ProcessStartInfo
                        {
                            FileName = "which",
                            Arguments = "java",
                            UseShellExecute = false,
                            RedirectStandardOutput = true,
                            CreateNoWindow = true
                        }
                    };

                    processMsg.Start();
                    processJava.Start();

                    return !string.IsNullOrWhiteSpace(processMsg.StandardOutput.ReadToEnd()) &&
                           !string.IsNullOrWhiteSpace(processJava.StandardOutput.ReadToEnd());
                }

                return false;
            }
            catch
            {
                return false;
            }
        }
    }
}
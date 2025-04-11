// File: src/FileConverter/Utilities/DependencyChecker.cs
// Purpose: Checks system dependencies for Skill Stack application

using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.IO;

namespace FileConverter.Utilities
{
    /// <summary>
    /// Checks system dependencies required for file conversion
    /// </summary>
    public static class DependencyChecker
    {
        /// <summary>
        /// Checks if LibreOffice is installed
        /// </summary>
        public static bool IsLibreOfficeInstalled()
        {
            return RuntimeInformation.IsOSPlatform(OSPlatform.Windows) 
                ? CheckWindowsLibreOffice() 
                : CheckLinuxLibreOffice();
        }

        private static bool CheckWindowsLibreOffice()
        {
            var searchPaths = new[]
            {
                @"C:\Program Files\LibreOffice\program\soffice.exe",
                @"C:\Program Files (x86)\LibreOffice\program\soffice.exe"
            };

            return Array.Exists(searchPaths, File.Exists);
        }

        private static bool CheckLinuxLibreOffice()
        {
            return RunCommand("which", "libreoffice") || 
                   RunCommand("command", "-v libreoffice");
        }

        /// <summary>
        /// Checks if Ghostscript is installed
        /// </summary>
        public static bool IsGhostscriptInstalled()
        {
            return RuntimeInformation.IsOSPlatform(OSPlatform.Windows) 
                ? CheckWindowsGhostscript() 
                : CheckLinuxGhostscript();
        }

        private static bool CheckWindowsGhostscript()
        {
            var searchPaths = new[]
            {
                @"C:\Program Files\gs\gs10.02.1\bin\gswin64c.exe",
                @"C:\Program Files (x86)\gs\gs10.02.1\bin\gswin64c.exe"
            };

            return Array.Exists(searchPaths, File.Exists);
        }

        private static bool CheckLinuxGhostscript()
        {
            return RunCommand("which", "gs");
        }

        /// <summary>
        /// Checks if Java is installed
        /// </summary>
        public static bool IsJavaInstalled()
        {
            return RunCommand("java", "-version");
        }

        /// <summary>
        /// Checks if wkhtmltopdf is installed
        /// </summary>
        public static bool IsWkhtmlToPdfInstalled()
        {
            return RunCommand("which", "wkhtmltopdf");
        }

        /// <summary>
        /// Checks if Siegfried is installed
        /// </summary>
        public static bool IsSiegfriedInstalled()
        {
            return RunCommand("which", "sf") || RunCommand("sf", "-version");
        }

        /// <summary>
        /// Runs a command and checks its exit status
        /// </summary>
        private static bool RunCommand(string command, string arguments)
        {
            try
            {
                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = command,
                        Arguments = arguments,
                        UseShellExecute = false,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        CreateNoWindow = true
                    }
                };

                process.Start();
                process.WaitForExit(3000);  // 3-second timeout

                return process.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Checks all critical dependencies for the application
        /// </summary>
        public static DependencyCheckResult CheckAllDependencies()
        {
            return new DependencyCheckResult
            {
                LibreOfficeInstalled = IsLibreOfficeInstalled(),
                GhostscriptInstalled = IsGhostscriptInstalled(),
                JavaInstalled = IsJavaInstalled(),
                WkhtmlToPdfInstalled = IsWkhtmlToPdfInstalled(),
                SiegfriedInstalled = IsSiegfriedInstalled()
            };
        }

        /// <summary>
        /// Represents the result of a dependency check
        /// </summary>
        public class DependencyCheckResult
        {
            public bool LibreOfficeInstalled { get; set; }
            public bool GhostscriptInstalled { get; set; }
            public bool JavaInstalled { get; set; }
            public bool WkhtmlToPdfInstalled { get; set; }
            public bool SiegfriedInstalled { get; set; }

            public bool AllCriticalDependenciesInstalled => 
                LibreOfficeInstalled && 
                GhostscriptInstalled && 
                JavaInstalled && 
                WkhtmlToPdfInstalled && 
                SiegfriedInstalled;
        }
    }
}

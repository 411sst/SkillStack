// File: src/FileConverter/Utilities/FileHelper.cs
// Purpose: Utility methods for file operations in Skill Stack

using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;

namespace FileConverter.Utilities
{
    /// <summary>
    /// Provides utility methods for file-related operations
    /// </summary>
    public static class FileHelper
    {
        /// <summary>
        /// Safely creates a directory if it doesn't exist
        /// </summary>
        public static void CreateDirectoryIfNotExists(string path)
        {
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
        }

        /// <summary>
        /// Generates a unique filename to prevent overwriting
        /// </summary>
        public static string GenerateUniqueFileName(string originalPath)
        {
            if (!File.Exists(originalPath))
                return originalPath;

            string directory = Path.GetDirectoryName(originalPath);
            string fileName = Path.GetFileNameWithoutExtension(originalPath);
            string extension = Path.GetExtension(originalPath);
            int counter = 1;

            string newPath = originalPath;
            while (File.Exists(newPath))
            {
                newPath = Path.Combine(directory, $"{fileName}_{counter}{extension}");
                counter++;
            }

            return newPath;
        }

        /// <summary>
        /// Gets all files in a directory with specified extensions
        /// </summary>
        public static IEnumerable<string> GetFilesByExtensions(
            string directory, 
            params string[] extensions)
        {
            if (extensions == null || extensions.Length == 0)
                return Directory.GetFiles(directory);

            return Directory.GetFiles(directory)
                .Where(file => extensions.Contains(
                    Path.GetExtension(file), 
                    StringComparer.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Safely moves a file, creating destination directory if needed
        /// </summary>
        public static void SafeMoveFile(string sourcePath, string destinationPath)
        {
            CreateDirectoryIfNotExists(Path.GetDirectoryName(destinationPath));
            File.Move(sourcePath, destinationPath, true);
        }

        /// <summary>
        /// Calculates total size of files in a directory
        /// </summary>
        public static long GetDirectorySize(string path)
        {
            return Directory.GetFiles(path, "*.*", SearchOption.AllDirectories)
                .Sum(file => new FileInfo(file).Length);
        }

        /// <summary>
        /// Checks if a file is in use by another process
        /// </summary>
        public static bool IsFileLocked(string filePath)
        {
            try
            {
                using (FileStream stream = File.Open(filePath, FileMode.Open, FileAccess.Read, FileShare.None))
                {
                    stream.Close();
                }
            }
            catch (IOException)
            {
                return true;
            }
            return false;
        }

        /// <summary>
        /// Gets a human-readable file size
        /// </summary>
        public static string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            int order = 0;
            double size = bytes;
            
            while (size >= 1024 && order < sizes.Length - 1)
            {
                order++;
                size /= 1024;
            }

            return $"{size:0.##} {sizes[order]}";
        }
    }
}

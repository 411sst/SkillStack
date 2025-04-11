// File: src/FileConverter/Models/FileMetadata.cs
// Purpose: Represents metadata for a file in Skill Stack

using System;
using System.Security.Cryptography;
using System.IO;

namespace FileConverter.Models
{
    /// <summary>
    /// Detailed metadata for a file in the conversion process
    /// </summary>
    public class FileMetadata
    {
        public string FilePath { get; set; }
        public string FileName { get; set; }
        public long FileSize { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastModified { get; set; }
        public string FileExtension { get; set; }
        public string PronomCode { get; set; }
        public string MimeType { get; set; }
        public string MD5Hash { get; set; }
        public string SHA256Hash { get; set; }

        public FileMetadata(string filePath)
        {
            FilePath = filePath;
            FileName = Path.GetFileName(filePath);
            FileExtension = Path.GetExtension(filePath);
            
            var fileInfo = new FileInfo(filePath);
            FileSize = fileInfo.Length;
            CreatedAt = fileInfo.CreationTimeUtc;
            LastModified = fileInfo.LastWriteTimeUtc;

            CalculateHashes();
        }

        private void CalculateHashes()
        {
            using (var md5 = MD5.Create())
            using (var sha256 = SHA256.Create())
            using (var stream = File.OpenRead(FilePath))
            {
                MD5Hash = BitConverter.ToString(md5.ComputeHash(stream)).Replace("-", "").ToLowerInvariant();
                stream.Position = 0;
                SHA256Hash = BitConverter.ToString(sha256.ComputeHash(stream)).Replace("-", "").ToLowerInvariant();
            }
        }

        public override string ToString()
        {
            return $"File: {FileName}, Size: {FileSize} bytes, PRONOM: {PronomCode}";
        }
    }
}

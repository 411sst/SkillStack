// File: src/FileConverter/Models/ConversionJob.cs
// Purpose: Represents a single file conversion job in Skill Stack

using System;
using System.IO;

namespace FileConverter.Models
{
    /// <summary>
    /// Represents a file conversion job with all necessary metadata
    /// </summary>
    public class ConversionJob
    {
        public Guid JobId { get; set; }
        public string InputFilePath { get; set; }
        public string OutputFilePath { get; set; }
        public string SourcePRONOM { get; set; }
        public string TargetPRONOM { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public ConversionStatus Status { get; set; }
        public long FileSize { get; set; }
        public string ConverterUsed { get; set; }

        public ConversionJob(string inputPath, string outputPath, string sourcePRONOM, string targetPRONOM)
        {
            JobId = Guid.NewGuid();
            InputFilePath = inputPath;
            OutputFilePath = outputPath;
            SourcePRONOM = sourcePRONOM;
            TargetPRONOM = targetPRONOM;
            CreatedAt = DateTime.UtcNow;
            Status = ConversionStatus.Pending;
            FileSize = new FileInfo(inputPath).Length;
        }

        public enum ConversionStatus
        {
            Pending,
            Processing,
            Completed,
            Failed
        }
    }
}

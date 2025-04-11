// File: src/FileConverter/Management/LoggingService.cs
// Purpose: Centralized logging service for Skill Stack application

using System;
using System.IO;
using System.Text.Json;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace FileConverter.Management
{
    /// <summary>
    /// Comprehensive logging service with multiple output mechanisms
    /// </summary>
    public class LoggingService
    {
        private static LoggingService _instance;
        public static LoggingService Instance => 
            _instance ??= new LoggingService();

        private readonly string _logDirectory;
        private readonly ConcurrentQueue<LogEntry> _logQueue;
        private readonly JsonSerializerOptions _jsonOptions;

        private LoggingService()
        {
            _logDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "logs");
            _logQueue = new ConcurrentQueue<LogEntry>();
            _jsonOptions = new JsonSerializerOptions { WriteIndented = true };

            // Ensure log directory exists
            Directory.CreateDirectory(_logDirectory);

            // Start background logging task
            Task.Run(ProcessLogQueue);
        }

        /// <summary>
        /// Log entry with multiple severity levels
        /// </summary>
        public enum LogLevel
        {
            Information,
            Warning,
            Error,
            Critical
        }

        /// <summary>
        /// Represents a single log entry
        /// </summary>
        public class LogEntry
        {
            public DateTime Timestamp { get; set; }
            public LogLevel Level { get; set; }
            public string Message { get; set; }
            public string Source { get; set; }
            public Exception Exception { get; set; }
        }

        /// <summary>
        /// Log a message
        /// </summary>
        public void Log(
            string message, 
            LogLevel level = LogLevel.Information, 
            string source = null, 
            Exception exception = null)
        {
            var logEntry = new LogEntry
            {
                Timestamp = DateTime.UtcNow,
                Level = level,
                Message = message,
                Source = source ?? "Unknown",
                Exception = exception
            };

            _logQueue.Enqueue(logEntry);
        }

        /// <summary>
        /// Background task to process log queue
        /// </summary>
        private async Task ProcessLogQueue()
        {
            while (true)
            {
                try
                {
                    if (_logQueue.TryDequeue(out var logEntry))
                    {
                        await WriteToTextLogAsync(logEntry);
                        await WriteToJsonLogAsync(logEntry);
                        
                        // Optional: Console logging
                        LogToConsole(logEntry);
                    }
                    else
                    {
                        // Wait a bit if queue is empty
                        await Task.Delay(500);
                    }
                }
                catch (Exception ex)
                {
                    // Fallback error handling
                    Console.Error.WriteLine($"Logging error: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Write log entry to text log file
        /// </summary>
        private async Task WriteToTextLogAsync(LogEntry entry)
        {
            string logFileName = $"log_{DateTime.UtcNow:yyyy-MM-dd}.txt";
            string logPath = Path.Combine(_logDirectory, logFileName);

            string logMessage = $"[{entry.Timestamp:yyyy-MM-dd HH:mm:ss}] " +
                                $"[{entry.Level}] " +
                                $"[{entry.Source}] " +
                                $"{entry.Message}" +
                                $"{(entry.Exception != null ? $" - {entry.Exception.Message}" : "")}";

            await File.AppendAllTextAsync(logPath, logMessage + Environment.NewLine);
        }

        /// <summary>
        /// Write log entry to JSON log file
        /// </summary>
        private async Task WriteToJsonLogAsync(LogEntry entry)
        {
            string logFileName = $"log_{DateTime.UtcNow:yyyy-MM-dd}.json";
            string logPath = Path.Combine(_logDirectory, logFileName);

            // Append to JSON log file
            using (var stream = new FileStream(logPath, FileMode.Append, FileAccess.Write, FileShare.Read))
            using (var writer = new StreamWriter(stream))
            {
                var jsonEntry = JsonSerializer.Serialize(entry, _jsonOptions);
                await writer.WriteLineAsync(jsonEntry);
            }
        }

        /// <summary>
        /// Write log entry to console
        /// </summary>
        private void LogToConsole(LogEntry entry)
        {
            ConsoleColor originalColor = Console.ForegroundColor;

            // Set color based on log level
            Console.ForegroundColor = entry.Level switch
            {
                LogLevel.Information => ConsoleColor.White,
                LogLevel.Warning => ConsoleColor.Yellow,
                LogLevel.Error => ConsoleColor.Red,
                LogLevel.Critical => ConsoleColor.DarkRed,
                _ => ConsoleColor.Gray
            };

            Console.WriteLine($"[{entry.Timestamp:HH:mm:ss}] [{entry.Level}] {entry.Message}");

            // Restore original color
            Console.ForegroundColor = originalColor;
        }

        /// <summary>
        /// Log conversion-specific details
        /// </summary>
        public void LogConversion(
            string inputFile, 
            string outputFile, 
            string sourcePRONOM, 
            string targetPRONOM, 
            bool success)
        {
            Log($"Conversion: {inputFile} -> {outputFile} " +
                $"[{sourcePRONOM} to {targetPRONOM}] " +
                $"Status: {(success ? "Success" : "Failed")}",
                success ? LogLevel.Information : LogLevel.Error,
                "FileConverter");
        }
    }
}

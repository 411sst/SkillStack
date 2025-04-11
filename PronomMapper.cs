// File: src/FileConverter/Utilities/PronomMapper.cs
// Purpose: Comprehensive mapping and translation utility for PRONOM codes in Skill Stack application

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;

namespace FileConverter.Utilities
{
    /// <summary>
    /// Provides advanced mapping and translation services for PRONOM codes
    /// </summary>
    public static class PronomMapper
    {
        // Comprehensive PRONOM to Full Name Mapping
        private static readonly ImmutableDictionary<string, FormatInfo> PronomDatabase = 
            new Dictionary<string, FormatInfo>
            {
                // PDF Formats
                {"fmt/14", new FormatInfo("PDF 1.0", FormatCategory.PDF, FormatType.Document)},
                {"fmt/15", new FormatInfo("PDF 1.1", FormatCategory.PDF, FormatType.Document)},
                {"fmt/16", new FormatInfo("PDF 1.2", FormatCategory.PDF, FormatType.Document)},
                {"fmt/17", new FormatInfo("PDF 1.3", FormatCategory.PDF, FormatType.Document)},
                {"fmt/18", new FormatInfo("PDF 1.4", FormatCategory.PDF, FormatType.Document)},
                {"fmt/19", new FormatInfo("PDF 1.5", FormatCategory.PDF, FormatType.Document)},
                {"fmt/20", new FormatInfo("PDF 1.6", FormatCategory.PDF, FormatType.Document)},
                {"fmt/276", new FormatInfo("PDF 1.7", FormatCategory.PDF, FormatType.Document)},
                {"fmt/1129", new FormatInfo("PDF 2.0", FormatCategory.PDF, FormatType.Document)},

                // PDF/A Formats
                {"fmt/95", new FormatInfo("PDF/A-1a", FormatCategory.PDFA, FormatType.ArchivalDocument)},
                {"fmt/354", new FormatInfo("PDF/A-1b", FormatCategory.PDFA, FormatType.ArchivalDocument)},
                {"fmt/476", new FormatInfo("PDF/A-2a", FormatCategory.PDFA, FormatType.ArchivalDocument)},
                {"fmt/477", new FormatInfo("PDF/A-2b", FormatCategory.PDFA, FormatType.ArchivalDocument)},
                {"fmt/478", new FormatInfo("PDF/A-2u", FormatCategory.PDFA, FormatType.ArchivalDocument)},
                {"fmt/479", new FormatInfo("PDF/A-3a", FormatCategory.PDFA, FormatType.ArchivalDocument)},
                {"fmt/480", new FormatInfo("PDF/A-3b", FormatCategory.PDFA, FormatType.ArchivalDocument)},
                {"fmt/481", new FormatInfo("PDF/A-3u", FormatCategory.PDFA, FormatType.ArchivalDocument)},

                // Office Document Formats
                {"x-fmt/329", new FormatInfo("Microsoft Word Document (DOC)", FormatCategory.Office, FormatType.WordDocument)},
                {"fmt/412", new FormatInfo("Microsoft Word Document (DOCX)", FormatCategory.Office, FormatType.WordDocument)},
                {"fmt/214", new FormatInfo("Microsoft Excel Spreadsheet (XLSX)", FormatCategory.Office, FormatType.SpreadsheetDocument)},
                {"fmt/215", new FormatInfo("Microsoft PowerPoint Presentation (PPTX)", FormatCategory.Office, FormatType.PresentationDocument)},

                // Image Formats
                {"fmt/11", new FormatInfo("PNG Image", FormatCategory.Image, FormatType.RasterImage)},
                {"fmt/12", new FormatInfo("PNG Image", FormatCategory.Image, FormatType.RasterImage)},
                {"fmt/13", new FormatInfo("PNG Image", FormatCategory.Image, FormatType.RasterImage)},
                {"fmt/41", new FormatInfo("JPEG Image", FormatCategory.Image, FormatType.RasterImage)},
                {"fmt/42", new FormatInfo("JPEG Image", FormatCategory.Image, FormatType.RasterImage)},
                {"fmt/43", new FormatInfo("JPEG Image", FormatCategory.Image, FormatType.RasterImage)},
                {"fmt/353", new FormatInfo("TIFF Image", FormatCategory.Image, FormatType.RasterImage)}
            }.ToImmutableDictionary();

        // File Extension to PRONOM Mapping
        private static readonly ImmutableDictionary<string, string> ExtensionToPRONOM = 
            new Dictionary<string, string>
            {
                {".pdf", "fmt/276"},     // Default to PDF 1.7
                {".docx", "fmt/412"},    // DOCX
                {".doc", "x-fmt/329"},   // DOC
                {".xlsx", "fmt/214"},    // XLSX
                {".pptx", "fmt/215"},    // PPTX
                {".png", "fmt/11"},      // PNG
                {".jpg", "fmt/41"},      // JPEG
                {".jpeg", "fmt/41"},     // JPEG
                {".tiff", "fmt/353"}     // TIFF
            }.ToImmutableDictionary();

        // Enum for Format Categories
        public enum FormatCategory
        {
            PDF,
            PDFA,
            Office,
            Image,
            Unknown
        }

        // Enum for Format Types
        public enum FormatType
        {
            Document,
            ArchivalDocument,
            WordDocument,
            SpreadsheetDocument,
            PresentationDocument,
            RasterImage,
            Unknown
        }

        // Format Information Class
        public class FormatInfo
        {
            public string FullName { get; }
            public FormatCategory Category { get; }
            public FormatType Type { get; }

            public FormatInfo(string fullName, FormatCategory category, FormatType type)
            {
                FullName = fullName;
                Category = category;
                Type = type;
            }
        }

        /// <summary>
        /// Gets detailed format information for a PRONOM code
        /// </summary>
        public static FormatInfo GetFormatInfo(string pronomCode)
        {
            return PronomDatabase.TryGetValue(pronomCode, out var info) 
                ? info 
                : new FormatInfo("Unknown Format", FormatCategory.Unknown, FormatType.Unknown);
        }

        /// <summary>
        /// Gets the full name of a PRONOM code
        /// </summary>
        public static string GetFullName(string pronomCode)
        {
            return GetFormatInfo(pronomCode).FullName;
        }

        /// <summary>
        /// Gets the PRONOM code for a file extension
        /// </summary>
        public static string GetPronomForExtension(string extension)
        {
            extension = extension.ToLower().TrimStart('.');
            var fullExtension = $".{extension}";

            return ExtensionToPRONOM.TryGetValue(fullExtension, out var pronom) 
                ? pronom 
                : null;
        }

        /// <summary>
        /// Gets all PRONOM codes for a specific category
        /// </summary>
        public static IEnumerable<string> GetPronomCodesForCategory(FormatCategory category)
        {
            return PronomDatabase
                .Where(kvp => kvp.Value.Category == category)
                .Select(kvp => kvp.Key);
        }

        /// <summary>
        /// Checks conversion compatibility between two PRONOM codes
        /// </summary>
        public static bool AreConversionCompatible(string sourcePRONOM, string targetPRONOM)
        {
            if (sourcePRONOM == targetPRONOM) return true;

            var sourceInfo = GetFormatInfo(sourcePRONOM);
            var targetInfo = GetFormatInfo(targetPRONOM);

            // Allow conversion within same category
            return sourceInfo.Category == targetInfo.Category;
        }

        /// <summary>
        /// Suggests potential conversion paths
        /// </summary>
        public static IEnumerable<string> SuggestConversionPaths(string sourcePRONOM)
        {
            var sourceInfo = GetFormatInfo(sourcePRONOM);

            return sourceInfo.Category switch
            {
                FormatCategory.PDF => new[] { "fmt/276", "fmt/480" },
                FormatCategory.Image => new[] { "fmt/18", "fmt/276" },
                FormatCategory.Office => new[] { "fmt/412", "fmt/215" },
                _ => Enumerable.Empty<string>()
            };
        }

        /// <summary>
        /// Provides a detailed description of a PRONOM code
        /// </summary>
        public static string GetPronomDescription(string pronomCode)
        {
            var formatInfo = GetFormatInfo(pronomCode);
            return $"{formatInfo.FullName} - {formatInfo.Category} {formatInfo.Type}";
        }
    }
}

// File: src/FileConverter/Converters/ImageConverter.cs
// Purpose: Image conversion implementation for Skill Stack application

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.IO;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Jpeg;

namespace FileConverter.Converters
{
    /// <summary>
    /// Converter for image file formats
    /// </summary>
    public class ImageConverter : BaseConverter
    {
        // Supported image PRONOMs
        private static readonly List<string> ImagePronoms = new List<string>
        {
            "fmt/3",    // GIF
            "fmt/4",    // GIF
            "fmt/11",   // PNG
            "fmt/12",   // PNG
            "fmt/13",   // PNG
            "fmt/41",   // JPEG
            "fmt/42",   // JPEG
            "fmt/43",   // JPEG
            "fmt/44",   // JPEG
            "fmt/353"   // TIFF
        };

        public ImageConverter()
        {
            Name = "Image Converter";
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
            
            // Support conversion to PDF
            foreach (var sourcePRONOM in ImagePronoms)
            {
                conversions[sourcePRONOM] = new List<string> 
                { 
                    "fmt/14",   // PDF 1.0
                    "fmt/15",   // PDF 1.1
                    "fmt/16",   // PDF 1.2
                    "fmt/17",   // PDF 1.3
                    "fmt/18",   // PDF 1.4
                    "fmt/19",   // PDF 1.5
                    "fmt/20",   // PDF 1.6
                    "fmt/276",  // PDF 1.7
                    "fmt/1129"  // PDF 2.0
                };
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
                // Determine PDF version based on target PRONOM
                PdfVersion targetVersion = MapPROMONToPdfVersion(targetPRONOM);

                // Use ImageSharp for image reading
                using (var image = Image.Load(inputFilePath))
                {
                    // Create PDF using iText
                    using (var writer = new PdfWriter(outputFilePath, 
                        new WriterProperties().SetPdfVersion(targetVersion)))
                    using (var pdfDocument = new PdfDocument(writer))
                    using (var document = new Document(pdfDocument))
                    {
                        // Convert image to a format iText can use
                        using (var ms = new MemoryStream())
                        {
                            image.Save(ms, new PngEncoder());
                            ms.Position = 0;

                            // Create iText image
                            var pdfImage = new iText.Layout.Element.Image(
                                iText.Kernel.Pdf.Xobject.PdfImageXObject.CreateJavaImage(pdfDocument, ms));
                            
                            // Add image to PDF document
                            document.Add(pdfImage);
                        }
                    }
                }

                LogConversionDetail($"Successfully converted {inputFilePath} to PDF");
            }
            catch (Exception ex)
            {
                LogConversionDetail($"Conversion failed: {ex.Message}", true);
                throw;
            }
        }

        private PdfVersion MapPROMONToPdfVersion(string pronom)
        {
            return pronom switch
            {
                "fmt/14" => PdfVersion.PDF_1_0,
                "fmt/15" => PdfVersion.PDF_1_1,
                "fmt/16" => PdfVersion.PDF_1_2,
                "fmt/17" => PdfVersion.PDF_1_3,
                "fmt/18" => PdfVersion.PDF_1_4,
                "fmt/19" => PdfVersion.PDF_1_5,
                "fmt/20" => PdfVersion.PDF_1_6,
                "fmt/276" => PdfVersion.PDF_1_7,
                "fmt/1129" => PdfVersion.PDF_2_0,
                _ => PdfVersion.PDF_1_7  // Default to PDF 1.7
            };
        }

        protected override void GetVersion()
        {
            // Use ImageSharp version
            Version = typeof(Image).Assembly.GetName().Version?.ToString() ?? "Unknown";
        }

        protected override bool CheckDependencies()
        {
            // Check if required libraries are available
            try
            {
                var _ = Image.Load(new byte[] { });
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}

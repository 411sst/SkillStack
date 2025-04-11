using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.IO;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Kernel.Geom;

namespace FileConverter.Converters
{
    /// <summary>
    /// PDF Converter using iText7 library
    /// </summary>
    public class PDFConverter : BaseConverter
    {
        // Static list of supported PDF PRONOMs
        private static readonly List<string> PDFPronoms = new List<string>
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

        public PDFConverter()
        {
            Name = "iText7 PDF Converter";
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
            
            // Allow conversion between all PDF PRONOMs
            foreach (var sourcePRONOM in PDFPronoms)
            {
                conversions[sourcePRONOM] = new List<string>(PDFPronoms);
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
                PdfVersion targetVersion = MapPROMONToPdfVersion(targetPRONOM);

                using (var reader = new PdfReader(inputFilePath))
                using (var writer = new PdfWriter(outputFilePath, 
                    new WriterProperties().SetPdfVersion(targetVersion)))
                using (var sourceDoc = new PdfDocument(reader))
                using (var targetDoc = new PdfDocument(writer))
                {
                    sourceDoc.CopyPagesTo(1, sourceDoc.GetNumberOfPages(), targetDoc);
                }

                LogConversionDetail($"Successfully converted {inputFilePath} to PDF version {targetVersion}");
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
            // Use iText7's built-in version retrieval
            Version = typeof(PdfDocument).Assembly.GetName().Version?.ToString() ?? "Unknown";
        }

        protected override bool CheckDependencies()
        {
            // Check if iText7 assemblies are loadable
            try
            {
                var _ = new PdfDocument(new PdfWriter(new MemoryStream()));
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}

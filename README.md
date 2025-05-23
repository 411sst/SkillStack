# Skill Stack

A comprehensive educational toolbox for high school and university students across STEM, coding, commerce, and humanities disciplines.

## Features

- **File Converter**: Convert between document formats (DOCX, PDF, PPT)
- **Chemistry Lab** (Coming Soon): Interactive 3D chemistry laboratory
- **Physics Simulator** (Coming Soon): Visualize physics concepts

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository or download the source code:
   ```bash
   git clone https://github.com/yourusername/SkillStack.git
   cd SkillStack
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. To build the application for production:
   ```bash
   npm run make
   ```

## Module 1: File Converter

The File Converter module allows students to convert between different document formats:

- DOCX to PDF: Convert Word documents to PDF format
- PDF to DOCX: Convert PDF documents to Word format (with limitations)
- PPT to PDF: Convert PowerPoint presentations to PDF format

### Usage

1. Select the File Converter from the navigation drawer
2. Drag and drop a file or click to browse your file system
3. Choose the desired conversion type
4. Click "Convert Document"
5. Once conversion is complete, click "Download Converted File"

## Project Structure

```
SkillStack/
│
├── src/                  # Source files
│   ├── components/       # React components
│   │   ├── FileConverter/    # File Converter module
│   │   ├── Navigation/       # Navigation components
│   │   └── ...
│   ├── App.js           # Main application component
│   └── index.js         # Entry point for React
│
├── public/              # Static files
│   └── index.html       # HTML template
│
├── main.js              # Electron main process
├── preload.js           # Preload script for Electron
└── package.json         # Project dependencies and scripts
```

## Roadmap

- **Version 1.0**: File Converter module
- **Version 1.1**: Chemistry Lab module
- **Version 1.2**: Physics Simulator module
- **Version 1.3**: Additional tools (Algorithm Visualizer, Logic Simulator, etc.)
- **Version 2.0**: Cross-platform support, mobile apps, and collaboration features

## Technology Stack

- **Desktop Framework**: Electron.js
- **Frontend**: React.js
- **UI Components**: Chakra UI
- **File Conversion**: pdf-lib, mammoth.js, pptxgenjs
- **Local Storage**: Electron Store

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Electron.js team for the amazing cross-platform desktop framework
- React.js team for the frontend library
- The authors of pdf-lib, mammoth.js, and pptxgenjs for the conversion libraries
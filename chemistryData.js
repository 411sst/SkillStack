// src/components/ChemistryLab/chemistryData.js

// Define color scheme for element categories
export const categoryColors = {
  'alkali metal': 'red.500',
  'alkaline earth metal': 'orange.500',
  'transition metal': 'yellow.500',
  'post-transition metal': 'green.500',
  'metalloid': 'teal.500',
  'nonmetal': 'blue.500',
  'halogen': 'cyan.500',
  'noble gas': 'purple.500',
  'lanthanide': 'pink.500',
  'actinide': 'blue.400',
};

// Define periodic table data
export const periodicTableData = [
  {
    atomicNumber: 1,
    symbol: "H",
    name: "Hydrogen",
    category: "nonmetal",
    atomicMass: 1.008,
    tableRow: 1,
    tableCol: 1,
    electronConfiguration: "1s¹",
    electronegativity: 2.2,
    density: 0.00008988,
    meltingPoint: 14.01,
    boilingPoint: 20.28,
    discoveredBy: "Henry Cavendish",
    discoveryYear: 1766
  },
  // You can include more elements here, or keep just this one for testing
  {
    atomicNumber: 2,
    symbol: "He",
    name: "Helium",
    category: "noble gas",
    atomicMass: 4.0026,
    tableRow: 1,
    tableCol: 18,
    electronConfiguration: "1s²",
    density: 0.0001785,
    meltingPoint: 0.95,
    boilingPoint: 4.22,
    discoveredBy: "Pierre Janssen",
    discoveryYear: 1868
  }
];
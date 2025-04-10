// src/components/ChemistryLab/moleculesData.js

// Common molecules data with structure information
export const commonMolecules = [
    {
      id: 'h2o',
      name: 'Water',
      formula: 'H₂O',
      type: 'Inorganic',
      molWeight: 18.01528,
      state: 'Liquid',
      meltingPoint: 0,
      boilingPoint: 100,
      density: 1.0,
      description: 'Water is a polar inorganic compound that is at room temperature a tasteless and odorless liquid, which is nearly colorless apart from an inherent hint of blue. It is the main constituent of Earth\'s hydrosphere and the fluids of all known living organisms.',
      uses: [
        'Essential for all known forms of life',
        'Solvent for many substances',
        'Industrial cooling',
        'Agricultural irrigation'
      ],
      structure: {
        atoms: [
          { element: 'O', x: 0, y: 0, z: 0, radius: 1.52 },
          { element: 'H', x: -0.8, y: -0.5, z: 0, radius: 1.2 },
          { element: 'H', x: 0.8, y: -0.5, z: 0, radius: 1.2 }
        ],
        bonds: [
          { from: 0, to: 1, type: 1 },
          { from: 0, to: 2, type: 1 }
        ],
        boundingBox: { width: 1.6, height: 1.0, depth: 1.0 },
        center: { x: 0, y: -0.25, z: 0 }
      }
    },
    {
      id: 'co2',
      name: 'Carbon Dioxide',
      formula: 'CO₂',
      type: 'Inorganic',
      molWeight: 44.01,
      state: 'Gas',
      meltingPoint: -56.6,
      boilingPoint: -78.5, // Sublimation point at 1 atm
      density: 1.98, // at 25°C, 100 kPa
      description: 'Carbon dioxide is a colorless gas with a density about 53% higher than that of dry air. It consists of a carbon atom covalently double bonded to two oxygen atoms.',
      uses: [
        'Carbonation in beverages',
        'Fire extinguishers',
        'Photosynthesis in plants',
        'Industrial refrigeration (dry ice)'
      ],
      structure: {
        atoms: [
          { element: 'C', x: 0, y: 0, z: 0, radius: 1.7 },
          { element: 'O', x: -1.2, y: 0, z: 0, radius: 1.52 },
          { element: 'O', x: 1.2, y: 0, z: 0, radius: 1.52 }
        ],
        bonds: [
          { from: 0, to: 1, type: 2 },
          { from: 0, to: 2, type: 2 }
        ],
        boundingBox: { width: 2.4, height: 1.0, depth: 1.0 },
        center: { x: 0, y: 0, z: 0 }
      }
    },
    {
      id: 'c2h6o',
      name: 'Ethanol',
      formula: 'C₂H₅OH',
      type: 'Organic',
      molWeight: 46.07,
      state: 'Liquid',
      meltingPoint: -114.1,
      boilingPoint: 78.37,
      density: 0.789,
      description: 'Ethanol, also called alcohol, ethyl alcohol and drinking alcohol, is a chemical compound, a simple alcohol with the chemical formula C₂H₅OH. It is a volatile, flammable, colorless liquid with a characteristic wine-like odor and pungent taste.',
      uses: [
        'Alcoholic beverages',
        'Antiseptic',
        'Solvent',
        'Biofuel'
      ],
      structure: {
        atoms: [
          { element: 'C', x: 0, y: 0, z: 0, radius: 1.7 },
          { element: 'C', x: 1.2, y: 0, z: 0, radius: 1.7 },
          { element: 'O', x: 2.4, y: 0, z: 0, radius: 1.52 },
          { element: 'H', x: -0.4, y: 0.9, z: 0, radius: 1.2 },
          { element: 'H', x: -0.4, y: -0.9, z: 0, radius: 1.2 },
          { element: 'H', x: -0.4, y: 0, z: 0.9, radius: 1.2 },
          { element: 'H', x: 1.6, y: 0.9, z: 0, radius: 1.2 },
          { element: 'H', x: 1.6, y: -0.9, z: 0, radius: 1.2 },
          { element: 'H', x: 2.8, y: 0.9, z: 0, radius: 1.2 }
        ],
        bonds: [
          { from: 0, to: 1, type: 1 },
          { from: 1, to: 2, type: 1 },
          { from: 0, to: 3, type: 1 },
          { from: 0, to: 4, type: 1 },
          { from: 0, to: 5, type: 1 },
          { from: 1, to: 6, type: 1 },
          { from: 1, to: 7, type: 1 },
          { from: 2, to: 8, type: 1 }
        ],
        boundingBox: { width: 3.2, height: 1.8, depth: 1.8 },
        center: { x: 1.0, y: 0, z: 0 }
      }
    },
    {
      id: 'nh3',
      name: 'Ammonia',
      formula: 'NH₃',
      type: 'Inorganic',
      molWeight: 17.031,
      state: 'Gas',
      meltingPoint: -77.73,
      boilingPoint: -33.34,
      density: 0.73, // at -33.3°C, liquid
      description: 'Ammonia is a compound of nitrogen and hydrogen with the formula NH₃. It is a colorless gas with a characteristic pungent smell and is a common nitrogenous waste, particularly among aquatic organisms.',
      uses: [
        'Fertilizer production',
        'Household cleaning products',
        'Refrigeration',
        'Manufacturing of nitric acid'
      ],
      structure: {
        atoms: [
          { element: 'N', x: 0, y: 0, z: 0, radius: 1.55 },
          { element: 'H', x: 0.94, y: 0, z: 0, radius: 1.2 },
          { element: 'H', x: -0.47, y: 0.81, z: 0, radius: 1.2 },
          { element: 'H', x: -0.47, y: -0.81, z: 0, radius: 1.2 }
        ],
        bonds: [
          { from: 0, to: 1, type: 1 },
          { from: 0, to: 2, type: 1 },
          { from: 0, to: 3, type: 1 }
        ],
        boundingBox: { width: 1.88, height: 1.62, depth: 1.0 },
        center: { x: 0, y: 0, z: 0 }
      }
    },
    {
      id: 'c6h12o6',
      name: 'Glucose',
      formula: 'C₆H₁₂O₆',
      type: 'Organic',
      molWeight: 180.156,
      state: 'Solid',
      meltingPoint: 150,
      boilingPoint: 'Decomposes',
      density: 1.54,
      description: 'Glucose is a simple sugar with the molecular formula C₆H₁₂O₆. Glucose is the most abundant monosaccharide, a subcategory of carbohydrates. It is a primary source of energy for living organisms.',
      uses: [
        'Energy source in cellular respiration',
        'Sweetener in food industry',
        'Medical tests and treatments',
        'Fermentation in brewing and wine making'
      ],
      structure: {
        // Simplified glucose structure (ring form)
        atoms: [
          // Carbon atoms in the ring
          { element: 'C', x: 0, y: 0, z: 0, radius: 1.7 },
          { element: 'C', x: 1.2, y: 0.6, z: 0, radius: 1.7 },
          { element: 'C', x: 2.1, y: -0.3, z: 0, radius: 1.7 },
          { element: 'C', x: 1.5, y: -1.5, z: 0, radius: 1.7 },
          { element: 'C', x: 0.1, y: -1.5, z: 0, radius: 1.7 },
          { element: 'O', x: -0.7, y: -0.4, z: 0, radius: 1.52 },
          // Oxygen atoms attached to the ring
          { element: 'O', x: 1.3, y: 1.9, z: 0, radius: 1.52 },
          { element: 'O', x: 3.4, y: -0.1, z: 0, radius: 1.52 },
          { element: 'O', x: 2.2, y: -2.7, z: 0, radius: 1.52 },
          { element: 'O', x: -0.7, y: -2.6, z: 0, radius: 1.52 },
          // Representative hydrogen (not all shown for simplicity)
          { element: 'H', x: 0.1, y: 0.9, z: 0.5, radius: 1.2 }
        ],
        bonds: [
          // Ring bonds
          { from: 0, to: 1, type: 1 },
          { from: 1, to: 2, type: 1 },
          { from: 2, to: 3, type: 1 },
          { from: 3, to: 4, type: 1 },
          { from: 4, to: 5, type: 1 },
          { from: 5, to: 0, type: 1 },
          // Oxygen bonds
          { from: 1, to: 6, type: 1 },
          { from: 2, to: 7, type: 1 },
          { from: 3, to: 8, type: 1 },
          { from: 4, to: 9, type: 1 },
          // One sample hydrogen bond
          { from: 0, to: 10, type: 1 }
        ],
        boundingBox: { width: 4.1, height: 4.6, depth: 1.0 },
        center: { x: 1.0, y: -0.4, z: 0 }
      }
    },
    {
      id: 'ch4',
      name: 'Methane',
      formula: 'CH₄',
      type: 'Organic',
      molWeight: 16.04,
      state: 'Gas',
      meltingPoint: -182.5,
      boilingPoint: -161.5,
      density: 0.656, // at 25°C, relative to air
      description: 'Methane is a chemical compound with the chemical formula CH₄. It is a group-14 hydride, the simplest alkane, and the main constituent of natural gas.',
      uses: [
        'Natural gas fuel',
        'Hydrogen production',
        'Chemical synthesis',
        'Rocket fuel'
      ],
      structure: {
        atoms: [
          { element: 'C', x: 0, y: 0, z: 0, radius: 1.7 },
          { element: 'H', x: 0.9, y: 0, z: 0, radius: 1.2 },
          { element: 'H', x: -0.3, y: 0.85, z: 0, radius: 1.2 },
          { element: 'H', x: -0.3, y: -0.85, z: 0, radius: 1.2 },
          { element: 'H', x: -0.3, y: 0, z: 0.85, radius: 1.2 }
        ],
        bonds: [
          { from: 0, to: 1, type: 1 },
          { from: 0, to: 2, type: 1 },
          { from: 0, to: 3, type: 1 },
          { from: 0, to: 4, type: 1 }
        ],
        boundingBox: { width: 1.8, height: 1.7, depth: 1.7 },
        center: { x: 0, y: 0, z: 0 }
      }
    }
  ];
  
  // Chemical reaction templates for the reaction simulator
  export const commonReactions = [
    {
      id: 'combustion-methane',
      name: 'Methane Combustion',
      equation: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O',
      type: 'Combustion',
      energyChange: 'Exothermic',
      energyValue: -890.3, // kJ/mol
      details: 'The combustion of methane is a highly exothermic reaction that produces carbon dioxide and water. It is the main reaction when natural gas is burned.',
      reactants: ['ch4', 'o2'],
      products: ['co2', 'h2o'],
      conditions: 'Ignition source needed to start the reaction',
      applications: [
        'Cooking',
        'Heating',
        'Power generation',
        'Industrial processes'
      ]
    },
    {
      id: 'water-formation',
      name: 'Hydrogen + Oxygen',
      equation: '2 H₂ + O₂ → 2 H₂O',
      type: 'Synthesis',
      energyChange: 'Exothermic',
      energyValue: -572, // kJ/mol
      details: 'The formation of water from hydrogen and oxygen is a highly exothermic reaction. It releases a large amount of energy, which is why hydrogen is used as a fuel.',
      reactants: ['h2', 'o2'],
      products: ['h2o'],
      conditions: 'Ignition source or catalyst needed',
      applications: [
        'Hydrogen fuel cells',
        'Rocket propulsion',
        'Laboratory demonstration'
      ]
    },
    {
      id: 'photosynthesis',
      name: 'Photosynthesis (simplified)',
      equation: '6 CO₂ + 6 H₂O + light → C₆H₁₂O₆ + 6 O₂',
      type: 'Biochemical',
      energyChange: 'Endothermic',
      energyValue: 2870, // kJ/mol
      details: 'Photosynthesis is the process by which plants, algae, and some bacteria convert carbon dioxide and water into glucose and oxygen using light energy from the sun.',
      reactants: ['co2', 'h2o'],
      products: ['c6h12o6', 'o2'],
      conditions: 'Light, chlorophyll, enzymes',
      applications: [
        'Plant growth',
        'Oxygen production',
        'Carbon dioxide consumption',
        'Food chain foundation'
      ]
    },
    {
      id: 'neutralization-naoh-hcl',
      name: 'Neutralization (NaOH + HCl)',
      equation: 'NaOH + HCl → NaCl + H₂O',
      type: 'Neutralization',
      energyChange: 'Exothermic',
      energyValue: -57.3, // kJ/mol
      details: 'A neutralization reaction between a strong base (sodium hydroxide) and a strong acid (hydrochloric acid) produces a salt (sodium chloride) and water.',
      reactants: ['naoh', 'hcl'],
      products: ['nacl', 'h2o'],
      conditions: 'Aqueous solution, room temperature',
      applications: [
        'Acid-base titrations',
        'pH control',
        'Chemical manufacturing',
        'Waste treatment'
      ]
    },
    {
      id: 'fermentation',
      name: 'Alcoholic Fermentation',
      equation: 'C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂',
      type: 'Biochemical',
      energyChange: 'Exothermic',
      energyValue: -67, // kJ/mol
      details: 'Alcoholic fermentation is the conversion of sugars to alcohol and carbon dioxide by yeast enzymes in the absence of oxygen.',
      reactants: ['c6h12o6'],
      products: ['c2h6o', 'co2'],
      conditions: 'Anaerobic, yeast enzymes, 25-40°C',
      applications: [
        'Beer and wine production',
        'Bread making',
        'Biofuel production',
        'Industrial ethanol production'
      ]
    }
  ];
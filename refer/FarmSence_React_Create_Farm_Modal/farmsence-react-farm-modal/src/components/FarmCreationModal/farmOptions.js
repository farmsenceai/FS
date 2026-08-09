export const FARMER_PROFILES = [
  { value: 'business', label: 'Business / Enterprise User' },
  { value: 'experienced', label: 'Experienced Farmer' },
  { value: 'new', label: 'New / Interested Farmer' },
  { value: 'contract', label: 'Contract Farmer' },
  { value: 'government', label: 'Government / Institutional Farm' },
  { value: 'research', label: 'Research / Demonstration Farm' },
];

export const FARM_CATEGORIES = [
  'Commercial Farm',
  'Individual Farm',
  'Contract Farm',
  'Demonstration Farm',
  'Government Farm',
  'Research Farm',
  'Educational Farm',
];

export const PRIMARY_ACTIVITIES = [
  { value: 'poultry', label: 'Poultry' },
  { value: 'hatchery', label: 'Hatchery' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'goat_sheep', label: 'Goat / Sheep' },
  { value: 'pig', label: 'Pig Farming' },
  { value: 'fish', label: 'Aquaculture / Fish' },
  { value: 'crop', label: 'Crop Farming' },
  { value: 'horticulture', label: 'Horticulture' },
  { value: 'mixed', label: 'Mixed Farming' },
];

export const SUBCATEGORY_OPTIONS = {
  poultry: [
    'Broiler',
    'Layer',
    'Native / Country Chicken',
    'Breeder',
    'Parent Stock',
    'Backyard Poultry',
    'Mixed Poultry',
  ],
  hatchery: [
    'Broiler Hatchery',
    'Layer Hatchery',
    'Native Bird Hatchery',
    'Multi-species Hatchery',
  ],
  dairy: ['Cow Dairy', 'Buffalo Dairy', 'Mixed Dairy'],
  goat_sheep: ['Goat', 'Sheep', 'Mixed Goat & Sheep'],
  pig: ['Breeding Farm', 'Grower Farm', 'Farrow-to-finish'],
  fish: ['Pond Culture', 'Biofloc', 'RAS', 'Cage Culture'],
  crop: ['Cereals', 'Pulses', 'Oilseeds', 'Vegetables', 'Mixed Crops'],
  horticulture: ['Fruits', 'Vegetables', 'Floriculture', 'Nursery'],
  mixed: ['Integrated Farm', 'Crop + Livestock', 'Livestock + Aquaculture'],
};

export const OWNERSHIP_TYPES = [
  'Individual / Proprietorship',
  'Partnership',
  'Private Limited Company',
  'LLP',
  'Cooperative / FPO',
  'NGO / Trust',
  'Government',
];

export const FARM_STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'construction', label: 'Under Construction' },
  { value: 'active', label: 'Active' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'paused', label: 'Temporarily Closed' },
];

export const INDIA_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
];

export const AREA_UNITS = [
  { value: 'sqm', label: 'm²' },
  { value: 'sqft', label: 'sq ft' },
  { value: 'acre', label: 'acre' },
  { value: 'hectare', label: 'hectare' },
  { value: 'bigha', label: 'bigha' },
];

export const YES_NO_UNKNOWN = [
  { value: '', label: 'Select' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'Not sure' },
];

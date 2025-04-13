export type Era = {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  description: string;
};

export type Continent =
  | 'Africa'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'South America'
  | 'Australia'
  | 'Antarctica'
  | 'Australia/Oceania'
  | 'Middle East (West Asia)'
  | 'East Asia'
  | 'South Asia'
  | 'Global';

export type BeliefSystem =
  | 'Monotheism'
  | 'Polytheism'
  | 'Nontheism'
  | 'Pantheism'
  | 'Panentheism'
  | 'Deism'
  | 'Atheism'
  | 'Agnosticism'
  | 'Dualism'
  | 'Animism'
  | 'Philosophical';

export type ReligionStatus = 'active' | 'extinct' | 'evolved';

export type Religion = {
  id: string;
  name: string;
  summary: string;
  description: string;
  founderName?: string;
  foundingYear: number;
  continent: Continent;
  originCountry: string;
  beliefs: BeliefSystem[];
  status: ReligionStatus;
  approxFollowers?: number;
  practices: string[];
  holyTexts?: string[];
  keyFigures?: string[];
  branches?: string[];
  parentReligions?: string[]; // IDs of parent religions
  childReligions?: string[]; // IDs of religions that evolved from this one
  relatedReligions?: string[]; // IDs of religions with significant connections
  imageUrl?: string;
  era: string; // Era ID
};

export type FilterOptions = {
  era?: string;
  continent?: Continent;
  beliefs?: BeliefSystem[];
  status?: ReligionStatus;
  searchQuery?: string;
};

export type TimelineViewMode = 'horizontal' | 'vertical';

export type User = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
};

export type EditSuggestion = {
  id: string;
  religionId: string;
  userId: string;
  fieldName: string;
  currentValue: string;
  suggestedValue: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
};
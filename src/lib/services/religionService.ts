import { supabase } from '../supabase';
import type { Religion, Era, BeliefSystem } from '../../types';

// Helper function to validate belief system
function isValidBeliefSystem(belief: string): belief is BeliefSystem {
  const validBeliefs = [
    'Monotheism', 'Polytheism', 'Nontheism', 'Pantheism', 'Panentheism',
    'Deism', 'Atheism', 'Agnosticism', 'Dualism', 'Animism', 'Philosophical'
  ];
  const isValid = validBeliefs.includes(belief);
  
  if (!isValid) {
    // console.warn(`Invalid belief system: "${belief}" is not in the list of valid beliefs:`, validBeliefs);
  
    // Check if this is a case sensitivity issue
    const lowerCaseBelief = belief.toLowerCase();
    const matchingBelief = validBeliefs.find(b => b.toLowerCase() === lowerCaseBelief);
    if (matchingBelief) {
      console.warn(`  - Case sensitivity issue detected: "${belief}" should be "${matchingBelief}"`);
    }
  }
  
  return isValid;
}

export async function fetchEras(): Promise<Era[]> {
  const { data, error } = await supabase
    .from('eras')
    .select('*')
    .order('start_year');

  if (error) {
    console.error('Error fetching eras:', error);
    return [];
  }

  return data.map(era => ({
    id: era.id,
    name: era.name,
    startYear: era.start_year,
    endYear: era.end_year,
    description: era.description || ''
  }));
}

export async function fetchReligions(): Promise<Religion[]> {
  // Fetch all religions (consider adding .limit(1000) if dataset is very large)
  const { data: religionData, error: religionError } = await supabase
    .from('religions')
    .select(`
      *,
      era:era_id (id, name),
      religion_beliefs (belief),
      religion_practices (practice),
      religion_texts (text_name),
      religion_figures (figure_name),
      religion_branches (branch_name)
    `)
    .order('founding_year');
 
  if (religionError) {
    console.error('Error fetching religions:', religionError);
    return [];
  }

  // Fetch all religion relationships
  const { data: relationshipsData, error: relationshipsError } = await supabase
    .from('religion_relationships')
    .select('*');
 
  if (relationshipsError) {
    console.error('Error fetching religion relationships:', relationshipsError);
    return [];
  }

  // Build relationships map
  const parentMap: Record<string, string[]> = {};
  const childMap: Record<string, string[]> = {};

  relationshipsData.forEach(rel => {
    if (!parentMap[rel.child_id]) parentMap[rel.child_id] = [];
    parentMap[rel.child_id].push(rel.parent_id);
    if (!childMap[rel.parent_id]) childMap[rel.parent_id] = [];
    childMap[rel.parent_id].push(rel.child_id);
  });

  const mappedReligions = religionData.map(religion => {
    const allBeliefs = religion.religion_beliefs.map(b => b.belief);
    const beliefs = allBeliefs.filter(isValidBeliefSystem);
    const practices = religion.religion_practices.map(p => p.practice);
    const holyTexts = religion.religion_texts.map(t => t.text_name);
    const keyFigures = religion.religion_figures.map(f => f.figure_name);
    const branches = religion.religion_branches.map(b => b.branch_name);

    return {
      id: religion.id,
      name: religion.name,
      summary: religion.summary || '',
      description: religion.description || '',
      founderName: religion.founder_name || undefined,
      foundingYear: religion.founding_year,
      continent: religion.continent as any,
      originCountry: religion.origin_country || '',
      beliefs: beliefs,
      status: (religion.status || 'active') as 'active' | 'extinct' | 'evolved',
      approxFollowers: religion.approx_followers || undefined,
      practices: practices,
      holyTexts: holyTexts.length > 0 ? holyTexts : undefined,
      keyFigures: keyFigures.length > 0 ? keyFigures : undefined,
      branches: branches.length > 0 ? branches : undefined,
      parentReligions: parentMap[religion.id] || [],
      childReligions: childMap[religion.id] || [],
      imageUrl: religion.image_url || `https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=800&q=80`,
      era: religion.era_id || '' // Use era_id directly for consistency
    };
  });

  // Only log summary information
  console.log(`Fetched ${mappedReligions.length} religions and ${relationshipsData.length} relationships from database.`);
  return mappedReligions;
}

export async function fetchReligionBySlug(slug: string): Promise<Religion | null> {
  console.log(`Fetching religion by slug: ${slug}`);
  
  // First try to find by slug field if it exists
  let query = supabase
    .from('religions')
    .select(`
      *,
      era:era_id (id, name),
      religion_beliefs (belief),
      religion_practices (practice),
      religion_texts (text_name),
      religion_figures (figure_name),
      religion_branches (branch_name)
    `);
  
  // Check if the religions table has a slug column
  const { data: tableInfo, error: tableError } = await supabase
    .from('religions')
    .select('slug')
    .limit(1);
  
  if (tableError) {
    console.error('Error checking for slug column:', tableError);
  }
  
  // If the slug column exists, use it for the query
  if (tableInfo && tableInfo.length > 0 && 'slug' in tableInfo[0]) {
    console.log('Using slug column for query');
    query = query.eq('slug', slug);
  } else {
    // Convert slug back to a name by replacing hyphens with spaces and capitalizing words
    const nameFromSlug = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    console.log(`Converted slug to name: "${nameFromSlug}"`);
    query = query.ilike('name', nameFromSlug);
  }
  
  // Execute the query
  const { data, error } = await query.limit(1);
  
  if (error) {
    console.error('Error fetching religion by slug:', error);
    return null;
  }
  
  if (!data || data.length === 0) {
    console.error(`No religion found for slug: ${slug}`);
    return null;
  }
  
  // Use the first result
  const religionData = data[0];
  console.log(`Found religion: ${religionData.name}`);

  // Get religion relationships
  const { data: parentData, error: parentError } = await supabase
    .from('religion_relationships')
    .select('parent_id')
    .eq('child_id', religionData.id);

  if (parentError) {
    console.error('Error fetching parent religions:', parentError);
    return null;
  }

  const { data: childData, error: childError } = await supabase
    .from('religion_relationships')
    .select('child_id')
    .eq('parent_id', religionData.id);

  if (childError) {
    console.error('Error fetching child religions:', childError);
    return null;
  }

  const beliefs = religionData.religion_beliefs
    .map((b: any) => b.belief)
    .filter(isValidBeliefSystem);
  const practices = religionData.religion_practices.map((p: any) => p.practice);
  const holyTexts = religionData.religion_texts.map((t: any) => t.text_name);
  const keyFigures = religionData.religion_figures.map((f: any) => f.figure_name);
  const branches = religionData.religion_branches.map((b: any) => b.branch_name);
  
  return {
    id: religionData.id,
    name: religionData.name,
    summary: religionData.summary || '',
    description: religionData.description || '',
    founderName: religionData.founder_name || undefined,
    foundingYear: religionData.founding_year,
    continent: religionData.continent as any,
    originCountry: religionData.origin_country || '',
    beliefs: beliefs,
    status: (religionData.status || 'active') as 'active' | 'extinct' | 'evolved',
    approxFollowers: religionData.approx_followers || undefined,
    practices: practices,
    holyTexts: holyTexts.length > 0 ? holyTexts : undefined,
    keyFigures: keyFigures.length > 0 ? keyFigures : undefined,
    branches: branches.length > 0 ? branches : undefined,
    parentReligions: parentData.map(p => p.parent_id),
    childReligions: childData.map(c => c.child_id),
    imageUrl: religionData.image_url || `https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=800&q=80`,
    era: religionData.era_id || '' // Use era_id directly for consistency
  };
}

export async function fetchReligionById(id: string): Promise<Religion | null> {
  const { data, error } = await supabase
    .from('religions')
    .select(`
      *,
      era:era_id (id, name),
      religion_beliefs (belief),
      religion_practices (practice),
      religion_texts (text_name),
      religion_figures (figure_name),
      religion_branches (branch_name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching religion:', error);
    return null;
  }

  // Get religion relationships
  const { data: parentData, error: parentError } = await supabase
    .from('religion_relationships')
    .select('parent_id')
    .eq('child_id', id);

  if (parentError) {
    console.error('Error fetching parent religions:', parentError);
    return null;
  }

  const { data: childData, error: childError } = await supabase
    .from('religion_relationships')
    .select('child_id')
    .eq('parent_id', id);

  if (childError) {
    console.error('Error fetching child religions:', childError);
    return null;
  }

  const beliefs = data.religion_beliefs
    .map(b => b.belief)
    .filter(isValidBeliefSystem);
  const practices = data.religion_practices.map(p => p.practice);
  const holyTexts = data.religion_texts.map(t => t.text_name);
  const keyFigures = data.religion_figures.map(f => f.figure_name);
  const branches = data.religion_branches.map(b => b.branch_name);
  
  return {
    id: data.id,
    name: data.name,
    summary: data.summary || '',
    description: data.description || '',
    founderName: data.founder_name || undefined,
    foundingYear: data.founding_year,
    continent: data.continent as any,
    originCountry: data.origin_country || '',
    beliefs: beliefs,
    status: (data.status || 'active') as 'active' | 'extinct' | 'evolved',
    approxFollowers: data.approx_followers || undefined,
    practices: practices,
    holyTexts: holyTexts.length > 0 ? holyTexts : undefined,
    keyFigures: keyFigures.length > 0 ? keyFigures : undefined,
    branches: branches.length > 0 ? branches : undefined,
    parentReligions: parentData.map(p => p.parent_id),
    childReligions: childData.map(c => c.child_id),
    imageUrl: data.image_url || `https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=800&q=80`,
    era: data.era_id || '' // Use era_id directly for consistency
  };
}

export async function searchReligions(term: string): Promise<Religion[]> {
  const { data, error } = await supabase
    .rpc('search_religions', { search_term: term })
    .select();

  if (error) {
    console.error('Error searching religions:', error);
    return [];
  }

  return data.map(religion => ({
    id: religion.id,
    name: religion.name,
    summary: religion.summary || '',
    description: religion.description || '',
    founderName: religion.founder_name || undefined,
    foundingYear: religion.founding_year,
    continent: religion.continent as any,
    originCountry: religion.origin_country || '',
    beliefs: [] as BeliefSystem[], // Empty array of valid belief systems
    status: (religion.status || 'active') as 'active' | 'extinct' | 'evolved',
    approxFollowers: religion.approx_followers || undefined,
    practices: [],
    imageUrl: religion.image_url || `https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=800&q=80`,
    era: religion.era_id || '' // This should match the era field in the other functions
  }));
}

// Count total religions in the database
export async function countReligions(): Promise<number> {
  const { count, error } = await supabase
    .from('religions')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error counting religions:', error);
    return 0;
  }

  return count || 0;
}
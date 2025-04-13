import { supabase } from '../supabase';
import type { Religion, Era, BeliefSystem } from '../../types';

// Helper function to validate belief system
function isValidBeliefSystem(belief: string): belief is BeliefSystem {
  return ['Monotheism', 'Polytheism', 'Nontheism', 'Pantheism', 'Panentheism', 'Deism', 'Atheism', 'Agnosticism'].includes(belief);
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
  console.log("Fetching religions from database...");
  
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

  console.log(`Retrieved ${religionData.length} religions from database`);

  // Get religion relationships
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
    // Add to child's parent map
    if (!parentMap[rel.child_id]) {
      parentMap[rel.child_id] = [];
    }
    parentMap[rel.child_id].push(rel.parent_id);
    
    // Add to parent's child map
    if (!childMap[rel.parent_id]) {
      childMap[rel.parent_id] = [];
    }
    childMap[rel.parent_id].push(rel.child_id);
  });

  return religionData.map(religion => {
    const beliefs = religion.religion_beliefs
      .map(b => b.belief)
      .filter(isValidBeliefSystem);
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
      era: religion.era?.id || ''
    };
  });
}

export async function fetchReligionBySlug(slug: string): Promise<Religion | null> {
  // Convert slug back to a name by replacing hyphens with spaces and capitalizing words
  const nameFromSlug = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

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
    .ilike('name', nameFromSlug)
    .single();

  if (error) {
    console.error('Error fetching religion by slug:', error);
    return null;
  }

  // Get religion relationships
  const { data: parentData, error: parentError } = await supabase
    .from('religion_relationships')
    .select('parent_id')
    .eq('child_id', data.id);

  if (parentError) {
    console.error('Error fetching parent religions:', parentError);
    return null;
  }

  const { data: childData, error: childError } = await supabase
    .from('religion_relationships')
    .select('child_id')
    .eq('parent_id', data.id);

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
    era: data.era?.id || ''
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
    era: data.era?.id || ''
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
    era: religion.era_id || ''
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
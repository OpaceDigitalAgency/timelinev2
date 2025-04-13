import React, { useState, useEffect } from 'react';
import type { Religion, Era } from '../types';

interface VerticalTimelineProps {
  religions: Religion[];
  eras: Era[];
}

const VerticalTimeline: React.FC<VerticalTimelineProps> = ({ religions: initialReligions, eras }) => {
  const [filteredReligions, setFilteredReligions] = useState<Religion[]>(initialReligions);

  useEffect(() => {
    // Listen for filter changes
    const handleFilterChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const filters = customEvent.detail;
      
      let filtered = [...initialReligions];
      
      // Filter by era
      if (filters.eras && filters.eras.length > 0) {
        filtered = filtered.filter(religion => filters.eras.includes(religion.era));
      }
      
      // Filter by continent
      if (filters.continents && filters.continents.length > 0) {
        filtered = filtered.filter(religion => 
          filters.continents.some((continent: string) => 
            religion.continent && religion.continent.includes(continent)
          )
        );
      }
      
      // Filter by beliefs
      if (filters.beliefs && filters.beliefs.length > 0) {
        filtered = filtered.filter(religion => 
          religion.beliefs.some(belief => 
            filters.beliefs.includes(belief)
          )
        );
      }
      
      // Filter by status
      if (filters.statuses && filters.statuses.length > 0) {
        filtered = filtered.filter(religion => filters.statuses.includes(religion.status));
      }
      
      // Filter by search term
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(religion => 
          religion.name.toLowerCase().includes(searchLower) ||
          religion.summary.toLowerCase().includes(searchLower) ||
          religion.description.toLowerCase().includes(searchLower) ||
          (religion.founderName && religion.founderName.toLowerCase().includes(searchLower))
        );
      }
      
      setFilteredReligions(filtered);
    };

    document.addEventListener('timeline-filters-changed', handleFilterChange);
    
    return () => {
      document.removeEventListener('timeline-filters-changed', handleFilterChange);
    };
  }, [initialReligions]);

  useEffect(() => {
    setFilteredReligions(initialReligions);
  }, [initialReligions]);
  
  // Sort religions by foundingYear and remove duplicates
  const uniqueReligionIds = new Set();
  
  // First pass: collect all unique IDs
  filteredReligions.forEach(religion => {
    uniqueReligionIds.add(religion.id);
  });
  
  console.log(`Found ${uniqueReligionIds.size} unique religions out of ${filteredReligions.length} total in vertical timeline`);
  
  // Second pass: filter and sort
  const sortedReligions = [...filteredReligions]
    .filter(r => {
      // Filter out religions with missing foundingYear
      if (typeof r.foundingYear !== 'number' || isNaN(r.foundingYear)) {
        return false;
      }
      
      // Keep only one instance of each religion by ID
      if (uniqueReligionIds.has(r.id)) {
        uniqueReligionIds.delete(r.id); // Remove from set so next occurrence is filtered out
        return true;
      }
      
      return false;
    })
    .sort((a, b) => a.foundingYear - b.foundingYear);
  
  // Group religions by era
  const religionsByEra = eras.map(era => {
    const eraReligions = sortedReligions.filter(
      religion => religion.foundingYear >= era.startYear && religion.foundingYear <= era.endYear
    );
    return { era, religions: eraReligions };
  });

  // Format year (BCE/CE)
  const formatYear = (year: number): string => {
    return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
  };

  // Get status classes
  const getStatusClasses = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'extinct': return 'bg-gray-400';
      case 'evolved': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="vertical-timeline py-8">
      {filteredReligions.length === 0 ? (
        <div className="text-center p-10">
          <p className="text-gray-500">No religions match the current filters. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="relative container mx-auto px-4">
          {/* Timeline line */}
          <div className="absolute left-[9px] md:left-1/2 md:ml-[-1px] top-0 bottom-0 w-[2px] bg-gray-200"></div>
          
          {religionsByEra.map(({ era, religions }) => (
            religions.length > 0 && (
              <div key={era.id} className="mb-12">
                {/* Era heading */}
                <div className="relative md:flex items-center justify-center mb-6">
                  <div className="absolute left-0 md:left-1/2 top-[10px] md:top-1/2 transform md:-translate-x-1/2 md:-translate-y-1/2 w-[20px] h-[20px] bg-primary-600 rounded-full z-10"></div>
                  <div className="pl-10 md:pl-0 md:absolute md:left-0 md:top-1/2 md:pr-8 md:w-[50%] md:text-right md:transform md:-translate-y-1/2">
                    <h2 className="text-xl font-bold text-gray-800">{era.name}</h2>
                    <p className="text-sm text-gray-500">{formatYear(era.startYear)} - {formatYear(era.endYear)}</p>
                  </div>
                </div>
                
                {/* Era religions */}
                {religions.length > 0 ? (
                  religions.map((religion, index) => (
                    <div key={religion.id} className="relative mb-10">
                      {/* Timeline dot */}
                      <div className={`absolute left-0 md:left-1/2 top-[20px] transform md:-translate-x-1/2 w-[10px] h-[10px] rounded-full z-10 border-2 border-white ${getStatusClasses(religion.status)}`}></div>
                      
                      {/* Content */}
                      <div className={`ml-10 md:ml-0 md:w-[45%] ${index % 2 === 0 ? 'md:float-left md:pr-8 md:text-right' : 'md:float-right md:pl-8'}`}>
                        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                          <div className="flex flex-col md:items-end">
                            <span className="text-sm text-gray-500">{formatYear(religion.foundingYear)}</span>
                            <h3 className="text-lg font-semibold text-gray-800">{religion.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{religion.summary}</p>
                          
                          {religion.beliefs.length > 0 && (
                            <div className={`flex flex-wrap gap-1 mt-3 ${index % 2 === 0 ? 'md:justify-end' : ''}`}>
                              {religion.beliefs.map(belief => (
                                <span key={belief} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                                  {belief}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className={`mt-3 ${index % 2 === 0 ? 'md:text-right' : ''}`}>
                            <a href={`/religions/${religion.id}`} className="text-primary-600 text-sm font-medium hover:text-primary-800 transition-colors">
                              View Details →
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="clear-both"></div>
                    </div>
                  ))
                ) : null}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default VerticalTimeline;
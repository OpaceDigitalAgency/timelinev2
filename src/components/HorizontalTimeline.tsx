import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Religion, Era } from '../types';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface HorizontalTimelineProps {
  religions: Religion[];
  eras: Era[];
}

const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({ religions: initialReligions, eras }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedReligion, setSelectedReligion] = useState<Religion | null>(null);
  const [width, setWidth] = useState(1000);
  const [filteredReligions, setFilteredReligions] = useState<Religion[]>(initialReligions);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const height = 600; // Increased height for better spacing
  const nodeRadius = 8;
  const padding = { top: 50, right: 70, bottom: 150, left: 70 };

  // Format year (BCE/CE)
  const formatYear = (year: number): string => {
    return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
            religion.continent && (
              typeof religion.continent === 'string' 
                ? religion.continent.includes(continent) 
                : religion.continent === continent
            )
          )
        );
      }
      
      // Filter by beliefs
      if (filters.beliefs && filters.beliefs.length > 0) {
        filtered = filtered.filter(religion => 
          religion.beliefs && religion.beliefs.some(belief => 
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

  // Listen for timeline zoom and refresh events from the page controls
  useEffect(() => {
    const handleTimelineZoom = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail === 'in') {
        handleZoomIn();
      } else if (customEvent.detail === 'out') {
        handleZoomOut();
      }
    };

    const handleTimelineRefresh = () => {
      handleRefresh();
    };

    document.addEventListener('timeline-zoom', handleTimelineZoom);
    document.addEventListener('timeline-refresh', handleTimelineRefresh);

    return () => {
      document.removeEventListener('timeline-zoom', handleTimelineZoom);
      document.removeEventListener('timeline-refresh', handleTimelineRefresh);
    };
  }, []);
// Function to handle zoom in
const handleZoomIn = () => {
  setZoomLevel(prev => Math.min(prev + 0.25, 3));
};

// Function to handle zoom out
const handleZoomOut = () => {
  setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
};

// Function to refresh the timeline
const handleRefresh = () => {
  setIsLoading(true);
  // Simulate a refresh by resetting the filtered religions and then setting them back
  setFilteredReligions([]);
  setTimeout(() => {
    setFilteredReligions(initialReligions);
    setIsLoading(false);
  }, 500);
};

useEffect(() => {
  if (!svgRef.current || filteredReligions.length === 0) return;

  const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Sort religions by founding year for more consistent visualization
    // Filter out religions with missing foundingYear (required for timeline placement)
    // Also filter out duplicate religions by ID to prevent duplicates in the timeline
    const uniqueReligionIds = new Set();
    
    // First pass: collect all unique IDs
    filteredReligions.forEach(religion => {
      uniqueReligionIds.add(religion.id);
    });
    
    console.log(`Found ${uniqueReligionIds.size} unique religions out of ${filteredReligions.length} total`);
    
    // Second pass: filter and sort
    const sortedReligions = [...filteredReligions]
      .filter(r => {
        // Filter out religions with missing foundingYear
        if (typeof r.foundingYear !== 'number' || isNaN(r.foundingYear)) {
          console.log(`Filtering out religion with invalid founding year: ${r.name}`);
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

    // Find min and max years for scale with padding to prevent edge crowding
    // Support negative foundingYear (BCE) for prehistoric religions
    let minYear = Math.min(...sortedReligions.map(r => r.foundingYear), ...eras.map(e => e.startYear));
    let maxYear = Math.max(
      ...sortedReligions.map(r => r.foundingYear),
      ...eras.map(e => e.endYear),
      // Include the current year for active religions
      ...sortedReligions.filter(r => r.status === 'active').map(() => new Date().getFullYear())
    );
    
    // Apply padding to the year range (10% on each side)
    const yearRange = maxYear - minYear;
    const yearPadding = yearRange * 0.1;
    minYear = minYear - yearPadding;
    maxYear = maxYear + yearPadding;

    // Log for debugging
    console.log(`Timeline has ${sortedReligions.length} religions from ${minYear} to ${maxYear}`);
    
    // Create time scale with improved domain
    const timeScale = d3.scaleLinear()
      .domain([minYear, maxYear])
      .range([padding.left, width - padding.right]);

    // Create background with alternating colors for eras
    const eraGroup = svg.append('g').attr('class', 'eras');
    
    eras.forEach((era, idx) => {
      // Alternate light colors for better visual separation
      const backgroundColor = idx % 2 === 0 ? '#f3f4f6' : '#f8fafc';
      
      eraGroup.append('rect')
        .attr('x', timeScale(era.startYear))
        .attr('y', padding.top - 30)
        .attr('width', timeScale(era.endYear) - timeScale(era.startYear))
        .attr('height', height - padding.top - padding.bottom + 30)
        .attr('fill', backgroundColor)
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1)
        .attr('rx', 0)
        .attr('ry', 0);
      
      eraGroup.append('text')
        .attr('x', timeScale(era.startYear + (era.endYear - era.startYear) / 2))
        .attr('y', padding.top - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#64748b')
        .text(era.name);
    });

    // Draw timeline axis
    const timelineGroup = svg.append('g').attr('class', 'timeline');
    
    // Draw the main line
    timelineGroup.append('line')
      .attr('x1', padding.left)
      .attr('y1', padding.top)
      .attr('x2', width - padding.right)
      .attr('y2', padding.top)
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2);
    
    // Improved tick calculation - adaptive based on timespan
    const yearSpan = maxYear - minYear;
    let tickCount = 10; // default
    
    // Adjust based on the time span
    if (yearSpan > 10000) {
      tickCount = Math.min(20, Math.floor(yearSpan / 5000));
    }
    
    const ticks = timeScale.ticks(tickCount);
    ticks.forEach(tick => {
      timelineGroup.append('line')
        .attr('x1', timeScale(tick))
        .attr('y1', padding.top - 10)
        .attr('x2', timeScale(tick))
        .attr('y2', padding.top + 10)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 1);
      
      timelineGroup.append('text')
        .attr('x', timeScale(tick))
        .attr('y', padding.top + 25)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#64748b')
        .text(formatYear(tick));
    });

    // Group religions by parentReligions for tree structure
    const religionsByParent: Record<string, Religion[]> = {};
    
    sortedReligions.forEach(religion => {
      const parentIds = religion.parentReligions || [];
      parentIds.forEach(parentId => {
        if (!religionsByParent[parentId]) religionsByParent[parentId] = [];
        religionsByParent[parentId].push(religion);
      });
    });

    // Create nodes
    const nodes = sortedReligions.map(religion => ({
      id: religion.id,
      year: religion.foundingYear,
      data: religion,
      x: timeScale(religion.foundingYear),
      y: 0,
      level: 0 // Will be calculated
    }));

    // Improved level calculation
    const calcLevels = () => {
      // Initialize all nodes at level 0
      const levelMap: Record<string, number> = {};
      nodes.forEach(node => levelMap[node.id] = 0);
      
      // Function to get all ancestors (parents, grandparents, etc)
      const getAncestors = (religionId: string, visited = new Set<string>()): string[] => {
        if (visited.has(religionId)) return []; // prevent circular references
        
        const religion = sortedReligions.find(r => r.id === religionId);
        if (!religion) return [];
        
        visited.add(religionId);
        const parents = religion.parentReligions || [];
        const ancestors = [...parents];
        
        for (const parentId of parents) {
          ancestors.push(...getAncestors(parentId, visited));
        }
        
        return ancestors;
      };
      
      // Function to get all descendants
      const getDescendants = (religionId: string, visited = new Set<string>()): string[] => {
        if (visited.has(religionId)) return []; // prevent circular references
        
        visited.add(religionId);
        const children = sortedReligions
          .filter(r => (r.parentReligions || []).includes(religionId))
          .map(r => r.id);
          
        const descendants = [...children];
        
        for (const childId of children) {
          descendants.push(...getDescendants(childId, visited));
        }
        
        return descendants;
      };
      
      // Assign levels based on genealogy
      for (const node of nodes) {
        const ancestors = getAncestors(node.id);
        const descendants = getDescendants(node.id);
        
        if (ancestors.length === 0 && descendants.length > 0) {
          // Root node (no parents, has children)
          levelMap[node.id] = 0;
        } else if (ancestors.length > 0) {
          // Has parents - compute level based on earliest ancestor
          levelMap[node.id] = ancestors.length;
        } else {
          // Isolated node
          levelMap[node.id] = 0;
        }
      }
      
      return levelMap;
    };
    
    const levelMap = calcLevels();
    
    // Find max level for scaling
    const maxLevel = Math.max(...Object.values(levelMap), 3); // ensure at least 3 levels
    
    // Calculate vertical spacing
    const levelHeight = (height - padding.top - padding.bottom) / (maxLevel + 1);

    // Assign vertical positions
    nodes.forEach(node => {
      node.level = levelMap[node.id];
      node.y = padding.top + (node.level * levelHeight);
    });

    // Minimize overlaps by adjusting positions
    const resolveOverlaps = () => {
      // Group nodes by level
      const nodesByLevel: Record<number, typeof nodes> = {};
      
      nodes.forEach(node => {
        if (!nodesByLevel[node.level]) nodesByLevel[node.level] = [];
        nodesByLevel[node.level].push(node);
      });
      
      // For each level, adjust x positions of nodes that are too close
      Object.values(nodesByLevel).forEach(levelNodes => {
        // Sort by x position
        levelNodes.sort((a, b) => a.x - b.x);
        
        const minDistance = nodeRadius * 4; // minimum distance between nodes
        
        for (let i = 1; i < levelNodes.length; i++) {
          const prev = levelNodes[i - 1];
          const curr = levelNodes[i];
          
          if (curr.x - prev.x < minDistance) {
            // Move current node to the right
            const overlap = minDistance - (curr.x - prev.x);
            curr.x += overlap / 2;
            
            // Move previous node to the left, but respect boundaries
            prev.x = Math.max(padding.left, prev.x - overlap / 2);
          }
        }
      });
    };
    
    resolveOverlaps();

    // Draw connections (lines between parent and child religions)
    const linksGroup = svg.append('g').attr('class', 'links');
    
    sortedReligions.forEach(religion => {
      const parentIds = religion.parentReligions || [];
      const childNode = nodes.find(n => n.id === religion.id);
      
      parentIds.forEach(parentId => {
        const parentNode = nodes.find(n => n.id === parentId);
        if (childNode && parentNode) {
          // Create a curved path between parent and child
          const controlX = (childNode.x + parentNode.x) / 2;
          
          linksGroup.append('path')
            .attr('d', `M${childNode.x},${childNode.y} C${controlX},${childNode.y} ${controlX},${parentNode.y} ${parentNode.x},${parentNode.y}`)
            .attr('fill', 'none')
            .attr('stroke', '#cbd5e1')
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.7);
        }
      });
    });

    // Draw religion nodes
    const nodesGroup = svg.append('g').attr('class', 'nodes');
    
    nodes.forEach(node => {
      const statusColors: Record<string, string> = {
        active: '#10b981',
        extinct: '#94a3b8',
        evolved: '#f59e0b'
      };
      
      nodesGroup.append('circle')
        .attr('cx', node.x)
        .attr('cy', node.y)
        .attr('r', nodeRadius)
        .attr('fill', statusColors[node.data.status] || '#94a3b8')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .attr('cursor', 'pointer')
        .attr('data-id', node.id)
        .on('click', () => {
          setSelectedReligion(node.data);
        })
        .on('mouseover', (event) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('r', nodeRadius * 1.5);
          
          // Add tooltip
          const tooltip = nodesGroup.append('g')
            .attr('class', 'tooltip')
            .attr('id', `tooltip-${node.id}`);
            
          // Create tooltip background
          const tooltipWidth = node.data.name.length * 7 + 30;
          tooltip.append('rect')
            .attr('x', node.x + 15)
            .attr('y', node.y - 15)
            .attr('width', tooltipWidth)
            .attr('height', 30)
            .attr('rx', 5)
            .attr('fill', '#1e293b')
            .attr('opacity', 0.9);
            
          // Add tooltip text
          tooltip.append('text')
            .attr('x', node.x + 25)
            .attr('y', node.y + 2)
            .attr('text-anchor', 'start')
            .attr('fill', 'white')
            .attr('font-weight', 'bold')
            .text(node.data.name);

          // Add founding year to tooltip
          tooltip.append('rect')
            .attr('x', node.x + 15)
            .attr('y', node.y + 15)
            .attr('width', tooltipWidth)
            .attr('height', 24)
            .attr('rx', 5)
            .attr('fill', '#1e293b')
            .attr('opacity', 0.9);

          tooltip.append('text')
            .attr('x', node.x + 25)
            .attr('y', node.y + 30)
            .attr('text-anchor', 'start')
            .attr('fill', 'white')
            .attr('font-size', '10px')
            .text(formatYear(node.data.foundingYear));
        })
        .on('mouseout', (event) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('r', nodeRadius);
          
          // Remove tooltip
          nodesGroup.select(`#tooltip-${node.id}`).remove();
        });
      
      // Add religion name labels selectively to reduce crowding
      if (nodes.length <= 30 || node.level % 2 === 0) {
        nodesGroup.append('text')
          .attr('x', node.x)
          .attr('y', node.y + 20)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('fill', '#1e293b')
          .attr('pointer-events', 'none')
          .text(node.data.name);
      }
    });

    // Add a legend for the status colors
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, ${height - 100})`);

    const statusEntries = [
      { status: 'active', label: 'Active' },
      { status: 'extinct', label: 'Extinct' },
      { status: 'evolved', label: 'Evolved' }
    ];

    statusEntries.forEach((entry, i) => {
      const statusColors: Record<string, string> = {
        active: '#10b981',
        extinct: '#94a3b8',
        evolved: '#f59e0b'
      };

      legend.append('circle')
        .attr('cx', 10)
        .attr('cy', i * 25 + 10)
        .attr('r', 6)
        .attr('fill', statusColors[entry.status]);

      legend.append('text')
        .attr('x', 25)
        .attr('y', i * 25 + 15)
        .attr('font-size', '12px')
        .attr('fill', '#1e293b')
        .text(entry.label);
    });

    // Add religion count to the top left
    svg.append('text')
      .attr('x', padding.left)
      .attr('y', 20)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#64748b')
      .text(`Showing ${sortedReligions.length} religions`);

  }, [filteredReligions, eras, width, zoomLevel]);

  return (
    <div className="relative">
      {/* Timeline Controls */}
      <div className="absolute top-4 right-4 flex space-x-2 z-10">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Zoom In"
          disabled={zoomLevel >= 3}
        >
          <ZoomIn className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Zoom Out"
          disabled={zoomLevel <= 0.5}
        >
          <ZoomOut className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={handleRefresh}
          className={`p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isLoading ? 'animate-spin' : ''}`}
          title="Refresh Timeline"
          disabled={isLoading}
        >
          <RefreshCw className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>
      
      <div
        className="w-full overflow-x-auto"
        ref={containerRef}
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          transition: 'transform 0.3s ease'
        }}
      >
        <div className="min-w-[1000px]">
        {filteredReligions.length === 0 ? (
          <div className="text-center p-10">
            <p className="text-gray-500">No religions match the current filters. Try adjusting your filters.</p>
          </div>
        ) : (
          <svg 
            ref={svgRef} 
            width={width} 
            height={height} 
            className="timeline-svg"
          />
        )}
        </div>
      </div>
      {selectedReligion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReligion(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-gray-900">{selectedReligion.name}</h2>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setSelectedReligion(null)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="mt-2 text-gray-600">{selectedReligion.description}</p>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Founded</h3>
                <p className="mt-1">{formatYear(selectedReligion.foundingYear)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Origin</h3>
                <p className="mt-1">{selectedReligion.originCountry}</p>
              </div>
              {selectedReligion.founderName && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Founder</h3>
                  <p className="mt-1">{selectedReligion.founderName}</p>
                </div>
              )}
              {selectedReligion.approxFollowers && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Followers</h3>
                  <p className="mt-1">{selectedReligion.approxFollowers.toLocaleString()}</p>
                </div>
              )}
            </div>
            
            {selectedReligion.beliefs && selectedReligion.beliefs.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Beliefs</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedReligion.beliefs.map(belief => (
                    <span key={belief} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                      {belief}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <a 
                href={`/religions/${selectedReligion.id}`}
                className="btn btn-primary"
              >
                View Full Profile
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HorizontalTimeline;
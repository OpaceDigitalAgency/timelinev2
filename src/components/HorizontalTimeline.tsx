import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Religion, Era } from '../types';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { createSlug } from '../lib/utils';

// Extend Window interface to include initialFilters
declare global {
  interface Window {
    initialFilters?: {
      eras: string[];
      continents: string[];
      beliefs: string[];
      statuses: string[];
      searchTerm?: string;
    };
  }
}

interface HorizontalTimelineProps {
  religions: Religion[];
  eras: Era[];
}

const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({ religions: initialReligions, eras }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedReligion, setSelectedReligion] = useState<Religion | null>(null);
  const [selectedEra, setSelectedEra] = useState<Era | null>(null);
  const [width, setWidth] = useState(1200);
  const [filteredReligions, setFilteredReligions] = useState<Religion[]>(initialReligions);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const height = 800;
  const nodeRadius = 20;
  const padding = { top: 100, right: 100, bottom: 100, left: 100 };

  // Format year (BCE/CE) with better formatting for large numbers
  const formatYear = (year: number): string => {
    const absYear = Math.abs(year);
    if (absYear >= 10000) {
      return `${(absYear / 1000).toFixed(1)}k ${year < 0 ? 'BCE' : 'CE'}`;
    }
    return year < 0 ? `${absYear} BCE` : `${year} CE`;
  };

  // Get color based on belief system
  const getBeliefColor = (beliefs: string[]): string => {
    if (beliefs.includes('Monotheism')) return '#3b82f6'; // blue
    if (beliefs.includes('Polytheism')) return '#8b5cf6'; // purple
    if (beliefs.includes('Nontheism')) return '#10b981'; // green
    if (beliefs.includes('Dualism')) return '#f59e0b'; // amber
    if (beliefs.includes('Animism')) return '#ef4444'; // red
    if (beliefs.includes('Philosophical')) return '#64748b'; // slate
    return '#64748b'; // default slate
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#22c55e'; // green
      case 'extinct': return '#94a3b8'; // gray
      case 'evolved': return '#f59e0b'; // amber
      default: return '#64748b'; // slate
    }
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
      const filters = customEvent.detail?.filters || customEvent.detail;
      
      if (!filters) return;
      
      let filtered = [...initialReligions];
      
      // Filter by era
      if (filters.eras && filters.eras.length > 0) {
        filtered = filtered.filter(religion => {
          return filters.eras.includes(religion.era);
        });
      }
      
      // Filter by continent
      if (filters.continents && filters.continents.length > 0) {
        filtered = filtered.filter(religion => {
          return filters.continents.some((continent: string) => {
            return religion.continent && (
              typeof religion.continent === 'string'
                ? religion.continent.includes(continent)
                : religion.continent === continent
            );
          });
        });
      }
      
      // Filter by beliefs
      if (filters.beliefs && filters.beliefs.length > 0) {
        filtered = filtered.filter(religion => {
          if (!religion.beliefs) return false;
          return religion.beliefs.some(belief => filters.beliefs.includes(belief));
        });
      }
      
      // Filter by status
      if (filters.statuses && filters.statuses.length > 0) {
        filtered = filtered.filter(religion => {
          return filters.statuses.includes(religion.status);
        });
      }
      
      // Filter by search term
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(religion => {
          return religion.name.toLowerCase().includes(searchLower) ||
            religion.summary.toLowerCase().includes(searchLower) ||
            religion.description.toLowerCase().includes(searchLower) ||
            (religion.founderName && religion.founderName.toLowerCase().includes(searchLower));
        });
      }
      
      setFilteredReligions(filtered);
    };
    
    // Handle clear all filters event
    const handleClearAllFilters = () => {
      setFilteredReligions(initialReligions);
    };

    // Listen for all filter-related events
    document.addEventListener('timeline-filters-changed', handleFilterChange);
    document.addEventListener('filters-changed', handleFilterChange);
    document.addEventListener('apply-filters', handleFilterChange);
    document.addEventListener('clear-all-filters', handleClearAllFilters);
    
    return () => {
      document.removeEventListener('timeline-filters-changed', handleFilterChange);
      document.removeEventListener('filters-changed', handleFilterChange);
      document.removeEventListener('apply-filters', handleFilterChange);
      document.removeEventListener('clear-all-filters', handleClearAllFilters);
    };
  }, [initialReligions]);

  useEffect(() => {
    setFilteredReligions(initialReligions);
  }, [initialReligions]);

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

  // Function to reset zoom
  const handleResetZoom = () => {
    setZoomLevel(1);
    setSelectedEra(null);
  };

  useEffect(() => {
    if (!svgRef.current || filteredReligions.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Process religions
    const sortedReligions = [...filteredReligions]
      .filter(r => typeof r.foundingYear === 'number' && !isNaN(r.foundingYear))
      .sort((a, b) => a.foundingYear - b.foundingYear);

    // Find min and max years
    const minYear = Math.min(...sortedReligions.map(r => r.foundingYear), ...eras.map(e => e.startYear));
    const maxYear = Math.max(
      ...sortedReligions.map(r => r.foundingYear),
      ...eras.map(e => e.endYear),
      new Date().getFullYear()
    );

    // Create a container group for the timeline
    const timelineContainer = svg.append('g')
      .attr('class', 'timeline-container');

    // Add a background for better visibility
    timelineContainer.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#f8fafc')
      .attr('rx', 8);

    // Add title and subtitle
    timelineContainer.append('text')
      .attr('x', width / 2)
      .attr('y', padding.top / 2 - 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1e293b')
      .text('Timeline of World Religions');

    timelineContainer.append('text')
      .attr('x', width / 2)
      .attr('y', padding.top / 2 + 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('fill', '#64748b')
      .text(`Showing ${sortedReligions.length} religions across ${formatYear(minYear)} to ${formatYear(maxYear)}`);

    // Create a time scale for the x-axis
    const timeScale = d3.scaleLinear()
      .domain([minYear, maxYear])
      .range([padding.left, width - padding.right]);

    // Create a flowing path for the timeline
    const pathGenerator = () => {
      const pathWidth = width - padding.left - padding.right;
      const pathHeight = height - padding.top - padding.bottom;
      const amplitude = pathHeight / 6; // Controls the wave height
      const frequency = 4; // Controls the number of waves
      
      // Generate a flowing, wave-like path
      let path = `M${padding.left},${padding.top + pathHeight / 2}`;
      
      for (let i = 0; i <= frequency; i++) {
        const x1 = padding.left + (i * pathWidth / frequency);
        const x2 = padding.left + ((i + 0.5) * pathWidth / frequency);
        const x3 = padding.left + ((i + 1) * pathWidth / frequency);
        
        const y1 = padding.top + pathHeight / 2;
        const y2 = i % 2 === 0 ? y1 - amplitude : y1 + amplitude;
        const y3 = padding.top + pathHeight / 2;
        
        if (i < frequency) {
          path += ` Q${x2},${y2} ${x3},${y3}`;
        }
      }
      
      return path;
    };

    // Draw the flowing timeline path
    const timelinePath = timelineContainer.append('path')
      .attr('d', pathGenerator())
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round');
    
    // Get the total length of the path for animations
    const pathLength = (timelinePath.node() as SVGPathElement).getTotalLength();
    
    // Function to get point at specific distance along the path
    const getPointAtLength = (distance: number) => {
      const point = (timelinePath.node() as SVGPathElement).getPointAtLength(distance);
      return { x: point.x, y: point.y };
    };
    
    // Map years to positions along the path
    const yearToPathPosition = (year: number) => {
      const normalizedPosition = (year - minYear) / (maxYear - minYear);
      const distance = normalizedPosition * pathLength;
      return getPointAtLength(distance);
    };

    // Add era backgrounds along the path
    const eraGroup = timelineContainer.append('g').attr('class', 'eras');
    
    eras.forEach((era, idx) => {
      const startPoint = yearToPathPosition(era.startYear);
      const endPoint = yearToPathPosition(era.endYear);
      const startDistance = (era.startYear - minYear) / (maxYear - minYear) * pathLength;
      const endDistance = (era.endYear - minYear) / (maxYear - minYear) * pathLength;
      
      // Create a group for this era
      const eraBackground = eraGroup.append('g')
        .attr('class', 'era-group')
        .attr('data-era-id', era.id);
      
      // Draw a segment of the path for this era with different color
      eraBackground.append('path')
        .attr('d', timelinePath.attr('d'))
        .attr('fill', 'none')
        .attr('stroke', idx % 2 === 0 ? '#e2e8f0' : '#f1f5f9')
        .attr('stroke-width', 30)
        .attr('stroke-linecap', 'round')
        .attr('stroke-dasharray', `0 ${startDistance} ${endDistance - startDistance} ${pathLength - endDistance}`)
        .attr('stroke-dashoffset', 0)
        .attr('opacity', 0.8)
        .attr('cursor', 'pointer')
        .on('click', () => {
          setSelectedEra(era);
          setZoomLevel(1.5);
        });
      
      // Add era label
      const midPoint = yearToPathPosition((era.startYear + era.endYear) / 2);
      
      eraBackground.append('text')
        .attr('x', midPoint.x)
        .attr('y', midPoint.y - 30)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .attr('fill', '#334155')
        .attr('cursor', 'pointer')
        .text(era.name);
      
      // Add year range
      eraBackground.append('text')
        .attr('x', midPoint.x)
        .attr('y', midPoint.y - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#64748b')
        .text(`${formatYear(era.startYear)} - ${formatYear(era.endYear)}`);
    });

    // Create a map of religion ID to its position
    const religionPositions: Record<string, { x: number, y: number }> = {};
    
    // Function to determine positions with influence from parent-child relationships
    const calculatePositions = () => {
      // First, map each religion to its position on the path
      sortedReligions.forEach(religion => {
        const point = yearToPathPosition(religion.foundingYear);
        religionPositions[religion.id] = { x: point.x, y: point.y };
      });
      
      // Then, adjust positions based on parent-child relationships
      // Create a map of parent religions to their children
      const childrenByParent: Record<string, Religion[]> = {};
      
      sortedReligions.forEach(religion => {
        if (religion.parentReligions && religion.parentReligions.length > 0) {
          religion.parentReligions.forEach(parentId => {
            if (!childrenByParent[parentId]) childrenByParent[parentId] = [];
            childrenByParent[parentId].push(religion);
          });
        }
      });
      
      // Adjust positions to avoid overlaps and show relationships
      const adjustPositions = (parentId: string, depth: number = 0, direction: number = 1) => {
        const children = childrenByParent[parentId] || [];
        if (children.length === 0) return;
        
        // Calculate vertical offset based on depth
        const verticalOffset = 15 + (depth * 5);
        
        children.forEach((child, index) => {
          const childPos = religionPositions[child.id];
          if (!childPos) return;
          
          // Alternate directions for children
          const childDirection = direction * (index % 2 === 0 ? 1 : -1);
          
          // Adjust position
          childPos.y += verticalOffset * childDirection;
          
          // Recursively adjust positions for this child's children
          adjustPositions(child.id, depth + 1, childDirection);
        });
      };
      
      // Start adjustment from root religions (those without parents in the filtered set)
      const rootReligions = sortedReligions.filter(religion => 
        !religion.parentReligions || 
        religion.parentReligions.length === 0 ||
        !religion.parentReligions.some(pid => sortedReligions.some(r => r.id === pid))
      );
      
      rootReligions.forEach(religion => {
        adjustPositions(religion.id);
      });
    };
    
    calculatePositions();

    // Draw connections between related religions
    const connectionsGroup = timelineContainer.append('g')
      .attr('class', 'connections');
    
    sortedReligions.forEach(religion => {
      if (!religion.parentReligions || religion.parentReligions.length === 0) return;
      
      const childPos = religionPositions[religion.id];
      if (!childPos) return;
      
      religion.parentReligions.forEach(parentId => {
        const parentReligion = sortedReligions.find(r => r.id === parentId);
        if (!parentReligion) return;
        
        const parentPos = religionPositions[parentId];
        if (!parentPos) return;
        
        // Create a curved connection line
        const linkGenerator = d3.linkHorizontal()
          .x(d => (d as any).x)
          .y(d => (d as any).y);
        
        const path = connectionsGroup.append('path')
          .attr('d', linkGenerator({
            source: parentPos,
            target: childPos
          } as any))
          .attr('fill', 'none')
          .attr('stroke', getBeliefColor(religion.beliefs))
          .attr('stroke-width', 2)
          .attr('stroke-opacity', 0.6)
          .attr('marker-end', 'url(#arrow)');
      });
    });
    
    // Add arrow marker for connections
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94a3b8');

    // Draw religion nodes
    const nodesGroup = timelineContainer.append('g')
      .attr('class', 'nodes');
    
    sortedReligions.forEach(religion => {
      const position = religionPositions[religion.id];
      if (!position) return;
      
      const nodeGroup = nodesGroup.append('g')
        .attr('class', 'religion-node')
        .attr('transform', `translate(${position.x}, ${position.y})`)
        .attr('data-religion-id', religion.id);
      
      // Create node background circle
      nodeGroup.append('circle')
        .attr('r', nodeRadius + 3)
        .attr('fill', 'white')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 1)
        .attr('opacity', 0.8);
      
      // Create colored circle based on belief system
      nodeGroup.append('circle')
        .attr('r', nodeRadius)
        .attr('fill', getBeliefColor(religion.beliefs))
        .attr('stroke', getStatusColor(religion.status))
        .attr('stroke-width', 3)
        .attr('cursor', 'pointer')
        .on('click', () => {
          setSelectedReligion(religion);
        });
      
      // Add religion name inside node
      nodeGroup.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', 'white')
        .attr('pointer-events', 'none')
        .text(religion.name.length > 12 ? religion.name.substring(0, 10) + '...' : religion.name);
      
      // Add founding year below node
      nodeGroup.append('text')
        .attr('x', 0)
        .attr('y', nodeRadius + 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#64748b')
        .text(formatYear(religion.foundingYear));
    });

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        timelineContainer.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // If there's a selected era, zoom to it
    if (selectedEra) {
      const eraStartPoint = yearToPathPosition(selectedEra.startYear);
      const eraEndPoint = yearToPathPosition(selectedEra.endYear);
      const centerX = (eraStartPoint.x + eraEndPoint.x) / 2;
      const centerY = (eraStartPoint.y + eraEndPoint.y) / 2;
      
      const transform = d3.zoomIdentity
        .translate(width / 2 - centerX * zoomLevel, height / 2 - centerY * zoomLevel)
        .scale(zoomLevel);
      
      svg.transition().duration(750).call(zoom.transform as any, transform);
    }

  }, [filteredReligions, width, height, zoomLevel, selectedEra]);

  return (
    <div className="relative">
      {/* Era Navigation */}
      <div className="absolute top-4 left-4 flex items-center space-x-4 z-10">
        <span className="text-sm font-medium text-gray-700">Jump to Era:</span>
        <div className="flex flex-wrap gap-2">
          {eras.map((era) => (
            <button
              key={era.id}
              onClick={() => {
                setSelectedEra(era);
                setZoomLevel(1.5);
              }}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedEra?.id === era.id
                  ? 'bg-primary-100 text-primary-800 border border-primary-300'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
              }`}
            >
              {era.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-4 z-10">
        {selectedEra && (
          <button
            onClick={handleResetZoom}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Reset View</span>
          </button>
        )}
        <div className="flex space-x-2">
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
      </div>
      
      <div
        className="w-full overflow-x-auto"
        ref={containerRef}
      >
        <div className="min-w-[1000px] relative">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          )}
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
      
      {/* Religion Detail Modal */}
      {selectedReligion && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={() => setSelectedReligion(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6" 
            onClick={(e) => e.stopPropagation()}
          >
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
                href={`/religions/${createSlug(selectedReligion.name)}`}
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

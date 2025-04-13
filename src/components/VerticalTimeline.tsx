import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Religion, Era } from '../types';
import { createSlug } from '../lib/utils';

interface VerticalTimelineProps {
  religions: Religion[];
  eras: Era[];
}

const VerticalTimeline: React.FC<VerticalTimelineProps> = ({ religions: initialReligions, eras }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedReligion, setSelectedReligion] = useState<Religion | null>(null);
  const [width, setWidth] = useState(1200);
  const [filteredReligions, setFilteredReligions] = useState<Religion[]>(initialReligions);
  const [zoomLevel, setZoomLevel] = useState(1);
  const height = 3000; // Taller to accommodate the tree structure

  // Format year (BCE/CE)
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
      
      if (filters.eras && filters.eras.length > 0) {
        // Find religions that match the era IDs in the filters
        filtered = filtered.filter(religion => {
          // Check if the religion's era ID is in the filters.eras array
          const result = filters.eras.includes(religion.era);
          
          // Debug logging
          if (filters.eras.includes('1f1162e5-54c4-411b-a55b-5dc4e24e0faa') ||
              filters.eras.includes('c095e73c-1c7f-4645-aaa6-bed059f20ef1')) {
            console.log(`Religion: ${religion.name}, Era ID: ${religion.era}, Founding Year: ${religion.foundingYear}, Match: ${result}`);
          }
          
          return result;
        });
        
        // Debug: Log the filtered religions and their eras
        console.log(`Filtering by eras: ${filters.eras.join(', ')}`);
        console.log(`Found ${filtered.length} religions with matching eras`);
      }
      
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
      
      if (filters.beliefs && filters.beliefs.length > 0) {
        filtered = filtered.filter(religion =>
          religion.beliefs && religion.beliefs.some((belief: string) => filters.beliefs.includes(belief))
        );
      }
      
      if (filters.statuses && filters.statuses.length > 0) {
        filtered = filtered.filter(religion => filters.statuses.includes(religion.status));
      }
      
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

  // Function to reset zoom
  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  useEffect(() => {
    if (!svgRef.current || filteredReligions.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Sort religions by founding year (descending for vertical timeline)
    const sortedReligions = [...filteredReligions]
      .filter(r => typeof r.foundingYear === 'number' && !isNaN(r.foundingYear))
      .sort((a, b) => a.foundingYear - b.foundingYear); // Ascending order for tree structure

    // Find min and max years
    const minYear = Math.min(...sortedReligions.map(r => r.foundingYear));
    const maxYear = Math.max(...sortedReligions.map(r => r.foundingYear));
    
    // Calculate the year range
    const yearRange = maxYear - minYear;
    
    // Create a time scale for vertical positioning
    // Log the min and max years for debugging
    console.log(`Min year: ${minYear}, Max year: ${maxYear}`);
    console.log(`Prehistoric religions:`, sortedReligions.filter(r => r.foundingYear < 0));
    
    // Use a custom scale that gives more weight to prehistoric years
    const timeScale = d3.scaleLinear()
      .domain([minYear, 0, maxYear]) // Split the domain at year 0 (BCE/CE boundary)
      .range([100, height / 2, height - 100]); // Give half the height to BCE years
      
    // Log the min and max years for debugging
    console.log(`Min year: ${minYear}, Max year: ${maxYear}`);
    console.log(`Prehistoric religions:`, sortedReligions.filter(r => r.foundingYear < 0));

    // Create a container group for the timeline
    const timelineContainer = svg.append('g')
      .attr('class', 'timeline-container');

    // Add a background
    timelineContainer.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#f8fafc')
      .attr('rx', 8);

    // Add title
    timelineContainer.append('text')
      .attr('x', width / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1e293b')
      .text('Vertical Timeline of World Religions');

    // Add era backgrounds
    const eraGroup = timelineContainer.append('g')
      .attr('class', 'eras');
    
    eras.forEach((era, idx) => {
      const eraStart = timeScale(era.startYear);
      const eraEnd = timeScale(era.endYear);
      const eraHeight = Math.abs(eraEnd - eraStart);
      
      // Create era background
      const eraBackground = eraGroup.append('g')
        .attr('class', 'era-group')
        .attr('data-era-id', era.id);

      // Era background rectangle
      eraBackground.append('rect')
        .attr('x', 0)
        .attr('y', eraStart)
        .attr('width', width)
        .attr('height', eraHeight)
        .attr('fill', idx % 2 === 0 ? '#f1f5f9' : '#f8fafc')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 1)
        .attr('rx', 4)
        .attr('opacity', 0.5);

      // Era label
      eraBackground.append('text')
        .attr('x', 100)
        .attr('y', eraStart + 30)
        .attr('text-anchor', 'start')
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .attr('fill', '#334155')
        .text(era.name);

      // Era year range
      eraBackground.append('text')
        .attr('x', 100)
        .attr('y', eraStart + 55)
        .attr('text-anchor', 'start')
        .attr('font-size', '14px')
        .attr('fill', '#64748b')
        .text(`${formatYear(era.startYear)} - ${formatYear(era.endYear)}`);
    });

    // Add time markers (ticks) along the timeline
    const tickInterval = Math.ceil(yearRange / 20); // Adjust for reasonable number of ticks
    const ticks = [];
    
    for (let year = minYear; year <= maxYear; year += tickInterval) {
      ticks.push(year);
    }
    
    // Ensure maxYear is included
    if (!ticks.includes(maxYear)) {
      ticks.push(maxYear);
    }

    const ticksGroup = timelineContainer.append('g')
      .attr('class', 'ticks');
    
    ticks.forEach(year => {
      const y = timeScale(year);
      
      // Draw tick line
      ticksGroup.append('line')
        .attr('x1', 80)
        .attr('y1', y)
        .attr('x2', width - 80)
        .attr('y2', y)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4');
      
      // Draw tick label
      ticksGroup.append('text')
        .attr('x', 70)
        .attr('y', y + 5)
        .attr('text-anchor', 'end')
        .attr('font-size', '12px')
        .attr('fill', '#64748b')
        .text(formatYear(year));
    });

    // Create a hierarchical structure for the religions
    interface TreeNode {
      id: string;
      name: string;
      foundingYear: number;
      children: TreeNode[];
      data: Religion;
      depth?: number;
      x?: number;
      y?: number;
    }

    // Convert religions to tree nodes
    const religionNodes: Record<string, TreeNode> = {};
    sortedReligions.forEach(religion => {
      religionNodes[religion.id] = {
        id: religion.id,
        name: religion.name,
        foundingYear: religion.foundingYear,
        children: [],
        data: religion
      };
    });

    // Build the tree structure
    const rootNodes: TreeNode[] = [];
    
    // First pass: add children to their parents
    sortedReligions.forEach(religion => {
      const node = religionNodes[religion.id];
      
      if (religion.parentReligions && religion.parentReligions.length > 0) {
        let hasParentInFiltered = false;
        
        religion.parentReligions.forEach(parentId => {
          const parentNode = religionNodes[parentId];
          if (parentNode) {
            parentNode.children.push(node);
            hasParentInFiltered = true;
          }
        });
        
        if (!hasParentInFiltered) {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Sort children by founding year
    Object.values(religionNodes).forEach(node => {
      node.children.sort((a, b) => a.foundingYear - b.foundingYear);
    });

    // Create a tree layout
    const treeLayout = d3.tree<TreeNode>()
      .size([width - 200, height - 200])
      .nodeSize([80, 120]); // [width, height] of node spacing

    // Create a root node to hold all root religions
    const rootNode: TreeNode = {
      id: 'root',
      name: 'Root',
      foundingYear: minYear - 1000,
      children: rootNodes,
      data: {} as Religion
    };

    // Generate the tree layout
    const hierarchyRoot = d3.hierarchy(rootNode);
    const treeData = treeLayout(hierarchyRoot);
    
    // Adjust the y-coordinate based on founding year
    treeData.descendants().forEach(node => {
      if (node.data.id !== 'root') {
        node.y = timeScale(node.data.foundingYear);
      } else {
        node.y = 80; // Position root node at the top
      }
    });

    // Create links between nodes
    const linksGroup = timelineContainer.append('g')
      .attr('class', 'links');
    
    // Custom link generator for tree branches
    const linkGenerator = d3.linkVertical<any, d3.HierarchyPointNode<TreeNode>>()
      .x(d => d.x)
      .y(d => d.y);
    
    // Draw links
    linksGroup.selectAll('path')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('d', linkGenerator)
      .attr('fill', 'none')
      .attr('stroke', d => d.target.data.id === 'root' ? 'transparent' : getBeliefColor(d.target.data.data.beliefs))
      .attr('stroke-width', 2)
      .attr('opacity', 0.7)
      .attr('marker-end', 'url(#arrow)');
    
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
    
    // Filter out the root node
    const religionTreeNodes = treeData.descendants().filter(d => d.data.id !== 'root');
    
    const nodeGroups = nodesGroup.selectAll('g')
      .data(religionTreeNodes)
      .enter()
      .append('g')
      .attr('class', 'religion-node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .attr('data-religion-id', d => d.data.id);
    
    // Create node background circle
    nodeGroups.append('circle')
      .attr('r', 40)
      .attr('fill', 'white')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1)
      .attr('opacity', 0.8);
    
    // Create colored circle based on belief system
    nodeGroups.append('circle')
      .attr('r', 35)
      .attr('fill', d => getBeliefColor(d.data.data.beliefs))
      .attr('stroke', d => getStatusColor(d.data.data.status))
      .attr('stroke-width', 3)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedReligion(d.data.data);
      });
    
    // Add religion name
    nodeGroups.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .attr('pointer-events', 'none')
      .text(d => d.data.name.length > 12 ? d.data.name.substring(0, 10) + '...' : d.data.name);
    
    // Add label with full name and year
    const labelGroups = nodeGroups.append('g')
      .attr('class', 'label')
      .attr('transform', d => d.x > width / 2 ? 'translate(50, 0)' : 'translate(-50, 0)');
    
    // Background for label
    labelGroups.append('rect')
      .attr('x', d => d.x > width / 2 ? 0 : -120)
      .attr('y', -25)
      .attr('width', 120)
      .attr('height', 50)
      .attr('fill', 'white')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1)
      .attr('rx', 4)
      .attr('opacity', 0.9);
    
    // Religion name in label
    labelGroups.append('text')
      .attr('x', d => d.x > width / 2 ? 10 : -10)
      .attr('y', -10)
      .attr('text-anchor', d => d.x > width / 2 ? 'start' : 'end')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#334155')
      .text(d => d.data.name);
    
    // Founding year in label
    labelGroups.append('text')
      .attr('x', d => d.x > width / 2 ? 10 : -10)
      .attr('y', 10)
      .attr('text-anchor', d => d.x > width / 2 ? 'start' : 'end')
      .attr('font-size', '12px')
      .attr('fill', '#64748b')
      .text(d => formatYear(d.data.foundingYear));
    
    // Add belief system indicator
    const beliefLabels = nodeGroups.append('g')
      .attr('class', 'belief-label')
      .attr('transform', 'translate(0, 50)');
    
    beliefLabels.append('rect')
      .attr('x', -40)
      .attr('y', 0)
      .attr('width', 80)
      .attr('height', 20)
      .attr('fill', 'white')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1)
      .attr('rx', 10)
      .attr('opacity', 0.9);
    
    beliefLabels.append('text')
      .attr('x', 0)
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#64748b')
      .text(d => d.data.data.beliefs[0] || '');

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        timelineContainer.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Initial zoom to fit the content
    const initialScale = Math.min(width / (width + 200), 0.8) * zoomLevel;
    const initialTransform = d3.zoomIdentity
      .translate(width / 4, 0)
      .scale(initialScale);
    
    svg.call(zoom.transform as any, initialTransform);

  }, [filteredReligions, width, height, zoomLevel]);

  return (
    <div className="vertical-timeline py-8 relative" ref={containerRef}>
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          title="Zoom In"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          title="Zoom Out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          title="Reset Zoom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

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

      {/* Religion Detail Modal */}
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

export default VerticalTimeline;
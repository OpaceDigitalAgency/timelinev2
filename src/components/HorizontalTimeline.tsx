import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import type { Religion, Era } from '../types';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { createSlug } from '../lib/utils';

interface HorizontalTimelineProps {
  religions: Religion[];
  eras: Era[];
}

const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({ religions: initialReligions, eras }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedReligion, setSelectedReligion] = useState<Religion | null>(null);
  const [selectedEra, setSelectedEra] = useState<Era | null>(null);
  const [width, setWidth] = useState(1000);
  const [filteredReligions, setFilteredReligions] = useState<Religion[]>(initialReligions);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomFocus, setZoomFocus] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const height = 800; // Increased height for better spacing
  const nodeRadius = 6; // Slightly smaller nodes for less overlap
  const padding = { top: 80, right: 100, bottom: 150, left: 100 };

  // Format year (BCE/CE) with better formatting for large numbers
  const formatYear = (year: number): string => {
    const absYear = Math.abs(year);
    if (absYear >= 10000) {
      return `${(absYear / 1000).toFixed(1)}k ${year < 0 ? 'BCE' : 'CE'}`;
    }
    return year < 0 ? `${absYear} BCE` : `${year} CE`;
  };

  // Define custom scale type
  interface CustomTimeScale {
    (year: number): number;
    ticks: () => number[];
    scale: d3.ScaleLogarithmic<number, number>;
  }

  // Create a custom scale for better distribution of prehistoric events
  const createTimeScale = (minYear: number, maxYear: number, width: number): CustomTimeScale => {
    // Use a logarithmic scale for better distribution of prehistoric events
    const scale = d3.scaleLog()
      .base(10)
      .domain([1, Math.max(Math.abs(minYear), Math.abs(maxYear))])
      .range([padding.left, width - padding.right])
      .clamp(true);

    // Create ticks at major intervals
    const generateTicks = () => {
      const majorIntervals = [
        -100000, -50000, -25000, -10000, -5000, -2500, -1000,
        -500, -250, -100, -50, 0, 50, 100, 250, 500,
        1000, 1500, 2000
      ];
      return majorIntervals.filter(year => year >= minYear && year <= maxYear);
    };

    // Extend the scale with our custom methods
    const customScale = ((year: number) => {
      // Special handling for year 0 and small absolute values
      if (Math.abs(year) < 1) return (width + padding.left) / 2;
      
      const absYear = Math.abs(year);
      const scaledPos = scale(absYear);
      
      // Invert position for BCE years to create two-sided timeline
      if (year < 0) {
        const range = width - padding.left - padding.right;
        return width - (scaledPos - padding.left);
      }
      return scaledPos;
    }) as CustomTimeScale;

    customScale.ticks = generateTicks;
    customScale.scale = scale;

    return customScale;
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
      
      console.log("HorizontalTimeline - Filter change detected:", filters);
      console.log("HorizontalTimeline - Initial religions count:", initialReligions.length);
      
      let filtered = [...initialReligions];
      
      // Filter by era
      if (filters.eras && filters.eras.length > 0) {
        console.log("HorizontalTimeline - Filtering by eras:", filters.eras);
        const beforeCount = filtered.length;
        filtered = filtered.filter(religion => {
          const match = filters.eras.includes(religion.era);
          if (!match) {
            console.log(`Religion ${religion.name} (era: ${religion.era}) doesn't match era filter`);
          }
          return match;
        });
        console.log(`HorizontalTimeline - After era filter: ${filtered.length} (removed ${beforeCount - filtered.length})`);
      }
      
      // Filter by continent
      if (filters.continents && filters.continents.length > 0) {
        console.log("HorizontalTimeline - Filtering by continents:", filters.continents);
        const beforeCount = filtered.length;
        filtered = filtered.filter(religion => {
          // Log continent data for debugging
          console.log(`Religion ${religion.name} continent:`, religion.continent,
                      `(type: ${typeof religion.continent})`);
          
          const match = filters.continents.some((continent: string) => {
            const isMatch = religion.continent && (
              typeof religion.continent === 'string'
                ? religion.continent.includes(continent)
                : religion.continent === continent
            );
            
            if (isMatch) {
              console.log(`  - Matched continent filter: "${continent}"`);
            }
            
            return isMatch;
          });
          
          if (!match) {
            console.log(`Religion ${religion.name} (continent: ${religion.continent}) doesn't match continent filter:`,
                        filters.continents);
          }
          
          return match;
        });
        console.log(`HorizontalTimeline - After continent filter: ${filtered.length} (removed ${beforeCount - filtered.length})`);
      }
      
      // Filter by beliefs
      if (filters.beliefs && filters.beliefs.length > 0) {
        console.log("HorizontalTimeline - Filtering by beliefs:", filters.beliefs);
        const beforeCount = filtered.length;
        filtered = filtered.filter(religion => {
          if (!religion.beliefs) {
            console.log(`Religion ${religion.name} has no beliefs defined`);
            return false;
          }
          const match = religion.beliefs.some(belief => filters.beliefs.includes(belief));
          if (!match) {
            console.log(`Religion ${religion.name} (beliefs: ${religion.beliefs.join(', ')}) doesn't match belief filter`);
          }
          return match;
        });
        console.log(`HorizontalTimeline - After beliefs filter: ${filtered.length} (removed ${beforeCount - filtered.length})`);
      }
      
      // Filter by status
      if (filters.statuses && filters.statuses.length > 0) {
        console.log("HorizontalTimeline - Filtering by statuses:", filters.statuses);
        const beforeCount = filtered.length;
        filtered = filtered.filter(religion => {
          const match = filters.statuses.includes(religion.status);
          if (!match) {
            console.log(`Religion ${religion.name} (status: ${religion.status}) doesn't match status filter`);
          }
          return match;
        });
        console.log(`HorizontalTimeline - After status filter: ${filtered.length} (removed ${beforeCount - filtered.length})`);
      }
      
      // Filter by search term
      if (filters.searchTerm) {
        console.log("HorizontalTimeline - Filtering by search term:", filters.searchTerm);
        const beforeCount = filtered.length;
        const searchLower = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(religion => {
          const match = religion.name.toLowerCase().includes(searchLower) ||
            religion.summary.toLowerCase().includes(searchLower) ||
            religion.description.toLowerCase().includes(searchLower) ||
            (religion.founderName && religion.founderName.toLowerCase().includes(searchLower));
          if (!match) {
            console.log(`Religion ${religion.name} doesn't match search term`);
          }
          return match;
        });
        console.log(`HorizontalTimeline - After search filter: ${filtered.length} (removed ${beforeCount - filtered.length})`);
      }
      
      console.log("HorizontalTimeline - Final filtered religions count:", filtered.length);
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

  // Check if we're embedded in the timeline page
  const [isEmbedded, setIsEmbedded] = useState(false);
  
  useEffect(() => {
    // Check if we're on the timeline page
    if (typeof window !== 'undefined') {
      setIsEmbedded(window.location.pathname.includes('/timeline'));
    }
  }, []);

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

    // Only add event listeners if we're embedded in the timeline page
    if (isEmbedded) {
      document.addEventListener('timeline-zoom', handleTimelineZoom);
      document.addEventListener('timeline-refresh', handleTimelineRefresh);
      
      return () => {
        document.removeEventListener('timeline-zoom', handleTimelineZoom);
        document.removeEventListener('timeline-refresh', handleTimelineRefresh);
      };
    }
  }, [isEmbedded]);
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

  // Process religions
  const processedReligionIds = new Set<string>();
  const sortedReligions: Religion[] = [];
  
  const allSortedReligions = [...filteredReligions]
    .filter(r => typeof r.foundingYear === 'number' && !isNaN(r.foundingYear))
    .sort((a, b) => a.foundingYear - b.foundingYear);
  
  allSortedReligions.forEach(religion => {
    if (!processedReligionIds.has(religion.id)) {
      sortedReligions.push(religion);
      processedReligionIds.add(religion.id);
    }
  });

  // Find min and max years
  let minYear = Math.min(...sortedReligions.map(r => r.foundingYear), ...eras.map(e => e.startYear));
  let maxYear = Math.max(
    ...sortedReligions.map(r => r.foundingYear),
    ...eras.map(e => e.endYear),
    new Date().getFullYear()
  );

  // Create custom time scale with better prehistoric distribution
  const timeScale = createTimeScale(minYear, maxYear, width);

  // Add era markers for better navigation
  const eraMarkers = svg.append('g')
    .attr('class', 'era-markers')
    .attr('transform', `translate(0, ${padding.top - 60})`);

  // Add markers for major time periods
  const majorPeriods = [
    { year: -50000, label: '50k BCE' },
    { year: -10000, label: '10k BCE' },
    { year: -5000, label: '5k BCE' },
    { year: -1000, label: '1k BCE' },
    { year: 0, label: 'CE/BCE' },
    { year: 1000, label: '1k CE' }
  ];

  majorPeriods.forEach(period => {
    const x = timeScale(period.year);
    eraMarkers.append('line')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', 0)
      .attr('y2', 10)
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1);

    eraMarkers.append('text')
      .attr('x', x)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#64748b')
      .text(period.label);
  });

  // Add zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .on('zoom', (event) => {
      const transform = event.transform;
      svg.selectAll('g').attr('transform', transform);
    });

  svg.call(zoom as any);

  // If there's a zoom focus point, calculate and apply the transform
  if (zoomFocus !== null) {
    const focusX = timeScale(Math.abs(zoomFocus));
    const transform = d3.zoomIdentity
      .translate(width / 2 - focusX * zoomLevel, 0)
      .scale(zoomLevel);
    svg.call(zoom.transform as any, transform);
  }

  // Create era backgrounds and navigation
  const eraGroup = svg.append('g').attr('class', 'eras');
  
  eras.forEach((era, idx) => {
    const eraStart = timeScale(Math.abs(era.startYear));
    const eraEnd = timeScale(Math.abs(era.endYear));
    const eraWidth = eraEnd - eraStart;
    
    // Create era background
    const eraBackground = eraGroup.append('g')
      .attr('class', 'era-group')
      .attr('data-era-id', era.id);

    // Era background with gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', `era-gradient-${era.id}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('style', `stop-color: ${idx % 2 === 0 ? '#f3f4f6' : '#f8fafc'}; stop-opacity: 0.8`);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('style', `stop-color: ${idx % 2 === 0 ? '#f8fafc' : '#f3f4f6'}; stop-opacity: 0.8`);

    // Era background rectangle
    eraBackground.append('rect')
      .attr('x', eraStart)
      .attr('y', padding.top - 30)
      .attr('width', eraWidth)
      .attr('height', height - padding.top - padding.bottom + 30)
      .attr('fill', `url(#era-gradient-${era.id})`)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('rx', 4)
      .attr('cursor', 'pointer')
      .on('click', () => {
        setSelectedEra(era);
        setZoomFocus(era.startYear);
        setZoomLevel(2);
      });

    // Era label with better positioning and styling
    const label = eraBackground.append('text')
      .attr('x', eraStart + eraWidth / 2)
      .attr('y', padding.top - 40)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1f2937')
      .attr('cursor', 'pointer')
      .text(era.name);

    // Add year range below era name
    eraBackground.append('text')
      .attr('x', eraStart + eraWidth / 2)
      .attr('y', padding.top - 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#6b7280')
      .text(`${formatYear(era.startYear)} - ${formatYear(era.endYear)}`);
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
    
    // Draw timeline ticks with improved spacing
    const ticks = timeScale.ticks();
    ticks.forEach(tick => {
      const x = timeScale(tick);
      
      // Draw tick line
      timelineGroup.append('line')
        .attr('x1', x)
        .attr('y1', padding.top - 10)
        .attr('x2', x)
        .attr('y2', padding.top + 10)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 1);
      
      // Draw tick label
      timelineGroup.append('text')
        .attr('x', x)
        .attr('y', padding.top + 25)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#64748b')
        .text(formatYear(tick));
      
      // Add subtle grid line
      timelineGroup.append('line')
        .attr('x1', x)
        .attr('y1', padding.top)
        .attr('x2', x)
        .attr('y2', height - padding.bottom)
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.5);
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
    // Create nodes with better vertical distribution for prehistoric religions
    const nodes = sortedReligions.map(religion => {
      const year = religion.foundingYear;
      const isPrehistoric = year < -3000;
      
      return {
        id: religion.id,
        year: year,
        data: religion,
        x: timeScale(year),
        y: 0,
        level: 0, // Will be calculated
        isPrehistoric
      };
    });

    // Adjust vertical spacing for prehistoric religions
    const prehistoricCount = nodes.filter(n => n.isPrehistoric).length;
    const prehistoricLevels = Math.ceil(Math.sqrt(prehistoricCount));

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
      
      // Assign levels with special handling for prehistoric religions
      for (const node of nodes) {
        const ancestors = getAncestors(node.id);
        const descendants = getDescendants(node.id);
        
        if (node.isPrehistoric) {
          // Distribute prehistoric religions more evenly
          const prehistoricIndex = nodes.filter(n => n.isPrehistoric && n.year > node.year).length;
          levelMap[node.id] = prehistoricIndex % prehistoricLevels;
        } else if (ancestors.length === 0 && descendants.length > 0) {
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
    // Improved overlap resolution function
    const resolveOverlaps = (nodes: any[]) => {
      const minDistance = nodeRadius * 3;
      const iterations = 3;
      
      for (let iter = 0; iter < iterations; iter++) {
        nodes.forEach((node, i) => {
          nodes.forEach((otherNode, j) => {
            if (i !== j) {
              const dx = node.x - otherNode.x;
              const dy = node.y - otherNode.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < minDistance) {
                const moveX = (minDistance - distance) * dx / distance / 2;
                const moveY = (minDistance - distance) * dy / distance / 2;
                
                node.x += moveX;
                node.y += moveY;
                otherNode.x -= moveX;
                otherNode.y -= moveY;
                
                // Keep nodes within bounds
                node.x = Math.max(padding.left, Math.min(width - padding.right, node.x));
                node.y = Math.max(padding.top, Math.min(height - padding.bottom, node.y));
                otherNode.x = Math.max(padding.left, Math.min(width - padding.right, otherNode.x));
                otherNode.y = Math.max(padding.top, Math.min(height - padding.bottom, otherNode.y));
              }
            }
          });
        });
      }
      
      return nodes;
    };
    
    // Apply overlap resolution to nodes
    const adjustedNodes = resolveOverlaps(nodes);
    adjustedNodes.forEach((node, i) => {
      nodes[i].x = node.x;
      nodes[i].y = node.y;
    });

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
    
    // Enhanced node rendering with better tooltips
    nodes.forEach(node => {
      const statusColors: Record<string, string> = {
        active: '#10b981',
        extinct: '#94a3b8',
        evolved: '#f59e0b'
      };

      const nodeGroup = nodesGroup.append('g')
        .attr('class', 'node-group')
        .attr('transform', `translate(${node.x},${node.y})`);

      // Node circle with glow effect
      nodeGroup.append('circle')
        .attr('r', nodeRadius + 4)
        .attr('fill', 'white')
        .attr('opacity', 0.3);

      const mainNode = nodeGroup.append('circle')
        .attr('r', nodeRadius)
        .attr('fill', statusColors[node.data.status] || '#94a3b8')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .attr('cursor', 'pointer')
        .attr('data-id', node.id)
        .on('click', () => {
          setSelectedReligion(node.data);
          setZoomFocus(node.data.foundingYear);
          setZoomLevel(3);
        });

      // Enhanced tooltip
      const tooltipGroup = nodeGroup.append('g')
        .attr('class', 'tooltip')
        .attr('opacity', 0)
        .attr('pointer-events', 'none');

      const tooltipPadding = 10;
      const tooltipWidth = Math.max(
        node.data.name.length * 8,
        formatYear(node.data.foundingYear).length * 8
      ) + tooltipPadding * 2;

      // Tooltip background
      tooltipGroup.append('rect')
        .attr('x', -tooltipWidth / 2)
        .attr('y', -70)
        .attr('width', tooltipWidth)
        .attr('height', 60)
        .attr('rx', 6)
        .attr('fill', '#1e293b')
        .attr('opacity', 0.95);

      // Religion name
      tooltipGroup.append('text')
        .attr('x', 0)
        .attr('y', -45)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .attr('font-size', '14px')
        .text(node.data.name);

      // Founding year
      tooltipGroup.append('text')
        .attr('x', 0)
        .attr('y', -25)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '12px')
        .text(formatYear(node.data.foundingYear));

      // Mouse interactions
      mainNode
        .on('mouseover', () => {
          tooltipGroup.transition()
            .duration(200)
            .attr('opacity', 1);
          
          mainNode.transition()
            .duration(200)
            .attr('r', nodeRadius * 1.5);
        })
        .on('mouseout', () => {
          tooltipGroup.transition()
            .duration(200)
            .attr('opacity', 0);
          
          mainNode.transition()
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

    // Enhanced legend with interactive highlighting
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 200}, ${height - 120})`);

    // Add legend background
    legend.append('rect')
      .attr('x', -10)
      .attr('y', -10)
      .attr('width', 160)
      .attr('height', 110)
      .attr('rx', 8)
      .attr('fill', 'white')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1);

    // Add legend title
    legend.append('text')
      .attr('x', 0)
      .attr('y', 10)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1f2937')
      .text('Religion Status');

    const statusEntries = [
      { status: 'active', label: 'Active', color: '#10b981' },
      { status: 'extinct', label: 'Extinct', color: '#94a3b8' },
      { status: 'evolved', label: 'Evolved', color: '#f59e0b' }
    ];

    statusEntries.forEach((entry, i) => {
      const legendItem = legend.append('g')
        .attr('class', 'legend-item')
        .attr('transform', `translate(0, ${i * 30 + 30})`)
        .style('cursor', 'pointer');

      // Background for hover effect
      legendItem.append('rect')
        .attr('x', -5)
        .attr('y', -15)
        .attr('width', 150)
        .attr('height', 25)
        .attr('rx', 4)
        .attr('fill', 'transparent')
        .attr('class', 'legend-hover');

      legendItem.append('circle')
        .attr('cx', 10)
        .attr('cy', 0)
        .attr('r', nodeRadius)
        .attr('fill', entry.color);

      legendItem.append('text')
        .attr('x', 25)
        .attr('y', 4)
        .attr('font-size', '13px')
        .attr('fill', '#1f2937')
        .text(entry.label);

      // Add hover effects
      legendItem
        .on('mouseover', function() {
          d3.select(this).select('.legend-hover')
            .transition()
            .duration(200)
            .attr('fill', '#f3f4f6');

          // Highlight related nodes
          nodesGroup.selectAll('.node-group')
            .filter((d: any) => d.__data__ && d.__data__.data.status === entry.status)
            .transition()
            .duration(200)
            .style('opacity', 1);

          nodesGroup.selectAll('.node-group')
            .filter((d: any) => d.__data__ && d.__data__.data.status !== entry.status)
            .transition()
            .duration(200)
            .style('opacity', 0.2);
        })
        .on('mouseout', function() {
          d3.select(this).select('.legend-hover')
            .transition()
            .duration(200)
            .attr('fill', 'transparent');

          // Reset all nodes
          nodesGroup.selectAll('.node-group')
            .transition()
            .duration(200)
            .style('opacity', 1);
        });
    });

    // Add enhanced statistics panel
    const statsPanel = svg.append('g')
      .attr('class', 'stats-panel')
      .attr('transform', `translate(${padding.left}, 20)`);

    // Add stats background
    statsPanel.append('rect')
      .attr('x', -10)
      .attr('y', -15)
      .attr('width', 220)
      .attr('height', 35)
      .attr('rx', 8)
      .attr('fill', 'white')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1);

    // Add religion count
    statsPanel.append('text')
      .attr('x', 0)
      .attr('y', 5)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1f2937')
      .text(`Showing ${sortedReligions.length} religions`);

    // Add era count
    statsPanel.append('text')
      .attr('x', 0)
      .attr('y', -10)
      .attr('font-size', '12px')
      .attr('fill', '#6b7280')
      .text(`Across ${eras.length} historical eras`);

  }, [filteredReligions, eras, width, zoomLevel]);

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
                setZoomFocus(era.startYear);
                setZoomLevel(2);
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

      {/* Timeline Controls - only show if not embedded in timeline page */}
      {!isEmbedded && (
        <div className="absolute top-4 right-4 flex items-center space-x-4 z-10">
          {selectedEra && (
            <button
              onClick={() => {
                setSelectedEra(null);
                setZoomFocus(null);
                setZoomLevel(1);
              }}
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
      )}
      
      <div
        className="w-full overflow-x-auto"
        ref={containerRef}
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
          transition: 'transform 0.3s ease'
        }}
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

export default HorizontalTimeline;
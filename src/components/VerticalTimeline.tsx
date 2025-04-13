import React, { useState, useEffect } from 'react';
import type { Religion, Era } from '../types';
import { createSlug } from '../lib/utils';

interface VerticalTimelineProps {
  religions: Religion[];
  eras: Era[];
}

// Utility: Build a forest (array of root nodes) from flat religions array
function buildReligionForest(religions: Religion[]): ReligionTreeNodeData[] {
  const idToReligion: Record<string, Religion> = {};
  religions.forEach(r => { idToReligion[r.id] = r; });

  // Mark all religions that are children
  const childIds = new Set<string>();
  religions.forEach(r => {
    (r.parentReligions || []).forEach(pid => childIds.add(r.id));
  });

  // Roots: religions with no parentReligions or whose parents are not in the filtered set
  const roots = religions.filter(
    r => !r.parentReligions || r.parentReligions.length === 0 ||
      r.parentReligions.every(pid => !idToReligion[pid])
  );

  // Build tree nodes recursively
  function buildNode(religion: Religion): ReligionTreeNodeData {
    const children = (religion.childReligions || [])
      .map(cid => idToReligion[cid])
      .filter(Boolean)
      .map(child => buildNode(child));
    return { religion, children };
  }

  return roots.map(buildNode);
}

type ReligionTreeNodeData = {
  religion: Religion;
  children: ReligionTreeNodeData[];
};

// Recursive component to render a religion node and its children
const ReligionTreeNode: React.FC<{
  node: ReligionTreeNodeData;
  depth: number;
  maxDepth: number;
  parentX?: number;
  parentY?: number;
  index: number;
  siblings: number;
}> = ({ node, depth, maxDepth, parentX, parentY, index, siblings }) => {
  // Layout: vertical spacing by depth, horizontal by index
  const verticalGap = 80;
  const horizontalGap = 220;
  const x = (index - (siblings - 1) / 2) * horizontalGap;
  const y = depth * verticalGap;

  // For lines: if parentX/Y provided, draw a line from parent to this node
  return (
    <div className="relative flex flex-col items-center" style={{ minWidth: 180 }}>
      {typeof parentX === 'number' && typeof parentY === 'number' && (
        <svg
          className="absolute pointer-events-none"
          style={{
            left: parentX - x + 90,
            top: parentY - y + 40,
            width: Math.abs(parentX - x),
            height: Math.abs(parentY - y),
            zIndex: 0,
          }}
        >
          <line
            x1={x > parentX ? 0 : Math.abs(parentX - x)}
            y1={0}
            x2={x > parentX ? Math.abs(parentX - x) : 0}
            y2={Math.abs(parentY - y)}
            stroke="#cbd5e1"
            strokeWidth={2}
          />
        </svg>
      )}
      <div
        className={`z-10 bg-white rounded-lg shadow-md p-4 mb-2 border-2 ${getStatusClasses(node.religion.status)}`}
        style={{ minWidth: 180, maxWidth: 260 }}
      >
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500">{formatYear(node.religion.foundingYear)}</span>
          <h3 className="text-base font-semibold text-gray-800">{node.religion.name}</h3>
        </div>
        <p className="text-xs text-gray-600 mt-1">{node.religion.summary}</p>
        {node.religion.beliefs.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 justify-center">
            {node.religion.beliefs.map(belief => (
              <span key={belief} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                {belief}
              </span>
            ))}
          </div>
        )}
        <div className="mt-2 text-center">
          <a
            href={`/religions/${createSlug(node.religion.name)}`}
            className="text-primary-600 text-xs font-medium hover:text-primary-800 transition-colors"
          >
            View Details →
          </a>
        </div>
      </div>
      {/* Render children horizontally */}
      {node.children.length > 0 && (
        <div className="flex flex-row justify-center items-start w-full">
          {node.children.map((child, i) => (
            <div key={child.religion.id} className="flex flex-col items-center" style={{ margin: '0 8px' }}>
              <ReligionTreeNode
                node={child}
                depth={depth + 1}
                maxDepth={maxDepth}
                parentX={x}
                parentY={y}
                index={i}
                siblings={node.children.length}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Format year (BCE/CE)
const formatYear = (year: number): string => {
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
};

// Get status classes
const getStatusClasses = (status: string): string => {
  switch (status) {
    case 'active': return 'border-green-500';
    case 'extinct': return 'border-gray-400';
    case 'evolved': return 'border-amber-500';
    default: return 'border-blue-500';
  }
};

const VerticalTimeline: React.FC<VerticalTimelineProps> = ({ religions: initialReligions, eras }) => {
  const [filteredReligions, setFilteredReligions] = useState<Religion[]>(initialReligions);

  useEffect(() => {
    // Listen for filter changes (same as before)
    const handleFilterChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const filters = customEvent.detail;
      let filtered = [...initialReligions];
      if (filters.eras && filters.eras.length > 0) {
        filtered = filtered.filter(religion => filters.eras.includes(religion.era));
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
    document.addEventListener('timeline-filters-changed', handleFilterChange);
    return () => {
      document.removeEventListener('timeline-filters-changed', handleFilterChange);
    };
  }, [initialReligions]);

  useEffect(() => {
    setFilteredReligions(initialReligions);
  }, [initialReligions]);

  // Build the tree/forest from filtered religions
  const forest = buildReligionForest(filteredReligions);

  return (
    <div className="vertical-timeline py-8 overflow-x-auto">
      {filteredReligions.length === 0 ? (
        <div className="text-center p-10">
          <p className="text-gray-500">No religions match the current filters. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="flex flex-row justify-center items-start gap-12 min-w-[900px]">
          {forest.map((root, i) => (
            <div key={root.religion.id} className="flex flex-col items-center">
              <ReligionTreeNode
                node={root}
                depth={0}
                maxDepth={6}
                index={i}
                siblings={forest.length}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VerticalTimeline;
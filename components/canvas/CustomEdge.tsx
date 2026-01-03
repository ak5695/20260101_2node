'use client';

import React, { memo, useMemo } from 'react';
import { EdgeProps, getBezierPath, BaseEdge, EdgeLabelRenderer } from 'reactflow';

interface CustomEdgeData {
  label?: string;
}

// Simple, performant edge component
const CustomEdgeComponent = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected,
  data,
}: EdgeProps<CustomEdgeData>) => {
  // Use getBezierPath for smooth curved lines
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Memoize styles to prevent recalculation
  const edgeStyle = useMemo(() => ({
    stroke: selected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
    strokeWidth: selected ? 3 : 2.5,
  }), [selected]);

  return (
    <>
      {/* Glow layer - only render when selected for performance */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke="#ffffff"
          strokeWidth={8}
          strokeOpacity={0.15}
          strokeLinecap="round"
        />
      )}
      
      {/* Main edge - single path element */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />
      
      {/* Edge Label - only render if has label */}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="px-2 py-0.5 bg-[#282828]/90 border border-white/10 rounded text-[10px] text-white/80 whitespace-nowrap"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

// Deep comparison memo for better performance
export const CustomEdge = memo(CustomEdgeComponent, (prevProps, nextProps) => {
  // Only re-render if these change
  return (
    prevProps.sourceX === nextProps.sourceX &&
    prevProps.sourceY === nextProps.sourceY &&
    prevProps.targetX === nextProps.targetX &&
    prevProps.targetY === nextProps.targetY &&
    prevProps.selected === nextProps.selected &&
    prevProps.data?.label === nextProps.data?.label
  );
});

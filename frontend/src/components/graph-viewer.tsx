import ForceGraph2D from 'react-force-graph-2d';
import { useRef, useEffect, useState } from 'react';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import { useLocation } from 'react-router-dom';

export type Node = {
  id: string;
  name?: string;
  x?: number;
  y?: number;
};

export type Link = {
  source: string;
  target: string;
};

export type Props = {
  nodes: Node[];
  links: Link[];
  onNodeClick: (node: Node) => void;
  onLinkClick: (link: Link) => void;
};

export default function GraphViewer({ nodes, links, onNodeClick, onLinkClick }: Props) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null!);
  const fgRef = useRef<ForceGraphMethods<any, any>>(null!);;
  const location = useLocation();

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden border border-gray-300">
      {dimensions.width > 0 && dimensions.height > 0 &&
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          d3VelocityDecay={0.6}
          graphData={{ nodes, links }}
          nodeLabel="name"
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name as string;
            const radius = 10 / globalScale;
            const labelPadding = 16 / globalScale;
            const fontSize = 16 / globalScale;

            ctx.beginPath();
            ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = (location.hash.substring(1) == node.id) ? 'lightblue' : 'lightgray';
            ctx.fill();

            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'black';
            ctx.fillText(label, node.x!, node.y! + radius + labelPadding);
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, 8, 0, 2 * Math.PI, false);
            ctx.fill();
          }}
          onNodeClick={onNodeClick}
          onLinkClick={onLinkClick}
          enableNodeDrag={true}
        />}
    </div>
  );
}
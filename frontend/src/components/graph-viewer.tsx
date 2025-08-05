import ForceGraph2D from 'react-force-graph-2d';
import { useRef, useEffect, useState } from 'react';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import { useNavigate } from 'react-router-dom';

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
  onNodeClick?: (node: Node) => void;
};

export default function GraphViewer({ nodes, links }: Props) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null!);
  const fgRef = useRef<ForceGraphMethods<any, any>>(null!);;
  const navigate = useNavigate();

  const onNodeClick = (node: Node) => {
    console.log("Node clicked:", node);
    navigate("#" + node.id);
  }


  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={{ nodes, links }}
        nodeLabel="name"
        nodeAutoColorBy="name"
        nodeColor="green"
        onNodeClick={onNodeClick}
        enableNodeDrag={true}
      />
    </div>
  );
}
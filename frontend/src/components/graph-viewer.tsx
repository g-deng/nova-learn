import ForceGraph2D from "react-force-graph-2d"
import { useRef, useEffect, useState } from "react"
import type { ForceGraphMethods } from "react-force-graph-2d"
import { useLocation } from "react-router-dom"

export type Node = {
  id: string
  name?: string
  x?: number
  y?: number
}

export type Link = {
  source: string
  target: string
}

export type Props = {
  nodes: Node[]
  links: Link[]
  onNodeClick: (node: Node) => void
  onLinkClick: (link: Link) => void
}

export default function GraphViewer({
  nodes,
  links,
  onNodeClick,
  onLinkClick
}: Props) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null!)
  const fgRef = useRef<ForceGraphMethods<any, any>>(null!)
  const location = useLocation()

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }

    updateSize()

    const observer = new ResizeObserver(updateSize)
    if (containerRef.current) observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden border border-gray-300"
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          d3VelocityDecay={0.6}
          graphData={{ nodes, links }}
          nodeLabel="name"
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name as string
            const radius = 10 / globalScale
            const labelPadding = 16 / globalScale
            const fontSize = 16 / globalScale

            ctx.beginPath()
            ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI, false)
            ctx.fillStyle =
              location.hash.substring(1) == node.id ? "lightblue" : "lightgray"
            ctx.fill()

            ctx.font = `${fontSize}px Sans-Serif`
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillStyle = "black"
            ctx.fillText(label, node.x!, node.y! + radius + labelPadding)
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(node.x!, node.y!, 8, 0, 2 * Math.PI, false)
            ctx.fill()
          }}
          linkCanvasObject={(link, ctx, globalScale) => {
            const start = link.source as Node
            const end = link.target as Node
            if (!start.x || !start.y || !end.x || !end.y) return

            // Draw line
            ctx.strokeStyle = "rgba(0,0,0,0.2)"
            ctx.lineWidth = 1 / globalScale
            ctx.beginPath()
            ctx.moveTo(start.x, start.y)
            ctx.lineTo(end.x, end.y)
            ctx.stroke()

            // Draw arrowhead
            ctx.fillStyle = "rgba(0,0,0,0.2)"
            const arrowLength = 12 / globalScale
            const arrowWidth = 8 / globalScale
            const dx = end.x - start.x
            const dy = end.y - start.y
            const angle = Math.atan2(dy, dx)

            // Position arrow tip slightly before node center
            const nodeRadius = 10 / globalScale
            const tipX = end.x - Math.cos(angle) * nodeRadius
            const tipY = end.y - Math.sin(angle) * nodeRadius

            ctx.save()
            ctx.translate(tipX, tipY)
            ctx.rotate(angle)

            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.lineTo(-arrowLength, arrowWidth / 2)
            ctx.lineTo(-arrowLength, -arrowWidth / 2)
            ctx.closePath()
            ctx.fillStyle = "rgba(0,0,0,0.6)"
            ctx.fill()
            ctx.restore()
          }}
          onNodeClick={onNodeClick}
          onLinkClick={onLinkClick}
          enableNodeDrag={true}
        />
      )}
    </div>
  )
}

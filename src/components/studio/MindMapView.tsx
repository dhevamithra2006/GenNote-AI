import React, { useState } from 'react';
import {
  Network,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Sparkles,
  Layers,
  RotateCcw,
  Info,
  GitBranch
} from 'lucide-react';

interface MindMapViewProps {
  content: any;
}

export const MindMapView: React.FC<MindMapViewProps> = ({ content }) => {
  const root = content?.root || {
    id: 'root-1',
    title: 'Core Concept',
    label: 'Core Concept',
    children: []
  };

  const nodeLabel = (node: any): string => node?.title || node?.label || 'Node';

  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [selectedNode, setSelectedNode] = useState<any>(root);
  const [zoomLevel, setZoomLevel] = useState(100);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const colors = [
    'border-emerald-500/60 bg-emerald-50/80 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200 hover:border-emerald-500',
    'border-blue-500/60 bg-blue-50/80 text-blue-950 dark:bg-blue-950/40 dark:text-blue-200 hover:border-blue-500',
    'border-purple-500/60 bg-purple-50/80 text-purple-950 dark:bg-purple-950/40 dark:text-purple-200 hover:border-purple-500',
    'border-amber-500/60 bg-amber-50/80 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200 hover:border-amber-500',
    'border-rose-500/60 bg-rose-50/80 text-rose-950 dark:bg-rose-950/40 dark:text-rose-200 hover:border-rose-500'
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Mind Map Controls */}
      <div className="p-4 rounded-2xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-neutral-900 dark:text-white block">Interactive Concept Topology</span>
            <span className="text-[11px] text-neutral-500">Explore interconnected knowledge nodes</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
          <button
            onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono min-w-[3rem] text-center font-semibold text-neutral-700 dark:text-neutral-300">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel(prev => Math.min(140, prev + 10))}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Mind Map Canvas / Tree Visualizer */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800/80 overflow-x-auto min-h-[460px] flex items-center justify-center relative">
          <div
            className="w-full transition-transform duration-200 origin-center space-y-6"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {/* ROOT NODE */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setSelectedNode(root)}
                className={`px-6 py-3.5 rounded-2xl border-2 shadow-lg font-bold text-sm transition-all cursor-pointer hover:scale-102 ${
                  selectedNode?.id === root.id
                    ? 'border-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/25 ring-4 ring-emerald-500/20'
                    : 'border-emerald-600/80 bg-white dark:bg-neutral-900 text-emerald-950 dark:text-emerald-300 hover:shadow-xl'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Network className="w-4 h-4 text-emerald-300" />
                  <span>{nodeLabel(root)}</span>
                </div>
              </button>

              {/* Vertical Connector */}
              <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-500 to-neutral-300 dark:to-neutral-700 my-1" />
            </div>

            {/* FIRST LEVEL BRANCHES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative">
              {(root.children || []).map((branch: any, bIdx: number) => {
                const isCollapsed = !!collapsedNodes[branch.id || `branch-${bIdx}`];
                const colorClass = colors[bIdx % colors.length];

                return (
                  <div
                    key={branch.id || bIdx}
                    className="flex flex-col items-center space-y-3"
                  >
                    {/* Branch Node */}
                    <div
                      onClick={() => setSelectedNode(branch)}
                      className={`w-full p-3.5 rounded-2xl border shadow-sm transition-all cursor-pointer flex items-center justify-between gap-2.5 hover:scale-102 ${colorClass} ${
                        selectedNode?.id === branch.id ? 'ring-4 ring-emerald-500/20 border-emerald-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <GitBranch className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="text-xs font-bold truncate">
                          {nodeLabel(branch)}
                        </span>
                      </div>
                      {branch.children && branch.children.length > 0 && (
                        <button
                          onClick={(e) => toggleCollapse(branch.id || `branch-${bIdx}`, e)}
                          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Sub-branch Leaf Nodes */}
                    {!isCollapsed && branch.children && (
                      <div className="w-full space-y-2 pl-3.5 border-l-2 border-emerald-400/40 dark:border-emerald-600/40 animate-fade-in">
                        {branch.children.map((sub: any, sIdx: number) => (
                          <div
                            key={sub.id || sIdx}
                            onClick={() => setSelectedNode(sub)}
                            className={`p-2.5 rounded-xl bg-white dark:bg-neutral-800/90 border text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:border-emerald-500/80 hover:shadow-sm transition-all cursor-pointer hover:scale-101 ${
                              selectedNode?.id === sub.id
                                ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20 font-semibold'
                                : 'border-neutral-200 dark:border-neutral-700/80'
                            }`}
                          >
                            {nodeLabel(sub)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Node Inspection Panel */}
        <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              Node Inspector
            </div>

            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 leading-snug">
              {nodeLabel(selectedNode) || nodeLabel(root)}
            </h3>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {selectedNode?.description || 'Select any concept node in the topology above to examine definitions, connected ideas, and contextual grounding.'}
            </p>

            {selectedNode?.children && selectedNode.children.length > 0 && (
              <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-2.5">
                  Sub-Branches ({selectedNode.children.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.children.map((c: any, i: number) => (
                    <span
                      key={i}
                      onClick={() => setSelectedNode(c)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 border border-neutral-200/60 dark:border-neutral-700/60 transition-colors"
                    >
                      {nodeLabel(c)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-neutral-400" />
            <span>Interactive RAG concept graph</span>
          </div>
        </div>
      </div>
    </div>
  );
};

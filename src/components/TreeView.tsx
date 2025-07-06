import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ChatNode } from '../types/chat';

interface CustomNodeData {
  question: string;
  answer: string;
}

const CustomNode: React.FC<{ data: CustomNodeData; selected: boolean }> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } min-w-[200px] max-w-[300px]`}>
      <Handle type="target" position={Position.Top} className="w-16 !bg-gray-500" />
      <div className="space-y-2">
        <div>
          <div className="text-xs text-gray-500 mb-1">質問</div>
          <div className="text-sm font-medium text-gray-800 line-clamp-2">{data.question}</div>
        </div>
        <div className="border-t pt-2">
          <div className="text-xs text-gray-500 mb-1">回答</div>
          <div className="text-sm text-gray-700 line-clamp-3">{data.answer}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-16 !bg-gray-500" />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

interface TreeViewProps {
  nodes: ChatNode[];
  onNodeClick: (nodeId: string) => void;
  selectedNodeId?: string;
}

const TreeView: React.FC<TreeViewProps> = ({ nodes, onNodeClick, selectedNodeId }) => {
  // ノードの階層レベルを計算
  const getNodeLevel = useCallback((nodeId: string, chatNodes: ChatNode[]): number => {
    const node = chatNodes.find(n => n.id === nodeId);
    if (!node || !node.parentId) return 0;
    return 1 + getNodeLevel(node.parentId, chatNodes);
  }, []);

  // ボトムアップで各ノードの必要幅を計算
  const calculateNodeWidths = useCallback((chatNodes: ChatNode[]): Map<string, number> => {
    const widths = new Map<string, number>();
    const baseWidth = 320; // マージンを含めた基本幅（250 + 70px余裕）
    
    // 深い階層から浅い階層へ処理（ボトムアップ）
    const sortedByDepth = [...chatNodes].sort((a, b) => 
      getNodeLevel(b.id, chatNodes) - getNodeLevel(a.id, chatNodes)
    );
    
    sortedByDepth.forEach(node => {
      const children = chatNodes.filter(n => n.parentId === node.id);
      
      if (children.length === 0) {
        // 葉ノード: 基本幅
        widths.set(node.id, baseWidth);
      } else {
        // 内部ノード: 子ノードの幅の合計
        const childrenWidth = children.reduce((sum, child) => 
          sum + (widths.get(child.id) || baseWidth), 0
        );
        widths.set(node.id, childrenWidth);
      }
    });
    
    return widths;
  }, [getNodeLevel]);

  // トップダウンで各ノードの位置を計算
  const calculatePositions = useCallback((chatNodes: ChatNode[], widths: Map<string, number>): Map<string, {x: number, y: number}> => {
    const positions = new Map<string, {x: number, y: number}>();
    const levelHeight = 200;
    
    // 再帰的に位置を計算
    const processNode = (nodeId: string, centerX: number, level: number) => {
      positions.set(nodeId, { x: centerX, y: level * levelHeight });
      
      const children = chatNodes.filter(n => n.parentId === nodeId);
      if (children.length === 0) return;
      
      // 子ノードをタイムスタンプ順でソート
      children.sort((a, b) => a.timestamp - b.timestamp);
      
      // 子ノード群の総幅を計算
      const totalChildrenWidth = children.reduce((sum, child) => 
        sum + (widths.get(child.id) || 320), 0
      );
      
      // 子ノード群の開始位置
      let currentX = centerX - totalChildrenWidth / 2;
      
      // 各子ノードを配置
      children.forEach(child => {
        const childWidth = widths.get(child.id) || 320;
        const childCenterX = currentX + childWidth / 2;
        
        processNode(child.id, childCenterX, level + 1);
        currentX += childWidth;
      });
    };
    
    // ルートノードから開始
    const rootNodes = chatNodes.filter(n => !n.parentId);
    rootNodes.forEach(root => processNode(root.id, 0, 0));
    
    return positions;
  }, []);

  const convertToFlowNodes = useCallback((chatNodes: ChatNode[]): Node[] => {
    // 1. 各ノードの必要幅を計算（ボトムアップ）
    const nodeWidths = calculateNodeWidths(chatNodes);
    
    // 2. 各ノードの位置を計算（トップダウン）
    const nodePositions = calculatePositions(chatNodes, nodeWidths);
    
    // 3. ReactFlowのNode配列を生成
    return chatNodes.map((node) => {
      const position = nodePositions.get(node.id) || { x: 0, y: 0 };
      
      return {
        id: node.id,
        type: 'custom',
        data: { question: node.question, answer: node.answer },
        position,
        selected: node.id === selectedNodeId,
      };
    });
  }, [selectedNodeId, calculateNodeWidths, calculatePositions]);

  const convertToFlowEdges = useCallback((chatNodes: ChatNode[]): Edge[] => {
    const edges: Edge[] = [];
    chatNodes.forEach(node => {
      if (node.parentId) {
        edges.push({
          id: `e${node.parentId}-${node.id}`,
          source: node.parentId,
          target: node.id,
        });
      }
    });
    return edges;
  }, []);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(convertToFlowNodes(nodes));
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(convertToFlowEdges(nodes));

  useEffect(() => {
    setFlowNodes(convertToFlowNodes(nodes));
    setFlowEdges(convertToFlowEdges(nodes));
  }, [nodes, selectedNodeId, setFlowNodes, setFlowEdges, convertToFlowNodes, convertToFlowEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick(node.id);
    },
    [onNodeClick]
  );

  return (
    <div className="h-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
      </ReactFlow>
    </div>
  );
};

export default TreeView;
import React, { useState } from 'react';

interface Block {
  id: string;
  type: 'paragraph' | 'heading' | 'list' | 'bold';
  content: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => {
    try {
      return JSON.parse(value);
    } catch {
      return [{ id: '1', type: 'paragraph', content: value || '' }];
    }
  });

  const updateBlock = (id: string, newContent: string) => {
    setBlocks(prev => {
      const newBlocks = prev.map(block =>
        block.id === id ? { ...block, content: newContent } : block
      );
      onChange(JSON.stringify(newBlocks));
      return newBlocks;
    });
  };

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: '',
    };
    setBlocks(prev => {
      const newBlocks = [...prev, newBlock];
      onChange(JSON.stringify(newBlocks));
      return newBlocks;
    });
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => {
      const newBlocks = prev.filter(block => block.id !== id);
      onChange(JSON.stringify(newBlocks));
      return newBlocks;
    });
  };

  const renderBlock = (block: Block) => {
    switch (block.type) {
      case 'heading':
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            className="w-full text-2xl font-bold p-2 border-b focus:outline-none focus:border-blue-500"
            placeholder="Heading..."
          />
        );
      case 'list':
        return (
          <div className="flex items-start gap-2">
            <span className="mt-3">•</span>
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, e.target.value)}
              className="flex-1 p-2 border-b focus:outline-none focus:border-blue-500"
              placeholder="List item..."
            />
          </div>
        );
      case 'bold':
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            className="w-full font-bold p-2 border-b focus:outline-none focus:border-blue-500"
            placeholder="Bold text..."
          />
        );
      default:
        return (
          <textarea
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            className="w-full p-2 border-b focus:outline-none focus:border-blue-500 min-h-[100px]"
            placeholder="Write something..."
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => addBlock('heading')}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          Add Heading
        </button>
        <button
          type="button"
          onClick={() => addBlock('paragraph')}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          Add Paragraph
        </button>
        <button
          type="button"
          onClick={() => addBlock('list')}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          Add List Item
        </button>
        <button
          type="button"
          onClick={() => addBlock('bold')}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          Add Bold Text
        </button>
      </div>
      
      <div className="space-y-4">
        {blocks.map((block) => (
          <div key={block.id} className="relative group">
            {renderBlock(block)}
            {blocks.length > 1 && (
              <button
                onClick={() => removeBlock(block.id)}
                className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { TextEditScreenLayout } from '../canvas/textEditLayout';

type Props = {
  getLayout: () => TextEditScreenLayout | null;
  layoutTick: number;
  initialText: string;
  selectAll?: boolean;
  replaceWithSeed?: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
};

export const MapInlineTextEditor: React.FC<Props> = ({
  getLayout,
  layoutTick,
  initialText,
  selectAll = false,
  replaceWithSeed,
  onCommit,
  onCancel,
}) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [layout, setLayout] = useState<TextEditScreenLayout | null>(() => getLayout());
  const [value, setValue] = useState(() => replaceWithSeed ?? initialText);
  const appliedInitialSelectionRef = useRef(false);

  useLayoutEffect(() => {
    setLayout(getLayout());
  }, [getLayout, layoutTick]);

  useEffect(() => {
    appliedInitialSelectionRef.current = false;
  }, [initialText, replaceWithSeed, selectAll]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input || appliedInitialSelectionRef.current) return;
    appliedInitialSelectionRef.current = true;
    input.focus();
    const len = input.value.length;
    if (replaceWithSeed != null) {
      input.setSelectionRange(len, len);
      return;
    }
    if (selectAll) {
      input.select();
      return;
    }
    input.setSelectionRange(len, len);
  }, [replaceWithSeed, selectAll, initialText]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  if (!layout) return null;

  const commit = () => {
    onCommit(value);
  };

  return (
    <textarea
      ref={inputRef}
      value={value}
      rows={1}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => commit()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          commit();
        }
      }}
      style={{
        position: 'absolute',
        left: layout.left,
        top: layout.top,
        zIndex: 6,
        margin: 0,
        padding: 0,
        border: '1px solid rgba(248, 215, 164, 0.55)',
        borderRadius: 2,
        outline: 'none',
        resize: 'both',
        minWidth: layout.minWidthPx,
        width: layout.minWidthPx,
        maxWidth: 'min(70vw, 640px)',
        background: 'rgba(17, 24, 32, 0.82)',
        color: layout.color,
        opacity: layout.opacity,
        fontFamily: '"Crimson Text", serif',
        fontSize: layout.fontSizePx,
        lineHeight: 1.2,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
      aria-label="Edit map text"
    />
  );
};

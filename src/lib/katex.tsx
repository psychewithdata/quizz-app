import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LaTeXProps {
  children: string;
  block?: boolean;
  className?: string;
}

export const LaTeX: React.FC<LaTeXProps> = ({ children, block = false, className = '' }) => {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(children, {
        displayMode: block,
        throwOnError: false,
        trust: true,
        strict: false,
      });
    } catch (error) {
      console.error('KaTeX error:', error);
      return children;
    }
  }, [children, block]);

  if (block) {
    return (
      <div
        className={`katex-display ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

// Parse mixed text with LaTeX
export const parseLatex = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // Match block LaTeX: $$...$$
  const blockRegex = /\$\$([\s\S]*?)\$\$/g;
  // Match inline LaTeX: $...$
  const inlineRegex = /\$([^$\n]+?)\$/g;

  // First, handle block LaTeX
  let match;
  const blockMatches: { start: number; end: number; content: string; isBlock: boolean }[] = [];
  
  while ((match = blockRegex.exec(text)) !== null) {
    blockMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[1],
      isBlock: true,
    });
  }

  // Then handle inline LaTeX (avoiding overlap with block)
  const inlineMatches: { start: number; end: number; content: string; isBlock: boolean }[] = [];
  while ((match = inlineRegex.exec(text)) !== null) {
    const isInsideBlock = blockMatches.some(
      (b) => match!.index >= b.start && match!.index < b.end
    );
    if (!isInsideBlock) {
      inlineMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        isBlock: false,
      });
    }
  }

  // Combine and sort all matches
  const allMatches = [...blockMatches, ...inlineMatches].sort((a, b) => a.start - b.start);

  for (const m of allMatches) {
    // Add text before this match
    if (m.start > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, m.start)}</span>);
    }

    // Add the LaTeX
    parts.push(
      <LaTeX key={key++} block={m.isBlock}>
        {m.content}
      </LaTeX>
    );

    lastIndex = m.end;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [<span key={0}>{text}</span>];
};

// Component that renders text with LaTeX
interface RenderLatexProps {
  content: string;
  className?: string;
}

export const RenderLatex: React.FC<RenderLatexProps> = ({ content, className = '' }) => {
  const rendered = React.useMemo(() => parseLatex(content), [content]);

  return <div className={className}>{rendered}</div>;
};

import React from 'react';

/**
 * Safely parses inline markdown (**bold**, *italic*) into React elements without dangerouslySetInnerHTML.
 */
export const renderInlineMarkdown = (text) => {
  if (!text || typeof text !== 'string') return text;

  // Regex matches bold (**...**) and italic (*...*)
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const tokens = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.substring(lastIndex, match.index));
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      const inner = matchedStr.slice(2, -2);
      tokens.push(
        <strong key={`b-${match.index}`} style={{ fontWeight: 800, color: 'inherit' }}>
          {inner}
        </strong>
      );
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      const inner = matchedStr.slice(1, -1);
      tokens.push(
        <em key={`i-${match.index}`} style={{ fontStyle: 'italic', opacity: 0.9 }}>
          {inner}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.substring(lastIndex));
  }

  return tokens.length > 0 ? tokens : text;
};

/**
 * FormattedMarkdownText: Renders multiline AI responses with bold headers,
 * clean bullet points, and italic advice notes with zero raw asterisks.
 */
export const FormattedMarkdownText = ({ content, style = {} }) => {
  if (!content) return null;

  const lines = String(content).split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: '4px' }} />;
        }

        // Check if line is a bullet item (•, -, or *)
        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || (trimmed.startsWith('* ') && !trimmed.endsWith('*'));
        const cleanLine = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : trimmed;

        if (isBullet) {
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                paddingLeft: '4px',
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: 'var(--green-700)', fontWeight: 900, lineHeight: 1.5 }}>•</span>
              <span style={{ flex: 1 }}>{renderInlineMarkdown(cleanLine)}</span>
            </div>
          );
        }

        // Check if line is a primary verdict title (e.g. "**TiPig Verdict:")
        const isVerdict = trimmed.toLowerCase().includes('tipig verdict:') || trimmed.toLowerCase().includes('purchases recorded');

        return (
          <div
            key={idx}
            style={{
              lineHeight: 1.5,
              fontSize: isVerdict ? '0.92rem' : '0.86rem',
              color: 'inherit',
            }}
          >
            {renderInlineMarkdown(trimmed)}
          </div>
        );
      })}
    </div>
  );
};

export default FormattedMarkdownText;

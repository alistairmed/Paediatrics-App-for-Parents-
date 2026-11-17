import React from 'react';

/**
 * Shows AI text without raw markdown marks (###, ***, **bold**, - lists).
 * Only React elements are built, never HTML, and headings are bold paragraphs so
 * the page's heading order stays as designed.
 */
const inline = (text: string): React.ReactNode[] =>
  text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).filter(Boolean).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    // Any leftover asterisks are stray marks, not words.
    return <React.Fragment key={i}>{part.replace(/\*+/g, '')}</React.Fragment>;
  });

export const AiText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      blocks.push(<ul key={`ul${blocks.length}`} className="list-disc pl-6 space-y-1">{bullets.map((b, i) => <li key={i}>{inline(b)}</li>)}</ul>);
      bullets = [];
    }
  };

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || /^([-*_]\s*){3,}$/.test(line)) { flush(); continue; }
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) { bullets.push(bullet[1]); continue; }
    flush();
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    blocks.push(
      heading
        ? <p key={blocks.length} className="font-black mt-4">{inline(heading[1])}</p>
        : <p key={blocks.length}>{inline(line)}</p>
    );
  }
  flush();
  return <div className={className ?? 'space-y-3'}>{blocks}</div>;
};

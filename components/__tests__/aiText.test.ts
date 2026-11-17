import { describe, test, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AiText } from '../AiText';

const html = (text: string) => renderToStaticMarkup(React.createElement(AiText, { text }));

describe('AiText', () => {
  test('Removes markdown marks and keeps the words', () => {
    const out = html('### 1. Simple Definition\n***\nBronchiectasis is **long-term** damage.\n- first\n- second');
    expect(out).not.toMatch(/###|\*\*\*|\*\*/);
    expect(out).toContain('1. Simple Definition');
    expect(out).toContain('<strong>long-term</strong>');
    expect(out).toContain('<li>first</li>');
  });

  test('Never builds HTML from the text', () => {
    const out = html('<img src=x onerror=alert(1)> **hi**');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img');
  });
});

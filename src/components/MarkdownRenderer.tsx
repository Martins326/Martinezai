import React, { useState } from 'react';
import { marked } from 'marked';
import { Copy, Check, ExternalLink, Code2 } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onOpenArtifact?: (code: string, language: string, title?: string) => void;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onOpenArtifact,
  className = '',
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  // Parse markdown into tokens using marked.lexer
  let tokens: any[] = [];
  try {
    tokens = marked.lexer(content || '');
  } catch (e) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  const renderInline = (text: string) => {
    // Quick inline formatter for bold, italic, code, links
    // marked parses inline tokens via marked.parseInline
    try {
      const html = marked.parseInline(text) as string;
      // Sanitize javascript: links
      const sanitized = html.replace(/href="javascript:[^"]*"/gi, 'href="#"');
      return <span dangerouslySetInnerHTML={{ __html: sanitized }} />;
    } catch {
      return <span>{text}</span>;
    }
  };

  return (
    <div className={`markdown-body space-y-3.5 leading-relaxed break-words ${className}`}>
      {tokens.map((token, idx) => {
        switch (token.type) {
          case 'heading': {
            const inner = renderInline(token.text);
            if (token.depth === 1) {
              return <h1 key={idx} className="text-xl font-bold mt-4 mb-2 tracking-tight">{inner}</h1>;
            }
            if (token.depth === 2) {
              return <h2 key={idx} className="text-lg font-semibold mt-3.5 mb-1.5">{inner}</h2>;
            }
            if (token.depth === 3) {
              return <h3 key={idx} className="text-base font-semibold mt-2.5 mb-1">{inner}</h3>;
            }
            return <h4 key={idx} className="text-sm font-semibold mt-2 mb-1">{inner}</h4>;
          }

          case 'paragraph': {
            return (
              <p key={idx} className="my-1.5 leading-relaxed">
                {renderInline(token.text)}
              </p>
            );
          }

          case 'code': {
            const rawLang = token.lang || 'text';
            const isCopied = copiedIndex === idx;
            const codeStr = token.text;

            return (
              <div
                key={idx}
                className="my-3 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900/95 shadow-sm"
              >
                {/* Code header bar */}
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-800/80 border-b border-neutral-700/60 text-xs text-neutral-300 font-mono select-none">
                  <span className="uppercase font-semibold tracking-wider text-[11px] text-neutral-400">
                    {rawLang}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {onOpenArtifact && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenArtifact(
                            codeStr,
                            rawLang,
                            `${rawLang.toUpperCase()} Snippet`
                          )
                        }
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                        title="Open in Workspace Canvas"
                      >
                        <Code2 size={13} />
                        <span className="text-[11px]">Workspace</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopyCode(codeStr, idx)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                      title="Copy code"
                    >
                      {isCopied ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span className="text-[11px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Code body */}
                <pre className="p-3.5 text-xs md:text-[13px] font-mono text-neutral-200 overflow-x-auto leading-relaxed selection:bg-indigo-600/40">
                  <code>{codeStr}</code>
                </pre>
              </div>
            );
          }

          case 'list': {
            const ListTag = token.ordered ? 'ol' : 'ul';
            const listStyle = token.ordered ? 'list-decimal pl-5' : 'list-disc pl-5';
            return (
              <ListTag key={idx} className={`space-y-1 my-2 text-neutral-200 ${listStyle}`}>
                {token.items.map((item: any, i: number) => (
                  <li key={i} className="leading-relaxed">
                    {renderInline(item.text)}
                  </li>
                ))}
              </ListTag>
            );
          }

          case 'blockquote': {
            return (
              <blockquote
                key={idx}
                className="pl-3.5 py-1 border-l-2 border-indigo-400/80 bg-neutral-800/30 text-neutral-300 my-2.5 rounded-r"
              >
                {renderInline(token.text)}
              </blockquote>
            );
          }

          case 'table': {
            return (
              <div key={idx} className="overflow-x-auto my-3 rounded-lg border border-neutral-800">
                <table className="min-w-full divide-y divide-neutral-800 text-xs md:text-sm">
                  <thead className="bg-neutral-900 text-neutral-300 font-semibold">
                    <tr>
                      {token.header.map((col: any, hIdx: number) => (
                        <th key={hIdx} className="px-3.5 py-2 text-left">
                          {renderInline(col.text)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 bg-neutral-950/60 text-neutral-300">
                    {token.rows.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-neutral-900/40 transition-colors">
                        {row.map((cell: any, cIdx: number) => (
                          <td key={cIdx} className="px-3.5 py-2">
                            {renderInline(cell.text)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          case 'hr': {
            return <hr key={idx} className="border-t border-neutral-800 my-4" />;
          }

          default: {
            if (token.text) {
              return <div key={idx}>{renderInline(token.text)}</div>;
            }
            return null;
          }
        }
      })}
    </div>
  );
};

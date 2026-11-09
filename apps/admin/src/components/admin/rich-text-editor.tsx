'use client';

import DOMPurify from 'dompurify';
import { Underline } from '@tiptap/extension-underline';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useState, useEffect, useRef } from 'react';

/**
 * Rich text editor for service descriptions (khal-admin-100-operable T4).
 *
 * Tiptap v2 + StarterKit + Underline (canon skill: never hand-craft a
 * contenteditable or use the deprecated document.execCommand). The editor
 * works on an HTML string in/out — the same shape the `services.description`
 * column and the public catalog render.
 *
 * `immediatelyRender: false` avoids SSR/client hydration mismatches; the
 * parent remounts the editor per dialog by keying on the service id.
 */

export type RichTextLabels = {
  bold: string;
  italic: string;
  underline: string;
  strike: string;
  bulletList: string;
  orderedList: string;
  undo: string;
  redo: string;
};

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({ label, active = false, disabled, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`h-11 min-w-11 rounded-md border px-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 min-h-[44px] min-w-[44px] touch-manipulation ${
        active
          ? 'border-emerald-400 bg-emerald-400 text-black'
          : 'border-white/20 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  labels,
  ariaLabel,
}: {
  value: string;
  onChange: (html: string) => void;
  labels: RichTextLabels;
  ariaLabel: string;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const editor: Editor | null = useEditor({
    extensions: [StarterKit, Underline],
    content: value || '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose-invert prose-sm max-w-none min-h-24 w-full rounded-b-lg border border-t-0 border-white/20 p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/40',
        'aria-label': ariaLabel,
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor: current }) => {
      const html = current.getHTML();
      // Collapse Tiptap's empty-doc markup so the DB stores '' not '<p></p>'.
      const empty = html === '<p></p>' || html === '<p><br></p>';
      // Sanitize HTML before saving to prevent XSS (T6 — HTML sanitization)
      const sanitized = empty ? '' : DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'b', 'i', 'u', 'strike', 'ul', 'ol', 'li', 'br', 'strong', 'em'],
        ALLOWED_ATTR: [],
      });
      onChange(sanitized);
    },
  });

  if (!editor) {
    return (
      <div
        className="min-h-24 animate-pulse rounded-lg border border-white/10 bg-white/[0.04]"
        aria-hidden="true"
      />
    );
  }

  const chain = () => editor.chain().focus();

  // Handle keyboard shortcuts and virtual keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for known shortcuts to avoid conflicts
      if ((e.metaKey || e.ctrlKey) && ['b', 'i', 'u', 'z', 'y'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Focus editor after fullscreen toggle using Tiptap commands
    setTimeout(() => {
      editor?.commands.focus();
    }, 0);
  };

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-zinc-950 flex flex-col' : ''}>
      {/* Fullscreen toolbar */}
      {isFullscreen && (
        <div className="flex items-center justify-between p-3 border-b border-white/10 bg-zinc-900/80 backdrop-blur-sm">
          <h3 className="font-mono-khal text-[10px] uppercase tracking-[2px] text-zinc-400">
            Edición a pantalla completa
          </h3>
          <ToolbarButton
            label="Salir pantalla completa"
            onClick={toggleFullscreen}
          >
            <span aria-hidden="true">⛶</span>
          </ToolbarButton>
        </div>
      )}

      <div
        ref={editorContainerRef}
        className={`
          ${isFullscreen ? 'flex-1 flex flex-col' : ''}
        `}
      >
        <div
          role="toolbar"
          aria-label={ariaLabel}
          className={`
            flex flex-wrap gap-1 rounded-t-lg border border-white/20 border-b-0 bg-white/[0.04] p-1
            ${isMobile ? 'overflow-x-auto scrollbar-hide pb-2' : 'gap-1'}
            ${isFullscreen ? 'border-t-0 rounded-t-none' : ''}
          `}
        >
          <ToolbarButton
            label={labels.bold}
            active={editor.isActive('bold')}
            onClick={() => chain().toggleBold().run()}
          >
            <strong aria-hidden="true">B</strong>
          </ToolbarButton>
          <ToolbarButton
            label={labels.italic}
            active={editor.isActive('italic')}
            onClick={() => chain().toggleItalic().run()}
          >
            <em aria-hidden="true">I</em>
          </ToolbarButton>
          <ToolbarButton
            label={labels.underline}
            active={editor.isActive('underline')}
            onClick={() => chain().toggleUnderline().run()}
          >
            <span aria-hidden="true" className="underline">
              U
            </span>
          </ToolbarButton>
          <ToolbarButton
            label={labels.strike}
            active={editor.isActive('strike')}
            onClick={() => chain().toggleStrike().run()}
          >
            <span aria-hidden="true" className="line-through">
              S
            </span>
          </ToolbarButton>
          <span aria-hidden="true" className="mx-1 w-px self-stretch bg-white/20" />
          <ToolbarButton
            label={labels.bulletList}
            active={editor.isActive('bulletList')}
            onClick={() => chain().toggleBulletList().run()}
          >
            <span aria-hidden="true">•—</span>
          </ToolbarButton>
          <ToolbarButton
            label={labels.orderedList}
            active={editor.isActive('orderedList')}
            onClick={() => chain().toggleOrderedList().run()}
          >
            <span aria-hidden="true">1.</span>
          </ToolbarButton>
          <span aria-hidden="true" className="mx-1 w-px self-stretch bg-white/20" />
          <ToolbarButton
            label={labels.undo}
            disabled={!editor.can().undo()}
            onClick={() => chain().undo().run()}
          >
            <span aria-hidden="true">↺</span>
          </ToolbarButton>
          <ToolbarButton
            label={labels.redo}
            disabled={!editor.can().redo()}
            onClick={() => chain().redo().run()}
          >
            <span aria-hidden="true">↻</span>
          </ToolbarButton>
          
          {/* Fullscreen toggle button */}
          {!isFullscreen && (
            <ToolbarButton
              label="Pantalla completa"
              onClick={toggleFullscreen}
            >
              <span aria-hidden="true">⛶</span>
            </ToolbarButton>
          )}
        </div>
        
        <EditorContent editor={editor} />
      </div>
      
      {/* Mobile keyboard spacer */}
      {isMobile && !isFullscreen && (
        <div className="h-16" aria-hidden="true" />
      )}
    </div>
  );
}

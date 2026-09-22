"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const toolbarBtn =
  "rounded-md px-2.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-40";

const toolbarBtnActive =
  "rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-semibold text-white";

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm max-w-none min-h-[240px] px-4 py-3 text-slate-200 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) {
    return (
      <div className="h-[300px] animate-pulse rounded-xl border border-slate-700 bg-slate-900/60" />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/60">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-700/70 px-2 py-1.5">
        <button
          type="button"
          aria-label="Bold"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${editor.isActive("bold") ? toolbarBtnActive : toolbarBtn}`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          aria-label="Italic"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${editor.isActive("italic") ? toolbarBtnActive : toolbarBtn}`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          aria-label="Strikethrough"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`${editor.isActive("strike") ? toolbarBtnActive : toolbarBtn}`}
        >
          <s>S</s>
        </button>

        <span className="mx-1 h-5 w-px bg-slate-700" aria-hidden="true" />

        <button
          type="button"
          aria-label="Heading 1"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? toolbarBtnActive : toolbarBtn}
        >
          H1
        </button>
        <button
          type="button"
          aria-label="Heading 2"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? toolbarBtnActive : toolbarBtn}
        >
          H2
        </button>
        <button
          type="button"
          aria-label="Heading 3"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive("heading", { level: 3 }) ? toolbarBtnActive : toolbarBtn}
        >
          H3
        </button>

        <span className="mx-1 h-5 w-px bg-slate-700" aria-hidden="true" />

        <button
          type="button"
          aria-label="Bullet list"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? toolbarBtnActive : toolbarBtn}
        >
          • List
        </button>
        <button
          type="button"
          aria-label="Ordered list"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? toolbarBtnActive : toolbarBtn}
        >
          1. List
        </button>
        <button
          type="button"
          aria-label="Blockquote"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? toolbarBtnActive : toolbarBtn}
        >
          “
        </button>
        <button
          type="button"
          aria-label="Code block"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive("codeBlock") ? toolbarBtnActive : toolbarBtn}
        >
          {"</>"}
        </button>
        <button
          type="button"
          aria-label="Horizontal rule"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={toolbarBtn}
        >
          — Line
        </button>

        <span className="mx-1 h-5 w-px bg-slate-700" aria-hidden="true" />

        <button
          type="button"
          aria-label="Undo"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={toolbarBtn}
        >
          ↶
        </button>
        <button
          type="button"
          aria-label="Redo"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={toolbarBtn}
        >
          ↷
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;
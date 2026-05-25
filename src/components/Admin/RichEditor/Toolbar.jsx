"use client";

import {
  Undo2,
  Redo2,
  Pilcrow,
  Heading2,
  Heading3,
  Heading4,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  FileCode,
  Minus,
  Link2,
  ImageIcon,
  Eraser,
  Loader2,
} from "lucide-react";
import styles from "./RichEditor.module.css";

const SZ = 15;

function Btn({ title, onClick, active, disabled, children, className = "" }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.toolbarBtn} ${active ? styles.active : ""} ${className}`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className={styles.separator} aria-hidden />;
}

export default function Toolbar({ editor, onImageClick, isUploading, uploadError }) {
  if (!editor) return null;

  function setLink() {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("URL", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Editor toolbar">

      {/* ── Group 1: History ── */}
      <Btn
        title="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo2 size={SZ} />
      </Btn>
      <Btn
        title="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo2 size={SZ} />
      </Btn>

      <Sep />

      {/* ── Group 2: Block type ── */}
      <Btn
        title="Paragraph"
        onClick={() => editor.chain().focus().setParagraph().run()}
        active={editor.isActive("paragraph")}
      >
        <Pilcrow size={SZ} />
      </Btn>
      <Btn
        title="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
      >
        <Heading2 size={SZ} />
      </Btn>
      <Btn
        title="Heading 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
      >
        <Heading3 size={SZ} />
      </Btn>
      <Btn
        title="Heading 4"
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        active={editor.isActive("heading", { level: 4 })}
      >
        <Heading4 size={SZ} />
      </Btn>

      <Sep />

      {/* ── Group 3: Inline formatting ── */}
      <Btn
        title="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
      >
        <Bold size={SZ} />
      </Btn>
      <Btn
        title="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
      >
        <Italic size={SZ} />
      </Btn>
      <Btn
        title="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
      >
        <Underline size={SZ} />
      </Btn>
      <Btn
        title="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
      >
        <Strikethrough size={SZ} />
      </Btn>
      <Btn
        title="Inline code"
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
      >
        <Code size={SZ} />
      </Btn>

      <Sep />

      {/* ── Group 4: Alignment ── */}
      <Btn
        title="Align left"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
      >
        <AlignLeft size={SZ} />
      </Btn>
      <Btn
        title="Align center"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
      >
        <AlignCenter size={SZ} />
      </Btn>
      <Btn
        title="Align right"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
      >
        <AlignRight size={SZ} />
      </Btn>

      <Sep />

      {/* ── Group 5: Lists & blocks ── */}
      <Btn
        title="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
      >
        <List size={SZ} />
      </Btn>
      <Btn
        title="Ordered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
      >
        <ListOrdered size={SZ} />
      </Btn>
      <Btn
        title="Blockquote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
      >
        <Quote size={SZ} />
      </Btn>
      <Btn
        title="Code block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
      >
        <FileCode size={SZ} />
      </Btn>
      <Btn
        title="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        active={false}
      >
        <Minus size={SZ} />
      </Btn>

      <Sep />

      {/* ── Group 6: Media & links ── */}
      <Btn
        title="Link"
        onClick={setLink}
        active={editor.isActive("link")}
      >
        <Link2 size={SZ} />
      </Btn>
      <Btn
        title={isUploading ? "Uploading…" : "Insert image"}
        onClick={onImageClick}
        disabled={isUploading}
        className={isUploading ? styles.toolbarBtnLoading : ""}
      >
        {isUploading
          ? <Loader2 size={SZ} className={styles.spin} />
          : <ImageIcon size={SZ} />}
      </Btn>

      <Sep />

      {/* ── Group 7: Clear formatting ── */}
      <Btn
        title="Clear formatting"
        onClick={() =>
          editor.chain().focus().clearNodes().unsetAllMarks().run()
        }
        active={false}
      >
        <Eraser size={SZ} />
      </Btn>

      {/* Inline upload error — avoids alert() */}
      {uploadError && (
        <span className={styles.uploadError} role="alert">
          {uploadError}
        </span>
      )}
    </div>
  );
}

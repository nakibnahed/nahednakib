"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import Toolbar from "./Toolbar";
import styles from "./RichEditor.module.css";

// ── Custom ResizableImage ─────────────────────────────────────────
// Extends the standard Image extension to support a "size" attribute
// rendered as data-size on the <img> tag for CSS-based resizing.
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: "full",
        parseHTML: (element) => element.getAttribute("data-size") || "full",
        renderHTML: (attributes) => ({ "data-size": attributes.size }),
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({ "data-align": attributes.align }),
      },
    };
  },
});

const UPLOAD_PLACEHOLDER = "⏳ Uploading image...";

export default function RichEditor({ content, onChange }) {
  const fileInputRef = useRef(null);
  const wrapperRef = useRef(null);
  const isInternalChange = useRef(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [imagePicker, setImagePicker] = useState(null);  // { nodePos, size, align }
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // GapCursor and Dropcursor are built into StarterKit; configure here.
        dropcursor: { color: "var(--primary-color)", width: 2 },
        gapcursor: true,
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Write your article content here..." }),
      ResizableImage,
    ],
    content: content || "",
    onUpdate({ editor }) {
      isInternalChange.current = true;
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: { class: "rich-editor-prosemirror" },

      // Improvement 2: detect image clicks to open the size picker
      handleClickOn(view, pos, node, nodePos) {
        if (node.type.name === "image") {
          setImagePicker({
            nodePos,
            size: node.attrs.size || "full",
            align: node.attrs.align || "center",
          });
          return true;
        }
        setImagePicker(null);
        return false;
      },

      // Improvement 3: always ensure user can type after the last block
      handleClick(view, pos) {
        const { doc, tr } = view.state;
        const lastNode = doc.lastChild;
        if (
          pos >= doc.content.size - 2 &&
          lastNode &&
          lastNode.type.name !== "paragraph"
        ) {
          const transaction = tr.insert(
            doc.content.size,
            view.state.schema.nodes.paragraph.create()
          );
          view.dispatch(transaction);
        }
        return false;
      },
    },
  });

  // Sync external content changes (e.g. edit page fetching from DB)
  useEffect(() => {
    if (!editor) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const current = editor.getHTML();
    if (current !== content) {
      editor.commands.setContent(content || "", false);
    }
  }, [content, editor]);

  // Re-measure picker position after every size/align change so it tracks the image
  useLayoutEffect(() => {
    if (!imagePicker || !editor || !wrapperRef.current) return;
    const domNode = editor.view.nodeDOM(imagePicker.nodePos);
    if (!domNode) return;
    const img =
      domNode instanceof HTMLImageElement
        ? domNode
        : domNode.querySelector?.("img");
    if (!img) return;
    const imgRect = img.getBoundingClientRect();
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    setPickerPos({
      top: imgRect.bottom - wrapperRect.top + 6,
      left: Math.max(0, imgRect.left - wrapperRect.left),
    });
  }, [imagePicker, editor]);

  // Close image size picker on outside click
  useEffect(() => {
    if (!imagePicker) return;
    function onPointerDown(e) {
      if (!e.target.closest("[data-size-picker]")) {
        setImagePicker(null);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [imagePicker]);

  // Update one or more attributes of the currently selected image node
  function updateImageAttr(attrs) {
    if (!editor || imagePicker === null) return;
    const nodeAtPos = editor.state.doc.nodeAt(imagePicker.nodePos);
    if (!nodeAtPos) return;
    editor.view.dispatch(
      editor.state.tr.setNodeMarkup(imagePicker.nodePos, undefined, {
        ...nodeAtPos.attrs,
        ...attrs,
      })
    );
    setImagePicker((prev) => (prev ? { ...prev, ...attrs } : null));
  }

  // Improvement 1: fast upload — no compression, placeholder while uploading
  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    e.target.value = "";
    setIsUploading(true);
    setUploadError(null);

    // Insert visible placeholder at current cursor position
    editor.chain().focus().insertContent(`<p>${UPLOAD_PLACEHOLDER}</p>`).run();

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage.from("blog-images").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

    if (error) {
      removePlaceholderAndInsert(editor, null);
      setUploadError("Upload failed: " + error.message);
      setTimeout(() => setUploadError(null), 5000);
      setIsUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage
      .from("blog-images")
      .getPublicUrl(fileName);

    removePlaceholderAndInsert(editor, publicData.publicUrl);
    setIsUploading(false);
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <Toolbar
        editor={editor}
        onImageClick={() => fileInputRef.current?.click()}
        isUploading={isUploading}
        uploadError={uploadError}
      />

      <div className={styles.editorArea}>
        <EditorContent editor={editor} className={styles.editor} />
      </div>

      {/* Floating image controls: size + alignment */}
      {imagePicker && (
        <div
          className={styles.sizePicker}
          style={{ top: pickerPos.top, left: pickerPos.left }}
          data-size-picker=""
        >
          {/* Size row */}
          <span className={styles.sizePickerLabel}>Size</span>
          {[
            { key: "small", label: "S" },
            { key: "medium", label: "M" },
            { key: "large", label: "L" },
            { key: "full", label: "Full" },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`${styles.sizePickerBtn} ${
                imagePicker.size === key ? styles.sizePickerBtnActive : ""
              }`}
              onClick={() => updateImageAttr({ size: key })}
            >
              {label}
            </button>
          ))}

          <span className={styles.sizePickerDivider} aria-hidden />

          {/* Align row */}
          <span className={styles.sizePickerLabel}>Align</span>
          {[
            { key: "left",   Icon: AlignLeft },
            { key: "center", Icon: AlignCenter },
            { key: "right",  Icon: AlignRight },
          ].map(({ key, Icon }) => (
            <button
              key={key}
              type="button"
              title={`Align ${key}`}
              className={`${styles.sizePickerBtn} ${
                imagePicker.align === key ? styles.sizePickerBtnActive : ""
              }`}
              onClick={() => updateImageAttr({ align: key })}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />
    </div>
  );
}

// ── Helper: find placeholder paragraph, remove it, optionally insert image ──
function removePlaceholderAndInsert(editor, imageUrl) {
  const { doc } = editor.state;
  let found = null;

  doc.descendants((node, pos) => {
    if (found) return false;
    if (
      node.type.name === "paragraph" &&
      node.textContent === UPLOAD_PLACEHOLDER
    ) {
      found = { from: pos, to: pos + node.nodeSize };
    }
  });

  if (!found) {
    // Placeholder was deleted by user — just insert image at cursor if we have a URL
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl, size: "full", align: "center" }).run();
    }
    return;
  }

  const tr = editor.state.tr;

  if (imageUrl) {
    const imageNode = editor.state.schema.nodes.image.create({
      src: imageUrl,
      size: "full",
      align: "center",
    });
    tr.delete(found.from, found.to).insert(found.from, imageNode);
  } else {
    tr.delete(found.from, found.to);
  }

  editor.view.dispatch(tr);
}

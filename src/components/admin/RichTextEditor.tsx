"use client";

import { useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
} from "lucide-react";
import { useFieldError, useMarkDirty } from "./AdminForm";
import { currentTitle } from "./form-title";
import { MediaLibrary } from "./MediaLibrary";

/**
 * Blog / ürün / proje / kategori içerikleri için zengin metin editörü (Tiptap v3 —
 * üretimde kullanılan editör). Yapıştırılan HTML editör şemasına göre süzülür (izin verilmeyen etiket ve
 * stiller düşer); kayıt sırasında sunucuda sanitize-html ile ikinci kez temizlenir. H1 yok: sayfa başlığı H1'dir.
 */
export function RichTextEditor({ name, label, defaultValue, placeholder = "Yazmaya başlayın…" }: { name: string; label: string; defaultValue?: string | null; placeholder?: string }) {
  const [html, setHtml] = useState(defaultValue ?? "");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [mediaOpen, setMediaOpen] = useState(false);
  const markDirty = useMarkDirty();
  const error = useFieldError(name);
  const editorWrapRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false, // Next.js SSR hydration uyumu
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        code: false,
        codeBlock: false,
        strike: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: "noopener noreferrer", target: null } },
      }),
      TiptapImage.configure({ allowBase64: false }), // base64 görsel DB'ye asla girmez
      Placeholder.configure({ placeholder }),
    ],
    content: defaultValue || "",
    editorProps: {
      attributes: { class: "prose prose-neutral max-w-none min-h-72 px-4 py-3 focus:outline-none", "aria-label": label, "aria-multiline": "true", role: "textbox" },
      // Word/Google Docs'tan gelen satır içi stil ve class'ları temizle (şema zaten izin vermez; ek güvence).
      transformPastedHTML: (pasted) => pasted.replace(/\sstyle="[^"]*"/gi, "").replace(/\sclass="[^"]*"/gi, ""),
    },
    onUpdate: ({ editor: e }) => {
      setHtml(e.isEmpty ? "" : e.getHTML());
      markDirty();
    },
  });

  return (
    <div ref={editorWrapRef}>
      <p className="mb-1.5 text-sm font-medium text-neutral-800">{label}</p>
      <input type="hidden" name={name} value={html} />
      <div className={`border bg-white ${error ? "border-red-500" : "border-neutral-300"} focus-within:border-ink`}>
        {editor ? <Toolbar editor={editor} onLink={() => {
          setLinkUrl(editor.getAttributes("link").href ?? "");
          setLinkOpen(true);
        }} onImage={() => setMediaOpen(true)} /> : <div className="h-11 border-b border-neutral-200 bg-neutral-50" />}
        {linkOpen && editor ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2">
            <label htmlFor={`${name}-link`} className="text-xs text-neutral-600">
              Bağlantı
            </label>
            <input
              id={`${name}-link`}
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink(editor, linkUrl);
                  setLinkOpen(false);
                }
                if (e.key === "Escape") setLinkOpen(false);
              }}
              placeholder="/urunler/... veya https://..."
              className="min-h-9 min-w-0 flex-1 border border-neutral-300 px-2 text-sm outline-none focus:border-ink"
            />
            <button type="button" onClick={() => { applyLink(editor, linkUrl); setLinkOpen(false); }} className="min-h-9 bg-ink px-3 text-sm text-white">
              Uygula
            </button>
            <button type="button" onClick={() => setLinkOpen(false)} className="min-h-9 px-3 text-sm">
              Vazgeç
            </button>
          </div>
        ) : null}
        <EditorContent editor={editor} />
      </div>
      {error ? <p className="mt-1.5 text-sm text-red-700">{error}</p> : null}
      <MediaLibrary
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(items) => {
          const m = items[0];
          // Alt metin: medyadaki alt; yoksa içeriğin başlığı (boş alt yerine anlamlı bir açıklama).
          if (m && editor) editor.chain().focus().setImage({ src: m.url, alt: m.alt || currentTitle(editorWrapRef.current) || "" }).run();
        }}
      />
    </div>
  );
}

function applyLink(editor: Editor, raw: string) {
  const url = raw.trim();
  if (!url) return editor.chain().focus().extendMarkRange("link").unsetLink().run();
  // Yalnızca güvenli şemalar: site içi yol, http(s), mailto, tel.
  if (!/^(\/|https?:\/\/|mailto:|tel:)/i.test(url)) return;
  editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
}

function Toolbar({ editor, onLink, onImage }: { editor: Editor; onLink: () => void; onImage: () => void }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      p: e.isActive("paragraph"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      h4: e.isActive("heading", { level: 4 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      ul: e.isActive("bulletList"),
      ol: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();
  const items: { label: string; icon: React.ComponentType<{ className?: string }>; run: () => void; active?: boolean; disabled?: boolean; sep?: boolean }[] = [
    { label: "Paragraf", icon: Pilcrow, run: () => c().setParagraph().run(), active: s.p },
    { label: "Başlık 2", icon: Heading2, run: () => c().toggleHeading({ level: 2 }).run(), active: s.h2 },
    { label: "Başlık 3", icon: Heading3, run: () => c().toggleHeading({ level: 3 }).run(), active: s.h3 },
    { label: "Başlık 4", icon: Heading4, run: () => c().toggleHeading({ level: 4 }).run(), active: s.h4, sep: true },
    { label: "Kalın", icon: Bold, run: () => c().toggleBold().run(), active: s.bold },
    { label: "İtalik", icon: Italic, run: () => c().toggleItalic().run(), active: s.italic },
    { label: "Altı çizili", icon: UnderlineIcon, run: () => c().toggleUnderline().run(), active: s.underline, sep: true },
    { label: "Madde işaretli liste", icon: List, run: () => c().toggleBulletList().run(), active: s.ul },
    { label: "Numaralı liste", icon: ListOrdered, run: () => c().toggleOrderedList().run(), active: s.ol },
    { label: "Alıntı", icon: Quote, run: () => c().toggleBlockquote().run(), active: s.quote },
    { label: "Ayraç", icon: Minus, run: () => c().setHorizontalRule().run(), sep: true },
    { label: "Bağlantı", icon: Link2, run: onLink, active: s.link },
    { label: "Bağlantıyı kaldır", icon: Unlink, run: () => c().extendMarkRange("link").unsetLink().run(), disabled: !s.link },
    { label: "Görsel ekle", icon: ImagePlus, run: onImage, sep: true },
    { label: "Geri al", icon: Undo2, run: () => c().undo().run(), disabled: !s.canUndo },
    { label: "Yinele", icon: Redo2, run: () => c().redo().run(), disabled: !s.canRedo },
  ];
  return (
    <div role="toolbar" aria-label="Metin biçimlendirme" className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-neutral-50 p-1">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <span key={it.label} className="flex items-center">
            <button
              type="button"
              title={it.label}
              aria-label={it.label}
              aria-pressed={it.active ?? undefined}
              disabled={it.disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={it.run}
              className={`flex h-9 w-9 items-center justify-center transition-colors disabled:opacity-30 ${it.active ? "bg-ink text-white" : "hover:bg-neutral-200"}`}
            >
              <Icon className="h-4 w-4" />
            </button>
            {it.sep ? <span aria-hidden="true" className="mx-1 h-6 w-px bg-neutral-300" /> : null}
          </span>
        );
      })}
    </div>
  );
}

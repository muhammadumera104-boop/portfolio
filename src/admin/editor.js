// Rich-text editor for blog posts (Tiptap). Output is HTML, sanitised again when a post is displayed.
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

const BUTTONS = [
  ['bold', 'B', 'Bold', (e) => e.chain().focus().toggleBold().run(), (e) => e.isActive('bold')],
  ['italic', 'I', 'Italic', (e) => e.chain().focus().toggleItalic().run(), (e) => e.isActive('italic')],
  ['h2', 'H2', 'Heading', (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), (e) => e.isActive('heading', { level: 2 })],
  ['h3', 'H3', 'Subheading', (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), (e) => e.isActive('heading', { level: 3 })],
  ['ul', '• List', 'Bulleted list', (e) => e.chain().focus().toggleBulletList().run(), (e) => e.isActive('bulletList')],
  ['ol', '1. List', 'Numbered list', (e) => e.chain().focus().toggleOrderedList().run(), (e) => e.isActive('orderedList')],
  ['quote', '“ ”', 'Quote', (e) => e.chain().focus().toggleBlockquote().run(), (e) => e.isActive('blockquote')],
  ['code', '</>', 'Code block', (e) => e.chain().focus().toggleCodeBlock().run(), (e) => e.isActive('codeBlock')],
  ['link', 'Link', 'Add or remove a link', null, (e) => e.isActive('link')],
  ['image', 'Image', 'Upload an image', null, () => false],
  ['undo', '↶', 'Undo', (e) => e.chain().focus().undo().run(), () => false],
  ['redo', '↷', 'Redo', (e) => e.chain().focus().redo().run(), () => false],
];

const safeUrl = (value) => /^(https?:\/\/|mailto:)/i.test(value.trim());

/**
 * @param {HTMLElement} host   element that will contain toolbar + editing area
 * @param {{content?: string, upload: (file: File) => Promise<string>, onError: (msg: string) => void}} options
 */
export function createEditor(host, { content = '', upload, onError }) {
  host.innerHTML = `
    <div class="editor__bar" role="toolbar" aria-label="Formatting">
      ${BUTTONS.map(([key, label, title]) => `<button type="button" class="editor__btn" data-cmd="${key}" title="${title}" aria-label="${title}">${label}</button>`).join('')}
    </div>
    <div class="editor__area" data-area></div>
    <input type="file" accept="image/*" hidden data-file>`;

  const fileInput = host.querySelector('[data-file]');
  const editor = new Editor({
    element: host.querySelector('[data-area]'),
    extensions: [StarterKit, Image, Link.configure({ openOnClick: false })],
    content,
    editorProps: { attributes: { class: 'prose editor__prose', 'aria-label': 'Post content' } },
    onTransaction: () => syncButtons(),
  });

  function syncButtons() {
    BUTTONS.forEach(([key, , , , isActive]) => {
      host.querySelector(`[data-cmd="${key}"]`)?.classList.toggle('is-active', isActive(editor));
    });
  }

  host.querySelector('.editor__bar').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-cmd]');
    if (!btn) return;
    const key = btn.dataset.cmd;
    if (key === 'link') {
      if (editor.isActive('link')) return editor.chain().focus().unsetLink().run();
      const url = window.prompt('Link address (https://… or mailto:…)');
      if (!url) return;
      if (!safeUrl(url)) return onError('Links must start with https://, http:// or mailto:');
      return editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    }
    if (key === 'image') return fileInput.click();
    BUTTONS.find(([k]) => k === key)[3](editor);
  });

  fileInput.addEventListener('change', async () => {
    const [file] = fileInput.files;
    fileInput.value = '';
    if (!file) return;
    try {
      const src = await upload(file);
      editor.chain().focus().setImage({ src, alt: '' }).run();
    } catch (error) {
      onError(error.message || 'Image upload failed.');
    }
  });

  return {
    getHTML: () => editor.getHTML(),
    isEmpty: () => editor.isEmpty,
    destroy: () => editor.destroy(),
  };
}

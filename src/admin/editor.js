// Rich-text editor for blog posts (Tiptap). Output is HTML, sanitised again when a post is displayed.
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import { looksLikeYoutubeUrl } from '../shared/sanitize.js';

const BUTTONS = [
  ['bold', 'B', 'Bold', (e) => e.chain().focus().toggleBold().run(), (e) => e.isActive('bold')],
  ['italic', 'I', 'Italic', (e) => e.chain().focus().toggleItalic().run(), (e) => e.isActive('italic')],
  ['h2', 'H2', 'Heading', (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), (e) => e.isActive('heading', { level: 2 })],
  ['h3', 'H3', 'Subheading', (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), (e) => e.isActive('heading', { level: 3 })],
  ['ul', '• List', 'Bulleted list', (e) => e.chain().focus().toggleBulletList().run(), (e) => e.isActive('bulletList')],
  ['ol', '1. List', 'Numbered list', (e) => e.chain().focus().toggleOrderedList().run(), (e) => e.isActive('orderedList')],
  ['quote', '“ ”', 'Quote', (e) => e.chain().focus().toggleBlockquote().run(), (e) => e.isActive('blockquote')],
  ['code', '&lt;/&gt;', 'Code block', (e) => e.chain().focus().toggleCodeBlock().run(), (e) => e.isActive('codeBlock')],
  ['link', 'Link', 'Add or remove a link', null, (e) => e.isActive('link')],
  ['image', 'Image', 'Upload an image', null, () => false],
  ['imageurl', 'Image URL', 'Insert an image from a web address', null, () => false],
  ['video', '▶ YouTube', 'Embed a YouTube video from its link', null, (e) => e.isActive('youtube')],
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
    // Videos use youtube-nocookie.com, so viewers are not tracked until they press play.
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Youtube.configure({ nocookie: true, controls: true, modestBranding: true, rel: 0, width: 640, height: 360 }),
    ],
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
    if (key === 'imageurl') {
      const src = window.prompt('Image address (https://…)');
      if (!src) return;
      if (!/^https:\/\//i.test(src.trim())) return onError('Image addresses must start with https://');
      return editor.chain().focus().setImage({ src: src.trim(), alt: '' }).run();
    }
    if (key === 'video') {
      const url = window.prompt('YouTube link (e.g. https://www.youtube.com/watch?v=… or https://youtu.be/…)');
      if (!url) return;
      if (!looksLikeYoutubeUrl(url)) return onError('That does not look like a YouTube link.');
      const ok = editor.chain().focus().setYoutubeVideo({ src: url.trim() }).run();
      if (!ok) onError('Could not embed that video. Check the link and try again.');
      return;
    }
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

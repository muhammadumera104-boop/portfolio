// Reading progress through an article, as a number from 0 to 1.
// 0 when the top of the article reaches the middle of the screen, 1 when its last line reaches the middle.
// (The bar in the header then shows how much of the post you have read, not how far down the whole page you are.)
export function readingProgress({ top, height, viewport }) {
  if (!(height > 0) || !(viewport > 0) || !Number.isFinite(top)) return 0;
  const readingLine = viewport / 2;
  return Math.min(1, Math.max(0, (readingLine - top) / height));
}

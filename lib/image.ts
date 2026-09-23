const MAX_INPUT_BYTES = 15 * 1024 * 1024;

// Center-crops an image file to a square and shrinks it to a small JPEG data
// URL (~10–20 KB at 192px), small enough to store directly on the user's
// Firestore profile without needing Firebase Storage.
export async function fileToAvatarDataURL(file: File, size = 192): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('That image is too large (max 15 MB).');

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Couldn’t read that image. Try a JPG or PNG.'));
      el.src = url;
    });

    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser couldn’t process the image.');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size
    );
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

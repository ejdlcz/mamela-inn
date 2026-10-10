/** Triggers a file download in the browser. */
export function browserDownload(
  filename: string,
  data: BlobPart,
  mime = 'application/octet-stream',
) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const form = document.getElementById('convertForm');
const fileInput = document.getElementById('document');
const statusText = document.getElementById('status');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const file = fileInput.files[0];
  if (!file) {
    statusText.textContent = 'Please choose a file first.';
    return;
  }

  const formData = new FormData();
  formData.append('document', file);

  statusText.textContent = 'Converting...';
  submitBtn.disabled = true;

  try {
    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      let message = 'Conversion failed.';
      try {
        const errorJson = await response.json();
        message = errorJson.error || message;
      } catch {
        // Ignore JSON parsing errors and keep default message.
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
    const downloadName = match ? match[1] : 'converted.pdf';

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = downloadName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    statusText.textContent = 'Done. Your PDF has been downloaded.';
  } catch (error) {
    statusText.textContent = error.message || 'Something went wrong.';
  } finally {
    submitBtn.disabled = false;
  }
});

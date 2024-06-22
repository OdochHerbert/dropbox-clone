document.getElementById('uploadForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const fileInput = document.getElementById('fileInput');
  const messageDiv = document.getElementById('message');
  
  if (!fileInput.files.length) {
    messageDiv.textContent = 'Please select a file to upload.';
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.text();
      messageDiv.style.color = 'green';
      messageDiv.textContent = result;
      fetchFiles();
    } else {
      messageDiv.style.color = 'red';
      messageDiv.textContent = 'Failed to upload file.';
    }
  } catch (error) {
    messageDiv.style.color = 'red';
    messageDiv.textContent = `Error: ${error.message}`;
  }
});

async function fetchFiles() {
  const fileList = document.getElementById('fileList');
  fileList.innerHTML = '';

  try {
    const response = await fetch('http://localhost:3000/files');
    if (response.ok) {
      const files = await response.json();
      files.forEach(file => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = `http://localhost:3000/download/${file.filename}`;
        link.textContent = file.filename;
        listItem.appendChild(link);
        fileList.appendChild(listItem);
      });
    } else {
      fileList.innerHTML = 'Failed to load files.';
    }
  } catch (error) {
    fileList.innerHTML = `Error: ${error.message}`;
  }
}

// Fetch files on page load
fetchFiles();

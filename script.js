document.addEventListener('DOMContentLoaded', async function() {
  // Fetch and display existing folders and their files
  await fetchFoldersAndFiles();

  // Handle folder creation
  document.getElementById('createFolderForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const folderNameInput = document.getElementById('folderNameInput');
    const messageDiv = document.getElementById('createFolderMessage');

    const folderName = folderNameInput.value;

    try {
      const response = await fetch('http://localhost:3000/folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folderName })
      });

      if (response.ok) {
        messageDiv.style.color = 'green';
        messageDiv.textContent = 'Folder created successfully';
        folderNameInput.value = '';
        await fetchFoldersAndFiles(); // Refresh folders and files list
      } else {
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Failed to create folder';
      }
    } catch (error) {
      messageDiv.style.color = 'red';
      messageDiv.textContent = `Error: ${error.message}`;
    }
  });

  // Handle file upload
  document.getElementById('uploadForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const folderSelect = document.getElementById('folderSelect');
    const messageDiv = document.getElementById('uploadMessage');

    if (!fileInput.files.length) {
      messageDiv.textContent = 'Please select a file to upload.';
      return;
    }

    const file = fileInput.files[0];
    const folder = folderSelect.value || 'default';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.text();
        messageDiv.style.color = 'green';
        messageDiv.textContent = result;
        fileInput.value = '';
        await fetchFoldersAndFiles(); // Refresh folders and files list
      } else {
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Failed to upload file.';
      }
    } catch (error) {
      messageDiv.style.color = 'red';
      messageDiv.textContent = `Error: ${error.message}`;
    }
  });
});

// Fetch folders and their files
async function fetchFoldersAndFiles() {
  const folderTree = document.getElementById('folderTree');
  folderTree.innerHTML = '';

  try {
    // Fetch folders
    const responseFolders = await fetch('http://localhost:3000/folders');
    if (responseFolders.ok) {
      const folders = await responseFolders.json();
      
      // Update folder select dropdown in upload form
      const folderSelect = document.getElementById('folderSelect');
      folderSelect.innerHTML = '';
      folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.name;
        option.textContent = folder.name;
        folderSelect.appendChild(option);
      });

      // Fetch files for each folder and display in tree
      for (let folder of folders) {
        const folderNode = document.createElement('div');
        folderNode.classList.add('folder-node');

        const folderName = document.createElement('p');
        folderName.textContent = folder.name;
        folderName.classList.add('folder-name');

        const filesList = document.createElement('ul');
        filesList.classList.add('files-list');
        filesList.setAttribute('data-folder', folder.name);

        folderNode.appendChild(folderName);
        folderNode.appendChild(filesList);

        folderTree.appendChild(folderNode);

        // Fetch and display files for this folder
        await fetchFiles(folder.name);
      }
    } else {
      folderTree.innerHTML = 'Failed to load folders.';
    }
  } catch (error) {
    folderTree.innerHTML = `Error: ${error.message}`;
  }
}

// Fetch files in a specific folder
async function fetchFiles(folderName) {
  const filesList = document.querySelector(`ul[data-folder="${folderName}"]`);
  filesList.innerHTML = '';

  try {
    const response = await fetch(`http://localhost:3000/folder/${folderName}`);
    if (response.ok) {
      const files = await response.json();
      for (let file of files) {
        const fileItem = document.createElement('li');
        const downloadLink = document.createElement('a');
        downloadLink.href = `http://localhost:3000/download/${folderName}/${file.filename}`;
        downloadLink.textContent = file.filename;
        fileItem.appendChild(downloadLink);
        filesList.appendChild(fileItem);
      }
    } else {
      filesList.innerHTML = 'Failed to load files.';
    }
  } catch (error) {
    filesList.innerHTML = `Error: ${error.message}`;
  }
}

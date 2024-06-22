const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection without deprecated option
mongoose.connect('mongodb://localhost:27017/fileuploads', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to mongodb://localhost:27017/fileuploads');
});

mongoose.connection.on('error', (err) => {
  console.error(`Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from mongodb://localhost:27017/fileuploads');
});

// Define a schema for the files
const fileSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  folder: String,
  createdAt: { type: Date, default: Date.now }
});

const File = mongoose.model('File', fileSchema);

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.body.folder || 'default';
    const folderPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware to parse JSON
app.use(express.json());

// Create a new folder endpoint
app.post('/folder', async (req, res) => {
  const folderName = req.body.folderName;
  if (!folderName) {
    return res.status(400).send('Folder name is required');
  }

  try {
    // Check if the folder already exists in the database
    const existingFolder = await File.findOne({ folder: folderName });
    if (existingFolder) {
      return res.status(400).send('Folder already exists');
    }

    // Create a new folder document in the database
    const newFolder = new File({ folder: folderName });
    await newFolder.save();
    
    res.status(201).send('Folder created successfully');
  } catch (err) {
    console.error(`Error creating folder: ${err}`);
    res.status(500).send('Error creating folder');
  }
});

// List all folders endpoint
app.get('/folders', async (req, res) => {
  try {
    const folders = await File.find().distinct('folder');
    res.json(folders.map(folder => ({ name: folder })));
  } catch (err) {
    console.error(`Error fetching folders: ${err}`);
    res.status(500).send('Error fetching folders');
  }
});

// List files in a folder endpoint
app.get('/folder/:folderName', async (req, res) => {
  try {
    const files = await File.find({ folder: req.params.folderName }, 'filename');
    res.json(files);
  } catch (err) {
    console.error(`Error fetching files: ${err}`);
    res.status(500).send('Error fetching files');
  }
});

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const folder = req.body.folder || 'default';
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }
    
    const file = new File({
      filename: req.file.filename,
      contentType: req.file.mimetype,
      folder: folder
    });

    await file.save(); // Save file metadata to MongoDB
    
    res.status(201).send('File uploaded successfully');
    console.log(`File uploaded to folder ${folder}: ${req.file.filename}`);
  } catch (err) {
    console.error(`Error uploading file: ${err}`);
    res.status(500).send('Error uploading file');
  }
});

// Download endpoint
app.get('/download/:folderName/:filename', async (req, res) => {
  try {
    const { folderName, filename } = req.params;
    const file = await File.findOne({ folder: folderName, filename: filename });
    if (!file) {
      return res.status(404).send('File not found');
    }

    const filePath = path.join(__dirname, 'uploads', filename);
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (err) => {
      console.error(`Error reading file: ${err}`);
      res.status(500).send('Error downloading file');
    });

    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename=${file.filename}`
    });

    fileStream.pipe(res);
    console.log(`File downloaded: ${file.filename}`);
  } catch (err) {
    console.error(`Error downloading file: ${err}`);
    res.status(500).send('Error downloading file');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

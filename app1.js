const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection without deprecated option
mongoose.connect('mongodb://localhost:27017/fileuploads', {
  useNewUrlParser: true
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
  data: Buffer
});

const File = mongoose.model('File', fileSchema);

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware to parse JSON
app.use(express.json());

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    const file = new File({
      filename: req.file.filename,
      contentType: req.file.mimetype,
      data: fs.readFileSync(filePath)
    });
    await file.save();
    res.status(201).send('File uploaded successfully');
    console.log(`File uploaded: ${req.file.filename}`);
  } catch (err) {
    console.error(`Error uploading file: ${err}`);
    res.status(500).send('Error uploading file');
  }
});

// Download endpoint
app.get('/download/:filename', async (req, res) => {
  try {
    const file = await File.findOne({ filename: req.params.filename });
    if (!file) {
      return res.status(404).send('File not found');
    }
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename=${file.filename}`
    });
    res.send(file.data);
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

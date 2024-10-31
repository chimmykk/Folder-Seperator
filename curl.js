const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 8024;

// Middleware to parse JSON bodies
app.use(express.json());

// Function to find folders based on a base name
function findFolder(baseFolderName) {
  const currentDir = fs.readdirSync(__dirname, { withFileTypes: true });
  return currentDir
    .filter(dir => dir.isDirectory() && dir.name.includes(baseFolderName))
    .map(dir => path.join(__dirname, dir.name));
}

// Function to sort files numerically
function numericSort(a, b) {
  return parseInt(a) - parseInt(b);
}

// Function to organize files into batches of 300
function organizeFiles(sourceFolder, outputFolder) {
  const imagesFolder = path.join(sourceFolder, 'images');
  const metadataFolder = path.join(sourceFolder, 'metadata');

  // Check if both folders exist
  if (!fs.existsSync(imagesFolder) || !fs.existsSync(metadataFolder)) {
    console.error(`Required subfolders (images or metadata) not found in ${sourceFolder}.`);
    return;
  }

  // Read and sort the files in order
  const imageFiles = fs.readdirSync(imagesFolder)
    .filter(file => file.endsWith('.jpg') || file.endsWith('.png'))
    .sort(numericSort);

  const metadataFiles = fs.readdirSync(metadataFolder)
    .filter(file => file.endsWith('.json'))
    .sort(numericSort);

  console.log(`Found ${imageFiles.length} image files in ${sourceFolder}.`);
  console.log(`Found ${metadataFiles.length} metadata files in ${sourceFolder}.`);

  // Check for mismatch
  if (imageFiles.length !== metadataFiles.length) {
    console.error("Mismatch between the number of images and metadata files.");
    return;
  }

  // Organize files in batches of 300
  for (let i = 0; i < imageFiles.length; i += 300) {
    const batchImages = imageFiles.slice(i, i + 300);
    const batchMetadata = metadataFiles.slice(i, i + 300);

    // Create the folder name for the current batch
    const folderName = `batch_${Math.floor(i / 300) + 1}`;
    const batchFolderPath = path.join(outputFolder, folderName);
    
    // Create the batch folder
    fs.mkdirSync(batchFolderPath, { recursive: true });

    // Create 'images' and 'metadata' subfolders within the batch folder
    const imagesOutputFolder = path.join(batchFolderPath, 'images');
    const metadataOutputFolder = path.join(batchFolderPath, 'metadata');
    fs.mkdirSync(imagesOutputFolder, { recursive: true });
    fs.mkdirSync(metadataOutputFolder, { recursive: true });

    // Move image files to the images folder within the batch folder
    batchImages.forEach((file) => {
      const oldImagePath = path.join(imagesFolder, file);
      const newImagePath = path.join(imagesOutputFolder, file);
      fs.renameSync(oldImagePath, newImagePath);
    });

    // Move metadata files to the metadata folder within the batch folder
    batchMetadata.forEach((file) => {
      const oldMetadataPath = path.join(metadataFolder, file);
      const newMetadataPath = path.join(metadataOutputFolder, file);
      fs.renameSync(oldMetadataPath, newMetadataPath);
    });

    console.log(`Created folder: ${folderName} with ${batchImages.length} images and ${batchMetadata.length} metadata files.`);
  }
}

// API endpoint to organize files
app.post('/organize-files', (req, res) => {
  const foldersToSplit = findFolder('split'); // Adjust base name as needed
  const outputFolder = path.join(__dirname, 'output');

  // Create the output folder if it doesn't exist
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
  }

  // Process each found folder
  foldersToSplit.forEach(folder => {
    console.log(`Processing folder: ${folder}`);
    organizeFiles(folder, outputFolder);
  });

  res.status(200).json({ message: 'Files organized successfully.' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

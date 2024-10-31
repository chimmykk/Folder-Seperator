const fs = require('fs');
const path = require('path');

// Paths to the source folders
const imagesFolder = path.join(__dirname, 'ejs/images');
const metadataFolder = path.join(__dirname, 'ejs/metadata');
const outputFolder = path.join(__dirname, 'output');

// Create the output folder if it doesn't exist
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder);
}

// Function to sort files numerically
function numericSort(a, b) {
  return parseInt(a) - parseInt(b);
}

// Function to organize files into batches of 300
function organizeFiles() {
  // Read and sort the files in order
  const imageFiles = fs.readdirSync(imagesFolder)
    .filter(file => file.endsWith('.jpg') || file.endsWith('.png')) // Adjust extensions as needed
    .sort(numericSort); // Numeric sort to ensure proper order

  const metadataFiles = fs.readdirSync(metadataFolder)
    .filter(file => file.endsWith('.json')) // Ensure metadata files are json
    .sort(numericSort); // Numeric sort to ensure proper order

  console.log(`Found ${imageFiles.length} image files.`);
  console.log(`Found ${metadataFiles.length} metadata files.`);

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
    const folderName = `${i}-${Math.min(i + 299, imageFiles.length - 1)}`; // Correct folder naming
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

organizeFiles();
console.log('Files organized into output folders with both images and metadata in order.');

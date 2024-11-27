let tracker;
let bestMatchImages = [];
let capture;
let bestImage;
let query = "Star Wars"; 

function preload() {
  fetchImages("Star Wars");
}

function setup() {
  createCanvas(640, 480);
  capture = createCapture(VIDEO);
  capture.size(width / 2, height); // Set the size of the camera feed
  capture.hide();
  tracker = new clm.tracker();
  tracker.init();
  tracker.start(capture.elt);
  // Fetch images initially
  fetchImages(query);

  // Fetch new images every 10 seconds
  setInterval(() => {
    fetchImages(query);
  }, 10000); // 10 seconds interval
}
function draw() {
  // Display camera feed on the left side of the canvas
  image(capture, 0, 0, width / 2, height);

  let faces = tracker.getCurrentPosition(); // Get the current position of faces

  if (faces.length > 0 && bestMatchImages.length > 0) {
    for (let i = 0; i < faces.length; i++) {
      let face = faces[i];
      let landmarks = tracker.getCurrentPosition();

      // Extract face embeddings
      let faceEmbeddings = extractEmbeddings(landmarks);

      // Compare face embeddings with best matching images
      let bestMatches = compareFacesWithImages(faceEmbeddings, bestMatchImages);

      // Display best matching image on the right side of the canvas
      if (bestMatches.length > 0) {
        let bestImageURL = bestMatches[0].image;
        loadImage(bestImageURL, (img) => {
          bestImage = img;
          image(bestImage, width / 2, 0, width / 2, height);
        });
      }
    }
  }

 // Display title
  fill(255,127,65);
  textSize(24);
  textAlign(CENTER, TOP);
  text("The Best Star Wars Scene Suits You Is", width / 2, 10);
}
function fetchImages(query) {
  // Make a request to Google Custom Search JSON API
  let apiKey = 'https://www.googleapis.com/customsearch/v1?q=${query}&searchType=image&key=${apiKey}&cx=${cx}';
  let cx = 'e30293b16171a499d';
  let url = `https://www.googleapis.com/customsearch/v1?q=${query}&searchType=image&key=${apiKey}&cx=${cx}`;
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
     console.log(data);  // Extract image URLs from the response
      bestMatchImages = data.items.map(item => item.link);
    })
    .catch(error => console.error('Error fetching images:', error));
}

// Function to extract embeddings from facial landmarks
function extractEmbeddings(landmarks) {
  // Extract relevant features from landmarks
  let embeddings = [];

  // Example: Extract x and y coordinates of each landmark point
  for (let i = 0; i < landmarks.length; i++) {
    let point = landmarks[i];
    embeddings.push(point[0]); // x-coordinate
    embeddings.push(point[1]); // y-coordinate
  }
 // Ensure embeddings have the same length
  let targetLength = 128; // Adjust this value based on your needs
  while (embeddings.length < targetLength) {
    embeddings.push(0); // Pad with zeros
  }
  embeddings = embeddings.slice(0, targetLength); // Truncate if necessary

  return embeddings;
}


// Function to compare face embeddings with best matching images
function compareFacesWithImages(faceEmbeddings, images) {
  let bestMatches = [];

  // Loop through each image and compute similarity scores
  for (let i = 0; i < images.length; i++) {
    // Assume extractEmbeddings function works for images as well
    let imageEmbeddings = extractEmbeddings(images[i]); // Implement this function
    let similarityScore = computeSimilarity(faceEmbeddings, imageEmbeddings); // Implement this function
    bestMatches.push({ image: images[i], score: similarityScore });
  }

  // Sort best matches by similarity score in descending order
  bestMatches.sort((a, b) => b.score - a.score);

  // Return array of best matching images
  return bestMatches;
}

// Function to compute similarity between face embeddings
function computeSimilarity(embeddings1, embeddings2) {
  if (embeddings1.length !== embeddings2.length) {
    throw new Error('Embeddings must have the same length');
  }

  // Calculate Euclidean distance between embeddings
  let distanceSquared = 0;
  for (let i = 0; i < embeddings1.length; i++) {
    distanceSquared += Math.pow(embeddings1[i] - embeddings2[i], 2);
  }

  // Return similarity score (inverse of distance)
  return 1 / Math.sqrt(distanceSquared);
}

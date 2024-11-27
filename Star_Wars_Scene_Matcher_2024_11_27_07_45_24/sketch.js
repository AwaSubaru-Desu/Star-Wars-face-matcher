let tracker;
let bestMatchImages = [];
let capture;
let bestImage;
let bestImageURL;
let queries = [
  "Star Wars",
  "Darth Vader",
  "Luke Skywalker",
  "Princess Leia",
  "Anakin Skywalker",
  "Padme",
  "Cal Kestis",
  "Palpatine",
  "Captain Rex",
  "Han Solo",
  "Duku",
  "Obiwan Kenobi"
];
let similarityScore;

function preload() {
  fetchImages(random(queries));
}

function setup() {
  createCanvas(800, 480);
  capture = createCapture(VIDEO);
  capture.size(width / 2, height); // Set the size of the camera feed
  capture.hide();
  tracker = new clm.tracker();
  tracker.init();
  tracker.start(capture.elt);
  // Fetch images initially
  fetchImages(random(queries));
}
function draw() {
  if (!similarityScore) {
    similarityScore = Math.random() * (100 - 70) + 70; // Generate random similarity score between 70 and 100
  }
 let cameraFeedWidth = width / 3; // Adjust the width as needed
  let cameraFeedHeight = (cameraFeedWidth / capture.width) * capture.height;

  // Display camera feed on the top left of the canvas
  image(capture, 0, 0, cameraFeedWidth, cameraFeedHeight);
  
  let faces = tracker.getCurrentPosition(); // Get the current position of faces

  if (faces.length > 0 && bestMatchImages.length > 0) {
    for (let i = 0; i < faces.length; i++) {
      let face = faces[i];
      let landmarks = tracker.getCurrentPosition();

      // Extract face embeddings
      let faceEmbeddings = extractEmbeddings(landmarks);

      // Compare face embeddings with best matching images
      let bestMatches = compareFacesWithImages(faceEmbeddings, bestMatchImages);

      // Display best matching image in the center of the canvas
      if (bestMatches.length > 0) {
        bestImageURL = bestMatches[0].image;
        loadImage(bestImageURL, (img) => {
          bestImage = img;
          // Calculate the aspect ratio of the loaded image
          let aspectRatio = img.width / img.height;
          // Calculate the height of the image to fit within the canvas height
          let imageHeight = height;
          // Calculate the width of the image based on the aspect ratio
          let imageWidth = imageHeight * aspectRatio;
          // Display the image in the center of the canvas
          image(bestImage, (width - imageWidth) / 2, 0, imageWidth, imageHeight);
        });
      }
    }
  }
  //Generate random similarity score between 70 and 100
  fill(255, 127, 65);
  textSize(36);
  textAlign(CENTER, BOTTOM);
  text(
    "Similarity Score: " + similarityScore.toFixed(2),
    width / 2,
    height - 10
  ); // Display similarity score at the bottom of the screen

  // Display title
  fill(255, 127, 65);
  textSize(36);
  textAlign(CENTER, TOP);
  text("The Best Star Wars Scene Suits You Is", width / 2, 10);
}

function fetchImages(query) {
  // Make a request to Google Custom Search JSON API
  let apiKey = 'AIzaSyCHiA3dyUVwocKiWP6exPD7Cigh2MW5Nyk';
  let cx = 'e30293b16171a499d';
  let url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image`;
 
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.items && data.items.length > 0) {
        // Extract image URLs from the response
        bestMatchImages = data.items.map(item => item.link);
        console.log('Images fetched successfully for query:', query);
      } else {
        console.error('No items found in the response for query:', query, data);
        // Randomly select a query from the list of queries
        let randomQuery = random(queries);
        console.log('Fetching images for random query:', randomQuery);
        fetchImages(randomQuery); // Fetch images for the random query
      }
    })
    .catch(error => console.error('Error fetching images for query:', query, error));
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
    throw new Error("Embeddings must have the same length");
  }

  // Calculate Euclidean distance between embeddings
  let distanceSquared = 0;
  for (let i = 0; i < embeddings1.length; i++) {
    distanceSquared += Math.pow(embeddings1[i] - embeddings2[i], 2);
  }

  // Return similarity score (inverse of distance)
  return 1 / Math.sqrt(distanceSquared);
}

"use strict";

const URL = "model/";

let model, webcam, labelContainer, maxPredictions, imageUpload;
let isWebcamActive = false; // Track webcam state

async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  try {
    // Load the model and metadata
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Append elements to the DOM
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
      // and class labels
      labelContainer.appendChild(document.createElement("div"));
    }
  } catch (error) {
    console.error("Initialization error: ", error);
  }
}

async function useWebcam() {
  const flip = true; // whether to flip the webcam

  // Check if webcam is already active
  if (webcam && isWebcamActive) {
    stopWebcam(); // Stop the current webcam stream
  }

  // Create a new webcam instance
  webcam = new tmImage.Webcam(400, 300, flip);

  // Setup and play the webcam
  await webcam.setup(); // request access to the webcam
  await webcam.play();

  // Update webcam state
  isWebcamActive = true;

  // Clear previous webcam container
  const webcamContainer = document.getElementById("webcam-container");
  webcamContainer.innerHTML = "";

  // Append the new webcam canvas to the container
  webcamContainer.appendChild(webcam.canvas);

  // Request animation frame for continuous updates
  window.requestAnimationFrame(loop);
}

function stopWebcam() {
  console.log("Stopping webcam");
  if (webcam) {
    webcam.stop(); // Stop the webcam stream
  }
  isWebcamActive = false;
}

function uploadImage(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function () {
    const imageElement = new Image();
    imageElement.src = reader.result;
    imageElement.onload = async function () {
      const prediction = await model.predict(imageElement);
      displayPredictions(prediction);
    };
    document.getElementById("webcam-container").innerHTML = "";
    document.getElementById("webcam-container").appendChild(imageElement);
  };
  reader.readAsDataURL(file);
}

async function loop() {
  if (isWebcamActive) {
    webcam.update(); // update the webcam frame if active
    await predict();
    window.requestAnimationFrame(loop);
  }
}

async function predict() {
  // Predict class labels
  const prediction = await model.predict(webcam.canvas);
  displayPredictions(prediction);
}

// Show all the results
// function displayPredictions(prediction) {
//   // Find the index of the largest prediction
//   let maxIndex = 0;
//   for (let i = 1; i < prediction.length; i++) {
//     if (prediction[i].probability > prediction[maxIndex].probability) {
//       maxIndex = i;
//     }
//   }

//   // Display predictions with special styling for the largest prediction
//   for (let i = 0; i < maxPredictions; i++) {
//     const classPrediction =
//       prediction[i].className +
//       ": " +
//       (prediction[i].probability * 100).toFixed(0) +
//       "%";

//     if (i === maxIndex) {
//       // Apply special styling for the largest prediction
//       labelContainer.childNodes[
//         i
//       ].innerHTML = `<span style="color: red; font-weight: bold;">${classPrediction}</span>`;
//     } else {
//       // Apply default styling for other predictions
//       labelContainer.childNodes[i].innerHTML = classPrediction;
//     }
//   }
// }

// Only show the largest percent
function displayPredictions(prediction) {
  // Find the index of the largest prediction
  let maxIndex = 0;
  for (let i = 1; i < prediction.length; i++) {
    if (prediction[i].probability > prediction[maxIndex].probability) {
      maxIndex = i;
    }
  }

  // Clear previous predictions
  labelContainer.innerHTML = "";

  // Display the prediction with the largest probability
  const classPrediction = prediction[maxIndex].className;
  // labelContainer.innerHTML = `<span style="font-weight: bold;">${classPrediction}</span>`;

  // Get all .information divs and hide them
  const informationDivs = document.querySelectorAll(".information > div");
  informationDivs.forEach((div) => (div.style.display = "none"));

  // Show the matching .information div
  const matchingDiv = document.getElementById(classPrediction);
  if (matchingDiv) {
    matchingDiv.style.display = "flex";
    matchingDiv.style.justifyContent = "center";
  }
}

// Initialize the application
init();

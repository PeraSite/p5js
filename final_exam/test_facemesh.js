/*
 * 👋 Hello! This is an ml5.js example made and shared with ❤️.
 * Learn more about the ml5.js project: https://ml5js.org/
 * ml5.js license and Code of Conduct: https://github.com/ml5js/ml5-next-gen/blob/main/LICENSE.md
 *
 * This example demonstrates face tracking on live video through ml5.faceMesh.
 */

let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: true };
let videoBounds = { x: 0, y: 0, w: 0, h: 0, sx: 1, sy: 1 };

function preload() {
  // Load the faceMesh model
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Create the webcam video and hide it
  video = createCapture({
    video: {
      facingMode: "user",
      width: { ideal: 720 },
      height: { ideal: 1280 },
      aspectRatio: { ideal: 9 / 16 }
    },
    audio: false
  });
  video.hide();
  // Start detecting faces from the webcam video
  faceMesh.detectStart(video, gotFaces);
}

function draw() {
  background(0);

  // Draw the webcam video
  updateVideoBounds();
  push();
  translate(videoBounds.x + videoBounds.w, videoBounds.y);
  scale(-1, 1);
  image(video, 0, 0, videoBounds.w, videoBounds.h);
  pop();

  // Draw all the tracked face points
  for (let i = 0; i < faces.length; i++) {
    let face = faces[i];
    for (let j = 0; j < face.keypoints.length; j++) {
      let keypoint = face.keypoints[j];
      let point = videoPointToCanvas(keypoint.x, keypoint.y);
      fill(0, 255, 0);
      noStroke();
      circle(point.x, point.y, 5);
    }
  }
}

function updateVideoBounds() {
  let sourceWidth = video?.elt?.videoWidth || video?.width || 720;
  let sourceHeight = video?.elt?.videoHeight || video?.height || 1280;
  let sourceRatio = sourceWidth / sourceHeight;
  let canvasRatio = width / height;

  if (canvasRatio > sourceRatio) {
    videoBounds.h = height;
    videoBounds.w = height * sourceRatio;
    videoBounds.x = (width - videoBounds.w) / 2;
    videoBounds.y = 0;
  } else {
    videoBounds.w = width;
    videoBounds.h = width / sourceRatio;
    videoBounds.x = 0;
    videoBounds.y = (height - videoBounds.h) / 2;
  }

  videoBounds.sx = videoBounds.w / sourceWidth;
  videoBounds.sy = videoBounds.h / sourceHeight;
}

function videoPointToCanvas(x, y) {
  return {
    x: videoBounds.x + videoBounds.w - x * videoBounds.sx,
    y: videoBounds.y + y * videoBounds.sy
  };
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Callback function for when faceMesh outputs data
function gotFaces(results) {
  // Save the output to the faces variable
  faces = results;
}

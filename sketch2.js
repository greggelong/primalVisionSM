let video;

let threshold = 200;

let numSpots = 20;

function setup() {
  createCanvas(windowWidth, windowHeight);

  pixelDensity(1);
  var constraints = {
    audio: false,
    video: {
      facingMode: {
        exact: "environment",
      },
    },
    // video: {
    // facingMode: "user"
    // }
  };

  //video = createCapture(VIDEO, { flipped: true }); //for computer
  video = createCapture(VIDEO, constraints); // for phone

  video.size(320, 240); // Downsample for speed

  video.hide();
}

function draw() {
  background(0);
  image(video, 0, 0, width, height);
  video.loadPixels();

  let brightSpots = [];

  for (let y = 1; y < video.height - 1; y++) {
    // Avoid edge of frame
    for (let x = 1; x < video.width - 1; x++) {
      let index = (x + y * video.width) * 4;
      let r = video.pixels[index];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];
      let brightness = (r + g + b) / 3;

      if (brightness > threshold) {
        // Check neighbors
        let hasDarkNeighbor = false;
        let neighbors = [
          (x - 1 + y * video.width) * 4, // left
          (x + 1 + y * video.width) * 4, // right
          (x + (y - 1) * video.width) * 4, // top
          (x + (y + 1) * video.width) * 4, // bottom
        ];

        for (let n of neighbors) {
          let nr = video.pixels[n];
          let ng = video.pixels[n + 1];
          let nb = video.pixels[n + 2];
          let nBrightness = (nr + ng + nb) / 3;

          if (nBrightness < threshold - 40) {
            // tweak this gap for sensitivity
            hasDarkNeighbor = true;
            break;
          }
        }

        if (hasDarkNeighbor) {
          let scaledX = map(x, 0, video.width, 0, width);
          let scaledY = map(y, 0, video.height, 0, height);
          brightSpots.push({ x: scaledX, y: scaledY, brightness: brightness });
        }
      }
    }
  }

  // Sort by brightness descending
  brightSpots.sort((a, b) => b.brightness - a.brightness);
  let topSpots = brightSpots.slice(0, min(numSpots, brightSpots.length));

  // Draw connecting lines
  strokeWeight(2);
  stroke(0, 255, 0);
  noFill();
  for (let i = 0; i < topSpots.length; i++) {
    for (let j = i + 1; j < topSpots.length; j++) {
      line(topSpots[i].x, topSpots[i].y, topSpots[j].x, topSpots[j].y);
    }
  }

  // Draw red boxes at bright edge spots
  stroke(255, 0, 0);
  strokeWeight(4);
  noFill();
  for (let pt of topSpots) {
    rect(pt.x - 5, pt.y - 5, 100, 50);
  }
}

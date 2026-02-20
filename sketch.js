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

  for (let y = 0; y < video.height; y++) {
    for (let x = 0; x < video.width; x++) {
      let index = (x + y * video.width) * 4;

      let r = video.pixels[index];

      let g = video.pixels[index + 1];

      let b = video.pixels[index + 2];

      let brightness = (r + g + b) / 3;

      if (brightness > threshold) {
        let scaledX = map(x, 0, video.width, 0, width);

        let scaledY = map(y, 0, video.height, 0, height);

        brightSpots.push({
          x: scaledX,

          y: scaledY,

          brightness: brightness,
        });
      }
    }
  }

  // Sort by brightness descending

  brightSpots.sort((a, b) => b.brightness - a.brightness);

  // Take top N brightest spots

  let topSpots = brightSpots.slice(0, min(numSpots, brightSpots.length));

  // Draw connecting lines

  stroke(0, 255, 0);
  strokeWeight(2);

  noFill();

  for (let i = 0; i < topSpots.length; i++) {
    for (let j = i + 1; j < topSpots.length; j++) {
      line(topSpots[i].x, topSpots[i].y, topSpots[j].x, topSpots[j].y);
    }
  }

  // Draw red circles on bright spots

  stroke(255, 0, 0);
  strokeWeight(4);

  for (let pt of topSpots) {
    rect(pt.x, pt.y, 100, 50);
  }
}

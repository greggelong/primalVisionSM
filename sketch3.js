let video;
let cols = 8;
let rows = 10;
let edgeThreshold = 40;
let connectionMax = 150;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  // The stable setup that doesn't zoom
  let constraints = {
    video: { facingMode: "environment" },
    audio: false,
  };

  video = createCapture(constraints);
  video.hide();
}

function draw() {
  background(0);

  if (video.width < 10) return;

  // 1. Draw the video to fill the screen
  image(video, 0, 0, width, height);
  video.loadPixels();

  const vw = video.width;
  const vh = video.height;
  const px = video.pixels;

  // 2. THE ORIGINAL SOBEL MATH (Restored)
  let gray = new Uint8Array(vw * vh);
  for (let i = 0; i < vw * vh; i++) {
    let b = i * 4;
    gray[i] = (px[b] + px[b + 1] + px[b + 2]) / 3;
  }

  let gridSpots = [];
  let cellW = vw / cols;
  let cellH = vh / rows;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      let bestX = 0,
        bestY = 0,
        maxMag = 0;

      for (let y = floor(r * cellH) + 1; y < (r + 1) * cellH - 1; y += 2) {
        for (let x = floor(c * cellW) + 1; x < (c + 1) * cellW - 1; x += 2) {
          // --- THE ORIGINAL SOBEL KERNELS ---
          let gx =
            -gray[(y - 1) * vw + (x - 1)] +
            gray[(y - 1) * vw + (x + 1)] +
            -2 * gray[y * vw + (x - 1)] +
            2 * gray[y * vw + (x + 1)] +
            -gray[(y + 1) * vw + (x - 1)] +
            gray[(y + 1) * vw + (x + 1)];
          let gy =
            -gray[(y - 1) * vw + (x - 1)] -
            2 * gray[(y - 1) * vw + x] -
            gray[(y - 1) * vw + (x + 1)] +
            gray[(y + 1) * vw + (x - 1)] +
            2 * gray[(y + 1) * vw + x] +
            gray[(y + 1) * vw + (x + 1)];

          let magnitude = abs(gx) + abs(gy);
          if (magnitude > maxMag && magnitude > edgeThreshold) {
            maxMag = magnitude;
            bestX = x;
            bestY = y;
          }
        }
      }

      if (maxMag > 0) {
        gridSpots.push({
          // Map back to screen correctly
          x: map(bestX, 0, vw, 0, width),
          y: map(bestY, 0, vh, 0, height),
          id: c + "-" + r,
        });
      }
    }
  }

  // 3. THE ORIGINAL NEON DRAWING (Restored)
  blendMode(ADD);
  let pulse = map(sin(frameCount * 0.15), -1, 1, 0.4, 1.2);

  for (let i = 0; i < gridSpots.length; i++) {
    let pA = gridSpots[i];
    for (let j = i + 1; j < gridSpots.length; j++) {
      let pB = gridSpots[j];
      let d = dist(pA.x, pA.y, pB.x, pB.y);

      if (d < connectionMax) {
        let alpha = map(d, 0, connectionMax, 255, 50);
        // Outer Glow
        stroke(255, 0, 255, alpha * pulse * 0.3);
        strokeWeight(8);
        line(pA.x, pA.y, pB.x, pB.y);
        // Inner Core
        stroke(150, 255, 255, alpha * pulse);
        strokeWeight(2);
        line(pA.x, pA.y, pB.x, pB.y);
      }
    }
    // The Stars
    fill(255, 0, 255, 150 * pulse);
    ellipse(pA.x, pA.y, 12, 12);
    fill(255);
    ellipse(pA.x, pA.y, 5, 5);
  }
  blendMode(BLEND);

  // 4. Labels
  for (let pt of gridSpots) {
    drawLabel(`SIG:${pt.id}`, pt.x + 10, pt.y);
  }
}

function drawLabel(txt, x, y) {
  textFont("monospace");
  textSize(10);
  fill(0, 255, 255);
  text(txt, x, y);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

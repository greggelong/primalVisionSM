let video;
let cols = 8;
let rows = 6;
let edgeThreshold = 40;
let connectionMax = 150;

const vW = 360;
const vH = 640;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  // Setup video capture with the requested resolution
  video = createCapture({
    video: { facingMode: "environment", width: vW, height: vH },
    audio: false,
  });

  video.size(vW, vH);
  video.hide();
  video.elt.setAttribute("playsinline", ""); // Essential for mobile
}

function draw() {
  background(0);

  // --- 1. CALCULATE NATURAL SCALING (COVER) ---
  let screenRatio = width / height;
  let videoRatio = video.width / video.height;
  let drawW, drawH, drawX, drawY;

  if (videoRatio > screenRatio) {
    // Video is wider than the screen (landscape sensor on portrait screen)
    drawH = height;
    drawW = height * videoRatio;
    drawX = (width - drawW) / 2;
    drawY = 0;
  } else {
    // Video is taller than the screen
    drawW = width;
    drawH = width / videoRatio;
    drawX = 0;
    drawY = (height - drawH) / 2;
  }

  // Draw the video centered and cropped (Natural look)
  image(video, drawX, drawY, drawW, drawH);

  video.loadPixels();
  const vw = video.width;
  const vh = video.height;
  const px = video.pixels;

  if (px.length === 0) return; // Wait for video to load

  // 2. Grayscale Pass
  let gray = new Uint8Array(vw * vh);
  for (let i = 0; i < vw * vh; i++) {
    let b = i * 4;
    gray[i] = (px[b] + px[b + 1] + px[b + 2]) / 3;
  }

  // 3. Grid-Based Edge Detection
  let gridSpots = [];
  let cellW = vw / cols;
  let cellH = vh / rows;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      let bestX = 0,
        bestY = 0,
        maxMag = 0;

      for (let y = floor(r * cellH) + 1; y < (r + 1) * cellH - 1; y += 2) {
        // Step 2 for speed
        for (let x = floor(c * cellW) + 1; x < (c + 1) * cellW - 1; x += 2) {
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
          // MAP coordinates to the centered/scaled video boundaries
          x: map(bestX, 0, vw, drawX, drawX + drawW),
          y: map(bestY, 0, vh, drawY, drawY + drawH),
          id: c + "-" + r,
          strength: maxMag,
        });
      }
    }
  }

  // --- 4. HIGH VISIBILITY NEON CONSTELLATION ---
  blendMode(ADD);
  let pulse = map(sin(frameCount * 0.15), -1, 1, 0.4, 1.2);

  for (let i = 0; i < gridSpots.length; i++) {
    let pA = gridSpots[i];
    for (let j = i + 1; j < gridSpots.length; j++) {
      let pB = gridSpots[j];
      let d = dist(pA.x, pA.y, pB.x, pB.y);

      if (d < connectionMax) {
        let alpha = map(d, 0, connectionMax, 255, 50);
        stroke(255, 0, 255, alpha * pulse * 0.3);
        strokeWeight(8);
        line(pA.x, pA.y, pB.x, pB.y);
        stroke(150, 255, 255, alpha * pulse);
        strokeWeight(2);
        line(pA.x, pA.y, pB.x, pB.y);
      }
    }
    fill(255, 0, 255, 150 * pulse);
    ellipse(pA.x, pA.y, 12, 12);
    fill(255);
    ellipse(pA.x, pA.y, 5, 5);
  }

  blendMode(BLEND);
  for (let pt of gridSpots) {
    drawLabel(`BIO_SIG:${pt.id}`, pt.x + 10, pt.y);
  }
}

function drawLabel(txt, x, y) {
  textFont("monospace");
  textSize(11);
  textStyle(BOLD);
  fill(0);
  text(txt, x + 1, y + 1);
  fill(0, 255, 255);
  text(txt, x, y);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

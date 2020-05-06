// Sorting myself out

// Generative sketch done with p5js

// Pixelise an image (based in one of the examples in _Generative Design_) and
// sort each row by brighness

// https://www.mostlymaths.com/2020/05/sorting-myself-out.html/

var img;
var rectSize;
var colors = [];
var cnt = 0;
var tileCount = 100;
var lastCounter = tileCount - 1;
var fullLoop = 0;

function preload() {
    img = loadImage("rb.jpg");1
}

function setup() {
    // Load the image and generate the canvas. This expects a square image.
    // Would accept a non-square image but you'd be bombarded by error logs
    var canvas = createCanvas(700, 700);
    canvas.parent('canvas');
    img.loadPixels();
    rectSize = width / tileCount;
    var samplingSize = img.width / tileCount;

    for (var gridY = 0; gridY < tileCount; gridY++) {
        for (var gridX = 0; gridX < tileCount; gridX++) {
            var px = int(gridX * samplingSize);
            var py = int(gridY * samplingSize);
            var i = (py * img.width + px) * 4;
            var c = color(img.pixels[i], img.pixels[i + 1], img.pixels[i + 2], img.pixels[i + 3]);
            colors.push(c);
        }
    }

}

function total(c) {
    // Proxy for brightness, seems to be faster than p5js's brightness()
    return red(c) + blue(c) + green(c);
}

function sorted(row) {
    var mapped = row.map(total);
    for (var i = 0; i < mapped.length - 2; i++) {
        if (mapped[i] < mapped[i + 1]) {
            return false;
        }
    }
    return true;
}

function draw() {
    // Draw the image, as based on the colors array
    var i = 0;
    for (var gridY = 0; gridY < tileCount; gridY++) {
        for (var gridX = 0; gridX < tileCount; gridX++) {
            fill(colors[i]);
            rect(gridX * rectSize, gridY * rectSize, rectSize, rectSize);
            i++;
        }
    }

    if (cnt > 50) {
        // Wait for a few frames to do anything
        if (lastCounter == 0) {
            lastCounter = tileCount - 1;
            fullLoop += 1;
        }

        // Main loop. This is obviously not a sorting algorithm for speed, but
        // for the effect. Start at the last pixel in each row, and move it
        // forward if its "brightness" is larger than the previous one. Repeat
        // until all rows are sorted in such a way
        var sortedRows = 0;
        for (row = 0; row < tileCount; row++) {
            if (sorted(colors.slice(row * tileCount, row * tileCount + tileCount - 1))) {
                sortedRows++;
                continue;
            }
            var lastIndex = row * tileCount + lastCounter;
            var lastItem = colors[lastIndex];
            for (var iter = lastCounter - 1; iter >= 0; iter--) {
                currentIndex = row * tileCount + iter;
                var currentItem = colors[currentIndex];
                if (total(lastItem) > total(currentItem)) {
                    colors.splice(lastIndex, 1); // Remove the last item
                    colors.splice(currentIndex, 0, lastItem); // Place it ahead
                }
            }
        }
        lastCounter--;
        if (sortedRows == tileCount - 1) {
            console.log("Finished sorting");
            noLoop();
        }
    } else {
        cnt++;
    }
}

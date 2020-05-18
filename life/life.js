const gapX = 10
const gapY = 10
let rectSize = 10
let cells, rows, columns, cnt = 0
let stateMatrix = [], nextStateMatrix = []

// Simple and non-optimised (no hashlife) version of Conway's Game of Life. You
// can control cell size with i (increase) and d (decrease). Use c to toggle an
// overlay with the current cell size

p5.disableFriendlyErrors = true


function setup() {
    createCanvas(windowWidth, windowHeight)    
    frameRate(30)
    setupMatrix()
    randomise()
}

function setupMatrix(){
    // Prepares two empty arrays to store states (current and next)
    columns = int(windowWidth / rectSize)
    rows = int(windowHeight / rectSize)
    stateMatrix = Array(columns)
    nextStateMatrix = Array(columns)
    for (let i = 0; i < columns; i++) {
        stateMatrix[i] = Array(rows)
            .fill(0);
        nextStateMatrix[i] = Array(rows)
            .fill(0);
    }
    // Prepares a static indexer, somehow this runs faster on iOS Safari than 
    // usual for loops. Go figure
    cells = []
    for (j = 0; j < rows; j++) {
        for (i = 0; i < columns; i++) {
            cells.push([i, j])
        }
    }
}

function randomise(){
    // Randomise current state matrix
    for(cell of cells) {
        [i, j] = cell
        stateMatrix[i][j] = int(random(2))
    }
}


function glider(x, y) {
    // Draw a [glider](https://en.m.wikipedia.org/wiki/Glider_(Conway%27s_Life)) 
    // at the given (wrapped) coordinates
    const alive = [
        [5, 5],
        [6, 6],
        [4, 7],
        [5, 7],
        [6, 7]
    ];
    for (item of alive) {
        [i, j] = item;
        stateMatrix[mod(i + x, columns)][mod(j + y, rows)]  = 1;
    }
}

function mod(m, n) {
    // Javascript's modulo ain't no modulo
    return ((m % n) + n) % n
}

function nextState(i, j, matrix) {
    // Finds the next state of a cell according to its neighbours statuses
    let up, down, left, right, count = 0

    left = mod(i - 1, columns)
    right = mod(i + 1, columns)
    up = mod(j - 1, rows)
    down = mod(j + 1, rows)
    let nbd = [
        [left, up],
        [i, up],
        [right, up],
        [left, j],
        [right, j],
        [left, down],
        [i, down],
        [right, down]
    ]
    for (item of nbd) {
        [ii, jj] = item;
        count += matrix[ii][jj]
    }
    let self = matrix[i][j]
    if (self == 1) {
        if ((count == 2) || (count == 3)) {
            return 1
        }
    }
    if (self == 0) {
        if (count == 3) {
            return 1
        }
    }
    return 0;
}

function draw() {
    rectMode(CENTER);
    strokeWeight(2);
    stroke(60, 60, 30)
    for (cell of cells ) {
        [i, j] = cell
        push()
        translate(gapX / 2 + i * rectSize, gapY / 2 + j * rectSize)
        beginShape()
        if (stateMatrix[i][j] == 1) {
            fill(20, 20, 20)
        } else {
            fill(100, 100, 100)
        }
        nextStateMatrix[i][j] = nextState(i, j, stateMatrix)
        
        rect(0, 0, rectSize, rectSize)
        endShape();
        pop()
    }
    // Advance states and clean next
    for (cell of cells) {
        [i, j] = cell
        stateMatrix[i][j] = nextStateMatrix[i][j]
        nextStateMatrix[i][j] = 0
    }
}

function touchStarted(){
    // Touch to add a glider. Why not
    let i = int((mouseX-gapX)/rectSize)
    let j = int((mouseY-gapY)/rectSize)
    console.log(i, j)
    glider(i, j)
}

function keyReleased() {
    let gui = document.getElementById("gui")
    // Show current configuration overlay
    if (key.toLowerCase() == 'c') {
        let v = gui.style.visibility
        if(v == "hidden" || v == ""){
            gui.style.visibility = "visible"
        } else {
            gui.style.visibility = "hidden"
        }
    }
    // Increase cell size
    if (key.toLowerCase() == 'i') {
        rectSize++
        setupMatrix()
        randomise()
    }
    // Decrease cell size
    if (key.toLowerCase() == 'd') {
        if(rectSize>4){
            rectSize--
        }
        setupMatrix()
        randomise()
    }
    // Clear canvas and place a glider randomly
    if (key.toLowerCase() == 'g') {
        setupMatrix()
        glider(int(random(rows)), int(random(columns)))
    }

    gui.innerHTML = "rectSize: " + rectSize
}
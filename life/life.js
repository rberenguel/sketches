import { glider, nextState, mod } from './lifeCommon.js'

const gapX = 10
const gapY = 10
let rectSize = 10
let cells, rows, columns, cnt = 0
let stateMatrix = [],
    nextStateMatrix = []

// Simple and non-optimised (no hashlife) version of Conway's Game of Life. You
// can control cell size with i (increase) and d (decrease). Use c to toggle an
// overlay with the current cell size

const sketch = (s) => {
    s.disableFriendlyErrors = true

    s.setup = () => {
        s.createCanvas(s.windowWidth, s.windowHeight)
        s.frameRate(30)
        setupMatrix()
        randomise()
    }

    function setupMatrix() {
        // Prepares two empty arrays to store states (current and next)
        columns = s.int(s.windowWidth / rectSize)
        rows = s.int(s.windowHeight / rectSize)
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
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < columns; i++) {
                cells.push([i, j])
            }
        }
    }

    function randomise() {
        // Randomise current state matrix
        for (let cell of cells) {
            let [i, j] = cell
            stateMatrix[i][j] = s.int(s.random(2))
        }
    }

    s.draw = () => {
        s.rectMode(s.CENTER);
        s.strokeWeight(2);
        s.stroke(60, 60, 30)
        for (let cell of cells) {
            let [i, j] = cell
            s.push()
            s.translate(gapX / 2 + i * rectSize, gapY / 2 + j * rectSize)
            s.beginShape()
            if (stateMatrix[i][j] == 1) {
                s.fill(20, 20, 20)
            } else {
                s.fill(100, 100, 100)
            }
            nextStateMatrix[i][j] = nextState(i, j, stateMatrix, rows, columns)

            s.rect(0, 0, rectSize, rectSize)
            s.endShape();
            s.pop()
        }
        // Advance states and clean next
        for (let cell of cells) {
            let [i, j] = cell
            stateMatrix[i][j] = nextStateMatrix[i][j]
            nextStateMatrix[i][j] = 0
        }
    }

    s.touchStarted = () => {
        // Touch to add a glider. Why not
        let i = s.int(s.mouseX/rectSize)
        let j = s.int(s.mouseY/rectSize)
        glider(i, j, stateMatrix, rows, columns)
    }

    s.keyReleased = () => {
        let gui = document.getElementById("gui")
        // Show current configuration overlay
        if (s.key.toLowerCase() == 'c') {
            let v = gui.style.visibility
            if (v == "hidden" || v == "") {
                gui.style.visibility = "visible"
            } else {
                gui.style.visibility = "hidden"
            }
        }
        // Increase cell size
        if (s.key.toLowerCase() == 'i') {
            rectSize++
            setupMatrix()
            randomise()
        }
        // Decrease cell size
        if (s.key.toLowerCase() == 'd') {
            if (rectSize > 4) {
                rectSize--
            }
            setupMatrix()
            randomise()
        }
        // Clear canvas and place a glider randomly
        if (s.key.toLowerCase() == 'g') {
            setupMatrix()
            glider(s.int(s.random(rows)), s.int(s.random(columns)), stateMatrix, rows, columns)
        }

        gui.innerHTML = "rectSize: " + rectSize
    }
}

let p5sketch = new p5(sketch)


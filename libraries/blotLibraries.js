export {
    paintPalette,
    drawCloud,
    canvasUpdate,
    createBlots,
    drawBlot,
    blotPtsInMesh
}

function paintPalette(s) {
    s.colorMode(s.RGB)
    let orange = s.color(236, 111, 68)
    let yellow = s.color(241, 210, 73)
    let blue = s.color(69, 154, 243)
    let green = s.color(70, 153, 57)
    let red = s.color(203, 43, 45)
    let pink = s.color(196, 69, 152)
    let gray = s.color(103, 122, 130)
    let black = s.color(0, 0, 0)
    return [blue, yellow, green, red, gray, orange, black, pink]
}

function drawCloud(drawing, blots, ink) {
    let {
        s,
        canvas,
        background,
        paint
    } = drawing
    let {
        blotPointsArray,
        blotPoints
    } = blots
    performance.mark("drawCloud")
    canvas.beginShape(s.POINTS)
    for (let b = 0; b < blotPoints; b++) {
        let [i, j, k] = blotPointsArray[b]
        let smoother = (k - 0.4) / 0.08
        let lerped = s.lerpColor(s.color(0, 0, 0, 0), ink, smoother)
        canvas.stroke(lerped)
        canvas.point(i, j)
    }
    canvas.endShape()
    canvasUpdate(drawing)
    performance.measure("drawCloudEnded", "drawCloud")
}

function transparentUpdate(s, canvas, background) {
    s.clear()
    s.noTint()
    s.background(background)
    s.tint(255, 120)
    let contained = canvas.get()
    s.image(contained, 0, 0)
}

function backgroundUpdate(s, canvas, background) {
    s.noTint()
    s.background(background)
    s.image(canvas, 0, 0)
}

function canvasUpdate(drawing) {
    let {
        s,
        canvas,
        background,
        paint
    } = drawing

    if (paint == 1) {
        backgroundUpdate(s, canvas, background)
    } else if (paint == 2) {
        transparentUpdate(s, canvas, background)
    } else {
        s.noTint()
        s.background(s.color(255, 255, 255, 255))
        s.image(canvas, 0, 0)
    }

}

function createBlots(s, cx, cy, blotCount, blotStrength, spread) {
    let blots = []
    for (let i = 0; i < blotCount; i++) {
        let x = s.randomGaussian(cx, spread)
        let y = s.randomGaussian(cy, spread)
        let a = s.random(10, 30)
        let b = s.random(5, 10)
        let vx = cx - x
        let vy = cy - y
        let r = vx * vx + vy * vy
        let size = blotStrength / (r + 1) //was s.width
        blots.push([x, y, a * a, b * b, s.sqrt(size), vx / s.sqrt(r), vy / s
            .sqrt(r)
        ])
    }
    return blots
}

function drawBlot(drawing, cx, cy, ink, meshes, blotSettings) {

    performance.mark("drawBlot")
    let {
        mesh,
        blotPointsArray
    } = meshes
    let {
        blotCount,
        blotStrength,
        blotSpread,
        vectors
    } = blotSettings
    let blot = createBlots(drawing.s, cx, cy, blotCount, blotStrength, blotSpread)
    let blotPoints = blotPtsInMesh(cx, cy, mesh, blot, blotPointsArray)
    drawCloud(drawing, {
        blotPointsArray,
        blotPoints
    }, ink)
    if (vectors)
        drawVectors(drawing.s, blot)
    performance.measure("drawBlotEnded", "drawBlot")

}


function blotPtsInMesh(cx, cy, msh, blots, blotPointsArray) {
    performance.mark("blotPtsInMesh")
    let blotPoints = 0
    for (let px of msh) {
        let potential = 0
        let [i, j] = px
        i = i + cx - 200
        j = j + cy - 200
        for (let blot of blots) {
            let [blotx, bloty, a2, b2, sqrtSize, vx, vy] = blot
            let x = i - blotx
            let y = j - bloty
            let xx = x * vx + y * vy
            let yy = x * vy - y * vx
            let r = xx * xx / a2 + yy * yy / b2
            potential += sqrtSize / r
        }
        let adjusted = potential * Math.sqrt(potential)
        let inBlot = adjusted < 0.4 ? false : true
        if (inBlot) {
            blotPointsArray[blotPoints] = [i, j, adjusted]
            blotPoints++
        }
    }
    performance.measure("blotPtsInMeshEnded", "blotPtsInMesh")
    return blotPoints
}

function drawVectors(s, blots) {
    for (let blot of blots) {
        let [blotx, bloty, a, b, size, vx, vy] = blot
        s.beginShape()
        s.strokeWeight(2)
        s.stroke(150, 100, 150)
        s.vertex(blotx, bloty)
        let endx = blotx + 20 * vx
        let endy = bloty + 20 * vy
        s.vertex(endx, endy)
        s.endShape()
        s.beginShape()
        s.circle(endx, endy, 3)
        s.endShape()
    }
}

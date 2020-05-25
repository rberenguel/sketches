export {
    colorKmeans
}

/**
Naive k-means. It is fast enough even for large images
*/

function colorKmeans(colors, numClusters) {
    let centroids = []
    for (let i = 0; i < numClusters; i++) {
        let index = Math.floor(Math.random() * colors.length)
        centroids.push(colors[index])
    }
    let assignments
    for (let k = 0; k < 10; k++) {
        assignments = Array(centroids.length)
        let newCentroids = []
        for (let i = 0; i < assignments.length; i++) assignments[i] = []
        let sumDist = 0
        for (let col of colors) {
            let minn = 255 * 3
            let minIndex
            let [r, g, b] = col
            for (let c = 0; c < centroids.length; c++) {
                let [cr, cg, cb] = centroids[c]
                let dist = Math.abs(cr - r) + Math.abs(cg - g) + Math.abs(cb -
                    b)
                if (dist < minn) {
                    minn = dist
                    minIndex = c
                }
            }
            assignments[minIndex].push(col)
        }
        let remainingCentroids = []
        for (let c = 0; c < assignments.length; c++) {
            if (assignments[c].length > 0) {
                remainingCentroids.push(centroids[c])

            }
        }
        for (let c = 0; c < assignments.length; c++) {
            if (assignments[c].length > 0) {
                newCentroids.push(averageColor(assignments[c]))
            }
        }
        for (let c = 0; c < remainingCentroids.length; c++) {
            let [cr, cg, cb] = remainingCentroids[c]
            let [r, g, b] = newCentroids[c]

            sumDist += Math.abs(cr - r) + Math.abs(cg - g) + Math.abs(cb - b)
            remainingCentroids[c][0] = r
            remainingCentroids[c][1] = g
            remainingCentroids[c][2] = b
            remainingCentroids[c][3] = assignments[c].length
        }
        centroids = remainingCentroids

        if (sumDist < 100) {
            break;
        }
    }
    let closestColors = []
    for (let c = 0; c < centroids.length; c++) {
        let minDist = 3 * 255
        let closestColor = centroids[c]
        let [cr, cg, cb] = centroids[c]
        for (let col of assignments[c]) {
            let [r, g, b] = col
            let dist = Math.abs(cr - r) + Math.abs(cg - g) + Math.abs(cb - b)
            if (dist < minDist) {
                minDist = dist
                closestColor = col
            }
        }
        closestColors.push(closestColor)
    }
    return [centroids, closestColors]
}

function averageColor(arr) {
    let mR = arr[0][0],
        mG = arr[0][1],
        mB = arr[0][2]
    for (let c = 1; c < arr.length; c++) {
        let col = arr[c]
        let [r, g, b] = col
        mR += (r - mR) / c
        mG += (g - mG) / c
        mB += (b - mB) / c
    }
    return [Math.floor(mR), Math.floor(mG), Math.floor(mB)]
}
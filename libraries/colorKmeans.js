/*jshint esversion: 6 */
/*jshint asi: true*/
export {
    colorKmeans
}

/**
Naive k-means. It is fast enough even for large images
*/
function colorKmeans(colors, numClusters, error = 50, seed) {
    let centroids = []
    for (let i = 0; i < numClusters; i++) {
        let index = Math.floor(Math.random() * colors.length)
        if(seed === undefined)
           centroids.push(colors[index])
        else{
          if(i<seed.length){
            centroids.push(seed[i]) 
          }
          else
            centroids.push(colors[index])
           }
    }
    let remainingCentroids;
    let newCentroidsI;
    let newCentroids = new Array(centroids.length)
    let assignments = new Array(centroids.length)
    for (let k = 0; k < centroids.length; k++) {
        assignments[k] = new Array(colors.length)
            .fill([]) // Trade speed for memory
    }
    let assignmentsI = new Array(centroids.length)
    for (let k = 0; k < 100; k++) {
        assignmentsI = assignmentsI.fill(0)
        let sumDist = 0
        for (let col of colors) {
            let minn = 255 * 3
            let minIndex;
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
            assignments[minIndex][assignmentsI[minIndex]] = col
            assignmentsI[minIndex] = assignmentsI[minIndex] + 1
        }
        newCentroidsI = 0
        remainingCentroids = 0
        for (let c = 0; c < assignments.length; c++) {
            if (assignmentsI[c] > 0) {
                centroids[remainingCentroids] = centroids[c]
                remainingCentroids++
            }
        }
        for (let c = 0; c < assignments.length; c++) {
            if (assignmentsI[c] > 0) {
                newCentroids[newCentroidsI] = averageColor(assignments[c],
                    assignmentsI[c])
                newCentroidsI++
            }
        }
        for (let c = 0; c < remainingCentroids; c++) {
            let [cr, cg, cb] = centroids[c]
            let [r, g, b] = newCentroids[c]

            sumDist += Math.abs(cr - r) + Math.abs(cg - g) + Math.abs(cb - b)
            centroids[c][0] = r
            centroids[c][1] = g
            centroids[c][2] = b
            centroids[c][3] = assignmentsI[c]
        }

        if (sumDist < error) {
            break;
        }
    }
    let closestColors = []
    for (let c = 0; c < remainingCentroids; c++) {
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
    return [centroids.slice(0, remainingCentroids), closestColors]
}

function averageColor(arr, length) {
    let mR = arr[0][0],
        mG = arr[0][1],
        mB = arr[0][2]
    for (let c = 1; c < length; c++) {
        let col = arr[c]
        let [r, g, b] = col
        mR += (r - mR) / c
        mG += (g - mG) / c
        mB += (b - mB) / c
    }
    return [Math.floor(mR), Math.floor(mG), Math.floor(mB)]
}
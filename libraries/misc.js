export { getLargeCanvas, mod, argMax , releaseCanvas}

function getLargeCanvas(s, maxSide){
    let w = s.windowWidth, h = s.windowHeight
    if(Math.max(w, h)<=maxSide) return {w: w, h: h}
    if(w>=h){
        // Landscape
        return {w: maxSide, h: Math.floor(maxSide*h/(1.0*w))}
    }
    if(h>w){
        // Portrait
        return {w: Math.floor(maxSide*w/(1.0*h)), h: maxSide}
    }
}

function mod(m, n) {
    // Javascript's modulo ain't no modulo
    return ((m % n) + n) % n
}

    function argMax(arr){
        let max = 0
        let ind = -1
        for(let i=0;i<arr.length;i++){
            if(arr[i]>max){
                ind = i
                max = arr[i]
            }
        }
        return ind
    }

  function releaseCanvas(canvas) {
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.drawingContext;
    ctx && ctx.clearRect(0, 0, 1, 1);
  }
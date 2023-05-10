export {
  easeInSq, easeInSqr
}

function easeInSq(x){
  return 1 - Math.sqrt(1 - x*x);
}

function easeInSqr(x){
  return 1 - x*x;
}
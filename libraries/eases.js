export {
  easeInSq
}

function easeInSq(x){
  return 1 - Math.sqrt(1 - x*x);
}
  
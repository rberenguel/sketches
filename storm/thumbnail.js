(function () {
  const sources = ["storm/thumbs/lightning.png", "storm/thumbs/storm.png"];
  let index = 0;

  function updateImage() {
    const img = document.getElementById("storm-thumb");
    if (!img) return; // Element might not be loaded yet or id mismatch

    // Preload next image
    const nextIndex = (index + 1) % sources.length;
    const nextImg = new Image();
    nextImg.src = sources[nextIndex];

    // Fade out logic could go here if we had CSS transitions on src,
    // but for simple source swap we just swap.
    // User requested "smooth transition", so we might need CSS assistance in main index.

    // Actually, to do a smooth transition on a single IMG tag is hard without double buffering.
    // However, if we just swap src, it's an instant cut.
    // User asked for "smooth transition".
    // Let's use a simple opacity fade approach if possible, but we are inside the main index.
    // simpler approach: just toggle class or standard src swap if "smooth" means "automated".

    // "smooth transition every 10 seconds" -> user requested smoother.
    // increasing duration to 2s.

    img.style.transition = "opacity 2.0s ease-in-out";
    img.style.opacity = 0;

    setTimeout(() => {
      index = nextIndex;
      img.src = sources[index];
      img.onload = () => {
        img.style.opacity = 1;
      };
    }, 2000); // Wait for fade out (matches transition time)
  }

  setInterval(updateImage, 10000);
})();

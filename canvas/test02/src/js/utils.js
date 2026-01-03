const fscreen = require("fscreen");

module.exports = {
  adjustSize: (element) => {
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    if (element.width != width) element.width = width;
    if (element.height != height) element.height = height;
    return [width, height];
  },
  toggleFullscreen: () => {
    const element = document.querySelector("body");
    if (fscreen.fullscreenElement !== null) {
      console.log('Fullscreen mode');
      fscreen.exitFullscreen();
    } else {
      console.log('Not fullscreen mode');
      fscreen.requestFullscreen(element);
    }
  }
};


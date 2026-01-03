function redraw() {
    // Resize
    console.log('resize');
    const one = document.getElementById('one');
    console.log(one);
    // Redraw table
    redrawTable();
}
function onLoad() {
    console.log('onLoad');
    redraw();
    window.addEventListener('resize', redraw);
}

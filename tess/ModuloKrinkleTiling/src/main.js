import { Renderer } from './renderer.js';
import { KrinkleGenerator } from './krinkle.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Canvas
    const canvas = document.getElementById('tiling-canvas');
    const ctx = canvas.getContext('2d');
    const renderer = new Renderer(canvas, ctx);

    // 2. Setup Logic
    const generator = new KrinkleGenerator();

    // 3. UI Elements
    const inputMod = document.getElementById('param-mod');
    const inputA = document.getElementById('param-a');
    const inputB = document.getElementById('param-b');
    const inputC = document.getElementById('param-c');
    const btnUpdate = document.getElementById('btn-update');
    const statusText = document.getElementById('status-text');

    function updateTiling() {
        const M = parseInt(inputMod.value, 10) || 7;
        const A = parseInt(inputA.value, 10) || 1;
        const B = parseInt(inputB.value, 10) || 1;
        const C = parseInt(inputC.value, 10) || 1;

        console.log("Updating...", { M, A, B, C });
        statusText.textContent = "Generating...";

        requestAnimationFrame(() => {
            const polygons = generator.generate(M, A, B, C);
            renderer.setDisplayData(polygons);
            statusText.textContent = `Generated ${polygons.length} polygons`;
        });
    }

    // 4. Event Listeners
    btnUpdate.addEventListener('click', updateTiling);

    // Initial draw
    updateTiling();
});

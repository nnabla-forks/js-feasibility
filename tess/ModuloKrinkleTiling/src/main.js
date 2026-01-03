import { Renderer } from './renderer.js';
import { KrinkleGenerator } from './krinkle.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tiling-canvas');
    const ctx = canvas.getContext('2d');
    const renderer = new Renderer(canvas, ctx);
    const generator = new KrinkleGenerator();

    // UI Elements
    // Note: Parameter mapping
    // UI Label: Modulo (M) -> k in code
    // UI Label: Param A    -> m in code
    // UI Label: Param B    -> n in code
    const inputK = document.getElementById('param-mod');
    const inputM = document.getElementById('param-a');
    const inputN = document.getElementById('param-b');

    // Unused for now
    const inputC = document.getElementById('param-c');
    inputC.parentElement.style.opacity = '0.5'; // Visual cue
    inputC.disabled = true;

    const btnUpdate = document.getElementById('btn-update');
    const statusText = document.getElementById('status-text');

    function updateTiling() {
        const k = parseInt(inputK.value, 10);
        const m = parseInt(inputM.value, 10);
        const n = parseInt(inputN.value, 10);

        // Validation display
        if (n < k) {
            statusText.textContent = "Error: B (n) must be >= Modulo (k)";
            statusText.style.color = "#ff6b6b";
            return;
        }

        statusText.style.color = "#8b949e";
        statusText.textContent = "Generating Prototile...";

        requestAnimationFrame(() => {
            const polygons = generator.generatePrototile(m, k, n);
            renderer.setDisplayData(polygons);

            // Auto-center on the first polygon (Prototile)
            if (polygons.length > 0) {
                renderer.autoCenter(polygons[0]);
            }

            const error = polygons[0]?.meta?.closureError || 0;
            statusText.textContent = `Generated. Closure Error: ${error.toFixed(5)}`;
        });
    }

    btnUpdate.addEventListener('click', updateTiling);

    // Initial draw
    updateTiling();
});

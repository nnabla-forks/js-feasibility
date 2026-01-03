/**
 * Modulo Krinkle Tiling Logic
 * Based on "Modulo Krinkle Tiling" (arXiv:2506.07638)
 */

export class KrinkleGenerator {
    constructor() {
        this.polygons = [];
    }

    /**
     * Generates the tiling geometry based on parameters.
     * @param {number} M - Parameter m (step size)
     * @param {number} K - Parameter k (modulus, sequence length)
     * @param {number} N - Parameter n (total symmetry)
     * @param {number} [A] - Unused in standard algorithm, kept for API compatibility or extensions
     */
    generate(M, A, B, C) {
        // Map UI parameters to Paper parameters
        // UI: Modulo(M), A, B, C
        // Paper: m, k, n
        // Let's assume:
        // UI M -> Paper k
        // UI A -> Paper m (step)
        // UI B -> Paper n (symmetry)
        // This mapping makes sense: M is usually "modulus".

        const k = M;
        const m = A;
        const n = B;
        // C is unused for now, maybe offset parameter?

        console.log(`Generating tiling with m=${m}, k=${k}, n=${n}`);
        this.polygons = [];

        if (n < k) {
            console.warn("n must be >= k for valid tiling");
            // return []; // or try anyway
        }

        // 1. Generate Prototile Sequences for Wedge 0
        // l_j = (j * m) % k
        // Sequence has length k (0 to k-1). Edges.

        const l_seq_base = [];
        for (let j = 0; j < k; j++) {
            l_seq_base.push((j * m) % k);
        }

        // u_seq (Upper) for Wedge 0
        // "obtained from l0j by replacing each occurrence of 0 with k"
        // Note: l_seq contains directions.
        const u_seq_base = l_seq_base.map(dir => dir === 0 ? k : dir);

        // Helper to get vector from direction index
        const getVector = (dirIndex) => {
            const angle = (dirIndex * 2 * Math.PI) / n;
            return {
                x: Math.cos(angle),
                y: Math.sin(angle)
            };
        };

        // Helper to construct Wedge i polygon relative to its origin
        const createWedgePolygon = (i) => {
            // l^i is l^0 + i
            const l_seq_i = l_seq_base.map(d => d + i);
            // u^i is u^0 + i
            const u_seq_i = u_seq_base.map(d => d + i);

            // Construct path
            // Start at (0,0)
            const path = [{ x: 0, y: 0 }];
            let current = { x: 0, y: 0 };

            // Forward along Lower Boundary (l_seq_i)
            for (let d of l_seq_i) {
                const v = getVector(d);
                current = { x: current.x + v.x, y: current.y + v.y };
                path.push(current);
            }

            // Backward along Upper Boundary (u_seq_i)
            // trace u_seq from origin, then reverse points? 
            // Or just trace back from current using -u_seq vectors?
            // Since they close, we can trace back.
            // u_seq_i corresponds to the upper boundary running OUT from origin.
            // So we want to go IN towards origin.
            // Reverse u_seq and negate vectors.

            const u_seq_rev = [...u_seq_i].reverse();
            for (let d of u_seq_rev) {
                const v = getVector(d);
                // Subtract vector
                current = { x: current.x - v.x, y: current.y - v.y };
                path.push(current);
            }

            // Last point should be close to 0,0. Clamp it?

            return {
                path: path,
                color: `hsl(${(i * 360 / n)}, 70%, 50%)`,
                stroke: '#000000'
            };
        }

        // 2. Tiling Process
        // Maintain "Front" sequence of directions
        // Initial front is u_seq of Wedge 0 repeated?
        // Actually, we just need a buffer large enough.
        // Let's create a dynamic front array.
        let front = [...u_seq_base];

        // We need to place Wedges 0 to N-1 (or just enough to fill?)
        // Paper says "continue placing until wedge index reaches k (no offset) or n/2 (offset)".
        // Then rotate/copy.
        // Let's try placing ALL n wedges if possible, or just follow the front.

        const totalWedges = n; // Try to fill circle
        const placedWedges = [];

        // Place Wedge 0
        const w0 = createWedgePolygon(0);
        this.polygons.push(w0);

        // Track current front position relative to world origin?
        // No, we track the 'front' sequence of directions.
        // But we need to know WHERE the wedge starts in world coordinates.
        // We know Wedge 0 starts at 0,0.

        // We need to track the vertices of the Front Path to know the start point coordinates.
        // Let's keep a list of segment vectors for the front?
        // Or just re-calculate position by summing front vectors.

        // Optimization: Keep front as logic sequence, but walk it to find pos.

        for (let i = 1; i < totalWedges; i++) {
            // Find first occurrence of direction 'i' in front
            const idx = front.indexOf(i);

            if (idx === -1) {
                console.warn(`Direction ${i} not found in front. Tiling may be incomplete or parameters invalid.`);
                break;
            }

            // Calculate start position: Sum of front vectors up to idx
            let startX = 0;
            let startY = 0;
            for (let j = 0; j < idx; j++) {
                const v = getVector(front[j]);
                startX += v.x;
                startY += v.y;
            }

            // Create Wedge i
            const wPoly = createWedgePolygon(i);

            // Translate Wedge i to startPos
            const translatedPath = wPoly.path.map(p => ({
                x: p.x + startX,
                y: p.y + startY
            }));

            this.polygons.push({
                path: translatedPath,
                color: wPoly.color,
                stroke: wPoly.stroke
            });

            // Update Front
            // We replace the segment at idx (length 1? or length k?)
            // "aligns its base edge with the first edge in the front that points in direction i"
            // Base edge is the *first segment* of the lower path. l_seq has k segments.
            // But only the *first* one is called "base edge".
            // So we consume 1 edge from Front (the one with dir 'i').
            // And we insert the "Upper" boundary of the new wedge?
            // Wedge i: Lower boundary l^i. Upper u^i.
            // l^i starts with 'i'. Matches front[idx].
            // But l^i has other edges too.
            // Does the new wedge Overwrite the front?
            // "Remarkably, its entire lower boundary aligns exactly with the current front"
            // This means Front[idx ... idx + k - 1] MUST MATCH l^i.
            // So we allow removing k segments from front, and replacing them with u^i.

            // Let's verify if Front has enough length
            // If front is not long enough, extend it? 
            // Since front is periodic (?), we can generate more if needed.
            // But for finite tiling, we just extend based on u^0 logic?
            // Actually, u_seq_base is length k. Initial front is length k.
            // If we need index > k, we might run out.
            // BUT, usually we tile around the center.
            // Let's extend front periodically if needed?
            // Or maybe the logic implies we only ever look at available front.

            // Wait, "Front direction sequence after placing wedge i... (fji)".
            // (fj0) = (u0j). Infinite periodic.
            // So "front" array should be conceptualized as infinite. 
            // We can generate terms on demand: u_seq_base repeated.

            // For implementation, let's keep a buffer and extend it if idx + k > length.
            while (idx + k > front.length) {
                // How to extend? 
                // The logical front is periodic? 
                // Initial front is periodic repetition of u0.
                // But as we modify it, it loses simple periodicity?
                // Prop 6.8: (f_j^i) = (s^{i+1}_j).
                // s sequence satisfies C(i).
                // It suggests the front structure is well-defined.
                // For now, let's just assume we replicate the initial u0 pattern if we run out, 
                // BUT realizing that we modified the beginning, so we can't just copy the beginning.
                // Wait, the "unmodified" tail of the front should still be the original sequence.
                // So we can append u0 terms.
                front.push(...u_seq_base);
            }

            // Verify match (optional, but good for debug)
            /*
            const l_seq_i = l_seq_base.map(d => (d + i)); // mod n? No, directions just increase
            // Note: l sequence values are modulo k in generation, but here we add i.
            // Actually, l_seq_base values are 0..k-1.
            // l_seq_i values are i..i+k-1.
            // Front values should match.
            */

            // Replace k items at idx with u^i
            // u^i = u_seq_base + i
            const u_seq_i = u_seq_base.map(d => d + i);

            front.splice(idx, k, ...u_seq_i);
        }

        return this.polygons;
    }
}

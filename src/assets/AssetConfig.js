/**
 * AssetConfig - Maps pet species to their 3D model files and render types
 * @module assets/AssetConfig
 * 
 * Each pet species maps to either:
 * - A GLB/glTF 3D model file (browser-rendered with Three.js)
 * - null (uses Canvas2D fallback renderer)
 */
const AssetConfig = {
    /** Pets with GLB/glTF 3D models */
    models: {
        dog: {
            type: 'glb',
            path: 'assets/models/dog/source/baby%20dog.glb',
            scale: 1.5,
            position: { x: 0, y: -0.5, z: 0 },
            rotation: { x: 0, y: Math.PI, z: 0 },
            animation: 'idle' // default animation name
        },
        duck: {
            type: 'gltf',
            path: 'assets/models/duck/source/scene/scene.gltf',
            scale: 2.0,
            position: { x: 0, y: -0.8, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            animation: null
        },
        fox: {
            type: 'gltf',
            path: 'assets/models/fox/source/baller_fox_redux/scene.gltf',
            scale: 1.8,
            position: { x: 0, y: -0.6, z: 0 },
            rotation: { x: 0, y: Math.PI, z: 0 },
            animation: null
        }
    },

    /** Pets using Canvas2D renderer (no 3D model yet) */
    canvasFallback: ['cat', 'bunny', 'dragon', 'penguin', 'meowl'],

    /**
     * Check if a species has a 3D model
     * @param {string} species
     * @returns {boolean}
     */
    hasModel(species) {
        return species in this.models;
    },

    /**
     * Get model config for a species
     * @param {string} species
     * @returns {Object|null}
     */
    getModelConfig(species) {
        return this.models[species] || null;
    }
};

export default AssetConfig;
</｜｜DSML｜｜parameter>
</invoke>
</｜｜DSML｜｜tool_calls>

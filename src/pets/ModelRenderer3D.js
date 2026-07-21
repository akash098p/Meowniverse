/**
 * ModelRenderer3D - Three.js 3D model renderer for pets
 * @module pets/ModelRenderer3D
 * 
 * Loads and renders GLB/glTF 3D models with animations,
 * lighting, and interactive behavior.
 * 
 * Uses Three.js from CDN via importmap in index.html.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import AssetConfig from '../assets/AssetConfig.js';

class ModelRenderer3D {
    /**
     * @param {HTMLCanvasElement|HTMLDivElement} container - Canvas or div to render into
     * @param {Pet} pet - Pet instance
     */
    constructor(container, pet) {
        this.container = container;
        this.pet = pet;
        this.model = null;
        this.mixer = null;
        this.animations = {};
        this.currentAction = null;
        this.clock = new THREE.Clock();
        this.animationId = null;
        this.isPetting = false;
        this.petTimer = 0;

        // Get model config
        const species = pet?.species || 'dog';
        this.modelConfig = AssetConfig.getModelConfig(species);

        if (!this.modelConfig) {
            console.warn(`[ModelRenderer3D] No model config for ${species}`);
            return;
        }

        this.#initScene();
        this.#loadModel();
        this.#startAnimation();
    }

    /**
     * Initialize Three.js scene, camera, renderer
     */
    #initScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = null; // transparent

        // Camera
        const rect = this.container.getBoundingClientRect();
        const aspect = (rect.width || 240) / (rect.height || 240);
        this.camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 100);
        this.camera.position.set(0, 1, 4);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(rect.width || 240, rect.height || 240);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Append renderer to container
        if (this.container.tagName === 'CANVAS') {
            // Replace canvas with renderer's canvas
            this.container.parentNode?.insertBefore(this.renderer.domElement, this.container);
            this.container.remove();
            this.container = this.renderer.domElement;
        } else {
            this.container.appendChild(this.renderer.domElement);
        }

        // Lighting
        this.#setupLighting();

        // Ground shadow
        this.#setupGround();

        // Handle resize
        this.#handleResize();
    }

    /**
     * Set up scene lighting
     */
    #setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.camera.near = 0.1;
        mainLight.shadow.camera.far = 20;
        mainLight.shadow.camera.left = -5;
        mainLight.shadow.camera.right = 5;
        mainLight.shadow.camera.top = 5;
        mainLight.shadow.camera.bottom = -5;
        this.scene.add(mainLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffccaa, 0.5);
        fillLight.position.set(-3, 2, 4);
        this.scene.add(fillLight);

        // Rim light
        const rimLight = new THREE.DirectionalLight(0x88ccff, 0.3);
        rimLight.position.set(0, 2, -5);
        this.scene.add(rimLight);

        // Soft hemisphere light
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
        this.scene.add(hemiLight);
    }

    /**
     * Set up ground plane for shadows
     */
    #setupGround() {
        const groundGeo = new THREE.PlaneGeometry(6, 6);
        const groundMat = new THREE.ShadowMaterial({
            opacity: 0.3,
            color: 0x000000
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Decorative circle
        const circleGeo = new THREE.RingGeometry(0.4, 0.6, 32);
        const circleMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide
        });
        const circle = new THREE.Mesh(circleGeo, circleMat);
        circle.rotation.x = -Math.PI / 2;
        circle.position.y = -0.49;
        this.scene.add(circle);
    }

    /**
     * Load 3D model from GLB/glTF file
     */
    #loadModel() {
        const loader = new GLTFLoader();
        const path = this.modelConfig.path;

        loader.load(
            path,
            (gltf) => {
                this.model = gltf.scene;
                this.model.scale.set(
                    this.modelConfig.scale,
                    this.modelConfig.scale,
                    this.modelConfig.scale
                );
                this.model.position.set(
                    this.modelConfig.position.x,
                    this.modelConfig.position.y,
                    this.modelConfig.position.z
                );
                this.model.rotation.set(
                    this.modelConfig.rotation.x,
                    this.modelConfig.rotation.y,
                    this.modelConfig.rotation.z
                );

                // Enable shadows
                this.model.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });

                this.scene.add(this.model);

                // Set up animations
                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(this.model);
                    gltf.animations.forEach((clip) => {
                        const action = this.mixer.clipAction(clip);
                        this.animations[clip.name] = action;
                    });

                    // Play default animation
                    const defaultAnim = this.modelConfig.animation || 
                        Object.keys(this.animations)[0];
                    if (defaultAnim && this.animations[defaultAnim]) {
                        this.currentAction = this.animations[defaultAnim];
                        this.currentAction.play();
                    }
                }

                console.log(`[ModelRenderer3D] Loaded ${this.pet?.species} model`);
            },
            (xhr) => {
                // Progress callback (optional)
                const progress = (xhr.loaded / xhr.total) * 100;
                if (progress < 100) {
                    console.log(`[ModelRenderer3D] Loading: ${Math.round(progress)}%`);
                }
            },
            (error) => {
                console.error(`[ModelRenderer3D] Failed to load model for ${this.pet?.species}:`, error);
            }
        );
    }

    /**
     * Handle resize
     */
    #handleResize() {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    this.camera.aspect = width / height;
                    this.camera.updateProjectionMatrix();
                    this.renderer.setSize(width, height);
                }
            }
        });
        resizeObserver.observe(this.container);
        this._resizeObserver = resizeObserver;
    }

    /**
     * Start animation loop
     */
    #startAnimation() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);

            const delta = this.clock.getDelta();

            // Update animation mixer
            if (this.mixer) {
                this.mixer.update(delta);
            }

            // Gentle floating animation
            if (this.model && !this.isPetting) {
                const floatY = Math.sin(Date.now() * 0.002) * 0.03;
                this.model.position.y = this.modelConfig.position.y + floatY;
                
                // Subtle rotation
                this.model.rotation.y += delta * 0.2;
            }

            // Petting animation
            if (this.isPetting) {
                this.petTimer -= delta;
                if (this.model) {
                    const bounce = Math.sin(Date.now() * 0.01) * 0.05;
                    this.model.position.y = this.modelConfig.position.y + bounce + 0.1;
                    this.model.rotation.z = Math.sin(Date.now() * 0.005) * 0.05;
                }
                if (this.petTimer <= 0) {
                    this.isPetting = false;
                }
            }

            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }

    /**
     * Play a petting animation
     */
    pet() {
        this.isPetting = true;
        this.petTimer = 1.5;
        
        // Play a different animation if available
        if (this.animations['play'] || this.animations['walk']) {
            const animName = this.animations['play'] ? 'play' : 'walk';
            if (this.currentAction !== this.animations[animName]) {
                if (this.currentAction) this.currentAction.fadeOut(0.3);
                this.currentAction = this.animations[animName];
                this.currentAction.reset().fadeIn(0.3).play();
                
                // Switch back after a bit
                setTimeout(() => {
                    const defaultAnim = this.modelConfig.animation || 
                        Object.keys(this.animations)[0];
                    if (defaultAnim && this.animations[defaultAnim]) {
                        if (this.currentAction) this.currentAction.fadeOut(0.3);
                        this.currentAction = this.animations[defaultAnim];
                        this.currentAction.reset().fadeIn(0.3).play();
                    }
                }, 1500);
            }
        }
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
        }
        if (this.scene) {
            this.scene.traverse((node) => {
                if (node.isMesh) {
                    node.geometry?.dispose();
                    if (Array.isArray(node.material)) {
                        node.material.forEach(m => m.dispose());
                    } else {
                        node.material?.dispose();
                    }
                }
            });
        }
    }
}

export default ModelRenderer3D;

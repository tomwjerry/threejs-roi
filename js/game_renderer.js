'use strict';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export default class GameRenderer {
    positionSystem;
    statsSystem;

    gltfloader = new GLTFLoader;

    characterMap = new Map;

    scene;
    renderer;
    guiRenderer;
    camera;

    orbitControls;

    goal;
    follow;
    keys = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        rotX: 0,
        rotY: 0
    };
    
    temp = new THREE.Vector3;
    a = new THREE.Vector3;
    coronaSafetyDistance = 3.0;

    /**
     * Sets stuff up
     */
    init(positionSystem) {
        this.positionSystem = positionSystem;

        this.scene = new THREE.Scene;
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);
        
        this.renderer = new THREE.WebGLRenderer;
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        document.getElementById('canvasContainer').appendChild(this.renderer.domElement);

        this.guiRenderer = new CSS2DRenderer;
        this.guiRenderer.setSize(window.innerWidth, window.innerHeight);
        this.guiRenderer.domElement.style.position = 'absolute';
        this.guiRenderer.domElement.style.top = '0px';
        document.getElementById('canvasContainer').appendChild(this.guiRenderer.domElement);

        this.orbitControls = new OrbitControls(this.camera, this.guiRenderer.domElement);

        const light = new THREE.AmbientLight(0xffffff);
        this.scene.add(light);

        this.camera.position.y = 2;
        this.camera.position.z = -3;

        const geometry = new THREE.PlaneGeometry(10, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0xc0c0c0, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(geometry, material);
        plane.position.y = -0.6;
        plane.rotateX(Math.PI / 2);
        this.scene.add(plane);

        this.follow = new THREE.Object3D;
        this.follow.position.z = -this.coronaSafetyDistance;

        this.goal = new THREE.Object3D;
        this.goal.rotation.order = 'YXZ';
        this.scene.add(this.goal);
        //this.goal.add(this.camera);

        this.gltfloader = new GLTFLoader;
        this.gltfloader.setPath('meshes/');
    }

    /**
     * Loads a gLTF mesh, returns a promise when done
     * @param {*} mesh 
     * @returns 
     */
    loadMesh(mesh) {
        const gameRen = this;
        return new Promise(function (resolve, reject) {
            gameRen.gltfloader.load(mesh, function(gltf) {
                console.log('Load');
                resolve(gltf.scene);
            }, null, function(error) {
                console.log("An error happened:", error);
                reject();
            });
        });
    }

    /**
     * Add gLFT to the scene, why not use loadMesh?
     * @param {*} identifier 
     * @param {*} mesh 
     * @returns 
     */
    addRenderable(identifier, mesh) {
        const gameRen = this;
        return new Promise(function(resolve, reject) {
            gameRen.gltfloader.load(mesh, function(gltf) {
                if (gltf.animations) {
                    gltf.scene.animations = gltf.animations;
                }
                gameRen.characterMap.set(identifier, gltf.scene);
                gameRen.scene.add(gltf.scene);
                resolve(gltf.scene);
            }, undefined, function(error) {
                console.log("An error happened:", error);
                reject();
            });
        });
    }

    /**
     * Add a DOM element to the scene, following the identifier
     */
    addDOM(domElement, identifier) {
        const label = new CSS2DObject(domElement);
        this.scene.add(label);
        gameRen.characterMap.get(identifier).add(label);
        earthLabel.layers.set(0);
    }

    /**
     * Tell camera to follow a character
     * @param {*} identifier 
     */
    setCameraFollow(identifier) {
        if (this.characterMap.has(identifier)) {
            this.characterMap.get(identifier).add(this.follow);
            this.camera.lookAt(this.characterMap.get(identifier).position);
            this.orbitControls.update();
        }
    }

    /**
     * Remove something from the scene, identified by entity
     * @param {*} identifier 
     */
    removeRenderable(identifier) {
        if (this.characterMap.has(identifier)) {
            this.scene.remove(this.characterMap.get(identifier));
            this.characterMap.delete(identifier);
        }
    }

    /**
     * Move the camera
     * @param {*} ckeys
     */
    cameraMove(ckeys) {
        /*this.goal.rotateY(ckeys.rotX * -0.01);
        let newXRot = this.goal.rotation.x - ckeys.rotY * 0.01;
        if (newXRot >= Math.PI / 2 - 0.01) {
            newXRot = Math.PI / 2 - 0.02;
        } else if (newXRot <= -Math.PI / 2 + 0.01) {
            newXRot = -Math.PI / 2 + 0.02;
        }
        
        this.goal.rotation.x = newXRot;
        this.goal.rotation.z = 0;*/
    }

    /**
     * Animate the scene, move things, update camera, render
     */
    animate() {
        for (const [charkey, character] of this.characterMap.entries()) {
            const posRot = this.positionSystem.get(charkey);
            character.position.copy(posRot.position);
            character.rotation.y = posRot.rotation;
        }

        if (this.characterMap.has('playerCharacter')) {
            const player = this.characterMap.get('playerCharacter');
            this.goal.position.copy(player.position);
            //this.camera.lookAt(player.position);

            this.a.lerp(player.position, 0.4);
            let b = new THREE.Vector3;
            b.copy(this.goal.position);
            let dir = new THREE.Vector3;
            dir.copy(this.a).sub(b).normalize();
            const dist = this.a.distanceTo(b) - this.coronaSafetyDistance;
            this.goal.position.addScaledVector(dir, dist);
            this.goal.position.lerp(this.temp, 0.02);

            this.temp.setFromMatrixPosition(this.follow.matrixWorld);  
            
            //this.camera.position.copy(this.goal.position);
            this.orbitControls.update();
            this.orbitControls.target.copy(player.position);
        }

        this.orbitControls.update();

        this.renderer.render(this.scene, this.camera);
        this.guiRenderer.render(this.scene, this.camera);
    }
};

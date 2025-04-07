import gameRenderer from './game_renderer.js';
import BattleGameplay from './battle_gameplay.js';
import SimpleAI from "./ai/simple_ai";
import PositionSystem from './position_system';

import {Vector3, AnimationMixer, Clock} from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const positionSystem = new PositionSystem;
positionSystem.set('playerCharacter', {
    position: new Vector3(0, 0, 0),
    movement: new Vector3(0, 0, 0),
    rotation: 0
});
positionSystem.set('monster',  {
    position: new Vector3(0, -0.6, 3),
    movement: new Vector3(0, 0, 0),
    rotation: Math.PI
});;

const gameRendererObj = new gameRenderer;
gameRendererObj.init(positionSystem);
const warrior = gameRendererObj.addRenderable('playerCharacter', 'warrior/warrior.glb');
const weaponLoad = gameRendererObj.loadMesh('weapons/basic_sword/basic_sword.glb');
const shieldLoad = gameRendererObj.loadMesh('weapons/basic_shield/basic_shield.glb');
let mixer;

Promise.all([weaponLoad, shieldLoad, warrior]).then(function(what) {
    what[2].scale.setScalar(0.5);
    what[2].children[0].position.y = -1.1;
    mixer = new AnimationMixer(what[2]);
    mixer.clipAction(what[2].animations[0]).paused = true;
    mixer.clipAction(what[2].animations[0]).play();

    what[0].scale.setScalar(0.5);
    what[0].rotation.y = Math.PI / 2;

    const rightHand = 
        what[2].children[0].children[0].skeleton.getBoneByName('handR');
    rightHand.add(what[0]);

    what[1].scale.setScalar(0.5);
    what[1].rotation.y = Math.PI + 1.6;
    what[1].rotation.x = Math.PI / 2;
    what[1].position.x = -0.05;
    what[1].position.y = 0.09;

    const lefthand = 
        what[2].children[0].children[0].skeleton.getBoneByName('handL');
    lefthand.add(what[1]);

    gameRendererObj.setCameraFollow('playerCharacter');
});

gameRendererObj.addRenderable('monster', 'wolf/wolf.glb').then(function(mesh) {
    mesh.scale.setScalar(0.009);
    const monsterStatsDiv = document.createElement('div');
});
const keymap = {
    w: 'forward',
    a: 'left',
    s: 'backward',
    d: 'right',
    1: 'skill0',
    2: 'skill1',
    3: 'skill2',
    4: 'skill3',
    5: 'skillSwap'
};

const commands = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    rotX: 0,
    rotY: 0
};

let playerVelocity = 0;

function playerMove() {
    let speed = 0.0;
    if (commands.forward) {
        speed = 0.01;
    } else if (commands.backward) {
        speed = -0.01;
    }

    playerVelocity += (speed - playerVelocity) * 0.3;

    const player = positionSystem.get('playerCharacter');

    const dir = (new Vector3(0, 0, 1))
        .applyAxisAngle(new Vector3(0, 1, 0), player.rotation)
        .multiplyScalar(playerVelocity);

    player.position.add(dir);

    if (commands.left) {
        player.rotation += 0.02;
    } else if (commands.right) {
        player.rotation -= 0.02;
    }
}

/*const lastMousePos = {x: 0, y: 0};
document.body.addEventListener('mousemove', function(e) {
    commands.rotX = e.clientX - lastMousePos.x;
    commands.rotY = e.clientY - lastMousePos.y;

    gameRendererObj.cameraMove(commands);
    lastMousePos.x = e.clientX;
    lastMousePos.y = e.clientY;
});*/

const GameModes = Object.freeze({
    Travel: 0,
    Battle: 1
    // More such as trading, crafting, training...
});

const battleGameplay = new BattleGameplay(positionSystem);
const ai = new SimpleAI;

ai.start([0], 1, battleGameplay, positionSystem);

document.querySelector('#guiContainer .skillpanel').addEventListener('click', function(e) {
    if (e.target.classList.contains('skill') &&
        battleGameplay.playerSkills[e.target.dataset.skill]) {
        battleGameplay.spendTurnAction(0, battleGameplay.playerSkills[e.target.dataset.skill], 1);
    }
});

function checkKeys(e, pressed) {
    const key = e.code.replace('Key', '').toLowerCase();
    const command = keymap[key];

    if (command) {
        if (command.startsWith('skill')) {
            const skillNum = command.substring(5);
            if (battleGameplay.playerSkills[skillNum]) {
                battleGameplay.spendTurnAction(0, battleGameplay.playerSkills[skillNum], 1);
            }
            return;
        }

        commands[command] = pressed;
    }
}

document.body.addEventListener('keydown', function(e) { checkKeys(e, true); });
document.body.addEventListener('keyup', function(e) { checkKeys(e, false); });

let gamemode = GameModes.Battle;
const clock = new Clock();

function gameLoop() {
    playerMove();
    if (gamemode == GameModes.Battle) {
        battleGameplay.loop();
        ai.think();
    }
    gameRendererObj.animate();
    if (mixer) {
        mixer.update(clock.getDelta());
    }
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

'use strict';

import components from './components_definition.js';
import gameRenderer from './game_renderer.js';
import BattleGameplay from './battle_gameplay.js';
import SimpleAI from "./ai/simple_ai";
import PositionSystem from './position_system';

import { createWorld, addEntity, addComponent } from 'bitecs';
import { Vector3, AnimationMixer, Clock } from 'three';

const world = createWorld();

// TODO: Implement a loading system
const playerCharacter = addEntity(world);
const monster = addEntity(world);

addComponent(world, components.Position, playerCharacter);
addComponent(world, components.Moveable, playerCharacter);
addComponent(world, components.Renderble, playerCharacter);
addComponent(world, components.Stats, playerCharacter);
addComponent(world, components.Battler, playerCharacter);
addComponent(world, components.BattlePosition, playerCharacter);
addComponent(world, components.Skillset, playerCharacter);

addComponent(world, components.Position, monster);
addComponent(world, components.Moveable, monster);
addComponent(world, components.Renderble, monster);
addComponent(world, components.Stats, monster);
addComponent(world, components.Battler, monster);
addComponent(world, components.BattlePosition, monster);
addComponent(world, components.Skillset, monster);

components.Position.x[playerCharacter] = 0;	
components.Position.y[playerCharacter] = 0;
components.Position.z[playerCharacter] = 0;

components.Moveable.mx[playerCharacter] = 0;
components.Moveable.my[playerCharacter] = 0;
components.Moveable.mz[playerCharacter] = 0;
components.Moveable.facing[playerCharacter] = 0;

components.Stats.health[playerCharacter] = 10;
components.Stats.power[playerCharacter] = 1;
components.Stats.maxHealth[playerCharacter] = 10;
components.Stats.maxPower[playerCharacter] = 5;
components.Stats.defenseChance[playerCharacter] = 0.5;

components.Battler.target[playerCharacter] = monster;

components.BattlePosition.x[playerCharacter] = 0;
components.BattlePosition.y[playerCharacter] = 0;
components.BattlePosition.z[playerCharacter] = 0;

components.Skillset.firstSkill[playerCharacter] = 1;
components.Skillset.secondSkill[playerCharacter] = 2;
components.Skillset.thirdSkill[playerCharacter] = 3;
components.Skillset.fourthSkill[playerCharacter] = 4;
components.Skillset.defenceSkill[playerCharacter] = 0;
components.Skillset.ultimateSkill[playerCharacter] = 0;

components.Position.x[monster] = 0;	
components.Position.y[monster] = -0.6;
components.Position.z[monster] = 3;

components.Moveable.mx[monster] = 0;
components.Moveable.my[monster] = 0;
components.Moveable.mz[monster] = 0;
components.Moveable.facing[monster] = Math.PI;

components.Stats.health[monster] = 10;
components.Stats.power[monster] = 1;
components.Stats.maxHealth[monster] = 10;
components.Stats.maxPower[monster] = 5;
components.Stats.defenseChance[monster] = 0.5;

components.Battler.target[monster] = playerCharacter;

components.BattlePosition.x[monster] = 0;
components.BattlePosition.y[monster] = 0;
components.BattlePosition.z[monster] = 0;

components.Skillset.firstSkill[monster] =51;
components.Skillset.secondSkill[monster] = 6;
components.Skillset.thirdSkill[monster] = 7;
components.Skillset.fourthSkill[monster] = 0;
components.Skillset.defenceSkill[monster] = 0;
components.Skillset.ultimateSkill[monster] = 0;

// END OF LOADING

const gameRendererObj = new gameRenderer;
gameRendererObj.init(positionSystem);
const warrior = gameRendererObj.addRenderable(playerCharacter, 'warrior/warrior.glb');
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

gameRendererObj.addRenderable(monster, 'wolf/wolf.glb').then(function(mesh) {
    mesh.scale.setScalar(0.009);
    const monsterStatsDiv = document.createElement('div');
    const healthBar = document.createElement('div');
    healthBar.classList.add('healthbar');
    const powerBar = document.createElement('div');
    powerBar.classList.add('powerbar');
    monsterStatsDiv.appendChild(healthBar);
    monsterStatsDiv.appendChild(powerBar);
    gameRendererObj.addDOM(monsterStatsDiv, 'monster');
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

function playerMove() {
    let speed = 0.0;
    if (commands.forward) {
        speed = 0.01;
    } else if (commands.backward) {
        speed = -0.01;
    }

    components.Moveable.velocity[playerCharacter] +=
        (speed - components.Moveable.velocity[playerCharacter]) * 0.3;

    const dir = (new Vector3(0, 0, 1))
        .applyAxisAngle(new Vector3(0, 1, 0), components.Moveable.facing[playerCharacter])
        .multiplyScalar(components.Moveable.velocity[playerCharacter]);

    components.Moveable.mx[playerCharacter] = dir.x;
    components.Moveable.my[playerCharacter] = dir.y;
    components.Moveable.mz[playerCharacter] = dir.z;

    if (commands.left) {
        components.Moveable.facing[playerCharacter] += 0.02;
    } else if (commands.right) {
        components.Moveable.facing[playerCharacter] -= 0.02;
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

const battleGameplay = new BattleGameplay;
const ai = new SimpleAI;

ai.start([0], 1);

document.querySelector('#guiContainer .skillpanel').addEventListener('click', function(e) {
    if (!e.target.dataset.skill) { return; }
    if (e.target.classList.contains('skill')) { return; }
    if (!components.Skillset[e.target.dataset.skill] ||
        !components.Skillset[e.target.dataset.skill][playerCharacter]) { return; }

    addComponent(world, playerCharacter, components.UseSkill);
});

function checkKeys(e, pressed) {
    const key = e.code.replace('Key', '').toLowerCase();
    const command = keymap[key];

    if (command) {
        commands[command] = pressed;
    }
}

document.body.addEventListener('keydown', function(e) { checkKeys(e, true); });
document.body.addEventListener('keyup', function(e) { checkKeys(e, false); });

let gamemode = GameModes.Battle;
const clock = new Clock;

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

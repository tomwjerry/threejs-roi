'use strict';

import { Vector3 } from 'three';

const thinkSpeed = 200;
const AIDecisions = Object.freeze({
    Idle: 0,
    Target: 1,
    Chase: 2,
    Attack: 3
});

export default class SimpleAI {
    enemies = [];
    you = null;
    chooseSkill = null;
    lastThink = 0;
    decision = AIDecisions.Idle;
    nextDecision = AIDecisions.Idle;

    start(world, entity, enemies) {
        this.enemies = enemies;
        // Casually choose a target
        this.target = enemies[Math.floor(Math.random() * enemies.length)];
        this.you = you;
        this.battleGameplay = battleGameplay;
        this.positionSystem = positionSystem;
    }

    think() {
        const gamestate = this.battleGameplay.characterStats;
        const yourState = gamestate[this.you];

        // This will likley happen very seldom
        if (yourState.health <= 0) {
            return;
        }
        if (!this.target || gamestate[this.target].health <= 0) {
            // Choose first best enemy
            this.target = null;
            for (let i = 0; i < this.enemies.length; i++) {
                if (gamestate[this.enemies[i]].health > 0) {
                    this.target = this.enemies[i];
                    break;
                }
            }
            // We have won, lets celebrate! :D
            if (this.target === null) {
                return;
            }
        }

        const yourPos = this.positionSystem.get(yourState.entity);
        const targetPos = this.positionSystem.get(gamestate[this.target].entity).position;
        let dir = new Vector3;
        dir.subVectors(targetPos, yourPos.position);
        const angle = Math.atan2(dir.x, dir.z);

        if (this.decision == AIDecisions.Target) {
            if (yourPos.rotation > angle) {
                if (yourPos.rotation - 0.02 < angle) {
                    yourPos.rotation = angle;
                    this.decision = AIDecisions.Chase;
                } else {
                    yourPos.rotation -= 0.02;
                }
            } else {
                if (yourPos.rotation + 0.02 > angle) {
                    yourPos.rotation = angle;
                    this.decision = AIDecisions.Chase;
                } else {
                    yourPos.rotation += 0.02;
                }
            }
            return;
        }

        // Check range
        const distance = this.battleGameplay.getActionDistanceHelper(this.you, this.target);

        if (this.decision == AIDecisions.Chase && this.chooseSkill) {
            if (distance > this.chooseSkill.range) {
                yourPos.rotation = angle;
                dir.normalize().multiplyScalar(0.005);
                yourPos.position.add(dir); // Need to think of an unified movement system
                return;
            } else {
                this.decision = AIDecisions.Attack;
            }
        }
        
        if (!this.chooseSkill) {
            const availableSkills = yourState.skills.filter(skill => skill.powerCost <= yourState.power);
            if (availableSkills.length > 0) {
                this.chooseSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
            } else {
                this.chooseSkill = null;
            }

            if (distance > this.chooseSkill.range) {
                this.nextDecision = AIDecisions.Target;
            } else {
                this.nextDecision = AIDecisions.Attack;
            }
        }

        const elitime = performance.now() - this.lastThink;
        if (elitime > thinkSpeed) {
            this.lastThink = performance.now();
            this.decision = this.nextDecision;
        }
        
        if (this.decision == AIDecisions.Attack) {
            this.battleGameplay.spendTurnAction(this.you, this.chooseSkill, this.target);
            this.chooseSkill = null;
            this.decision = AIDecisions.Idle;
        }
    }
}
'use strict';

export default {
    Position: {
        x: [],
        y: [],
        z: []
    },
    Moveable: {
        mx: [],
        my: [],
        mz: [],
        facing: [],
        velocity: []
    },
    Renderble: {},
    Stats: {
        health: [],
        power: [],
        maxHealth: [],
        maxPower: [],
        defenseChance: []
    },
    Battler: {
        target: [],
        myturn: []
    },
    BattlePosition: {
        x: [],
        y: [],
        z: []
    },
    UseSkill: {
        skill: []
    },
    GetAttackedBy: {
        attack: [],
        attacker: []
    },
    DefendsAttack: {
        attack: [],
        defence: [],
        attacker: []
    },
    Skillset: {
        firstSkill: [],
        secondSkill: [],
        thirdSkill: [],
        fourthSkill: [],
        defenceSkill: [],
        ultimateSkill: []
    }
};

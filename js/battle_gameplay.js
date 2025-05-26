'use strict';

const normalRoundTime = 5000;
const defenceRoundTime = 200;

export default class BattleGameplay {
    // Move this somewhere
    // Game logic, think of how we want to do this
    monsterSkills = [
        {
            name: 'Bite',
            damageMin: 1,
            damageMax: 3,
            defendMin: 0,
            defendMax: 1,
            powerCost: 1,
            range: 1
        },
        {
            name: 'Slash',
            damageMin: 1,
            damageMax: 5,
            defendMin: 0,
            defendMax: 2,
            powerCost: 2,
            range: 1
        },
        {
            name: 'Double Slash',
            damageMin: 2,
            damageMax: 7,
            defendMin: 0,
            defendMax: 2,
            powerCost: 4,
            range: 1
        }
    ];

    playerSkills = [
        {
            name: 'Attack',
            damageMin: 1,
            damageMax: 3,
            defendMin: 1,
            defendMax: 5,
            powerCost: 1,
            range: 1
        },
        {
            name: 'Massive Attack',
            damageMin: 2,
            damageMax: 5,
            defendMin: 0,
            defendMax: 2,
            powerCost: 2,
            range: 1
        },
        {
            name: 'All out attack',
            damageMin: 3,
            damageMax: 7,
            defendMin: 0,
            defendMax: 2,
            powerCost: 4,
            range: 1
        }
    ];

    characterIndexes = [];

    positionSystem = null;
    tatsSystem = null;
    
    whosturn = 0;
    temporaryTurn = 0;
    roundTime = 0;
    tempAttackSkill = false;
    curCharEntity = null;
    
    constructor(positionSystem, statsSystem) {
        this.positionSystem = positionSystem;
        this.statsSystem = statsSystem;

        // TEMP!
        const statmap = [
            ['playerCharacter', {
                target: 1,
                health: 10,
                power: 1,
                maxHealth: 10,
                maxPower: 5,
                defenseChance: 0.5,
                skills: this.playerSkills
            }],
            ['monster', {
                target: 0,
                health: 10,
                power: 1,
                maxHealth: 10,
                maxPower: 5,
                defenseChance: 0.1,
                skills: this.monsterSkills
            }]
        ];

        for (let i = 0; i < statmap.length; i++) {
            this.statsSystem.set(statmap[i][0], statmap[i][1]);
            this.characterIndexes.push(statmap[i][0]);
        }
    }

    // Move somewher
    setVitals() {
        const charStats = this.statsSystem.get(curCharEntity);
        const healthBar = document.getElementById('healthbar');
        const powerBar = document.getElementById('powerbar');
        healthBar.querySelector('.number').innerText =
            charStats.health + '/' + charStats.maxHealth;
        healthBar.querySelector('.meter').style.width =
            (charStats.health / charStats.maxHealth) * 100 + '%';
        powerBar.querySelector('.number').innerText =
            charStats.power + '/' + charStats.maxPower;
        powerBar.querySelector('.meter').style.width =
            (charStats.power / charStats.maxPower) * 100 + '%';
    }

    /**
     * Attack, and defend
     * @param {*} attacker 
     * @param {*} defender 
     * @param {*} skill 
     * @returns 
     */
    attack(attacker, defender, skill) {
        const attackerStats = this.statsSystem.get(attacker);
        const defenderStats = this.statsSystem.get(defender);

        console.log('Attacker: ' + attacker + ' Defender: ' + defender + ' Skill: ' + skill.name);
        // Check if we can defend
        if (Math.random() <= defenderStats.defenseChance && !this.tempAttackSkill) {
            console.log('Defense!');
            this.temporaryTurn = this.characterIndexes.findIndex(defender);
            this.tempAttackSkill = skill;
            return;
        }

        // Check range
        const dist = this.getActionDistance(attacker, defender);
        console.log('Distance: ' + dist);
        if (dist > skill.range) {
            return;
        }

        let realAttackSkill = skill;
        let realDefender = defenderStats;
        let attackDamage = 0;
        let withDefense = false;

        // When you defend, the attacker and defender in this function is swapped
        // weird, but it works
        if (this.tempAttackSkill) {
            console.log('Defending...');
            realDefender = attackerStats;
            realAttackSkill = this.tempAttackSkill;
            withDefense = true;
        }

        // Calculate damage
        attackDamage = realAttackSkill.damageMin + Math.floor(
            Math.random() * (realAttackSkill.damageMax - realAttackSkill.damageMin + 1));
        // Decrease damage by defense skill used
        if (withDefense) {
            attackDamage -= skill.defendMin + Math.floor(
                Math.random() * (skill.defendMax - skill.defendMin + 1));
            
            if (attackDamage < 0) {
                attackDamage = 0;
            }
        }

        console.log('Damage: ' + attackDamage + ' health:' + realDefender.health);

        // Apply damage
        realDefender.health -= attackDamage;
        this.setVitals();

        // After defence turn, set back to attack turn?
        if (withDefense) {
            this.temporaryTurn = this.whosturn;
        }
    }

    /**
     * Spend turn action, not neccary attack, but move etc,
     * called by characters
     * @param {*} whoCharID 
     * @param {*} skill 
     * @param {*} target 
     * @returns 
     */
    spendTurnAction(whoCharID, skill, target) {
        const whoChar = this.characterIndexes.findIndex(whoCharID);
        
        // If you try to spend skill before your turn, do nothing, or possible queue up the skill
        if (whoChar != this.temporaryTurn) {
            return;
        }

        const charStats = this.statsSystem.get(curCharEntity);
        let power = charStats.power;

        console.log('Power: ' + this.characterStats[whoChar].power);
        // Decrease power accorind to skill / move
        if (power >= skill.powerCost) {
            power -= skill.powerCost;
            charStats.power = power;
            this.statsSystem.set(whoCharID, charStats);
            this.setVitals();
            this.attack(whoCharID, target, skill);
        }
        // New turn, I have an explaination for this but I forgot
        if (this.whosturn == this.temporaryTurn) {
            this.newTurn();
        }
    }

    /**
     * Distance between two characters in "action units"
     * @param {*} fromCharID 
     * @param {*} toCharID 
     * @returns 
     */
    getActionDistance(fromCharID, toCharID) {
        const actudist = this.positionSystem.get(fromCharID).position.distanceToSquared(
            this.positionSystem.get(toCharID).position);
        return Math.round(actudist / 5);
    }

    /**
     * Logic for new turn
     */
    newTurn() {
        this.tempAttackSkill = false;
        this.whosturn++;
        this.whosturn = this.whosturn % 2;
        this.temporaryTurn = this.whosturn;
        console.log('New turn for ' + this.whosturn);
        
        curCharEntity = this.characterIndexes[this.whosturn];
        const charStats = this.statsSystem.get(curCharEntity);
        let power = charStats.power + 2;

        if (power > charStats.maxPower) {
            power = charStats.maxPower;
        }

        charStats.power = power;
        this.statsSystem.set(curCharEntity, charStats);

        // Shull not be here
        this.setVitals();
    }
};

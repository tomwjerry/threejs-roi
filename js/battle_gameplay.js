import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

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

    characterStats = [];
    characterIndexes = new Map;

    positionSystem = null;
    
    whosturn = 0;
    temporaryTurn = 0;
    roundTime = 0;
    tempAttackSkill = false;
    
    constructor(positionSystem) {
        this.positionSystem = positionSystem;

        this.characterStats.push({
            entity: 'playerCharacter',
            target: 1,
            health: 10,
            power: 1,
            maxHealth: 10,
            maxPower: 5,
            defenseChance: 0.5,
            skills: this.playerSkills
        });
        this.characterStats.push({
            entity: 'monster',
            target: 0,
            health: 10,
            power: 1,
            maxHealth: 10,
            maxPower: 5,
            defenseChance: 0.1,
            skills: this.monsterSkills
        });

        for (let i = 0; i < this.characterStats.length; i++) {
            this.characterIndexes.set(this.characterStats[0].entity, i);
        }
    }

    // Move somewher
    setVitals() {
        const healthBar = document.getElementById('healthbar');
        const powerBar = document.getElementById('powerbar');
        healthBar.querySelector('.number').innerText =
            this.characterStats[0].health + '/' + this.characterStats[0].maxHealth;
        healthBar.querySelector('.meter').style.width =
            (this.characterStats[0].health / this.characterStats[0].maxHealth) * 100 + '%';
        powerBar.querySelector('.number').innerText =
            this.characterStats[0].power + '/' + this.characterStats[0].maxPower;
        powerBar.querySelector('.meter').style.width =
            (this.characterStats[0].power / this.characterStats[0].maxPower) * 100 + '%';
    }

    attack(attacker, defender, skill) {
        console.log('Attacker: ' + attacker + ' Defender: ' + defender + ' Skill: ' + skill.name);
        // Check if we can defend
        if (Math.random() <= this.characterStats[defender].defenseChance && !this.tempAttackSkill) {
            console.log('Defense!');
            this.temporaryTurn = defender;
            this.tempAttackSkill = skill;
            return;
        }

        // Check range
        const dist = this.getActionDistanceHelper(attacker, defender);
        console.log('Distance: ' + dist);
        if (dist > skill.range) {
            return;
        }

        let realAttackSkill = skill;
        let realDefender = this.characterStats[defender];
        let attackDamage = 0;
        let withDefense = false;

        if (this.tempAttackSkill) {
            console.log('Defending...');
            realDefender = this.characterStats[attacker];
            realAttackSkill = this.tempAttackSkill;
            withDefense = true;
        }

        attackDamage = realAttackSkill.damageMin + Math.floor(
            Math.random() * (realAttackSkill.damageMax - realAttackSkill.damageMin + 1));
        if (withDefense) {
            attackDamage -= skill.defendMin + Math.floor(
                Math.random() * (skill.defendMax - skill.defendMin + 1));
            
            if (attackDamage < 0) {
                attackDamage = 0;
            }
        }

        console.log('Damage: ' + attackDamage + ' health:' + realDefender.health);

        realDefender.health -= attackDamage;
        this.setVitals();

        if (withDefense) {
            this.temporaryTurn = this.whosturn;
        }
    }

    spendTurnAction(whoCharID, skill, target) {
        const whoChar = this.characterIndexes.get(whoCharID);
        
        if (whoChar != this.temporaryTurn) {
            return;
        }

        console.log('Power: ' + this.characterStats[whoChar].power);
        if (this.characterStats[whoChar].power >= skill.powerCost) {
            this.characterStats[whoChar].power -= skill.powerCost;
            this.setVitals();
            this.attack(whoChar, target, skill);
        }
        if (this.whosturn == this.temporaryTurn) {
            this.newTurn();
        }
    }

    getActionDistance(fromCharID, toCharID) {
        const actudist = this.positionSystem.get(fromCharID).position.distanceToSquared(
            this.positionSystem.get(toCharID).position);
        return Math.round(actudist / 5);
    }

    getActionDistanceHelper(fromChar, toChar) {
        return this.getActionDistance(
            this.characterStats[fromChar].entity, this.characterStats[toChar].entity);
    }

    newTurn() {
        this.tempAttackSkill = false;
        this.whosturn++;
        this.whosturn = this.whosturn % 2;
        this.temporaryTurn = this.whosturn;
        console.log('New turn for ' + this.whosturn);
        this.characterStats[this.whosturn].power += 2;
        if (this.characterStats[this.whosturn].power > this.characterStats[this.whosturn].maxPower) {
            this.characterStats[this.whosturn].power = this.characterStats[this.whosturn].maxPower;
        }
        this.setVitals();
    }
    
    loop() {
        const elitime = performance.now() - this.roundTime;
        if (elitime > normalRoundTime) {
            this.roundTime = performance.now();
            this.newTurn();
        }
    }
};

import { Vector3 } from "three";

export default class PositionSystem {
    positions = new Map;

    get(character) {
        if (this.positions.has(character)) {
            return this.positions.get(character);
        }
        return {
            position: new Vector3(0, 0, 0),
            movement: new Vector3(0, 0, 0),
            rotation: 0
        };
    }

    set(character, objatr) {
        this.positions.set(character, objatr);
    }

    move(character, movement) {
        const attr = this.get(character);
        attr.position.add(movement);
        attr.movement.copy(movement);
    }
}

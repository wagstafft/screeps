import { ManagedEntity } from "../BaseClasses/ManagedEntity";

export enum TowerRoles {
    idle = 0,
    defend = 1,
    repair = 2,
    heal = 3,
}

export type TowerTarget = Structure | Creep;

const NON_EMERGENCY_ENERGY_USE_THRESHOLD: number = .5;

export class Tower extends ManagedEntity<TowerRoles, TowerTarget>  {
    private _tower: StructureTower;
    constructor(tower: StructureTower) {
        super();
        this._tower = tower;
    }

    name(): string {
        return "Tower";
    }

    energyCapacityPercentage = () => this._tower.store['energy'] / this._tower.store.getCapacity('energy');
    executeRole(): void {
        switch (this.Role) {
            case TowerRoles.repair:
                if (this.energyCapacityPercentage() > NON_EMERGENCY_ENERGY_USE_THRESHOLD) {
                    this._tower.repair(this.Target as Structure);
                }
                break;
            case TowerRoles.defend:
                this._tower.attack(this.Target);
                break;
            case TowerRoles.heal:
                if (this.energyCapacityPercentage() > NON_EMERGENCY_ENERGY_USE_THRESHOLD) {
                    this._tower.heal(this.Target as Creep);
                }
                break;
            case TowerRoles.idle:
            default:
                break;
        }
    }

    report(): void {
        console.log(`I am a tower ${this._tower.hits}/${this._tower.hitsMax}`);
    }
}
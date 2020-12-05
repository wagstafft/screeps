import { ManagedEntity } from "../BaseClasses/ManagedEntity";
import { getUtil } from "../Utils";

export enum MinerRoles {
    idle = 0,
    harvest = 1,
    transfer = 2
}

export type MinerTarget = Source | {
    store: any;
    getFreeCapacity: any;
    getUsedCapacity: any;
    id: any;
}

export interface MinerMemory extends CreepMemory {
    role: MinerRoles,
    target: MinerTarget
}

export class Miner extends ManagedEntity<MinerRoles, MinerTarget>  {
    name(): string {
        return "Miner";
    }

    public _creep: Creep;

    constructor(creep: Creep) {
        super();
        this._creep = creep;
    }

    setIdle(): void {
        (this._creep.memory as MinerMemory).role = MinerRoles.idle;
        (this._creep.memory as MinerMemory).target = null;
    }

    executeRole(): void {
        this.Role = (this._creep.memory as MinerMemory).role;
        if ((this._creep.memory as MinerMemory).target) {
            this.Target = Game.getObjectById((this._creep.memory as MinerMemory).target.id);
        }

        this.report();
        switch (this.Role) {
            case MinerRoles.harvest:
                if (this._creep.harvest(this.Target as Source) == ERR_NOT_IN_RANGE) {
                    this._creep.moveTo(this.Target as Source, { visualizePathStyle: { stroke: '#ffff00' } });
                }
                getUtil().delayedSay(this._creep, `mining`);

                if (this._creep.store.getCapacity() > 0 && this._creep.store.getFreeCapacity() === 0) {
                    this.setIdle();
                }
                break;
            case MinerRoles.transfer:
                if (this._creep.transfer(this.Target as any, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this._creep.moveTo(this.Target as any, { visualizePathStyle: { stroke: '#ffff00' } });
                }
                if (this._creep.store.getUsedCapacity() === 0) {
                    this.setIdle();
                }
                getUtil().delayedSay(this._creep, `transfer not implemented`);
        }
    }
    report(): void {
        console.log(`I am ${this._creep.name} Miner with role ${this.Role} and target ${this.Target}`);
    }
}
import { ManagedEntity } from "../BaseClasses/ManagedEntity";
import { getUtil } from "../Utils";

export enum WorkerRoles {
    idle = 0,
    repair = 1,
    build = 2,
    pickup = 3,
    upgrade = 4,
    move = 5,
}

// export type WorkerStructureTarget = Structure | ConstructionSite | AnyStoreStructure;
// export type WorkerPickUp = Resource<ResourceConstant>;
export type WorkerTarget = Structure | ConstructionSite | AnyStoreStructure | Resource<ResourceConstant>;

export interface WorkerMemory extends CreepMemory {
    role: WorkerRoles,
    target: WorkerTarget
}

export class Worker extends ManagedEntity<WorkerRoles, WorkerTarget>  {
    public _creep: Creep;

    constructor(creep: Creep) {
        super();
        this._creep = creep;
    }

    workerRoleStr(role: WorkerRoles): string {
        switch (role) {
            case WorkerRoles.idle:
                return "idle";
            case WorkerRoles.repair:
                return "repair";
            case WorkerRoles.build:
                return "build";
            case WorkerRoles.pickup:
                return "pickup";
            case WorkerRoles.upgrade:
                return "upgrade";
            case WorkerRoles.move:
                return "move";
                break;
            default:
                break;
        }
    }

    name(): string {
        return "Worker";
    }

    setIdle(): void {
        (this._creep.memory as WorkerMemory).role = WorkerRoles.idle;
        (this._creep.memory as WorkerMemory).target = null;
    }

    executeRole(): void {
        this.Role = (this._creep.memory as WorkerMemory).role;
        if ((this._creep.memory as WorkerMemory).target) {
            this.Target = Game.getObjectById((this._creep.memory as WorkerMemory).target.id);
        }

        if (!this.Target || !this.Role) {
            this.setIdle();
        }

        if (this.Target && this._creep.room != this.Target.room) {
            this._creep.moveTo(this.Target);

        }

        if (this._creep.store.getUsedCapacity() === 0 && this.Role !== WorkerRoles.pickup) {
            this.setIdle();
        }

        getUtil().delayedSay(this._creep, `👷 ${this.workerRoleStr(this.Role)}`);

        switch (this.Role) {
            case WorkerRoles.build:
                if (this._creep.build(this.Target as ConstructionSite) == ERR_NOT_IN_RANGE) {
                    this._creep.moveTo(this.Target, { visualizePathStyle: { stroke: '#00ff00' } });
                }

                break;
            case WorkerRoles.pickup:
                if (this._creep.withdraw(this.Target as AnyStoreStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this._creep.moveTo(this.Target, { visualizePathStyle: { stroke: '#00ff00' } });
                } else if (this._creep.pickup(this.Target as Resource<ResourceConstant>) == ERR_NOT_IN_RANGE) {
                    this._creep.moveTo(this.Target, { visualizePathStyle: { stroke: '#00ff00' } });
                }

                if (this._creep.store.getFreeCapacity() === 0) {
                    this.setIdle();
                }
                break;
            case WorkerRoles.move:
                this._creep.moveTo(this.Target, { visualizePathStyle: { stroke: '#00ff00' } });
                if (this._creep.room === this.Target.room) {
                    this.setIdle();
                }
                break;
            case WorkerRoles.upgrade:
                if (this._creep.upgradeController(this._creep.room.controller) == ERR_NOT_IN_RANGE) {
                    this._creep.moveTo(this._creep.room.controller, { visualizePathStyle: { stroke: '#00ff00' } });
                }
                break;
            case WorkerRoles.idle:
                break;
            default:
                throw new Error('Worker role ' + this.Role + ' not implemented');
        }
    }
    report(): void {
        console.log(`I am ${this._creep.name} worker with role ${this.Role} and target ${this.Target}`);
    }
}
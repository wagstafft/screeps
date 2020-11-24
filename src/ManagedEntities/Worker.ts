import { ManagedEntity } from "../BaseClasses/ManagedEntity";

export enum WorkerTasks {
    idle = 0,
    repair = 1,
    build = 2,
    picup = 3,
}

export type WorkerStructureTarget = Structure | ConstructionSite | AnyStoreStructure;
export type WorkerPickUp = Source;

export class Worker extends ManagedEntity<WorkerTasks, (WorkerStructureTarget| WorkerPickUp)>  {
    private _creep: Creep;

    constructor(creep: Creep) {
        super();
        this._creep = creep;
    }

    name(): string {
        return "Worker";
    }

    executeRole(): void {
        console.log(`I am a worker with role ${this.Role} and target ${this.Target}`);
        console.log('execute worker role');
    }
    report(): void {
        console.log(`I am ${this._creep.name} worker with role ${this.Role} and target ${this.Target}`);
    }
}
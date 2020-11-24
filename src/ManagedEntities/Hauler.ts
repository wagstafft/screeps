import { ManagedEntity } from "../BaseClasses/ManagedEntity";

export enum HaulerTask {
    idle = 0,
    pickup = 1,
    withdraw = 2,
    transfer = 3
}

export type HaulerTarget = {
    store: any;
    getFreeCapacity: any;
    getUsedCapacity: any;
}
// export type HaulerTarget = AnyStoreStructure | Resource;
// export type WorkerStructureTarget = Structure | ConstructionSite | AnyStoreStructure;
// export type WorkerPickUp = Source;

export class Hauler extends ManagedEntity<HaulerTask, HaulerTarget>  {
    name(): string {
        return "Hauler";
    }

    public _creep: Creep;

    constructor(creep: Creep) {
        super();
        this._creep = creep;
    }

    executeRole(): void {
        this._creep.say(`hello`);
        console.log(`I am a hauler with role ${this.Role} and target ${this.Target}`);
        console.log('execute hauler role');
        // this._creep.moveTo(this.Target, {visualizePathStyle: {stroke: '#ffffff'}});
    }
    report(): void {
        console.log(`I am ${this._creep.name} hauler with role ${this.Role} and target ${this.Target}`);
    }
}
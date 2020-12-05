//import { HaulerTask, HaulerTarget } from './../ManagedEntities/Hauler';
import { Manager, RoomItem } from "./Manager";
import { getUtil, StrutureSearchTypes } from "../Utils";
import { Worker, WorkerTarget, WorkerRoles, WorkerMemory } from "../ManagedEntities/Worker";
//import { Hauler, HaulerTarget } from "../ManagedEntities/Hauler";

const ROOM_MIN_WORKERS = 4; // ROOM wont send off if it will put itself below Min Workers
// TODO workers pickup source
// TODO workers will go to other owned rooms to get source if need be
// TODO if room is above min and others rooms are below min will send off excess workers
// TODO always have at least one creep upgrading controller
// TODO workers will flee to a safe room for now Spawn1
// TODO in an emergency workers act as temporary miners

export class WorkerManager extends Manager<Worker> {
    name(): string {
        return "Worker Manager";
    }

    constructor(rooms: Room[]) {
        super(rooms);
    }

    findManageditems(rooms: Room[]): RoomItem<Worker>[] {
        return rooms.map((room) => {
            let creeps: Creep[] = room.find(FIND_CREEPS).filter((creep) => creep.name.toLowerCase().includes('worker')).sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));
            return { room: room, items: creeps.map((creep) => new Worker(creep)) };
        });
    }

    manage(): void {
        let crisisRooms: RoomItem<Worker>[] = [];
        let crisisConstructionSites: ConstructionSite[] = [];
        let roomSources: Resource<ResourceConstant>[] = [];
        let storageStructures: AnyStoreStructure[] = [];

        this._roomItems.forEach((roomItem) => {
            if (roomItem.room.find(FIND_MY_SPAWNS).length === 0 && roomItem.room.find(FIND_CONSTRUCTION_SITES).length > 0) {
                crisisRooms.push(roomItem);
                crisisConstructionSites = crisisConstructionSites.concat(roomItem.room.find(FIND_CONSTRUCTION_SITES));
            }

            roomSources = roomSources.concat(roomItem.room.find(FIND_DROPPED_RESOURCES).filter((resource) => resource.resourceType === 'energy'));
            storageStructures = storageStructures.concat(roomItem.room.find(FIND_STRUCTURES).filter((structure) => structure.structureType === 'storage' || structure.structureType === 'container').map((structure) => structure as AnyStoreStructure));
        });

        this._roomItems.forEach((roomItem) => {
            let first: boolean = true;
            let constructionSites = crisisConstructionSites.concat(roomItem.room.find(FIND_CONSTRUCTION_SITES));
            console.log('construction sites ' + constructionSites);
            let reassignedWorker = 0;
            roomItem.items.forEach((item) => {
                let workerMemory: WorkerMemory = item._creep.memory as WorkerMemory;
                workerMemory.role = undefined;
                workerMemory.target = undefined;
                // console.log(JSON.stringify(workerMemory));

                if (workerMemory.role === undefined || workerMemory.target === undefined || workerMemory.role === WorkerRoles.idle) {
                    workerMemory.role = WorkerRoles.idle;
                    workerMemory.target = null;

                    let role = WorkerRoles.idle;
                    let target: WorkerTarget = null;
                    if (item._creep.store.getUsedCapacity() === 0) {
                        role = WorkerRoles.pickup;
                        let storage = storageStructures.sort((a, b) => item._creep.pos.getRangeTo(a) - item._creep.pos.getRangeTo(b))[0];
                        let dropped = roomItem.room.find(FIND_DROPPED_RESOURCES).sort((a, b) => item._creep.pos.getRangeTo(a) - item._creep.pos.getRangeTo(b))[0];
                        if (item._creep.pos.getRangeTo(storage) < item._creep.pos.getRangeTo(dropped) || (item._creep.store.getFreeCapacity() / 2 > dropped?.amount ?? 0)) {
                            target = storage;
                        } else {
                            target = dropped;
                        }
                    } else if (crisisRooms.length > 0 && roomItem.items.length - reassignedWorker > ROOM_MIN_WORKERS) {
                        console.log('transfer');
                        role = WorkerRoles.move;
                        target = crisisRooms[0].room.controller;
                        reassignedWorker++;
                    } else {
                        if (first || constructionSites.length === 0) {
                            console.log('first ' + constructionSites);
                            first = false;
                            role = WorkerRoles.upgrade;
                            target = roomItem.room.controller;
                        } else {
                            role = WorkerRoles.build;
                            target = constructionSites.sort((a, b) => item._creep.pos.getRangeTo(a) - item._creep.pos.getRangeTo(b))[0];
                        }
                    }

                    workerMemory.target = target;
                    workerMemory.role = role;
                }

                item.executeRole();
            });
        });
    }
}
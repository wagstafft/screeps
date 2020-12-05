import { Manager, RoomItem } from "./Manager";
import { getUtil, StrutureSearchTypes } from "../Utils";
import { Miner, MinerTarget, MinerRoles, MinerMemory } from "../ManagedEntities/Miner";

export class MinerManager extends Manager<Miner> {
    name(): string {
        return "Miner Manager";
    }

    constructor(rooms: Room[]) {
        super(rooms);
    }

    findManageditems(rooms: Room[]): RoomItem<Miner>[] {
        return rooms.map((room) => {
            let creeps: Creep[] = room.find(FIND_CREEPS).filter((creep) => creep.name.toLowerCase().includes('miner')).sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));
            return { room: room, items: creeps.map((creep) => new Miner(creep)) };
        });
    }

    getMinerSourceCounts(room: Room): {source: Source, count: number}[] {
        let sourceCount: {source: Source, count: number}[] = [];
        let sources = room.find(FIND_SOURCES);

        for (let source of sources) {
            let minableLocations: number = 0;

            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (room.getTerrain().get(source.pos.x + i, source.pos.y + j) === 0) {
                        minableLocations++;
                    }
                }
            }

            sourceCount.push({source: source, count: 1});//minableLocations});
        }

        return sourceCount;
    }

    manage(): void {
        let crisisRooms: RoomItem<Miner>[] = [];
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
            let sourceMinerCounts: {source: Source, count: number}[] = this.getMinerSourceCounts(roomItem.room);
            roomItem.items.forEach((item) => {
                let minerMemory: MinerMemory = item._creep.memory as MinerMemory;

                // minerMemory.target = null;
                // minerMemory.role = undefined;
                
                let role = MinerRoles.idle;
                let target: MinerTarget = null;

                if (minerMemory.role === undefined || !minerMemory.target) {
                    if (item._creep.store.getCapacity() > 0 && item._creep.store.getFreeCapacity() === 0) {
                        let spawn = item._creep.room.find(FIND_MY_SPAWNS)[0];
                        target = spawn as any;
                        role = MinerRoles.transfer;
                    } else {
                        target = sourceMinerCounts[0].source;
                        role = MinerRoles.harvest;
                        sourceMinerCounts[0].count--;
                    }

                    minerMemory.role = role;
                    minerMemory.target = target;
                } else {
                        let target = Game.getObjectById(minerMemory.target.id);
                        let source = sourceMinerCounts.find((source) => source.source.id === minerMemory.target.id);
                        if (source) {
                            source.count--;
                        }
                }

                if (sourceMinerCounts[0].count === 0) {
                    sourceMinerCounts.splice(0,1);
                }

                item.executeRole();
            });
        });
    }
}
export enum StrutureSearchTypes {
    container = 1,
    storage = 2,
    extension = 3,
    spawners = 4,
    allStorage = 5,
    allWithDrawableStorage = 6,
    road = 7,
    tower = 8,
    rampart = 9,
    allStructures = 100,
}

interface searchResults {
    structures: Structure[],
    searchType: StrutureSearchTypes
}

interface roomSearchResults {
    room: Room,
    searchs: searchResults[]
}

// TODO calculate safe rooms, so screeps can flee
class Util {
    private _structureSearchs: roomSearchResults[] = [];

    // index by rooms then by structureSearchTypes
    private getRoomResults: (room: Room) => searchResults[] = (room) => this._structureSearchs.find((search) => search.room === room)?.searchs;
    private getSearchTypeResults: (room: Room, searchType: StrutureSearchTypes) => Structure[] = (room, searchType) => this.getRoomResults(room).find((result) => result.searchType === searchType)?.structures;

    public searchStructures(searchRoom: Room, searchType: StrutureSearchTypes): Structure[] {
        let cachedRoomResults: searchResults[] = this.getRoomResults(searchRoom);
        // Have we ever searched this room?
        if (!cachedRoomResults) {
            let result: Structure[] = [];

            result = result.concat(searchRoom.find(FIND_STRUCTURES));
            result = result.concat(searchRoom.find(FIND_MY_STRUCTURES));
            result = result.filter((structure) => structure.structureType !== "constructedWall");

            result = result.filter((x, index) => {
                return result.indexOf(x) === index
            });

            let searchResults: searchResults[] = [];
            searchResults.push({ structures: result, searchType: StrutureSearchTypes.allStructures })
            this._structureSearchs.push({ room: searchRoom, searchs: searchResults });

            let filteredResult: Structure[];

            filteredResult = result.filter((structure) => structure.structureType === "container");
            searchResults.push({ structures: filteredResult, searchType: StrutureSearchTypes.container });

            filteredResult = result.filter((structure) => structure.structureType === "storage");
            searchResults.push({ structures: filteredResult, searchType: StrutureSearchTypes.storage });

            filteredResult = result.filter((structure) => structure.structureType === "extension");
            searchResults.push({ structures: filteredResult, searchType: StrutureSearchTypes.extension });

            filteredResult = result.filter((structure) => structure.structureType === "spawn");
            searchResults.push({ structures: filteredResult, searchType: StrutureSearchTypes.spawners });

            filteredResult = result.filter((structure) =>
                structure.structureType === "tower" ||
                structure.structureType === "container" ||
                structure.structureType === "storage" ||
                structure.structureType === "extension" ||
                structure.structureType === "spawn");
            searchResults.push({ structures: filteredResult, searchType: StrutureSearchTypes.allStorage });

            filteredResult = result.filter((structure) =>
                structure.structureType === "container" ||
                structure.structureType === "storage");

            searchResults.push({ structures: filteredResult, searchType: StrutureSearchTypes.allWithDrawableStorage });

            filteredResult = result.filter((structure) => structure.structureType === "road");
            searchResults.push({ structures: filteredResult, searchType: StrutureSearchTypes.road });

            filteredResult = result.filter((structure) => structure.structureType === "rampart");
            searchResults.push({ structures: filteredResult, searchType: StrutureSearchTypes.rampart });

            filteredResult = result.filter((structure) => structure.structureType === "tower");
            searchResults.push({ structures: filteredResult, searchType: StrutureSearchTypes.tower });

            this._structureSearchs.push({ room: searchRoom, searchs: searchResults });
        }

        return this.getSearchTypeResults(searchRoom, searchType);
    }

    public getAllDepositableEnergy(room: Room): AnyStoreStructure[] {
        if (this.searchStructures(room, StrutureSearchTypes.allStorage).length === 0) {
            return [];
        }
        return this.searchStructures(room, StrutureSearchTypes.allStorage).filter((struct) => struct as AnyStoreStructure).map((struct) => struct as AnyStoreStructure);
    }

    public getAllWithDrawableEnergy(room: Room): AnyStoreStructure[] {
        if (this.searchStructures(room, StrutureSearchTypes.allWithDrawableStorage).length === 0) {
            return [];
        }
        return this.searchStructures(room, StrutureSearchTypes.allWithDrawableStorage).filter((struct) => struct as AnyStoreStructure).map((struct) => struct as AnyStoreStructure);
    }


    public getUsableEnergy(room: Room): number {
        return room.energyAvailable;
    }

    public getUsableEnergyRatio(room: Room): number {
        return room.energyAvailable / room.energyCapacityAvailable
    }

    public getStorableEnergy(room: Room): number {
        if (this.searchStructures(room, StrutureSearchTypes.allWithDrawableStorage).length === 0) {
            return 0;
        }
        return this.searchStructures(room, StrutureSearchTypes.allWithDrawableStorage).map((struct) => {
            let store = struct as StructureStorage | StructureContainer;
            return store.store.getCapacity();
        }).reduce((a, b) => {
            return a + b;
        });
    }

    public getUsedStorableEnergy(room: Room): number {
        if (this.searchStructures(room, StrutureSearchTypes.allWithDrawableStorage).length === 0) {
            return 0;
        }
        return this.searchStructures(room, StrutureSearchTypes.allWithDrawableStorage).map((struct) => {
            let store = struct as StructureStorage | StructureContainer;
            return store.store.getUsedCapacity();
        }).reduce((a, b) => {
            return a + b;
        });
    }

    public getStorableEnergyRatio(room: Room): number {
        return this.getUsedStorableEnergy(room) / this.getStorableEnergy(room);
    }

    public creepTypeMatch(creepA: Creep, bodyToTest: BodyPartDefinition[]) {
        if (creepA.body.length === bodyToTest.length) {
            let sortedBody = creepA.body.map((body) => body.type).sort((a, b) => a === b ? 0 : a > b ? 1 : -1);
            let sortedTestBody = bodyToTest.map((body) => body.type).sort((a, b) => a === b ? 0 : a > b ? 1 : -1);

            for (let i = 0; i < sortedBody.length; i++) {
                if (sortedBody[i] !== sortedTestBody[i]) {
                    return false;
                }
            }

            return true;
        }

        return false;
    }

    public calculateCreepCost(bodyToTest: BodyPartDefinition[]) {
        let cost = 0;
        for (let i in bodyToTest) {
            cost += BODYPART_COST[bodyToTest[i].type];
        }
        return cost;
    }

    public delayedSay(creep: Creep, message: string) {
        if (Game.time % 1 === 0) {
            creep.say(message);
        }
    }
}

const UTIL = new Util();

export let getUtil = () => UTIL;
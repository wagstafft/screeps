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

class Util {
    private _structureSearchs: roomSearchResults[] = [];

    // index by rooms then by structureSearchTypes
    private getRoomResults: (room: Room) => searchResults[] = (room) => this._structureSearchs.find((search) => search.room === room)?.searchs;
    private getSearchTypeResults: (room: Room, searchType: StrutureSearchTypes) => Structure[] = (room, searchType) => this.getRoomResults(room).find((result) => result.searchType === searchType)?.structures;

    public SearchStructures(searchRoom: Room, searchType: StrutureSearchTypes): Structure[] {
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
}

const UTIL = new Util();

export let getUtil = () => UTIL;
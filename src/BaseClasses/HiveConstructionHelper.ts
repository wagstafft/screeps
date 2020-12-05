/*
0 	— 	Roads, 5 Containers
1 	200 	Roads, 5 Containers, 1 Spawn
2 	45,000 	Roads, 5 Containers, 1 Spawn, 5 Extensions (50 capacity), Ramparts (300K max hits), Walls
3 	135,000 	Roads, 5 Containers, 1 Spawn, 10 Extensions (50 capacity), Ramparts (1M max hits), Walls, 1 Tower
4 	405,000 	Roads, 5 Containers, 1 Spawn, 20 Extensions (50 capacity), Ramparts (3M max hits), Walls, 1 Tower, Storage
5 	1,215,000 	Roads, 5 Containers, 1 Spawn, 30 Extensions (50 capacity), Ramparts (10M max hits), Walls, 2 Towers, Storage, 2 Links
6 	3,645,000 	Roads, 5 Containers, 1 Spawn, 40 Extensions (50 capacity), Ramparts (30M max hits), Walls, 2 Towers, Storage, 3 Links, Extractor, 3 Labs, Terminal
7 	10,935,000 	Roads, 5 Containers, 2 Spawns, 50 Extensions (100 capacity), Ramparts (100M max hits), Walls, 3 Towers, Storage, 4 Links, Extractor, 6 Labs, Terminal
8 	— 	Roads, 5 Containers, 3 Spawns, 60 Extensions (200 capacity), Ramparts (300M max hits), Walls, 6 Towers, Storage, 6 Links, Extractor, 10 Labs, Terminal, Observer, Power Spawn
*/
const ROOM_WIDTH = 50;
const ROOM_HEIGHT = 50;
let min_extension_width = 0;
let max_extension_width = 0;
let min_extension_height = 0;
let max_extension_height = 0;
type allowedStructureLimits = {
    spawns: number,
    extensions: number,
    towers: number,
    links: number,
    labs: number,
}
const BUILDINGS_ALLOWED_RCL: { levels: allowedStructureLimits[] } = {
    levels: [
        { spawns: 0, extensions: 0, towers: 0, links: 0, labs: 0 },
        { spawns: 1, extensions: 0, towers: 0, links: 0, labs: 0 },
        { spawns: 1, extensions: 5, towers: 0, links: 0, labs: 0 },
        { spawns: 1, extensions: 10, towers: 1, links: 0, labs: 0 },
        { spawns: 1, extensions: 20, towers: 1, links: 0, labs: 0 },
        { spawns: 1, extensions: 30, towers: 2, links: 2, labs: 0 },
        { spawns: 1, extensions: 40, towers: 2, links: 3, labs: 3 },
        { spawns: 2, extensions: 50, towers: 3, links: 4, labs: 6 },
        { spawns: 3, extensions: 60, towers: 6, links: 6, labs: 10 },
    ]
};
export class HiveConstructionHelper {
    _room: Room;
    constructor(room: Room) {
        this._room = room;
    }

    build() {
        switch (this._room.controller?.level) {
            // would like to eventually set outside at least 10 slots
            // 6 towers
            // 1 storage
            // 3 nukers
            // all around the spawner so maybe replace the extensions over time as we can build those things?
            // TODO don't build too close to resources
            // TODO build a network of roads inbetween the structures
            // TODO build roads to source
            case 8:
            case 7:
            case 6:
            case 5:
            case 4:
                this.handleStorage();
            case 3:
                this.handleTowers();
            case 2:
                this.handleExtensions();

                if (this._room.find(FIND_MY_CONSTRUCTION_SITES).length === 0) {
                    this.handleRoads();
                }
            case 1:
            case 0:
        }
    }

    handleTowers() {
        if (this._room.find(FIND_MY_STRUCTURES).filter((structure) => structure.structureType === 'tower').length < BUILDINGS_ALLOWED_RCL.levels[this._room.controller?.level ?? 0].towers) {
            let spawns = this._room.find(FIND_MY_SPAWNS);
            let changedChecker = this.checkerboardPositions(spawns[0].pos).sort((a, b) => spawns[0].pos.getRangeTo(a) - spawns[0].pos.getRangeTo(b));
            for (let pos of changedChecker) {
                if (this.checkValidConstructionSite(pos) && this._room.createConstructionSite(pos.x, pos.y, "tower") === 0) {
                    break;
                }
            }
        }
    }

    handleStorage() {
        if (this._room.find(FIND_MY_STRUCTURES).filter((structure) => structure.structureType === 'storage').length === 0) {
            let spawns = this._room.find(FIND_MY_SPAWNS);
            let changedChecker = this.checkerboardPositions(spawns[0].pos).sort((a, b) => spawns[0].pos.getRangeTo(a) - spawns[0].pos.getRangeTo(b));
            for (let pos of changedChecker) {
                if (this.checkValidConstructionSite(pos) && this._room.createConstructionSite(pos.x, pos.y, "storage") === 0) {
                    break;
                }
            }
        }
    }

    handleRoads() {
        if (min_extension_height !== 0) {
            let spawns = this._room.find(FIND_MY_SPAWNS);
            let structures = this._room.find(FIND_MY_STRUCTURES).filter((structure) => structure.structureType === 'extension' || structure.structureType === 'storage' || structure.structureType === 'spawn' || structure.structureType === 'tower');
            let changedChecker = this.checkerboardPositions(spawns[0].pos).sort((a, b) => spawns[0].pos.getRangeTo(a) - spawns[0].pos.getRangeTo(b));

            for (let structure of structures) {
                if (this._room.getTerrain().get(structure.pos.x -1, structure.pos.y) !== 1)
                this._room.createConstructionSite(structure.pos.x - 1, structure.pos.y, "road");
                if (this._room.getTerrain().get(structure.pos.x +1, structure.pos.y) !== 1)
                this._room.createConstructionSite(structure.pos.x + 1, structure.pos.y, "road");
                if (this._room.getTerrain().get(structure.pos.x, structure.pos.y + 1) !== 1)
                this._room.createConstructionSite(structure.pos.x, structure.pos.y + 1, "road");
                if (this._room.getTerrain().get(structure.pos.x, structure.pos.y - 1) !== 1)
                this._room.createConstructionSite(structure.pos.x, structure.pos.y - 1, "road");
            }
        }
    }

    handleExtensions() {
        let extensionLimits = BUILDINGS_ALLOWED_RCL.levels[this._room.controller?.level ?? 0].extensions;
        let currentExtensions = this._room.find(FIND_MY_STRUCTURES).filter((structure) => structure.structureType === 'extension').length;
        let constructionSites = this._room.find(FIND_CONSTRUCTION_SITES).filter((site) => site.structureType === 'extension').length;
        let spawns = this._room.find(FIND_MY_SPAWNS);
        if (spawns.length > 0) {
            let pos = spawns[0].pos;
            this.checkerboardPositions(spawns[0].pos);

            let changedChecker = this.checkerboardPositions(spawns[0].pos).sort((a, b) => spawns[0].pos.getRangeTo(a) - spawns[0].pos.getRangeTo(b)).slice(30);

            for (let pos of changedChecker) {
                if (this.checkValidConstructionSite(pos)) {
                    if (this._room.createConstructionSite(pos.x, pos.y, "extension") === 0) {
                        constructionSites++;
                    }
                }
            }
        }

        let extensions = this._room.find(FIND_MY_STRUCTURES).filter((structure) => structure.structureType === 'extension');
        if (extensions.length > 0) {
            min_extension_height = Math.min(...extensions.map((struct) => struct.pos.y));
            max_extension_height = Math.max(...extensions.map((struct) => struct.pos.y));
            min_extension_width = Math.min(...extensions.map((struct) => struct.pos.x));
            max_extension_width = Math.max(...extensions.map((struct) => struct.pos.x));
        }
        // this._room.find(FIND_CONSTRUCTION_SITES).forEach((site) => site.remove());
        // this._room.find(FIND_MY_STRUCTURES).filter((structure) => structure.structureType === 'extension').forEach((struct) => struct.destroy());
    }

    checkPositionClear(pos: RoomPosition): boolean {
        return /*this._room.getTerrain().get(pos.x, pos.y) === 0 || */this._room.find(FIND_STRUCTURES).filter((structure) => structure.pos === pos).length === 0 && this._room.find(FIND_MY_STRUCTURES).filter((structure) => structure.pos === pos).length === 0;
    }

    checkDiagonalPositions(pos: RoomPosition): boolean {
        for (let i = -1; i <= 1; i++) {
            let checkPos = pos;
            checkPos.x += i;
            checkPos.y += i;
            if (!this.checkPositionClear(checkPos)) {
                return false;
            }
        }

        return true;
    }

    checkHorizontalPositions(pos: RoomPosition): boolean {
        for (let i = -1; i < 1; i++) {
            let checkPos = pos;
            checkPos.x += i;
            checkPos.y += i;
            if (this._room.getTerrain().get(checkPos.x, checkPos.y) !== 0) {
                return false;
            }
        }

        return true;
    }

    checkValidConstructionSite(pos: RoomPosition): boolean {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (pos.x + i < 0 || pos.x + i > 49 || pos.y + j < 0 || pos.y + j > 49) {
                    continue;
                }

                if (new RoomPosition(pos.x + i, pos.y + j, pos.roomName).look().find((lookResult) => lookResult.type === LOOK_SOURCES || lookResult.type === LOOK_DEPOSITS || lookResult.type === LOOK_MINERALS)) {
                    return false;
                }
            }
        }
        return true;
    }

    checkerboardPositions(pos: RoomPosition): RoomPosition[] {
        let result: RoomPosition[] = [];

        for (let i = 0; i < 50; i += 1) {
            for (let j = -1 * (pos.y / 2) + i % 2; j < 50; j += 2) {
                if (pos.x + i > 49 || pos.x - i < 0 || pos.y + j > 49 || pos.y - j < 0) {
                    continue;
                }
                if (this.checkValidConstructionSite(new RoomPosition(pos.x + i, pos.y + j, pos.roomName)))
                    result.push(new RoomPosition(pos.x + i, pos.y + j, pos.roomName));
                if (this.checkValidConstructionSite(new RoomPosition(pos.x + - i, pos.y + j, pos.roomName)))
                    result.push(new RoomPosition(pos.x + - i, pos.y + j, pos.roomName));
                if (this.checkValidConstructionSite(new RoomPosition(pos.x + i, pos.y + j, pos.roomName)))
                    result.push(new RoomPosition(pos.x + i, pos.y + j, pos.roomName));
                if (this.checkValidConstructionSite(new RoomPosition(pos.x + - i, pos.y + j, pos.roomName)))
                    result.push(new RoomPosition(pos.x + - i, pos.y + j, pos.roomName));
            }
        }
        return result;
    }
}


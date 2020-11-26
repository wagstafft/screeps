import { HaulerManager } from './../Managers/HaulerManager';
import { TowerManager } from '../Managers/TowerManager';
import BaseEntity = require("./BaseEntity");
import { Manager } from "../Managers/Manager";

enum HiveStates {
    Safe = 1,
    Defense,
}

export interface HiveMemory {
    rooms: Room[],
    spawners: StructureSpawn[]
}

let hiveMemory: HiveMemory | Memory = Memory;

const REFRESH_HIVE_MEMORY_INTERVAL: number = 1;
export class Hive {
    private _rooms: Room[] = [];
    private _spawners: StructureSpawn[] = [];
    private _managers: Manager<BaseEntity>[] = [];

    constructor() {
        // if (hiveMemory.rooms) {
        // console.log('testing memory ' + hiveMemory);
        // console.log('length of memory ' + hiveMemory.rooms.length + hiveMemory.spawners.length)
        // }
        // if (Game.time % REFRESH_HIVE_MEMORY_INTERVAL == 0 || !hiveMemory) {
        //     console.log('REFRESHING HIVE TIME ' + Game.time);
        //     console.log('spawns ' + Game.spawns);

        for (const i in Game.spawns) {
            this._spawners.push(Game.spawns[i]);
            this._rooms.push(Game.spawns[i].room);
        }

        hiveMemory = {
            rooms: this._rooms,
            spawners: this._spawners
        }

        this._managers.push(new TowerManager(hiveMemory.rooms));
        this._managers.push(new HaulerManager(hiveMemory.rooms));

        this._managers.forEach((manager) => {
            manager.report();
        });
    }

    public state: HiveStates;
}
import { HaulerManager } from './../Managers/HaulerManager';
import { WorkerManager } from './../Managers/WorkerManager';
import { TowerManager } from '../Managers/TowerManager';
import BaseEntity = require("./BaseEntity");
import { Manager } from "../Managers/Manager";
import { getUtil } from '../Utils';
import { HiveConstructionHelper } from './HiveConstructionHelper';
import { MinerManager } from '../Managers/MinerManager';

let minerCount = 0;
let haulerCount = 0;
let rangedDefenderCount = 0;
let meleeDefenderCount = 0;
let claimDefenderCount = 0;
let workerCount = 0;
let MINER_LIMIT = 6;
let HAULER_LIMIT = 0;
let WORKER_LIMIT = 0;
const BASE_WORKER_LIMIT = 1.5;
const BASE_HAULER_LIMIT = 1;
const RANGED_DEFENDER_LIMIT = 0;
const CLAIM_DEFENDER_LIMIT = 0;
const MELEE_DEFENDER_LIMIT = 0;
function getMineableLocations(room: Room) {
    MINER_LIMIT = 0;
    let minerSourceAllocation = [];
    let sourceCount = room.find(FIND_SOURCES);

    for (let i = 0; i < sourceCount.length; i++) {
        let source = room.find(FIND_SOURCES)[i];
        let mineableCount = 0;
        for (let j = -1; j <= 1; j++) {
            for (let k = -1; k <= 1; k++) {
                if (j !== 0 || k !== 0) {
                    if (source.room.find(FIND_STRUCTURES).filter((test) => test.pos.x === source.pos.x + j && test.pos.y === source.pos.y + k).length === 1) {
                        mineableCount += 1;
                    } else {
                        let terrain = Game.map.getRoomTerrain(source.room.name).get(source.pos.x + j, source.pos.y + k);
                        if (terrain === 0) {
                            mineableCount += 1;
                        }
                    }
                }
            }
        }
        minerSourceAllocation.push({ source: i, minerCount: 1/*minerCount*/ });
        MINER_LIMIT += 1;//mineableCount;
    }
    return minerSourceAllocation;
}

function printReport() {
    let rooms: Room[] = [];
    for (let spawn in Game.spawns) {
        if (rooms.indexOf(Game.spawns[spawn].room) === -1) {
            rooms.push(Game.spawns[spawn].room);
        }
    }
    console.log('\n================================================================================START REPORT==================================================================================================');
    console.log(`Room🛏️\t\tUSB⚡\t\tStore⚡\t\t\tTowers🏢\tTower⚡\t\tWall HP\t\tMiners⛏️\tHaulers🚚\tWorkers👷\tRanged🏹\tMelee⚔️\t\tClaim🏁`)
    rooms.forEach((room) => {
        getCreepCounts(room);
        let towers = room.find<StructureTower>(FIND_STRUCTURES).filter((structure) => structure.structureType === 'tower');
        let towerEng = towers.length > 0 ? towers.map((x) => x.store.energy).reduce((a, b) => a + b) : 0;
        let ramparts = room.find<StructureRampart>(FIND_STRUCTURES).filter((structure) => structure.structureType === 'rampart');
        let towerHitAvg = ramparts.length > 0 ? ((ramparts.map((rampart) => rampart.hits).reduce((a, b) => a + b) / ramparts.length) / 1_000_000).toFixed(2) + 'M' : 0;

        let roomStr = `${room}\t`;
        roomStr += `${getUtil().getUsableEnergy(room)}(${getUtil().getUsableEnergyRatio(room).toFixed(2)})\t`;
        roomStr += `${getUtil().getUsedStorableEnergy(room)}/${getUtil().getStorableEnergy(room)}(${getUtil().getStorableEnergyRatio(room).toFixed(2)})\t`;
        roomStr += `${towers.length}\t\t`;
        roomStr += `${towerEng}/${towers.length * 1000}\t`;
        roomStr += `${towerHitAvg}\t\t`;
        roomStr += `${minerCount}/${MINER_LIMIT}\t\t`;
        roomStr += `${haulerCount}/${HAULER_LIMIT}\t\t`;
        roomStr += `${workerCount}/${WORKER_LIMIT}\t\t`;
        roomStr += `${rangedDefenderCount}/${RANGED_DEFENDER_LIMIT}\t\t`;
        roomStr += `${meleeDefenderCount}/${MELEE_DEFENDER_LIMIT}\t\t`;
        roomStr += `${claimDefenderCount}/${CLAIM_DEFENDER_LIMIT}`;
        console.log(roomStr);
        // console.log(`${room}\t${getUtil().getUsableEnergy(room)}(${getUtil().getUsableEnergyRatio(room).toFixed(2)})\t${getUtil().getUsedStorableEnergy(room)}/${getUtil().getStorableEnergy(room)}(${getUtil().getStorableEnergyRatio(room).toFixed(2)})\t${towers.length}\t\t${towerEng}/${towers.length * 1000}\t${towerHitAvg}\t\t${minerCount}/${MINER_LIMIT}\t\t${haulerCount}/${HAULER_LIMIT}\t\t${workerCount}/${WORKER_LIMIT}\t\t${rangedDefenderCount}/${RANGED_DEFENDER_LIMIT}\t\t${meleeDefenderCount}/${MELEE_DEFENDER_LIMIT}\t\t${claimDefenderCount}/${CLAIM_DEFENDER_LIMIT}`);
    });
    console.log('=================================================================================END REPORT===================================================================================================\n');
}

function getCreepCounts(room: Room) {
    getMineableLocations(room);
    minerCount = 0;
    haulerCount = 0;
    rangedDefenderCount = 0;
    meleeDefenderCount = 0;
    workerCount = 0;
    let sourceCount = room.find(FIND_SOURCES).length;
    WORKER_LIMIT = Math.ceil(BASE_WORKER_LIMIT * sourceCount);
    HAULER_LIMIT = BASE_HAULER_LIMIT * sourceCount;

    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        if (creep.room === room) {
            if (name.includes('harvest') || name.includes('miner')) {
                minerCount++;
            } else if (name.includes('defenderRanged')) {
                rangedDefenderCount++;
            } else if (name.includes('defenderMelee')) {
                meleeDefenderCount++;
            } else if (name.includes('hauler')) {
                haulerCount++;
            } else if (name.includes('worker')) {
                workerCount++;
            } else if (name.includes('Claim')) {
                claimDefenderCount++;
            }
        }
    }
}

function getSpawnBudget(spawn: StructureSpawn): number {
    let budget = getUtil().getUsableEnergy(spawn.room) > 600 ? getUtil().getUsableEnergy(spawn.room) * .75 : 300;
    return budget;
}

function spawnMiner(spawn: StructureSpawn) {
    let budget = getSpawnBudget(spawn);
    let body : BodyPartConstant[] = [];

    if (getUtil().getUsableEnergy(spawn.room) < budget) {
        return;
    }

    while (budget >= BODYPART_COST[MOVE]) {
        if (BODYPART_COST[MOVE] <= budget) {
            budget -= BODYPART_COST[MOVE];
            body.push(MOVE);
        }
        if (BODYPART_COST[WORK] <= budget) {
            budget -= BODYPART_COST[WORK];
            body.push(WORK);
        }
    }

    spawnCreep(spawn, `minerLvl${body.length}`, body, minerCount, MINER_LIMIT);
}

function spawnHauler(spawn: StructureSpawn) {
    let budget = getSpawnBudget(spawn);
    let body : BodyPartConstant[] = [];

    if (getUtil().getUsableEnergy(spawn.room) < budget) {
        return;
    }

    while (budget >= BODYPART_COST[CARRY]) {
        if (BODYPART_COST[CARRY] <= budget) {
            budget -= BODYPART_COST[CARRY];
            body.push(CARRY);
        }
        if (BODYPART_COST[MOVE] <= budget) {
            budget -= BODYPART_COST[MOVE];
            body.push(MOVE);
        }
    }

    spawnCreep(spawn, `haulerLvl${body.length}`, body, haulerCount, HAULER_LIMIT);
}

function spawnWorker(spawn: StructureSpawn) {
    let budget = getSpawnBudget(spawn);
    let body : BodyPartConstant[] = [];

    if (getUtil().getUsableEnergy(spawn.room) < budget) {
        return;
    }

    while (budget >= BODYPART_COST[MOVE]) {
        if (BODYPART_COST[MOVE] <= budget) {
            budget -= BODYPART_COST[MOVE];
            body.push(MOVE);
        }
        if (BODYPART_COST[WORK] <= budget) {
            budget -= BODYPART_COST[WORK];
            body.push(WORK);
        }
        if (BODYPART_COST[CARRY] <= budget) {
            budget -= BODYPART_COST[CARRY];
            body.push(CARRY);
        }
    }

    spawnCreep(spawn, `workerLvl${body.length}`, body, workerCount, WORKER_LIMIT);
}

function spawnHarvester(spawn: StructureSpawn) {
    spawnCreep(spawn, 'minerLvl0', [CARRY, MOVE, WORK], minerCount, MINER_LIMIT);
}

function spawnRangedDefender(spawn: StructureSpawn) {
    let budget = getSpawnBudget(spawn);
    let body : BodyPartConstant[] = [];

    if (getUtil().getUsableEnergy(spawn.room) < budget) {
        return;
    }

    while (budget >= BODYPART_COST[MOVE]) {
        if (BODYPART_COST[MOVE] <= budget) {
            budget -= BODYPART_COST[MOVE];
            body.push(MOVE);
        }
        if (BODYPART_COST[RANGED_ATTACK] <= budget) {
            budget -= BODYPART_COST[RANGED_ATTACK];
            body.push(RANGED_ATTACK);
        }
        if (BODYPART_COST[TOUGH] <= budget) {
            budget -= BODYPART_COST[TOUGH];
            body.push(TOUGH);
        }
    }

    spawnCreep(spawn, `defenderRanged${body.length}`, body, minerCount, MINER_LIMIT);
}

function spawnMeleeDefender(spawn: StructureSpawn) {
    let budget = getSpawnBudget(spawn);
    let body : BodyPartConstant[] = [];

    if (getUtil().getUsableEnergy(spawn.room) < budget) {
        return;
    }

    while (budget >= BODYPART_COST[MOVE]) {
        if (BODYPART_COST[MOVE] <= budget) {
            budget -= BODYPART_COST[MOVE];
            body.push(MOVE);
        }
        if (BODYPART_COST[ATTACK] <= budget) {
            budget -= BODYPART_COST[RANGED_ATTACK];
            body.push(RANGED_ATTACK);
        }
        if (BODYPART_COST[TOUGH] <= budget) {
            budget -= BODYPART_COST[TOUGH];
            body.push(TOUGH);
        }
        if (BODYPART_COST[TOUGH] <= budget) {
            budget -= BODYPART_COST[TOUGH];
            body.push(TOUGH);
        }
    }

    spawnCreep(spawn, `defenderMelee${body.length}`, body, minerCount, MINER_LIMIT);
}

function spawnClaimDefender(spawn: StructureSpawn) {
    spawnCreep(spawn, 'defenderClaim', [CLAIM, MOVE], claimDefenderCount, CLAIM_DEFENDER_LIMIT);
}
function spawnCreep(spawn: StructureSpawn, name: string, parts: BodyPartConstant[], count: number, limit: number) {
    for (let i = 0; i < limit * 10; i++) {
        let spawnRetCode = spawn.spawnCreep(parts, `${name}${i}`)
        console.log('ret code ' + spawnRetCode);
        if (spawnRetCode === 0) {
            console.log(`Spawning ${name} with parts ${parts} we have ${++count} currently result ${spawnRetCode}`);
            return 0;
            // -3 name already used -4 spawner busy
        } else if (spawnRetCode !== -3 && spawnRetCode !== -4) {
            console.log(`Failed to spawn ${spawnRetCode}`);
            return spawnRetCode;
        }
    }
}

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
// TODO spawn managers
export class Hive {
    private _rooms: Room[] = [];
    private _spawners: StructureSpawn[] = [];
    private _managers: Manager<BaseEntity>[] = [];

    constructor() {
        for (const i in Game.rooms) {
            let room = Game.rooms[i];
            let spawners = room.find(FIND_MY_SPAWNS);
            this._spawners = this._spawners.concat(spawners);
            this._rooms.push(room);
        }

        hiveMemory = {
            rooms: this._rooms,
            spawners: this._spawners
        }

        if (Game.time % 100 === 0) {
            this._rooms.forEach((room) => {
                let hiveConsturctionHelper = new HiveConstructionHelper(room);
                hiveConsturctionHelper.build();
            });
        }
        this._managers.push(new TowerManager(hiveMemory.rooms));
        this._managers.push(new HaulerManager(hiveMemory.rooms));
        this._managers.push(new WorkerManager(hiveMemory.rooms));
        this._managers.push(new MinerManager(hiveMemory.rooms));

        for (let i = 0; i < this._spawners.length; i++) {
            getCreepCounts(this._spawners[i].room);
            console.log(this._spawners[i].room + ' miner ' + minerCount);
            if (minerCount < MINER_LIMIT && minerCount <= haulerCount) {
                if (minerCount === 0 && haulerCount === 0) {
                    spawnHarvester(this._spawners[i]);
                } else {
                    spawnMiner(this._spawners[i]);
                }
            } else if (haulerCount < HAULER_LIMIT) {
                spawnHauler(this._spawners[i]);
            } else if (workerCount < WORKER_LIMIT) {
                spawnWorker(this._spawners[i]);
            } else if (Game.time % 5 === 0) {
                if (rangedDefenderCount < RANGED_DEFENDER_LIMIT) {
                    spawnRangedDefender(this._spawners[i]);
                } else if (meleeDefenderCount < MELEE_DEFENDER_LIMIT) {
                    spawnMeleeDefender(this._spawners[i]);
                } else if (claimDefenderCount < CLAIM_DEFENDER_LIMIT) {
                    spawnClaimDefender(this._spawners[i]);
                }
            }
        }

        printReport();
        this._managers.forEach((manager) => {
            manager.report();
        });

    }

    public state: HiveStates;
}
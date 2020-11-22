// import {roleHarvester} from './role';
import { Hive } from './BaseClasses/Hive';
import roles = require('./Role');
import {getUtil, StrutureSearchTypes } from './Utils';
//TODO finish Tower manager to repair, and defend
//TODO Hauler Manager
//TODO Hauler Manger picks up loose source
//TODO Hauler Manager picks up from Storage in emergency
//TODO Hauler store energy when needed in extensions, and storage
//TODO container building and storing
//TODO repair
//TODO take over second room
//TODO build roads automatically
//TODO build walls automatically
//TODO dynamically use spawners(not hard locked to Spawner1)
//TODO dynalically scale up spawns to take advantage of more or less energy capacity
const debug_mode = true;
let minerCount = 0;
let haulerCount = 0;
let rangedDefenderCount = 0;
let meleeDefenderCount = 0;
let claimDefenderCount = 0;
let workerCount = 0;
let MINER_LIMIT = 6;
const HAULER_LIMIT = 8;
const WORKER_LIMIT = 5;
const RANGED_DEFENDER_LIMIT = 0;
const CLAIM_DEFENDER_LIMIT = 0;
const MELEE_DEFENDER_LIMIT = 0;
function getMineableLocations() {
    const HIVE = new Hive();
    MINER_LIMIT = 0;
    let minerSourceAllocation = [];
    let sourceCount = Game.spawns['Spawn1'].room.find(FIND_SOURCES);

    for (let i = 0; i < sourceCount.length; i++) {
        let source = Game.spawns['Spawn1'].room.find(FIND_SOURCES)[i];
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
        minerSourceAllocation.push({ source: i, minerCount: mineableCount });
        MINER_LIMIT += mineableCount;
    }
    return minerSourceAllocation;
}

function spawnMiner() {
    // spawn('miner', [WORK, WORK, MOVE], minerCount, MINER_LIMIT);
    if (spawn('miner', [WORK, WORK, WORK, MOVE], minerCount, MINER_LIMIT) === ERR_NOT_ENOUGH_ENERGY) {
        spawn('miner', [WORK, WORK, MOVE], minerCount, MINER_LIMIT)
    }
}

function spawnHauler() {
    if (spawn('hauler', [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE], haulerCount, HAULER_LIMIT) === ERR_NOT_ENOUGH_ENERGY) {
        spawn('hauler', [CARRY, CARRY, MOVE], haulerCount, HAULER_LIMIT);
    }
}

function spawnWorker() {
    // spawn('worker', [CARRY, MOVE, WORK, WORK], workerCount, WORKER_LIMIT);

    // 400
    if (spawn('worker', [CARRY, CARRY, MOVE, MOVE, WORK, WORK], workerCount, WORKER_LIMIT)) {

    }
}

function spawnHarvester() {
    spawn('miner', [CARRY, MOVE, WORK], minerCount, MINER_LIMIT);
}

function spawnRangedDefender() {
    if (spawn('defenderRanged', [RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, TOUGH, TOUGH, TOUGH, MOVE, MOVE], rangedDefenderCount, RANGED_DEFENDER_LIMIT) === ERR_NOT_ENOUGH_ENERGY) {
        if (spawn('defenderRanged', [RANGED_ATTACK, RANGED_ATTACK, TOUGH, TOUGH, MOVE, MOVE], rangedDefenderCount, RANGED_DEFENDER_LIMIT) === ERR_NOT_ENOUGH_ENERGY) {
            spawn('defenderRanged', [RANGED_ATTACK, TOUGH, MOVE], rangedDefenderCount, RANGED_DEFENDER_LIMIT);
        }
    }
}

function spawnMeleeDefender() {
    if (spawn('defenderMelee', [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, ATTACK, ATTACK, ATTACK, MOVE, MOVE], meleeDefenderCount, MELEE_DEFENDER_LIMIT) === ERR_NOT_ENOUGH_ENERGY) {
        if (spawn('defenderMelee', [TOUGH, TOUGH, TOUGH, TOUGH, ATTACK, ATTACK, MOVE, MOVE], meleeDefenderCount, MELEE_DEFENDER_LIMIT) === ERR_NOT_ENOUGH_ENERGY) {
            spawn('defenderMelee', [TOUGH, ATTACK, MOVE], meleeDefenderCount, MELEE_DEFENDER_LIMIT);
        }
    }
}

function spawnClaimDefender() {
    spawn('defenderClaim', [CLAIM, MOVE], claimDefenderCount, CLAIM_DEFENDER_LIMIT);
}
function spawn(name: string, parts: BodyPartConstant[], count: number, limit: number) {
    for (let i = 0; i < limit; i++) {
        let spawnRetCode = Game.spawns['Spawn1'].spawnCreep(parts, `${name}${i}`)
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

module.exports.loop = function () {
    let minerAssignedCount = 0;
    let haulerAssignedCount = 0;
    let defenderAssignedCount = 0;
    let workerAssignedCount = 0;
    let minerAllocation = getMineableLocations();
    for (var name in Game.creeps) {
        if (name.includes('miner') || name.includes('harvest')) {
            let requiredMiners = 0;
            for (let allocation of minerAllocation) {
                requiredMiners += allocation.minerCount;
                if (requiredMiners > minerAssignedCount) {
                    minerAssignedCount++;
                    roles.roleHarvester.run(name, allocation.source);
                    break;
                }
            }
        } else if (name.includes('worker')) {
                roles.roleWorker.run(name)
        } else if (name.includes('hauler')) {
            let sourceCount = Game.creeps[name].room.find(FIND_DROPPED_RESOURCES);
            roles.roleHauler.run(name, haulerAssignedCount++ % sourceCount.length);
        } else if (name.includes('defender')) {
            let enemySources = Game.creeps[name].room.find(FIND_HOSTILE_CREEPS);
            if (enemySources.length > 0) {
                roles.roleRangedDefender.run(name, defenderAssignedCount++ % enemySources.length, true, false);
            } else {
                if (Game.time % 5 == 0) {
                    let sourceCount = Game.creeps[name].room.find(FIND_EXIT);
                    roles.roleRangedDefender.run(name, defenderAssignedCount++ % sourceCount.length, false, true);
                }
            }
        }
    }

    function printReport() {
        getCreepCounts();

        let spawn = Game.spawns['Spawn1'];
        console.log('\n================START REPORT==================================');
        console.log(`Room ${spawn.room}`);
        console.log(`Energy ${spawn.store['energy']}/${spawn.store.getCapacity('energy')}`);
        console.log(`Miner Count ${minerCount}/${MINER_LIMIT}`);
        console.log(`Hauler Count ${haulerCount}/${HAULER_LIMIT}`);
        console.log(`Worker Count ${workerCount}/${WORKER_LIMIT}`);
        console.log(`Ranged Defender Count ${rangedDefenderCount}/${RANGED_DEFENDER_LIMIT}`);
        console.log(`Melee Defender Count ${meleeDefenderCount}/${MELEE_DEFENDER_LIMIT}`);
        console.log(`Claim Defender Count ${claimDefenderCount}/${CLAIM_DEFENDER_LIMIT}`);
        console.log('=================END REPORT===================================\n');
    }

    function getCreepCounts() {
        getMineableLocations();
        minerCount = 0;
        haulerCount = 0;
        rangedDefenderCount = 0;
        meleeDefenderCount = 0;
        workerCount = 0;

        for (let name in Game.creeps) {
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
            } else if (name.includes('claim')) {
                claimDefenderCount++;
            }
        }
    }

    // if (Game.time % 4 === 0) {
    //     printReport();
    // }

    printReport();
    if (minerCount < MINER_LIMIT) {
        if (haulerCount === 0) {
            spawnHarvester();
        } else {
            spawnMiner();
        }
    } else if (haulerCount < HAULER_LIMIT) {
        spawnHauler();
    } else if (workerCount < WORKER_LIMIT) {
        spawnWorker();
    } else if (Game.time % 25 === 0) {
        if (rangedDefenderCount < RANGED_DEFENDER_LIMIT) {
            spawnRangedDefender();
        } else if (meleeDefenderCount < MELEE_DEFENDER_LIMIT) {
            spawnMeleeDefender();
        } else if (claimDefenderCount < CLAIM_DEFENDER_LIMIT) {
            spawnClaimDefender();
        }
    }
}

module.exports.loop();
// import {roleHarvester} from './role';
import roles = require('./role');

const debug_mode = true;
let minerCount = 0;
let haulerCount = 0;
let rangedDefenderCount = 0;
let meleeDefenderCount = 0;
let workerCount = 0;
let MINER_LIMIT = 6;
const HAULER_LIMIT = 10;
const WORKER_LIMIT = 6;
const RANGED_DEFENDER_LIMIT = 15;
const MELEE_DEFENDER_LIMIT = 15;

function getMineableLocations() {
    MINER_LIMIT = 0;
    let minerSourceAllocation = [];
    for (let name in Game.creeps) {
        let sourceCount = Game.creeps[name].room.find(FIND_SOURCES);

        for (let i = 0; i < sourceCount.length; i++) {
            let source = Game.creeps[name].room.find(FIND_SOURCES)[i];
            let mineableCount = 0;
            for (let j = -1; j <= 1; j++) {
                for (let k = -1; k <= 1; k++) {
                    if (j !== 0 || k !== 0) {
                        if (Game.map.getRoomTerrain(source.room.name).get(source.pos.x + j, source.pos.y + k) === 0) {
                            mineableCount += 1;
                        }
                    }
                }
            }
            minerSourceAllocation.push({ source: i, minerCount: mineableCount });
            MINER_LIMIT += mineableCount;
        }
        return minerSourceAllocation;
    }
}

function spawnMiner() {
    spawn('miner', [WORK, WORK, MOVE], minerCount, MINER_LIMIT);
}

function spawnHauler() {
    spawn('hauler', [CARRY, CARRY, MOVE], haulerCount, HAULER_LIMIT);
}

function spawnWorker() {
    spawn('worker', [CARRY, MOVE, WORK], workerCount, WORKER_LIMIT);
}

function spawnHarvester() {
    spawn('miner', [CARRY, MOVE, WORK], minerCount, MINER_LIMIT);
}

function spawnRangedDefender() {
    spawn('defenderRanged', [RANGED_ATTACK, TOUGH, MOVE], rangedDefenderCount, RANGED_DEFENDER_LIMIT);
}

function spawnMeleeDefender() {
    spawn('defenderMelee', [TOUGH, ATTACK, MOVE], meleeDefenderCount, MELEE_DEFENDER_LIMIT);
}

function spawn(name: string, parts: BodyPartConstant[], count: number, limit: number) {
    for (let i = 0; i < limit; i++) {
        let spawnRetCode = Game.spawns['Spawn1'].spawnCreep(parts, `${name}${i}`)
        if (spawnRetCode === 0) {
            console.log(`Spawning ${name} with parts ${parts} we have ${++count} currently result ${spawnRetCode}`);
            return;
            // -3 name already used -4 spawner busy
        } else if (spawnRetCode !== -3 && spawnRetCode !== -4) {
            console.log(`Failed to spawn ${spawnRetCode}`);
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
            let sourceCount = Game.creeps[name].room.find(FIND_DROPPED_RESOURCES);
            roles.roleWorker.run(name, workerAssignedCount++ % sourceCount.length);
        } else if (name.includes('hauler')) {
            let sourceCount = Game.creeps[name].room.find(FIND_DROPPED_RESOURCES);
            roles.roleHauler.run(name, haulerAssignedCount++ % sourceCount.length);
        } else if (name.includes('defender')) {
             let enemySources = Game.creeps[name].room.find(FIND_HOSTILE_CREEPS);
             if (enemySources.length > 0) {
             roles.roleRangedDefender.run(name, defenderAssignedCount++ % enemySources.length, true);
             } else {
                let sourceCount = Game.creeps[name].room.find(FIND_EXIT);
                roles.roleRangedDefender.run(name, defenderAssignedCount++ % sourceCount.length, false);
             }
        }
    }

    function printReport() {
        getCreepCounts();

        let spawn = Game.spawns['Spawn1'];
        console.log('\n================START REPORT==================================');
        console.log(`Energy ${spawn.store['energy']}/${spawn.store.getCapacity('energy')}`)
        console.log(`Miner Count ${minerCount}/${MINER_LIMIT}`);
        console.log(`Hauler Count ${haulerCount}/${HAULER_LIMIT}`);
        console.log(`WOrker Count ${workerCount}/${WORKER_LIMIT}`);
        console.log(`Ranged Defender Count ${rangedDefenderCount}/${RANGED_DEFENDER_LIMIT}`);
        console.log(`Melee Defender Count ${meleeDefenderCount}/${MELEE_DEFENDER_LIMIT}`);
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
            }
        }
    }

    if (Game.time % 10 === 0) {
        printReport();
    }

    if (Game.spawns['Spawn1'].store['energy'] === 300) {
        printReport();
        if (minerCount < MINER_LIMIT) {
            if (minerCount === 0) {
                spawnHarvester();
            } else {
                spawnMiner();
            }
        } else if (haulerCount < HAULER_LIMIT) {
            spawnHauler();
        } else if (workerCount < WORKER_LIMIT) {
            spawnWorker();
        } else if (rangedDefenderCount < RANGED_DEFENDER_LIMIT) {
            spawnRangedDefender();
        } else if (meleeDefenderCount < MELEE_DEFENDER_LIMIT) {
            spawnMeleeDefender();
        }
    }
}

module.exports.loop();

// Move
    // var creep = Game.creeps['Harvester1'];
    // var sources = creep.room.find(FIND_SOURCES);
    // if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
    //     creep.moveTo(sources[0]);
    // }

// Spawn
//    Game.spawns['Spawn1'].spawnCreep( [WORK, CARRY, MOVE], 'Harvester2' );

//
// Game.spawns['Spawn1'].spawnCreep( [WORK, CARRY, MOVE], 'Harvester2' );
//     console.log('yay5');
//     var creep = Game.creeps['Harvester1'];

//     if(creep.store.getFreeCapacity() > 0) {
//         var sources = creep.room.find(FIND_SOURCES);
//         if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
//             creep.moveTo(sources[0]);
//         }
//     }
//     else {
//         if( creep.transfer(Game.spawns['Spawn1'], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE ) {
//             creep.moveTo(Game.spawns['Spawn1']);
//         }
//     }
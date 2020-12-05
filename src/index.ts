// import {roleHarvester} from './role';
import { Hive } from './BaseClasses/Hive';
import roles = require('./Role');
import { getUtil } from './Utils';
//TODO Hauler Manager
//TODO Hauler Manger picks up loose source
//TODO Hauler Manager picks up from Storage in emergency
//TODO Hauler store energy when needed in extensions, and storage
//TODO container building and storing
//TODO build roads automatically
//TODO build walls automatically
//TODO dynamically use spawners(not hard locked to Spawner1)
//TODO dynalically scale up spawns to take advantage of more or less energy capacity
//TODO recycle creeps when we have energy for upgrading them
//TODO move get miners to Util

module.exports.loop = function () {
    const HIVE = new Hive();

    // Dead creep garbage collection doesn't need to be done often
    if (Game.time % 1000 === 0) {
        for (let i in Memory.creeps) {
            if (!Game.creeps[i]) {
                delete Memory.creeps[i];
            }
        }
    }

    let minerAssignedCount = 0;
    let haulerAssignedCount = 0;
    let towerAssigned = 0;
    let defenderAssignedCount = 0;
    const body_repair_requirement = 20;

    let creeps: Creep[] = [];
    for (var name in Game.creeps) {
        creeps.push(Game.creeps[name]);

        let creep = Game.creeps[name];
        let spawn = creep.room.find(FIND_MY_SPAWNS).sort((a,b) => creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b))[0];
        if (creep.body.length > body_repair_requirement && getUtil().getUsableEnergyRatio(spawn.room) > .5 && getUtil().getUsableEnergyRatio(spawn.room) > .5 && creep.ticksToLive < 200 || (creep.ticksToLive < 1400 && spawn.pos.getRangeTo(creep) <= 1) && !creep.name.includes('Claim')) {
            creep.moveTo(Game.spawns['Spawn1']);
            continue;
        }
        if (name.includes('miner') || name.includes('harvest')) {
            //let sources = creep.room.find(FIND_SOURCES);
            //roles.roleHarvester.run(name, minerAssignedCount++ % sources.length);
        } else if (name.includes('worker')) {
            // roles.roleWorker.run(name)
        } else if (name.includes('hauler')) {
            let sourceCount = Game.creeps[name].room.find(FIND_DROPPED_RESOURCES);
            let storage = creep.room.find<StructureStorage>(FIND_STRUCTURES).filter((source) => (source.structureType === 'storage') && source.store.getFreeCapacity() > 0);
            let tower = creep.room.find<StructureTower>(FIND_STRUCTURES).filter((structure) => structure.structureType === 'tower');
            if (storage.length > 0 && tower.length > 0 && towerAssigned++ === 0) {
                roles.roleHauler.run(name, 0, true, false);
            } else {
                roles.roleHauler.run(name, haulerAssignedCount++ % sourceCount.length, false, false);
            }
        } else if (name.includes('Claim')) {
            roles.roleClaim.run(name);
        } else if (name.includes('defender')) {
            let enemySources = Game.creeps[name].room.find(FIND_HOSTILE_CREEPS);
            if (enemySources.length > 0) {
                roles.roleRangedDefender.run(name, defenderAssignedCount++ % enemySources.length, true, false);
            } else {
                let sourceCount = Game.creeps[name].room.find(FIND_EXIT);
                roles.roleRangedDefender.run(name, defenderAssignedCount++ % sourceCount.length, false, true);
            }
        }
    }

    for (let name in Game.spawns) {
        let spawn = Game.spawns[name];
    let sortedScreeps = creeps.filter((creep) => {
        return creep.ticksToLive < 1400;
    }).sort((a, b) => b.ticksToLive - a.ticksToLive).sort((a, b) => {
        return spawn.pos.getRangeTo(a) - spawn.pos.getRangeTo(b);
    });

    if (sortedScreeps.length > 1) {
        sortedScreeps.forEach((creep) => {
            spawn.renewCreep(creep);
        })
    }
}
}

module.exports.loop();
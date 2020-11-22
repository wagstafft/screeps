import { getUtil, StrutureSearchTypes } from './Utils';
function getDistance(creep: Creep, pos: RoomPosition) {
    return Math.abs(creep.pos.x + pos.x) + Math.abs(creep.pos.y + pos.y);
}

const REPAIR_PRIORITY_THRESHOLD = .6;

let roles = {
    roleHarvester: {
        /** @param {Creep} creep **/
        run: function (creepName: string, sourceIndex: number) {
            let creep = Game.creeps[creepName];

            if (creep.store.getFreeCapacity() > 0 || creep.store.getCapacity() === null) {
                var sources = creep.room.find(FIND_SOURCES);
                delayedSay(creep, 'mining');
                if (creep.harvest(sources[sourceIndex]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[sourceIndex]);
                }
            }
            else {
                if (creep.transfer(Game.spawns['Spawn1'], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(Game.spawns['Spawn1']);
                }
            }
        }
    },
    roleHauler: {
        run: function (creepName: string, sourceIndex: number) {
            let creep = Game.creeps[creepName];
            let sources = creep.room.find(FIND_DROPPED_RESOURCES);
            let storage = creep.room.find<StructureContainer>(FIND_STRUCTURES).filter((source) => (source.structureType === 'container' || source.structureType === 'storage') && source.store.getFreeCapacity() > 0);



            if (sources.length > 0 && (creep.store.getUsedCapacity() === 0 || getDistance(creep, sources[sourceIndex].pos) < 3 || (creep.store.getUsedCapacity() === 0 || creep.store.getFreeCapacity() > 0))) {
                if (creep.pickup(sources[sourceIndex]) == ERR_NOT_IN_RANGE) {
                    delayedSay(creep, 'pickup');
                    creep.moveTo(sources[sourceIndex]);
                }
            } else if (creep.store.getUsedCapacity() === 0 && storage[storage.length % sourceIndex]) {
                delayedSay(creep, 'reserve pkup');
                if (creep.withdraw(storage[storage.length % sourceIndex], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage[storage.length % sourceIndex])
                }
            } else {
                if (sourceIndex === 3 || sourceIndex === 2) {
                    let tower = creep.room.find<StructureTower>(FIND_STRUCTURES).filter((structure) => structure.structureType === 'tower');
                    if (tower?.length ?? 0 > 0) {
                        if (tower[0].store.getCapacity('energy') !== tower[0].store['energy']) {
                            delayedSay(creep, 'charge tower');
                            if (creep.transfer(tower[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(tower[0]);
                            }
                            return;
                        }
                    }
                }

                if (Game.spawns['Spawn1'].store['energy'] === Game.spawns['Spawn1'].store.getCapacity('energy')) {
                    let extensionSources = creep.room.find<StructureExtension>(FIND_MY_STRUCTURES).filter((source) => source.structureType === "extension");
                    for (let extension of extensionSources) {
                        if (extension.store.getCapacity('energy') !== extension.store['energy']) {
                            delayedSay(creep, 'chg ext');
                            if (creep.transfer(extension, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(extension);
                            }
                            return;
                        }
                    }
                    for (let storageSource of storage) {
                        delayedSay(creep, 'chg storage');
                        if (storageSource.store.getCapacity('energy') !== storageSource.store['energy']) {
                            if (creep.transfer(storageSource, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(storageSource);
                            }
                            return;
                        }
                    }
                    creep.moveTo(25, 25);
                } else if (creep.transfer(Game.spawns['Spawn1'], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    delayedSay(creep, 'spawn charge');
                    creep.moveTo(Game.spawns['Spawn1']);
                } else {
                    delayedSay(creep, 'nothing to do');
                    creep.moveTo(25, 25);
                }
            }
        }
    },
    roleRangedDefender: {
        run: function (creepName: string, sourceIndex: number, attack: boolean, conquest: boolean) {
            let creep = Game.creeps[creepName];
            let enemySources = creep.room.find(FIND_HOSTILE_CREEPS);
            if (attack) {
                delayedSay(creep, 'attack');
                if (creep.attack(enemySources[sourceIndex]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(enemySources[sourceIndex], { visualizePathStyle: { stroke: '#ff0000' } });
                } else if (creep.rangedAttack(enemySources[sourceIndex]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(enemySources[sourceIndex], { visualizePathStyle: { stroke: '#ff0000' } });
                }
            } else if (Game.flags['rally']) {
                delayedSay(creep, 'rally');
                let flag = Game.flags['rally'];
                creep.moveTo(flag);
            } else if (conquest) {
                delayedSay(creep, 'conquer');
                let flag = Game.flags['conquest'];

                if (flag) {
                    if (creep.room != flag.room) {
                        creep.moveTo(flag);
                    } else {
                        delayedSay(creep, 'claim');

                        console.log('claim ' + creep.claimController(creep.room.controller));
                        if (creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(creep.room.controller);
                        }
                    }
                }
            } else {
                creep.moveTo(34, 16);
            }

            // creep.moveTo(x, y);

            // come home
            // creep.moveTo(Game.spawns['Spawn1']);

        }
    },
    roleWorker: {
        run: function (creepName: string) {
            let creep = Game.creeps[creepName];
            if (creep.store.getUsedCapacity() === 0) {
                let source = getUtil().SearchStructures(creep.room, StrutureSearchTypes.allWithDrawableStorage).sort((a, b) => creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b))[0];
                delayedSay(creep, 'pickup');
                if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            } else {
                let constructionSources = creep.room.find(FIND_CONSTRUCTION_SITES).sort((a, b) => creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b));
                let constructionSource;

                if (constructionSources?.length > 0) {
                    constructionSource = constructionSources[0];
                }
                

                delayedSay(creep, 'bld');
                if (constructionSource) {
                    if (creep.build(constructionSource) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(constructionSource);
                    }
                } else {
                    delayedSay(creep, 'upg cont');
                    if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.controller);
                    }
                }
            }
        }
    }
}

function delayedSay(creep: Creep, message: string) {
    if (Game.time % 1 === 0) {
        creep.say(message);
    }
}

export = roles;




// var roleRepairer =
// {
// /** @param {Creep} creep **/
// run: function(creep) {

// if(creep.memory.repairing && creep.carry.energy == 0) {
// creep.memory.repairing = false;
// creep.say('🔄 R: Hrv');
// }
// else if(!creep.memory.repairing && creep.carry.energy < creep.carryCapacity) {
// creep.memory.repairing = false;
// creep.say('🔄 R: Hrv');
// }
// else if(!creep.memory.repairing && creep.carry.energy == creep.carryCapacity) {
// creep.memory.repairing = true;
// creep.say('🚧 repair');
// }

// if(creep.memory.repairing)
// {
// const targets = creep.room.find(FIND_STRUCTURES);
// targets.sort((a,b) => a.hits - b.hits);
// if(targets.length) {
// if(creep.repair(targets[0]) == ERR_NOT_IN_RANGE) {
// creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
// creep.say('repair');
// }
// }
// }
// else
// {
// var sources = creep.room.find(FIND_SOURCES);
// if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
// creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
// }
// }
// }
// }

// module.exports = roleRepairer; 
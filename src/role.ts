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
            let sources = creep.room.find(FIND_SOURCES);

            if (sources.length === 0) {
                creep.moveTo(Game.spawns['Spawn1']);
            } else if (creep.store.getFreeCapacity() > 0 || creep.store.getCapacity() === null) {
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
        run: function (creepName: string, sourceIndex: number, towerIndex: number, towerCharge: boolean) {
            let creep = Game.creeps[creepName];
            let sources = creep.room.find(FIND_DROPPED_RESOURCES);
            let storage = creep.room.find<StructureStorage>(FIND_STRUCTURES).filter((source) => (source.structureType === 'storage') && source.store.getFreeCapacity() > 0);
            let tower = creep.room.find<StructureTower>(FIND_STRUCTURES).filter((structure) => structure.structureType === 'tower').filter((tower) => tower.store['energy'] < 700);


            if (towerCharge && creep.store.getUsedCapacity() === 0 && tower.length > 0 && storage.length > 0) {
                if (creep.withdraw(storage[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage[0]);
                    return;
                }
            } else if (towerCharge && tower.length > 0) {
                if (tower[0].store.getCapacity('energy') !== tower[0].store['energy']) {
                    delayedSay(creep, 'charge tower');
                    if (creep.transfer(tower[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(tower[0]);
                    }
                    return;
                }
            }


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
                if (Game.spawns['Spawn1'].store['energy'] === Game.spawns['Spawn1'].store.getCapacity('energy')) {
                    let extensionSources = creep.room.find<StructureExtension>(FIND_MY_STRUCTURES).filter((source) => source.structureType === "extension");
                    let sortedExtensions = extensionSources.filter((extension) => extension.store.getCapacity('energy') !== extension.store['energy']).sort((a, b) => creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b));

                    if (sortedExtensions.length > 0) {
                        delayedSay(creep, 'chg ext');
                        if (creep.transfer(sortedExtensions[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(sortedExtensions[0], { visualizePathStyle: { stroke: '#00ff00'}});
                        }
                        return;
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
            let enemyStructures = creep.room.find(FIND_HOSTILE_STRUCTURES);
            let sortedEnemies = enemySources.sort((a, b) => creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b));
            let sortedStructures = enemyStructures.sort((a, b) => creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b));
            if (attack) {
                delayedSay(creep, 'attack');
                if (creep.attack(sortedEnemies[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sortedEnemies[0], { visualizePathStyle: { stroke: '#ff0000' } });
                } else if (creep.rangedAttack(sortedEnemies[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sortedEnemies[0], { visualizePathStyle: { stroke: '#ff0000' } });
                }
            } else if (Game.flags['rally']) {
                delayedSay(creep, 'rally');
                let flag = Game.flags['rally'];
                creep.moveTo(flag);
            } else if (conquest) {
                delayedSay(creep, 'conquer');
                let flag = Game.flags['conquest'];

                if (flag) {
                    if (sortedEnemies.length > 0 && (sortedStructures.length === 0) || creep.pos.getRangeTo(sortedStructures[0]) < creep.pos.getRangeTo(sortedEnemies[0])) {
                        if (creep.attack(sortedEnemies[0]) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(sortedEnemies[0], { visualizePathStyle: { stroke: '#ff0000' } });
                        } else if (creep.rangedAttack(sortedEnemies[0]) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(sortedEnemies[0], { visualizePathStyle: { stroke: '#ff0000' } });
                        }
                    } else if (sortedStructures.length > 0) {
                        if (creep.attack(sortedStructures[0]) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(sortedStructures[0], { visualizePathStyle: { stroke: '#ff0000' } });
                        } else if (creep.rangedAttack(sortedStructures[0]) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(sortedStructures[0], { visualizePathStyle: { stroke: '#ff0000' } });
                        }
                    } else {
                        creep.moveTo(flag);
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
                let source = getUtil().searchStructures(creep.room, StrutureSearchTypes.allWithDrawableStorage).sort((a, b) => creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b))[0];
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
                    } else {
                        creep.moveTo(creep.room.controller);
                    }
                }
            }
        }
    },
    roleClaim: {
        run: function (creepName: string) {
            let creep = Game.creeps[creepName];
            let flag = Game.flags['conquest'];

            if (flag) {
                delayedSay(creep, 'conquer');
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
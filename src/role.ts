function getDistance(creep: Creep, pos: RoomPosition) {
    return Math.abs(creep.pos.x + pos.x) + Math.abs(creep.pos.y + pos.y);
}

let roles = {
    roleHarvester: {

        /** @param {Creep} creep **/
        run: function (creepName: string, sourceIndex: number) {
            let creep = Game.creeps[creepName];

            if (creep.store.getFreeCapacity() > 0 || creep.store.getCapacity() === null) {
                var sources = creep.room.find(FIND_SOURCES);
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

            if (creep.store.getUsedCapacity() === 0 || getDistance(creep, sources[sourceIndex].pos) < 3 || (creep.store.getUsedCapacity() === 0 || creep.store.getFreeCapacity() > 0)) {
                if (creep.pickup(sources[sourceIndex]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[sourceIndex]);
                }
            } else {
                if (creep.transfer(Game.spawns['Spawn1'], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(Game.spawns['Spawn1']);
                }
            }
        }
    },
    roleRangedDefender: {
        run: function (creepName: string, sourceIndex: number, attack: boolean) {
            let creep = Game.creeps[creepName];
            let enemySources = creep.room.find(FIND_HOSTILE_CREEPS);

            if (!attack) {
                creep.moveTo(34, 16);
            } else {
                if (creep.attack(enemySources[sourceIndex]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(enemySources[sourceIndex]);
                } else if (creep.rangedAttack(enemySources[sourceIndex]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(enemySources[sourceIndex]);
                }
            }
            // creep.moveTo(x, y);

            // come home
            // creep.moveTo(Game.spawns['Spawn1']);

        }
    },
    roleWorker: {
        run: function (creepName: string, sourceIndex: number, construction: boolean) {
            let creep = Game.creeps[creepName];
            let sources = creep.room.find(FIND_DROPPED_RESOURCES);

            if (creep.store.getUsedCapacity() === 0) {
                if (creep.pickup(sources[sourceIndex]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[sourceIndex]);
                }
            } else {
                let constructionSources = creep.room.find(FIND_CONSTRUCTION_SITES);
                if (!construction) {
                    if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.controller);
                    }
                } else {
                    if (creep.build(constructionSources[sourceIndex]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(constructionSources[sourceIndex]);
                    }
                }
            }
        }
    }
};


export = roles;
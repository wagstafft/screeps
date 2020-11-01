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
            var sources = creep.room.find(FIND_DROPPED_RESOURCES);
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
        run: function (creepName: string, sourceIndex: number) {
            let creep = Game.creeps[creepName];
            let sources = creep.room.find(FIND_EXIT);
            sources = Game.spawns['Spawn1'].room.find(FIND_EXIT);
            creep.moveTo(sources[sourceIndex]);

            // come home
            // creep.moveTo(Game.spawns['Spawn1']);

        }
    }
};


export = roles;
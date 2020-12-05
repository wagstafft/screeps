import { Manager, RoomItem } from "./Manager";
import { Tower, TowerRoles, TowerTarget, } from "../ManagedEntities/Tower";
import { getUtil, StrutureSearchTypes } from "../Utils";

const MAX_RAMPART_RATIO = 1;
export interface TowerMemory {

}

export class TowerManager extends Manager<Tower> {
    name(): string {
        return "Tower Manager";
    }

    constructor(rooms: Room[]) {
        super(rooms);
    }

    findManageditems(rooms: Room[]): RoomItem<Tower>[] {
        return rooms.map((room) => {
            let towers = room.find<StructureTower>(FIND_MY_STRUCTURES,
                { filter: { structureType: STRUCTURE_TOWER } });

            return { room: room, items: towers.map((tower) => new Tower(tower)) };
        });
    }

    manage(): void {
        this._roomItems.forEach((roomItem) => {
            let role = TowerRoles.idle;
            let target: TowerTarget = null;

            let enemySources = roomItem.room.find(FIND_HOSTILE_CREEPS);
            let friendlyCreeps = roomItem.room.find(FIND_MY_CREEPS)
            .filter((creep) => creep.hits < creep.hitsMax)?.sort((a,b) => (a.hits / a.hitsMax) - (b.hits / b.hitsMax));

            let damagedStructures = getUtil().searchStructures(roomItem.room, StrutureSearchTypes.allStructures)
            .filter((structure) => structure.hits < structure.hitsMax)
            .sort((a, b) => (a.hits / a.hitsMax) - (b.hits / b.hitsMax));

            roomItem.items.forEach((tower) => {
                if (enemySources?.length ?? 0 > 0) {
                    target = enemySources[0];
                    role = TowerRoles.defend;
                } else if (friendlyCreeps?.length ?? 0 > 0) {
                    role = TowerRoles.heal;
                    target = friendlyCreeps[0];

                    if (friendlyCreeps.length > 1) {
                        friendlyCreeps.splice(0, 1);
                    }
                } else {
                    // Filter out ramparts above a threshold
                    damagedStructures = damagedStructures.filter((structure) => structure.structureType != STRUCTURE_RAMPART || (structure.hits < (structure.hitsMax * MAX_RAMPART_RATIO)));

                    if (damagedStructures.length > 0) {
                        role = TowerRoles.repair;
                        target = damagedStructures[0];

                        if (damagedStructures.length > 1) {
                            damagedStructures.splice(0, 1);
                        }
                    }
                }

                if (role != TowerRoles.idle) {
                    tower.Role = role;
                    tower.Target = target;
                    tower.executeRole();
                }
            });
        });
    }
}
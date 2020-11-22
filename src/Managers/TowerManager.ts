import { Manager, RoomItem } from "./Manager";
import { Tower, TowerRoles, TowerTarget, } from "../ManagedEntities/Tower";
import { getUtil, StrutureSearchTypes } from "../Utils";

const MAX_RAMPART_REPAIR_HITS = 10_000;
export interface TowerMemory {

}

export class TowerManager extends Manager<Tower> {
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

    report(): void {
        console.log(`tower manager up with ${this._roomItems.length} rooms and ${this._roomItems[0].items} towers to manager`);
    }

    manage(): void {
        this._roomItems.forEach((roomItem) => {
            let role = TowerRoles.idle;
            let target: TowerTarget = null;

            let enemySources = roomItem.room.find(FIND_HOSTILE_CREEPS);
            if (enemySources?.length ?? 0 > 0) {
                target = enemySources[0];
                role = TowerRoles.defend;
            } else {
                let damagedStructures = getUtil().SearchStructures(roomItem.room, StrutureSearchTypes.allStructures).filter((structure) => structure.hits < structure.hitsMax);

                damagedStructures.sort((a, b) => (a.hits / a.hitsMax) - (b.hits / b.hitsMax));

                // Filter out ramparts above a threshold
                damagedStructures = damagedStructures.filter((structure) => structure.structureType != STRUCTURE_RAMPART || structure.hits < MAX_RAMPART_REPAIR_HITS);

                if (damagedStructures.length > 0) {
                    role = TowerRoles.repair;
                    target = damagedStructures[0];
                }
            }
            if (role != TowerRoles.idle) {
                // TODO use memory and set roles
                roomItem.items.forEach((tower) => {
                    tower.Role = role;
                    tower.Target = target;
                    tower.executeRole();
                });
            }
        });
    }

    repair() {

    }
}
//import { HaulerTask, HaulerTarget } from './../ManagedEntities/Hauler';
import { Manager, RoomItem } from "./Manager";
import { getUtil, StrutureSearchTypes } from "../Utils";
import { Hauler } from "../ManagedEntities/Hauler";
//import { Hauler, HaulerTarget } from "../ManagedEntities/Hauler";


const USABLE_ENERGY_CRISIS_RATIO_THRESHOLD = .8;
const USABLE_ENERGY_CRISIS_TOTAL_THRESHOLD = 600;
export class HaulerManager extends Manager<Hauler> {
    name(): string {
        return "Hauler Manager";
    }

    constructor(rooms: Room[]) {
        super(rooms);
    }

    findManageditems(rooms: Room[]): RoomItem<Hauler>[] {
        return rooms.map((room) => {
            let creeps: Creep[] = room.find(FIND_CREEPS).filter((creep) => creep.name.toLowerCase().includes('hauler'));
            return { room: room, items: creeps.map((creep) => new Hauler(creep)) };
        });
    }

    manage(): void {
        this._roomItems.forEach((roomItem) => {
            let energyEmergency: boolean = getUtil().getUsableEnergy(roomItem.room) < USABLE_ENERGY_CRISIS_TOTAL_THRESHOLD
                || getUtil().getUsableEnergyRatio(roomItem.room) < USABLE_ENERGY_CRISIS_RATIO_THRESHOLD;
            let enemyAttackEmergency: boolean = roomItem.room.find(FIND_HOSTILE_CREEPS).length > 0;


            let droppedSources = roomItem.room.find(FIND_DROPPED_RESOURCES).map((source) => {
                return { amount: source.amount, source: source }
            });

            console.log('dropped sources ' + droppedSources);
            

            // let depositStructures = getUtil().searchStructures(roomItem.room, StrutureSearchTypes.allStorage).map((structure) => {
            //     console.log(storeStructure + 'store struct ' + storeStructure.getFreeCapacity);
            //     return { amount: storeStructure.getFreeCapacity ?? 0, structure: storeStructure };
            // }).filter((struct) => { struct.amount > 0 });

            // console.log('deposit structures ' + depositStructures);

            // let withdrawStructures = getUtil().searchStructures(roomItem.room, StrutureSearchTypes.allWithDrawableStorage).map((structure) => {
            //     let storeStructure = structure as StructureContainer;

            //     // console.log(storeStructure + 'store struct ' + storeStructure.store.getFreeCapacity());
            //     return { amount: storeStructure.store.getUsedCapacity(), structure: storeStructure };
            // }).filter((struct) =>  struct.structure.store.getUsedCapacity() > 0);

            // console.log('dropped ' + droppedSources);
            // console.log('deposit ' + depositStructures);
            // console.log('withdraw ' + withdrawStructures);
            // roomItem.items.forEach((hauler) => {
            //     let role: HaulerTask = HaulerTask.idle;
            //     let target: HaulerTarget = null;

            //     console.log('first');
            //     console.log('creep ' + hauler._creep);
            //     if (hauler._creep.store.getUsedCapacity() > 0 && depositStructures.length > 0) {
            //         console.log('store?');
            //         let sortedStructures = depositStructures.sort((a, b) => hauler._creep.pos.getRangeTo(a.) - hauler._creep.pos.getRangeTo(b.structure.pos));
            //         role = HaulerTask.transfer;
            //         target = sortedStructures[0].structure;
            //         let alteredStructure = depositStructures.find((structure) => structure === sortedStructures[0]);
            //         alteredStructure.amount -= hauler._creep.store.getUsedCapacity<RESOURCE_ENERGY>();
            //         if (alteredStructure.amount <= 0) {
            //             console.log('splice');
            //             depositStructures.splice(depositStructures.indexOf(alteredStructure), 1);
            //         }
            //     } else if (!enemyAttackEmergency && !energyEmergency && droppedSources.length > 0) {
            //         console.log('pickup?');
            //         let sortedSources = droppedSources.sort((a, b) => hauler._creep.pos.getRangeTo(a.source.pos) - hauler._creep.pos.getRangeTo(b.source.pos));
            //         role = HaulerTask.pickup;
            //         target = sortedSources[0].source;
            //         let alteredSource = droppedSources.find((resource) => resource === sortedSources[0]);
            //         alteredSource.amount -= hauler._creep.store.getFreeCapacity();
            //         if (alteredSource.amount <= 0) {
            //             console.log('splice');
            //             droppedSources.splice(droppedSources.indexOf(alteredSource), 1);
            //         }
            //     }
                // } else if (withdrawStructures.length > 0) {
                //     console.log('emergency pull from storage if possible');
                //     let sortedStructures = withdrawStructures.sort((a, b) => hauler._creep.pos.getRangeTo(a.structure.pos) - hauler._creep.pos.getRangeTo(b.structure.pos));
                //     role = HaulerTask.withdraw;
                //     target = sortedStructures[0].structure;
                //     let alteredStructure = depositStructures.find((structure) => structure === sortedStructures[0]);
                //     alteredStructure.amount -= hauler._creep.store.getFreeCapacity<RESOURCE_ENERGY>();
                //     if (alteredStructure.amount <= 0) {
                //         console.log('splice');
                //         depositStructures.splice(depositStructures.indexOf(alteredStructure), 1);
                //     }
                // }

                //hauler.executeRole();
            // });
            //TODO pickup dropped source
            //TODO make sure not too many creeps are assigned to each pickup ie 5 don't run off to pick up 10 energy
            //TODO creeps are picking up nearest source assuming above condition
            //TODO in some emergency prioritize picking up energy from storage say after creeps have been anhilated


            //TODO haulers charge up storage and containers
            //TODO haulers charge up towers special emphasis placed on closest
            //TODO when hostile creeps are around making sure tower is charged gets special priority

            // let enemySources = roomItem.room.find(FIND_HOSTILE_CREEPS);
            // if (enemySources?.length ?? 0 > 0) {
            //     target = enemySources[0];
            //     role = TowerRoles.defend;
            // } else {
            //     let damagedStructures = getUtil().SearchStructures(roomItem.room, StrutureSearchTypes.allStructures).filter((structure) => structure.hits < structure.hitsMax);

            //     damagedStructures.sort((a, b) => (a.hits / a.hitsMax) - (b.hits / b.hitsMax));

            //     // Filter out ramparts above a threshold
            //     damagedStructures = damagedStructures.filter((structure) => structure.structureType != STRUCTURE_RAMPART || structure.hits < MAX_RAMPART_REPAIR_HITS);

            //     if (damagedStructures.length > 0) {
            //         role = TowerRoles.repair;
            //         target = damagedStructures[0];
            //     }
            // }
            // if (role != TowerRoles.idle) {
            //     // TODO use memory and set roles
            //     roomItem.items.forEach((tower) => {
            //         tower.Role = role;
            //         tower.Target = target;
            //         tower.executeRole();
            //     });
            // }
        });
    }
}
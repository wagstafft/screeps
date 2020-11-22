import BaseEntity = require("../BaseClasses/BaseEntity");
export interface RoomItem<T> {
    room: Room,
    items: T[]
}

export abstract class Manager<T extends BaseEntity> extends BaseEntity {
    protected _roomItems: RoomItem<T>[];
    constructor(rooms: Room[]) {
        super();
        this._roomItems = this.findManageditems(rooms);
        this.manage();
    }

    abstract manage(): void;

    abstract findManageditems(rooms: Room[]): RoomItem<T>[];
}
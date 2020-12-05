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

    abstract name(): string;
    abstract manage(): void;

    report() {
        console.log(`${this.name()} up with ${this._roomItems.length} rooms and ${this._roomItems.map((roomItem) => roomItem.items.length).reduce((x, y) => x + y)} ${this._roomItems[0].items[0]?.name() ?? 'no name?'}s to manage`);
    }

    abstract findManageditems(rooms: Room[]): RoomItem<T>[];
}
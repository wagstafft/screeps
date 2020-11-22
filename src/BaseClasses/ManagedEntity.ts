import BaseEntity = require("./BaseEntity");

export abstract class ManagedEntity<T, U> extends BaseEntity {
    private _role: T;
    private _target: U;
    
    public get Role() : T {
        return this._role; 
    }
  
    public set Role(value : T) {
        this._role = value;
    }

    public get Target() : U {
        return this._target;
    }

    public set Target(value: U) {
        this._target = value;
    }
    
    abstract executeRole(): void;
}
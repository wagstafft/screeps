enum HiveStates {
    Safe = 1,
    Defense,
}

class Hive {    
    constructor(){
        
    }

    public state: HiveStates;
    
}

let hive: Hive = new Hive();
export = hive;
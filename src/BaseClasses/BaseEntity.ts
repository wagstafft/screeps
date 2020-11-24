import Reporter = require("./Reporter");

abstract class BaseEntity extends Reporter {
    abstract name(): string;
}

export = BaseEntity;
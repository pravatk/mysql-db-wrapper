/**
 * Query Object that will hold the sql to be run, the database name where the query will run and the binding parameters to be used with the query.
 * 
 * @author Pravat
 */
class Query {
    constructor(sql, database, values = []) {
        this.sql = sql;
        this.database = database;
        this.values = values;
    }

    getDatabase() {
        return this.database;
    }

    getSql() {
        return this.sql;
    }
    setSql(sql) {
        this.sql = sql;
    }
    setDatabase(database) {
        this.database = database;
    }
    getValues() {
        return this.values;
    }

    setValues(values = []) {
        this.values = values;
    }
}

module.exports = Query;
const mongoose = require('mongoose');
require('dotenv').config()

class Database {

    constructor() {
        this.connect();
    }
    connect() {
        const dbUrl = process.env.DATABASE_URL;
        mongoose.connect(dbUrl)
            .then(() => {
                console.log('Database connection successful.')
            })
            .catch((err) => {
                console.log(`Database connection error: ${err}`)
            })
    }
}

module.exports = new Database();
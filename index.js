require("dotenv").config()

let bot = require('./bot')
require('./server')(bot)
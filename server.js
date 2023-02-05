const express = require('express')
const bodyParser = require('body-parser')
const packageInfo = require('./package.json')
const conn = require('./bot')

const app = express()
app.use(bodyParser.json())

app.get('/', (req,res) => {
    res.json({version: packageInfo.version})
})

let server = app.listen(process.env.PORT, '0.0.0.0', () => {
    const host = server.address().address
    const port = server.address().port
    console.log('Web server started at http://%s:%s', host, port)

})
module.exports = (bot) => {
    app.post('/' + bot.token, (req,res)  => {
        noteBot.processUpdate(req.body)
        res.sendStatus(200)
    })
}
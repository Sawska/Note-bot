const tgBot = require('node-telegram-bot-api')
require('dotenv').config()
const mysql = require('mysql')
const token = process.env.BOT_TOKEN
//const bot = new tgBot(token, {polling:true})
const connection = mysql.createConnection({
    host: "localhost",
    user: 'root',
    password: 'Spl@y1494',
    database: 'TelegramNotes'
})
let bot  
if(process.env.NODE_ENV == 'production') {
    bot = new tgBot(token)
} else {
    bot = new tgBot(token,{polling:true})
}
connection.connect(() => {
    let noteCreate = false
    let noteChoose = false
    let numberNote
    let noteEdit = false
bot.on('message',(msg) => {
    const chatId = msg.chat.id
    const text = msg.text
    const userId = msg.from.id
    if(text == '/start' || text == '⬅️Go back to start menu') {
        Verification(userId)
        noteCreate = false
        noteChoose = false
        let str = `Hi👋 this telegram bot🤖 can create notes📓 
to help you optimise your time⌚️
🟢 To Create a new note press: 🔨Create Note
🟢 To Watch all your notes press: 👀Watch Notes`

         bot.sendMessage(chatId,str, {
            "reply_markup": {
                "keyboard": [['🔨Create Note'], ["👀Watch Notes"]]
            }
         })
    }
    if(text == '🔨Create Note' || text == '🛠Create another note') {
        let str = 'Please reply with your note📝'
         noteCreate = true
        bot.sendMessage(chatId, str, {
            "reply_markup": {
                "keyboard": [['⬅️Go back to start menu']]
            }
        })
    }
    if((noteCreate && text !== '🔨Create Note' && text !== '🛠Create another note' && text !== '⬅️Go back to start menu')) {
        noteCreate = false
        noteChoose = false
        noteEdit = false
        let note = new Note()
        note.title = text.split('\n')[0]
        note.text = text.split('\n').slice(1).join(' ')
        let str = 'Created a new note✅'

        connection.query(`SELECT title FROM Notes WHERE title = '${note.title}' AND n_id = ${userId}`, (err,result) => {
            if(result[0] === undefined) {
                connection.query(`INSERT INTO Notes (n_id,title,note) VALUES(${userId},'${note.title}','${note.text}')`)
                bot.sendMessage(chatId,str, {
                    "reply_markup": {
                        "keyboard": [['🛠Create another note'], ['⬅️Go back to start menu']]
                    }
                })
            } else {
                bot.sendMessage(chatId,"Can't create note with same title😖", {
                    "reply_markup": {
                        "keyboard": [['🛠Create another note'], ['⬅️Go back to start menu']]
                    }
                })
            }
        })
    }
    if(text == "👀Watch Notes" || text == '👀Watch other notes') {
        noteCreate = false
        noteChoose = false
        noteEdit = false
        let query = `SELECT title FROM Notes WHERE n_id = ${userId} LIMIT 10`
        connection.query(query,(err,result) => {
            if(err) throw err
            if(result[0] == undefined ) {
                bot.sendMessage(chatId,"Looks like you don't have notes🚫\nCreate one!😀", {
                    "reply_markup": {
                        "keyboard": [['🔨Create Note']]
                    }
                })
            } else {
                bot.sendMessage(chatId,'List📃 of your notes:\n' + generateTemplate(result).join('\n') + '\nTo choose note press: ↪️Enter number', {
                    "reply_markup": {
                        "keyboard": [['↪️Enter number'],['⬅️Go back to start menu']]
                    }
                })
            }
        })
    }
    if(text == '↪️Enter number') {
        noteChoose = true
        let query = `SELECT title FROM Notes WHERE n_id = ${userId} LIMIT 10`
        connection.query(query,(err,result) => {
            bot.sendMessage(chatId, '↪️Enter number to see Note:\n'+ generateTemplate(result).join('\n'), {
                "reply_markup": {
                    "keyboard": [['⬅️Go back to start menu']]
                }
            })
        })
    }
    if(noteChoose && !Boolean(text.match('↪️Enter number'))) {
        noteChoose = false 
        numberNote = text.replace(/\D/g, '')
        let str = '🙅‍♂️This is not valid number'
        let query = `SELECT title,note FROM Notes WHERE n_id = ${userId} LIMIT 10`
            connection.query(query, (err,result) => {
                    
                if(numberNote == '' || +numberNote >= result.length || +numberNote <= -1) {
                        bot.sendMessage(chatId,str, {
                            "reply_markup": {
                                "keyboard": [['↪️Enter number'], ['⬅️Go back to start menu'], ['👀Watch Notes'] ]
                            }
                        })
                } else {
                    bot.sendMessage(chatId, result[text].title + '\n' + result[text].note, {
                        "reply_markup": {
                            "keyboard": [['✏️Edit note'],['🗑Delete note'],['⬅️Go back to start menu']]
                        }
                    })
                }     
            })
       
    }

    if(text == '🗑Delete note') {
        let str = "✅Successfully deleted note"
    let query = `SELECT title FROM Notes WHERE n_id = ${userId} LIMIT 10`
    connection.query(query,(err,result) => {

        connection.query(`DELETE FROM Notes WHERE title = '${result[numberNote].title}' AND n_id = ${userId} LIMIT 1`, (err) => {
            if(err) {
                bot.sendMessage(chatId,"Can't delete note", {
                    "reply_markup": {
                        "keyboard": [['⬅️Go back to start menu'], ['👀Watch Notes']]
                    }
                })
            }
            else {
                bot.sendMessage(chatId,str,{
                    "reply_markup": {
                        "keyboard": [['⬅️Go back to start menu']]
                    }
                })
            }
        })
    })
    }
    if(text == '✏️Edit note') {
        noteEdit = true
        let str = 'Please re enter your note and edit it✏️'
        let query = `SELECT title FROM Notes WHERE n_id = ${userId} LIMIT 10`
    connection.query(query,(err,result) => {
            bot.sendMessage(chatId,str,{
                "reply_markup": {
                    "keyboard": [['👀Watch other notes'],['⬅️Go back to start menu']]
                }
            })
    })
    }
    if(noteEdit == true && text !== '✏️Edit note' && text !== '⬅️Go back to start menu' && text !== '👀Watch other notes') {
        noteEdit = false
        let str = '✅Successfully edited your note'
        let note = new Note()
        note.title = text.split('\n')[0]
        note.text = text.split('\n').slice(1).join(' ')
        let query = `SELECT title FROM Notes WHERE n_id = ${userId} LIMIT 10`
            connection.query(query, (err,results) => {
                if(results[numberNote].title == note.title) {
         bot.sendMessage(chatId,"Can't edit note with same title😓", {
                 "reply_markup": {
                 "keyboard": [['👀Watch other notes'], ['⬅️Go back to start menu']]
                        }
                     })
                } else {
            connection.query(`UPDATE Notes SET title = '${note.title}', note = '${note.text}' WHERE title = '${results[numberNote].title}' AND n_id = ${userId}`)
                bot.sendMessage(chatId,str, {
                    "reply_markup": {
                    "keyboard": [['👀Watch other notes'], ['⬅️Go back to start menu']]
                         }
                 })
                }

            })
    }
})
})

//
//                      ADDITIONAL FUNCTIONS
//

function Verification(ctxId) {
    connection.query(`SELECT telegram_id FROM Users WHERE telegram_id = ${ctxId}`, (err,result) => {
        if(result[0] === undefined) register(ctxId)
    })
}



 function register(ctxId) {
     connection.query(`INSERT INTO Users (telegram_id) VALUES(${ctxId})`)
 }

  class Note {
     constructor(title,text) {}
 }

function generateTemplate(list) {
    let arr = []
    for(let i = 0; i <list.length;i++) {
        arr.push( i + ' ' + list[i].title)
    }
    return arr
}
module.exports = bot
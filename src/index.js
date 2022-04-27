const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage , generateLocationMessage} = require('./utils/messages')
const { addUser,removeUser,getUser,getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDiretoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDiretoryPath))

io.on('connection',(socket)=>{
    console.log('New Websocket connection')
    

    socket.on('join',(option , callback)=>{
        const {error , user} = addUser({id:socket.id , ...option})
        if(error){
            return callback(error)
        }
        socket.join(user.room)

        socket.emit('message',generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
    })

    socket.on('sendMessage',(message,callback)=>{
        const {username,room} = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }

        io.to(room).emit('message',generateMessage(username,message))
        callback()
    })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation',({latitude,longitude},callback)=>{
        const {username,room} = getUser(socket.id)
        io.to(room).emit('locationMessage',generateLocationMessage(username,`https://google.com/maps?q=${latitude},${longitude}`))
        callback('Location shared')
    })

    
})      

server.listen(port,()=>{
    console.log(`server listening on port ${port}`)
})
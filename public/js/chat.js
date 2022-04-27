const socket = io()

const input = document.getElementById('messageWelcome')
const btn = document.getElementById('submit')
const sendlocation = document.getElementById('send-location')
const messageForm = document.getElementById('message-form')
const messages = document.getElementById('messages')
const currentLocation = document.getElementById('current-location')

const messageTemplate = document.getElementById('message-template').innerHTML
const locationTemplate = document.getElementById('location-message-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML

const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll = () => {
    // New message element
    const $newMessage = messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = messages.offsetHeight

    // Height of messages container
    const containerHeight = messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('message',(message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message : message.text,
        createAt : moment(message.createAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()

    btn.setAttribute('disabled', 'disabled')
    socket.emit('sendMessage',input.value,(error)=>{
        btn.removeAttribute('disabled')
        input.value=''
        input.focus()

        if(error){
           return console.log(error)
        }
        console.log('Message delivered') 
        
    })
})

sendlocation.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    sendlocation.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        // console.log(position)
        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },(message)=>{
            console.log(message)
            sendlocation.removeAttribute('disabled')
        })
        
    })
})

socket.on('locationMessage',(message)=>{
    console.log(message)
    const html = Mustache.render(locationTemplate,{
        username:message.username,
        url : message.url,
        createAt: moment(message.createAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})  




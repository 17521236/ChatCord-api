const port = process.env.PORT || 3000;

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    handlePreflightRequest: (req, res) => {
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": "*", //or the specific origin you want to give access to,
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
    },
    origins: '*:*'
});

const moment = require('moment');
const { addUser, getUserById, getUsers, deletePeopleById, isExisted } = require('./helper/user.helper');
const { getIcons } = require('./helper/resource.helper');

app.use(express.static('public'));
//socket code
io.on('connection', socket => {
    //when connected -> emit list icons to user
    console.log(socket.id);
    socket.emit('server-response-icons', getIcons());

    //disconnected
    socket.on('disconnect', () => {
        const user = getUserById(socket.id);
        if (!user) {
            return;
        }
        deletePeopleById(socket.id);
        socket.broadcast.to(user?.room).emit('server-response-send-message', {
            avatarUrl: 'icons/avatar/robot.svg',
            username: '* Bot *',
            message: `${user.username} has left the chat`,
            time: moment().format('LT'),
            isMine: false
        });
        // notification number people in room
        socket.broadcast.to(user?.room).emit('server-response-login', {
            room: user.room,
            users: getUsers(user.room)
        });
    })

    //login
    socket.on('client-login', (data) => {

        // check duplication
        if (isExisted(data.username)) {
            socket.emit('server-response-login-fail', 'Username existed !');
        } else {
            socket.emit('server-response-login-success', '');
            // add user to list users
            addUser(socket.id, data.username, data.room, data.avatarUrl);
            //get user
            const user = getUserById(socket.id);
            if (!user) return;
            //join to room
            socket.join(user.room);
            // message to other people
            socket.broadcast.to(user.room).emit('server-response-send-message', {
                avatarUrl: 'icons/avatar/robot.svg',
                username: '* Bot *',
                message: `${user.username} has joined room`,
                time: moment().format('LT'),
                isMine: false
            });
            // message to current socket
            socket.emit('server-response-send-message', {
                avatarUrl: 'icons/avatar/robot.svg',
                username: '* Bot *',
                message: `Welcome ${user.username} !!! Let's send your first message to other people in room`,
                time: moment().format('LT'),
                isMine: false
            });
            // notification number people in room
            io.to(user.room).emit('server-response-login', {
                room: user.room,
                users: getUsers(user.room)
            });
        }
    })

    // send message
    socket.on('client-send-message', (data) => {
        const user = getUserById(socket.id);
        if (!user) {
            socket.emit('server-response-user-logout', true);
            return;
        }
        socket.emit('server-response-send-message', {
            avatarUrl: user.avatarUrl,
            username: user.username,
            message: data,
            time: moment().format('LT'),
            isMine: true
        });

        socket.broadcast.to(user.room).emit('server-response-send-message', {
            avatarUrl: user.avatarUrl,
            username: user.username,
            message: data,
            time: moment().format('LT'),
            isMine: false
        });
    })

    socket.on('client-user-logout', (data) => {
        deletePeopleById(socket.id);
    })
});



//setting multer
// const multer = require("multer");
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './upload')
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.originalname);
//     }
// })
// const upload = multer({ storage });

// //post upload
// app.post("/upload", upload.single("file"), function (req, res) {
//     console.log(req.file);
//     res.send("upload success");
// })

app.get('/', (req, res) => {
    res.send({ connect: 'ok' });
})
// connection

server.listen(port, () => {
    console.log(`Port ${port} is running ...`);
})

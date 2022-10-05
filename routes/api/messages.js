const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');
const Chat = require('../../schemas/ChatSchema');
const Message = require('../../schemas/MessageSchema');
const Notification = require('../../schemas/NotificationSchema');

app.use(bodyParser.urlencoded({ extended: false }));

router.post('/', async (req, res, next) => {
    if (!req.body.content || !req.body.chatId) {
        console.log('Invalid data passed into request.');
        return res.sendStatus(400);
    }

    const newMessage = {
        sender: req.session.user._id,
        content: req.body.content,
        chat: req.body.chatId
    };

    Message.create(newMessage)
        .then(async results => {
            message = await results.populate('sender');
            message = await results.populate('chat');
            message = await User.populate(message, { path: 'chat.users' });
            const chat = await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message })
                .catch(error => {
                    console.log(error);
                });
            insertNotifications(chat, message);
            res.status(201).send(results);
        })
        .catch(error => {
            console.log(error);
            res.sendStatus(400);
        });
});

function insertNotifications(chat, message) {
    chat.users.forEach(user => {
        if (user == message.sender._id.toString()) return;
        Notification.insertNotification(user, message.sender._id, 'message', message.chat._id);
    })
}

module.exports = router;

const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../schemas/UserSchema');
const Chat = require('../schemas/ChatSchema');

router.get('/', (req, res, next) => {
    const data = {
        title: 'Inbox',
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    };
    res.status(200).render('inboxPage', data);
});

router.get('/new', (req, res, next) => {
    const data = {
        title: 'New message',
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    };
    res.status(200).render('newMessage', data);
});

router.get('/:chatId', async (req, res, next) => {
    const userId = req.session.user._id;
    const chatId = req.params.chatId;
    const isValidId = mongoose.isValidObjectId(chatId)
    const data = {
        title: 'Chat',
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    };

    if (!isValidId) {
        data.errorMessage = 'Chat does not exist or you do not have permission to view it.';
        return res.status(200).render('chatPage', data);
    }

    let chat = await Chat.findOne({ _id: chatId, users: { $elemMatch: { $eq: userId } } })
        .populate('users');

    if (chat == null) {
        const userFound = await User.findById(chatId);

        if (userFound != null) {
            chat = await getChatByUserId(userId, userFound._id);
        }
    }

    if (chat == null) {
        data.errorMessage = 'Chat does not exist or you do not have permission to view it.';
    } else {
        data.chat = chat;
    }
    res.status(200).render('chatPage', data);
});

function getChatByUserId(userLoggedInId, otherUserId) {
    return Chat.findOneAndUpdate({
        isGroupChat: false,
        users: {
            $size: 2,
            $all: [
                { $elemMatch: { $eq: mongoose.Types.ObjectId(userLoggedInId) } },
                { $elemMatch: { $eq: mongoose.Types.ObjectId(otherUserId) } }
            ]
        }
    },
        {
            $setOnInsert: {
                users: [userLoggedInId, otherUserId]
            }
        },
        {
            new: true,
            upsert: true
        })
        .populate('users');
}

module.exports = router;

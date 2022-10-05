const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const User = require('../schemas/UserSchema');

router.get('/', (req, res, next) => {
    const data = {
        title: req.session.user.username,
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
        profileUser: req.session.user
    };

    res.status(200).render('profilePage', data);
});

router.get('/:username', async (req, res, next) => {
    const data = await getData(req.params.username, req.session.user);
    res.status(200).render('profilePage', data);
});

router.get('/:username/following', async (req, res, next) => {
    const data = await getData(req.params.username, req.session.user);
    data.selectedTab = 'following';
    res.status(200).render('followersAndFollowing', data);
});

router.get('/:username/followers', async (req, res, next) => {
    const data = await getData(req.params.username, req.session.user);
    data.selectedTab = 'followers';
    res.status(200).render('followersAndFollowing', data);
});

router.get('/:username/replies', async (req, res, next) => {
    const data = await getData(req.params.username, req.session.user);
    data.selectedTab = 'replies';
    res.status(200).render('profilePage', data);
});

async function getData(username, userLoggedIn) {
    let user = await User.findOne({ username });
    if (user == null) {
        user = await User.findById(username);
        if (user == null) {
            return {
                title: 'User not found..',
                userLoggedIn,
                userLoggedInJs: JSON.stringify(userLoggedIn)
            };
        }
    }

    return {
        title: user.username,
        userLoggedIn,
        userLoggedInJs: JSON.stringify(userLoggedIn),
        profileUser: user
    };
}

module.exports = router;

const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const User = require('../schemas/UserSchema');

router.get('/', (req, res, next) => {
    const data = createPayload(req.session.user);
    res.status(200).render('searchPage', data);
});

router.get('/:selectedTab', (req, res, next) => {
    const data = createPayload(req.session.user);
    data.selectedTab = req.params.selectedTab;
    res.status(200).render('searchPage', data);
});

function createPayload(userLoggedIn) {
    return {
        title: 'Search',
        userLoggedIn,
        userLoggedInJs: JSON.stringify(userLoggedIn)
    };

}

module.exports = router;

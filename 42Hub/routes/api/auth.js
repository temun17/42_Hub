const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator/check');

const User = require('../../models/User');

// @route      GET api/auth
// @desc       Get User from jsonwebtoken
// @access     Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch(error) {
        console.error(error.message);
        res.status(500).send('Server Error!');
    } 
});

// @route      GET api/auth
// @desc       Authenticate user & get token
// @access     Public
router.post('/', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please is required!').exists()
], 
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // SEE IF USER EXISTS
       let user = await User.findOne({ email });

       if (!user) {
         return res.status(400).json({ errors: [ { msg: 'Invalid Credentials' }]});
       }

       const isMatch = await bcrypt.compare(password, user.password);

       if (!isMatch) {
           return res
            .status(400)
            .json({ errors: [{ msg: 'Invalid Credentials' }]});
       }

       // Return jsonwebtoken
       const payload = {
           user: {
               id: user.id
           }
       }

       jwt.sign(
           payload, 
           config.get('jwtSecret'),
           { expiresIn: 3600 }, // 3600 seconds is an hour
           (err, token) => { // use an arrow callback function to check for error or token success
               if(err) throw err;
               res.json({ token });
           });
    } catch(error) {
       console.error(error.message);
       res.status(500).send('Server error!');
    }
});

module.exports = router;
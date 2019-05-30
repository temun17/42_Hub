 const express = require('express');
 const router = express.Router();
 const gravatar = require('gravatar');
 const bcrypt = require('bcryptjs');
 const jwt = require('jsonwebtoken');
 const config = require('config');
 const { check, validationResult } = require('express-validator/check');

 const User = require('../../models/User');

 // @route      GET api/users
 // @desc       Register user
 // @access     Public
 router.post('/', [
     check('name', 'Name is required')
     .not()
     .isEmpty(),
     check('email', 'Please include a valid email').isEmail(),
     check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6})
 ], 
 async (req, res) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
     }

     const { name, email, password } = req.body;

     try {
         // SEE IF USER EXISTS
        let user = await User.findOne({ email });

        if (user) {
          return res.status(400).json({ errors: [ { msg: 'User already exists '}]});
        }

        // GET USERS GRAVATAR
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        user = new User({
            name,
            email,
            avatar,
            password
        });

        // Encrypt password
        const salt = await bcrypt.genSalt(10); // recommended has length for password

        user.password = await bcrypt.hash(password, salt);

        await user.save();

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
        console.log(error.message);
        res.status(500).send('Server error!');
     }
 });

 module.exports = router;
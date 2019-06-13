const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const auth = require('../../middleware/auth');

const Posts = require('../../models/Posts');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route      POST api/posts
// @desc       Create a post
// @access     Private
router.post('/', [auth, [
    check('text', 'Text is required')
        .not()
        .isEmpty()
    ] 
], 
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Posts({ // new Posts is a collection in the database
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        })

        const posts = await newPost.save();

        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error!');
    }
});

// @route      GET api/posts
// @desc       Get all posts
// @access     Private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Posts.find().sort({ date: -1 }); // sort by most recent
        res.json(posts);
    } catch(error) {
        console.error(error.message);
        res.status(500).send('Server Error!');
    }
});

// @route      GET api/posts/:id
// @desc       Get posts by id
// @access     Private
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Posts.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post Not Found! '});
        }
        res.json(post);
    } catch(error) {
        console.error(error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post Not Found! '});
        }
        res.status(500).send('Server Error!');
    }
});

// @route      DELETE api/posts/:id
// @desc       Delete a post 
// @access     Private

router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Posts.findById(req.params.id);

        // If post does not exist
        if (!post) {
            return res.status(404).json({ msg: 'Post Not Found! '});
        }

        // Check if the user so only user can delete the post
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized!' }) //Not Authorized!
        }

        await post.remove();

        res.json({ msg: 'Post Removed! '});
    } catch(error) {
        console.error(error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post Not Found! '});
        }
        res.status(500).send('Server Error!');
    }
});

// @route      PUT api/posts//like/:id
// @desc       Like a Post 
// @access     Private

router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Posts.findById(req.params.id);
        //filter() High order array method
        // Check if post has already been liked
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: 'Post already liked!' }) // 400 BAD REQUEST
        }

        post.likes.unshift({ user: req.user.id });

        await post.save();

        res.json(post.likes); // For front-end purpose
    } catch(error) {
        console.error(error.message);
        res.status(500).send('Server Error!');
    }
});

// @route      PUT api/posts//unlikelike/:id
// @desc       Unlike a Post 
// @access     Private

router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const post = await Posts.findById(req.params.id);
        //filter() High order array method
        // Check if post has already been liked
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ msg: 'Post has not yet been liked' }) // 400 BAD REQUEST
        }

        // Get remove index (Same as Experience & Education)
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

        //splice() takes out the specific key value out of the array
        post.likes.splice(removeIndex, 1);

        await post.save();

        res.json(post.likes); // For front-end purpose
    } catch(error) {
        console.error(error.message);
        res.status(500).send('Server Error!');
    }
});

// @route      POST api/posts/comment/:id
// @desc       Create a comment
// @access     Private
router.post('/comment/:id', [auth, [
    check('text', 'Text is required')
        .not()
        .isEmpty()
    ] 
], 
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Posts.findById(req.params.id);

        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id,
        };

        post.comments.unshift(newComment);

        await post.save();

        res.json(post.comments);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error!');
    }
});

// @route      DELETE api/posts/comment/:id/:comment_id
// @desc       Delete a comment
// @access     Private

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Posts.findById(req.params.id);

        // Pull out comment
        const comment = post.comments.find(comment => comment.id = req.params.comment_id);

        // Make sure comment exists
        if (!comment) {
            return res.status(404).json({ msg: 'Comment does not exist!' });
        }

        // Check user
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized! '})
        }

        // Get remove index
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);

        //splice() takes out the specific key value out of the array
        post.comments.splice(removeIndex, 1);

        await post.save();

        res.json(post.comments); // For front-end purpose
    } catch(error) {
        console.error(error.message);
        res.status(500).send('Server Error!');
    }
});


module.exports = router;
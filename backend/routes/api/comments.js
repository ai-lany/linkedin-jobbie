const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Post = mongoose.model('Post');
const Comment = mongoose.model('Comment');
const { requireUser } = require('../../config/passport');
const validateCommentInput = require('../../validations/comments');

router.post('/', requireUser, async (req, res, next) => {
    try {
        const newComment = new Comment({
            text: req.body.text,
            user: req.body.user,
            post: req.body.post
        });

        let comment = await newComment.save();
        comment = await comment.populate('user', '_id username');
        // await comment.populate('post', '_id');
        comment = {
            ...comment.toJSON(),
            post: comment.post._id,
        };

        return res.json(comment);
    } catch (err) {
        next(err);
    }
});

router.get('/post/:postId', async (req, res, next) => {
    let post;
    try{
        post = await Post.findById(req.params.postId);
    } catch(err) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        error.errors = { message: "No post found with that id" };
        return next(error);
    }
    try{
        const comments = await Comment.find({ post: post._id })
        .populate("user", "_id username");
        return res.json(comments);
    }
    catch(err) {
        return res.json([]);
    }
});


module.exports = router;

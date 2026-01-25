const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Post = mongoose.model('Post');
const { requireUser } = require('../../config/passport');
const validatePostInput = require('../../validations/posts');

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
                              .populate("author", "_id username")
                              .sort({ createdAt: -1 });

    let postsObject = {}
    posts.forEach((post) => {
      postsObject[post._id] = post;
    })

    return res.json(postsObject);
  }
  catch(err) {
    return res.json([]);
  }
});

router.get('/user/:userId', async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.params.userId);
  } catch(err) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.errors = { message: "No user found with that id" };
    return next(error);
  }
  try {
    const posts = await Post.find({ author: user._id })
                              .sort({ createdAt: -1 })
                              .populate("author", "_id username");
    return res.json(posts);
  }
  catch(err) {
    return res.json([]);
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
                             .populate("author", "_id username");
    return res.json(post);
  }
  catch(err) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    error.errors = { message: "No post found with that id" };
    return next(error);
  }
});


router.post('/', requireUser, validatePostInput, async (req, res, next) => {
    try {
      const newPost = new Post({
        text: req.body.text,
        author: req.user._id
      });
  
      let post = await newPost.save();
      post = await post.populate('author', '_id username');
      return res.json(post);
    }
    catch(err) {
      next(err);
    }
});

router.patch('/:id', requireUser, async (req, res, next) => {
  try {
    const post = await Post.findOneAndUpdate(
      // Find the post by ID and ensure it belongs to the authenticated user
      {_id: req.params.id, author: req.user._id},
      {
        // Use the $set operator to update the specified fields (in this case, the 'text' field)
        $set: {
          text: req.body.text
        }
      },
      // Set { new: true } to return the updated document instead of the original one
      {new: true}
    ).populate('author', '_id username');

    // If the post is not found or the user is not authorized to update it, handle the error
    if (!post){
      const error = new Error('Post not found or unauthorized');
      error.statusCode = 404;
      error.errors = { message: 'No post found with that id or unauthorized access'};
      return next(error);
    }

    // If the post is successfully updated, return the updated post in the response
    return res.json(post)
  } catch (err) {
    // If an error occurs during the update process, pass it to the error handling middleware
    next(err);
  }

});

router.delete('/:id', requireUser, async (req, res, next) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id
    });
    if (!post){
      const error = new Error('Post not found or unauthorized')
      error.statusCode = 404;
      error.errors = { message: 'No post found with that id or unauthorized access' };
      return next(error);
    }
    return res.json({ message: 'Post deleted successfully' });
  } catch(err) {
    next(err);
  }
})

module.exports = router;
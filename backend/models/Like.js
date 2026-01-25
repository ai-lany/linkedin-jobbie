const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const likeSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Polymorphic association
    likeable: {
        type: Schema.Types.ObjectId,
        required: true
    },
    // Indicate the type of the liked item: 'Post' or 'Comment'
    likeableType: {
        type: String,
        enum: ['post', 'comment'],
        required: true
    }
}, {
timestamps: true
});

module.exports = mongoose.model('Like', likeSchema);
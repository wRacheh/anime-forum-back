'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const commentSchema = Schema({
    content: String,
    user: { type : Schema.Types.ObjectId, ref: 'user' },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    created: { type: Date, default: Date.now },
    post: { type: Schema.Types.ObjectId, ref: 'post' }
});

commentSchema.methods.upvote = function (cb) {
    this.upvotes += 1;
    this.save(cb);
};

commentSchema.methods.downvote = function (cb) {
    this.downvotes += 1;
    this.save(cb);
};
mongoose.model('Comment', commentSchema);

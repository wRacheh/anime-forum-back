'use strict';
require('./Category');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const postSchema =  Schema({
    title: String,
    content: String,
    user: { type: Schema.ObjectId, ref: 'user' },
    upvotes: { type: Number, default: 0 },
    category:{type: Schema.ObjectId, ref: 'Category'},
    downvotes: { type: Number, default: 0 },
    created: { type: Date, default: Date.now },
    views: {Type:Number,default:0},
    active: {type: Boolean, default: true},
    comments: [{ type: Schema.ObjectId, ref: 'Comment' }],

});


  postSchema.methods.downvote = function(cb) {
    this.downvotes += 1;
    this.save(cb);
  };

  postSchema.methods.addview = function(cb) {
    this.views += 1;
    this.save(cb);
  };

  postSchema.methods.close = function(cb) {
    this.active = false;
    this.save(cb);
  };

  postSchema.methods.open = function(cb) {
    this.active = true;
    this.save(cb);
  };
  postSchema.methods.addpost = function (cb) {
   // this.numposts += 1;
    this.save(cb);
};
  postSchema.pre('remove', function(next) {
      this.model('comment').remove( { post: this._id }, next )
      this.model('Category').update({ posts: this._id },
        { $pull: { posts: { $in: [this._id] }} } , next);
  });

  module.exports = mongoose.model("Post", postSchema);

  mongoose.model('Post', postSchema);


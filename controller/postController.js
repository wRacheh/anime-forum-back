'use strict';
var moment = require('moment');
var mongoose = require('mongoose');
const post = require('../model/post');

var user = require('../model/user')
// var Post = require('../model/Post');
function savePost(req, res) {
    var params = req.body;
    if (!params.title)
        return res.status(200).send({message: "Title field is required."});

    var Post = new Post();
    Post.title = params.title;
    Post.content = params.content;
    Post.user = req.user.sub;
    Post.save((err, PostStored) => {
        if (err)
            return res.status(500).send({message: "Saving Posty error."});
        if (!publicationStored)
            return res.status(404).send({message: "Post not saved."});

        return res.status(200).send({publication: PostStored});
    });
}

//     console.log(posts)


module.exports = {
  savePost,
  
};
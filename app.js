require("dotenv").config();
require("./config/database").connect();
const mongoose = require("mongoose");
require('./model/Post');
require('./model/Category');
require('./model/Comment');
var bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const User = require("./model/user");
const express = require("express");
const app = express();
app.use(express.json());
var Post = mongoose.model('Post');
var user = mongoose.model('user');
var Category = mongoose.model('Category');
var Comment =mongoose.model('Comment')
var router = express.Router();
var bodyParser = require('body-parser');
const auth = require("./middleware/auth");
const { json } = require("express");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');

    next();
});
//signup methode
app.post("/register", async (req, res) => {
    try {
        const { first_name, last_name, username, imageUrl, email, password } = req.body;

        if (!(email && username && password && first_name && last_name)) {
            res.status(400).send("All input is required");
        }
        const oldUserEmail = await User.findOne({ email });
        const oldUserUsername = await User.findOne({ username });
        if (oldUserEmail || oldUserUsername) {
            return res.status(409).send("User Already Exist. Please Login");
        }

        encryptedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            first_name,
            last_name,
            username,
            imageUrl,
            email: email.toLowerCase(),
            password: encryptedPassword,
        });
        console.log("user created")
        const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            {
                expiresIn: "2h",
            }
        );
        user.token = token;
        res.status(201).json(user);
    } catch (err) {
        console.log(err);
    }
});

//login methode
app.post("/login", async (req, res) => {

    try {
        const { email, password } = req.body;

        if (!(email && password)) {
            res.status(400).send("Email and password Are required");
        }
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2h",
                }
            );
            user.token = token;
            res.status(200).json(user);
        }
        res.status(400).send("Invalid Credentials");
    } catch (err) {
        console.log(err);
    }
});

//get all users
app.get('/api/user/', function (req, res, next) {
    user.find(function (err, user) {
        if (err) return next(err)
        res.json(user);
    });
});

//get by id 
app.get('/api/user/:id', function (req, res) {
    var userId = req.params.id;
    user.findById(userId, function (err, user) {
        if (!user)
            return res.status(404).send({ message: "User Not Found." });
        res.json(user);
    });
});
//update user
app.post('/api/user/:id', auth, function (req, res) {
    var userId = req.params.id;
    var update = req.body;
    delete update.password;
    if (userId !== req.user.user_id) {
        return res.status(500).send({ message: "You do not have permissions to modify the user." });
    }
    user.find({
        $or: [
            { email: update.email.toLowerCase() },
            { username: update.username.toLowerCase() }
        ]
    }).exec((err, users) => {
        var user_isset = false;
        users.forEach((users) => {
            console.log(users._id)

            if (users._id != userId)
                user_isset = true;
        });
        console.log(user_isset)
        if (user_isset)
            return res.status(400).send({ message: "The email and/or the username already exists..." });

        user.findByIdAndUpdate(userId, update, { new: true }, (err, userUpdated) => {
            if (!userUpdated)
                return res.status(404).send({ message: "User Not Found." });
            if (err)
                return res.status(500).send({ message: "Request Error." });

            return res.status(200).send({ user: userUpdated });
        });
    });
})

//delet user by id 
app.delete('/api/user/:user', auth, function (req, res) {
    console.log("Deleting user with ID: " + req.params.user);

    user.findById(req.params.user).exec(function (err, doc) {
        if (err || !doc) {
            res.statusCode = 404;
            res.send({ message: "User not found !" });
        }
        else {
            doc.remove(function (err) {
                if (err) {
                    res.statusCode = 403;
                    res.send({ message: "Erreur :" })
                }
                else {
                    res.send({ message: "user deleted" })
                }
            })
        }
    });
});

//Post methodes 

// //create post
app.post('/api/posts', auth, (req, res, next) => {
    var params = req.body;
    var post = new Post(req.body);
    if (!params.content)
        return res.status(200).send({ message: "Content field is required." });

    post.save((err, postStored) => {
        if (err)
            return res.status(500).send({ message: "Saving publication error." });
        if (!postStored)
            return res.status(404).send({ message: "Publication not saved." });
        if (postStored) {
            user.findOne({ 'id': params.user._id }, function (err, user) {
                if (err) return handleError(err);
                user.addpost(user);
                user.posts.push(post);
            });
            Category.findOne({ 'id': params.category._id }, function (err, category) {
                if (err) return handleError(err);
                category.posts.push(post)
                console.log("cat", category)

            });
            return res.status(200).send({ post: postStored });
        }
    })
});


//get All Posts
app.get('/api/posts/', function (req, res, next) {
    Post.find(function (err, posts) {
        if (err) return next(err)
        res.json(posts);
    });
});


//get post by id 
app.get('/api/posts/:post', function (req, res, next) {
    req.post.addview(function (err, post) {
        if (err) { return next(err); }

    });
    req.id.populate('comment', function (err, post) {
        if (err) { return next(err) }
        res.json(post);
    })
})

app.param('post', function (req, res, next, id) {
    var query = Post.findById(id);
    query.exec(function (err, post) {
        if (err) { return next(err); }
        if (!post) { return next(new Error('can\'t find post')); }
        req.post = post;
        return next();
    });
});

//upvote post
app.put('/api/posts/upvote/:post', auth, function (req, res, next) {
    req.post.upvote(function (err, post) {
        if (err) { return next(err); }
        res.json(post);
    });
});

//downvote post
app.put('/api/posts/downvote/:post', auth, function (req, res, next) {
    req.post.downvote(function (err, post) {
        if (err) { return next(err); }
        res.json(post);
    });
});

//close post
app.put('/api/posts/close/:post', auth, function (req, res, next) {

    req.post.close(function (err, post) {
        if (err) { return next(err); }
        res.json(post);
    });
});
//open post 
app.put('/api/posts/open/:post', auth, function (req, res, next) {
    req.post.open(function (err, post) {
        if (err) { return next(err); }
        res.json(post);
    });
});


//delet post 

app.delete('/api/post/delet/:userId/:postId', auth, function (req, res) {
    Post.findById(req.params.postId).exec(function (err, doc) {
        if (err || !doc) {
            res.statusCode = 404;
            res.send({ message: "Post not found !" });
        }
        else {
            user.findById(req.params.userId).exec(function (err, user) {
                if (err || !user) {
                    res.statusCode = 404
                    res.send({ message: "User not found" })
                }
                else {
                    if (req.params.userId == doc.user._id) {
                        user.posts.pull({ _id: req.params.postId });
                        user.numposts--;
                        user.save()
                        Post.findByIdAndDelete(req.params.postId).exec(function (err, doc) {
                            if (!doc) {
                                res.statusCode = 404
                                res.send({ message: "Post Not Found" })
                            }
                            else {
                                res.statusCode = 200
                                res.send({ message: "Post deleted !" })

                            }
                        })
                    }
                }
            })
        }
    })
})
// category function

//create category
app.post('/api/category', auth, (req, res) => {
    catName = req.body.categoryname
    cat = catName.toUpperCase()
    var category = new Category({
        "categoryname": cat,
        "categorydescription": req.body.categorydescription,
        "createdBy": req.body.createdBy
    });

    let userId = category.createdBy._id;
    let currentRole = ""
    user.findById(userId, function (err, user) {
        if (!user) {
            return res.status(404).send({ message: "User Not Found." });
        }
        else {
            currentRole = user.userrole;
            if (currentRole !== "Admin") {
                return res.status(500).send({ message: "You can't add a category ..." });
            }
            else {
                category.save(function (err, category) {
                    if (err) {
                        return res.status(404).send({ message: "Category name already in use." });
                    }
                    res.json(category)
                }
                )
            }
        }
    });
})

//edit post 
app.put('/api/post/edit/:id', auth, function (req, res) {
    oldPostId = req.params.id;
    var option = { new: true };
    var update;
    Post.findById(oldPostId, function (err, post) {
        if (!post) {
            res.statusCode = 404
            res.send({ message: "Post not found" })
        }
        else {
            //console.log()
             update = {
                title: req.body.title,
                content: req.body.content,
                category: post.category
            };
            Post.findByIdAndUpdate(oldPostId, update, option, function (err, post) {
               if(post){
                //res.json(post)
                res.send({ message: "Post Updated" })

               }
            })    
        }
 
    })
   // res.send(json(post))
})

// get all categorys
app.get('/api/category', (req, res, next) => {

    Category.find(function (err, user) {
        if (err) return next(err)
        res.json(user);
    })
})

//get category by id
app.get('/api/category/:id', (req, res) => {
    var catId = req.params.id;
    Category.findById(catId, function (err, category) {
        if (!category)
            return res.status(404).send({ message: "Category Not Found." });
        res.json(category);
    });
})

//get category by name
app.get('/api/categorys/:categoryname', function (req, res, next) {
    catName = req.params.categoryname;
    Category.findOne({ categoryname: req.params.categoryname.toUpperCase() }, function (req, category) {
        if (!category) {
            return res.status(404).send({ message: "Category not found with name " + catName })
        }
        else {
            res.json(category)
        }
    })
})


//comment post
//comment router
app.param('Comment', function(req, res, next, id) {
    var query = Comment.findById(id);
    query.exec(function (err, comment){
      if (err) { return next(err); }
      if (!comment) { return next(new Error('can\'t find comment')); }
      req.comment = comment;
      return next();
    });
  });
  //add new comment
app.post('/api/comments/:post/comments', auth, function(req, res, next) { 
    var comment = new Comment(req.body);
    comment.post = req.post;
    if(req.post.active && comment.content.length> 1){
        
        comment.save(function(err, comment){
            if(err){ return next(err); }
            req.post.comments.push(comment);
            req.post.save(function(err, post) {
            if(err){ return next(err); }
            res.json(comment);
            });
        });
        User.findOne({ 'id': comment.user._id }, function (err, user) {
            if (err) return handleError(err);
                user.addcomment(user);
                user.comments.push(comment);
        });
    }
    else if(req.post.active && comment.content.length< 1){
        var err =("Comment can't be empty !")
        res.send(err)
        return next(err)
    }
    else{
        var err = ("Failed. The Post Is Inactive.")
        res.send(err);
        return next(err);
    }
});

//delet comment
app.delete('/api/comment/delet/:userId/:postId/:commentId', auth, function (req, res) {
    Comment.findById(req.params.commentId).exec(function (err, doc) {
        if (err || !doc) {
            res.statusCode = 404;
            res.send({ message: "Comment not found !" });
        }
        else {
            user.findById(req.params.userId).exec(function (err, user) {
                if (err || !user) {
                    res.statusCode = 404
                    res.send({ message: "User not found" })
                }
                else {
                    if (req.params.userId == doc.user._id) {
                        user.comments.pull({ _id: req.params.commentId });
                        user.numcomments--;
                        user.save()

                        Post.findById(req.params.postId).exec(function(err,post){
                            post.comments.pull({_id: req.params.commentId});
                            post.save();
                        })
                        Comment.findByIdAndDelete(req.params.commentId).exec(function (err, doc) {
                            if (!doc) {
                                res.statusCode = 404
                                res.send({ message: "Comment Not Found" })
                            }
                            else {
                                res.statusCode = 200
                                res.send({ message: "Comment deleted !" })
                            }
                        })
                        
                    }
                }
            })
        }
    })
})
//upvote comment 
app.put('/api/comments/upvote/:Comment', auth, function(req, res, next) {
    req.comment.upvote(function(err, comment){
        if (err) { return next(err); }
        res.json(comment);
    });
});

//downvote comment
app.put('/api/comments/downvote/:Comment', auth, function(req, res, next) {
    req.comment.downvote(function(err, comment){
        if (err) { return next(err); }
        res.json(comment);
    });
});


//update comment 

module.exports = app;
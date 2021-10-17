const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const userSchema = Schema({
    first_name: { type: String, default: null },
    last_name: { type: String, default: null },
    imageUrl: { type: String, default: null },
    username: { type: String, default: null, unique: true },
    email: { type: String, unique: true, unique: true },
    password: { type: String },
    userrole: { type: String, default: 'User' },
    comments: [{ type:Schema.Types.ObjectId, ref: 'comment' }],
    posts: [{ type: Schema.ObjectId, ref: 'Post' }],
    numposts: { type: Number, default: 0 },
    numcomments: { type: Number, default: 0 },
    token: { type: String },
});
userSchema.methods.addpost = function (cb) {
    this.numposts += 1;
    this.save(cb);
};
userSchema.methods.addcomment = function (cb) {
    this.numcomments += 1;
    this.save(cb);
};
module.exports = mongoose.model("user", userSchema);
mongoose.model('user', userSchema);

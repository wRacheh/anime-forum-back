var mongoose = require('mongoose');
var schema = mongoose.Schema
var CategorySchema = schema({
	categoryname: {type:String , unique:true,required:true},
	categorydescription: String,
	created: {type: Date, default: Date.now()},
	posts: [{ type: schema.Types.ObjectId, ref: 'Post' }],
    createdBy : {type:schema.Types.ObjectId,ref :'user'}
});

CategorySchema.methods.addview = function(cb) {
  this.views += 1;
  this.save(cb);
};

CategorySchema.pre('remove', function(next) {
    this.model('Post').find( { category: this._id }, function(err, docs){
        for( var doc in docs){
            docs[doc].remove();
        }
    });	
	next();
});
module.exports = mongoose.model("Category", CategorySchema);
mongoose.model('Category', CategorySchema);
const mongoose =require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    description :{
        type : String,
        required : true,
        trim : true,
        minlength : 10
    },

    completed:{
        type : Boolean,
        default:false
    },
    owner:{
        type : mongoose.Schema.Types.ObjectId,
        required:true,
        ref : 'User'
    }    
},{
    timestamps:true
});

const Task = mongoose.model('Task', userSchema);
module.exports = Task
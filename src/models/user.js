const mongoose =require('mongoose');
const validator = require('validator');
const bcrypt =require('bcrypt');
const jwt = require('jsonwebtoken');
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name :{
        type : String,
        required : true,
        trim : true
    },
    email:{
        type : String,
        unique:true,
        required : true,
        lowercase : true,
        trim:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error ('Email is invalid')
            }
        }
    },
    password:{
        type :String,
        required:true,
        trim :true,
        minlength : 7,
        validate(value){
            if(value.toLowerCase().includes('password'))
            {
                throw new Error('Password contains "password"'); 
            }
        }
    },
    age:{
        type : Number,
        default: 0,
        validate(value){
            if(value< 0){
                throw new Error('Age must be Positive')
            }
        }
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }],
    avatar:{
        type :Buffer
    }
},  {
    timestamps:true
})

// Trying to establish connection between tasks and user
userSchema.virtual('tasks',{
    ref:'Task',
    localField : '_id',
    foreignField : 'owner'
})

// Hiding private Data
userSchema.methods.toJSON= function(){
    const user = this
    const userObject = user.toObject()
    
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}

// Authentication token generation
userSchema.methods.generateAuthToken = async function (){
    const user = this
    const token = jwt.sign({_id:user._id.toString()},process.env.JWT_SECRET)

    user.tokens =user.tokens.concat({token})
    await user.save()
    return token
}

// Login credentials
userSchema.statics.findByCredentials =async(email,password)=>{
    const user = await User.findOne({email})
    if(!user)
    {
        throw new Error('Invalid Credentials')
    }

    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch)
    {
        throw new Error('Invalid Credentials')
    }

    return user
}


// This is for Password Hashing
userSchema.pre('save', async function(next){
    const user = this

    if(user.isModified('password'))
    {
        user.password=await bcrypt.hash(user.password,8)
    }

    next()
})

//When user is deleted, his tasks are also to be deleted
userSchema.pre('remove',async function(next){
    const user= this
    await Task.deleteMany({owner : user._id})
    next()
}) 

const User = mongoose.model('User', userSchema);

module.exports = User
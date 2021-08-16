const express=require('express');
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp  = require('sharp');
const { sendWelcomeEmail, cancellationMail } = require('../emails/account');
const router = new express.Router()


router.post('/users',async(req,res)=>{
    
    const user = new User(req.body);

    try{
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user,token})
    }catch(e){
        res.status(400).send(e)
    }
    // user.save().then(()=>{
    //     res.status(201).send(user)
    // }).catch((e)=>{
    //     res.status(400).send(e)
    // })
})

// For login Credentials
router.post('/users/login',async(req,res)=>{
    try {
        const user =await User.findByCredentials(req.body.email,req.body.password)
        const token = await user.generateAuthToken()
        res.send({user,token})
    } catch (e) {
        res.status(400).send()   
    }
})

// For logout 
router.post('/users/logout',auth,async(req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    }catch(e)
    {
        res.status(500).send()  
    }
})

// For logoutAll tokens
router.post('/users/logoutAll',auth,async(req,res)=>{
    try{
        req.user.tokens = []
        
        await req.user.save()

        res.send()
    }catch(e)
    {
        res.status(500).send()  
    }
})
// For Reading Data

router.get('/users/me',auth,async(req,res)=>{

    res.send(req.user)
    // try {
    //     const users = await User.find({})
    //     res.send(users)
    // } catch (e) {
    //     res.status(500).send()
    // }
    // User.find({}).then((users)=>{
    //     res.send(users);
    // }).catch((e)=>{
    //     res.status(500).send()
    // })
})

// For reading Data with particular ID
// router.get('/users/:id',async(req,res)=>{

//     const _id=req.params.id;
//     try {
//         const user = await User.findById({_id})
//         if(!user)
//         {
//             return res.status(404).send()
//         }
//         res.send(user);
//     } catch (e) {
//         res.status(500).send()
//     }
//     // User.findById({_id}).then((user)=>{
//     //     if(!user){
//     //         return res.status(404).send()
//     //     }
//     //     res.send(user);
//     // }).catch((e)=>{
//     //     res.status(500).send()
//     // })
// })

// Here we are updating Data
router.patch('/users/me',auth,async(req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name','email','password','age']
    const isValidOperation = updates.every((update)=>{
        return allowedUpdates.includes(update)
    })
    if(!isValidOperation)
    {
        return res.status(400).send({error : 'Invalid Updates!'})
    }
    const _id = req.params.id
    try {
        // We can also update by using this 
        // const user = await User.findByIdAndUpdate(_id,req.body,{new:true,runValidators:true})

        
        updates.forEach((update)=>{
            req.user[update] = req.body[update]
        })
        await req.user.save()
        
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// For deleting user
router.delete('/users/me',auth,async(req,res)=>{
    
    try {
        await req.user.remove()
        cancellationMail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send()   
    }
})

const upload = multer({
    limits : {
        // 1MB = 1000000
        fileSize : 2000000
    },
    // Here file is file name and cb is callback
    // This is in regex101 format(regular expression)
    // starts and ends with / (\ this searches the file with .jpg or jpeg or png) $ means ending with
    fileFilter(req,file,cb)
    {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/))
        {
            return cb(new Error('Image extension should be correct'))
        }
        cb(undefined,true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req,res)=>{
    const buffer=  await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}),(error,req,res,next)=>{
    res.status(400).send({error:error.message})
}

router.delete('/users/me/avatar', auth, async(req,res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async(req,res)=>{
    try {
        const user = await User.findById(req.params.id)
    if(!user || !user.avatar)
    {
        throw new Error()
    }
    res.set('Content-Type','image/png')
    res.send(user.avatar)
 
    } catch (e) {
            res.status(400).send()
    }
})
module.exports = router
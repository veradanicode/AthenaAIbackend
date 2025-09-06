const { genSalt } = require('bcryptjs');
const User =require('../models/User')
const jwt=require('jsonwebtoken')

//register a user
const registerUser =async(req,res)=>{
    try {
        const {name,email,password}=req.body;

        //check if the user email exists already
        const user = await User.findOne({email})
        if (user) {
            return res.status(400).json({
                success:false,
                message:"This user already exists!Please try again"
            })
        }

        //hash the password
        const salt =genSalt(10)
        const hashedPassword= await bcrypt.hash(password,salt)

        //Create new User
        const newUser=new User({
            name,
            email,
            password:hashedPassword
        })

        await newUser.save()

        res.status(201).json({
                message: "User created successfully" 
        });


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
}
//login a user
const loginUser =async(req,res)=>{
    try {
        const {email,password}=req.body;

        //check if email exists
        const user=await User.findOne({email})
        if (!user) {
            return res.status(400).json({ message: "Invalid email " });
        }

        //check if password is correct
        const isMatch=await bcrypt.compare(password,user.password)
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid  password" });
        }

        res.status(200).json({ message: "Login successful" });

        //get access token



    } catch (error) {
        console.error(error);
    res.status(500).json({ message: "Server error during login" });
    }
}

module.exports={
    registerUser,
    loginUser
}
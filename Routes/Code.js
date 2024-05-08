const express = require('express');
const router = express.Router();
const Codes = require('../Models/Codes');
const mongoose=require('mongoose');

router.get('/CreateCode' , async (req, res)=>{
    try{
        const codes = await Codes.create({
            code: "Connect"
        })
    
        const codes1 = await Codes.create({
            code: "Follow"
        })

        const Success = true;
        res.json({ Success })
    }

    catch(error){
        console.error(error.message);
        res.status(500).send("Some error occured in Create Code");
    }
})

module.exports = router
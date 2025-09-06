import express from 'express';
const router = express.Router();
const {registerUser,loginUser}=require('../controllers/auth-controller')

// routes
router.post('/register', registerUser);
router.post('/login',loginUser);

export default router;

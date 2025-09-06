import express from 'express';
import router from  express.Router();
import {registerUser,loginUser} from '../controllers/auth-controller';
import authMiddleware from '../middleware/auth'

// routes
router.post('/register', registerUser);
router.post('/login',loginUser);

export default router;

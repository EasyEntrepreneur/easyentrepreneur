import { Router } from 'express';
import { generateDocument } from '../controllers/documentController';

const router = Router();

router.post('/generate', generateDocument);

export default router;

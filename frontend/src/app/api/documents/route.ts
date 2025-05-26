import { Router } from 'express';
import { generateDocument } from '../../../../backend/src/controllers/documentController';

const router = Router();

router.post('/generate', generateDocument);

export default router;

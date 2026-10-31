import { Router } from 'express';
import { query } from '../../db/pool.js';
import { auth, requireRole } from '../../middleware/auth.js';
const router=Router(); router.use(auth,requireRole('customer'));
router.get('/overview',async(req,res,next)=>{try{const [subs,invoices,payments]=await Promise.all([query("SELECT s.*,p.name AS plan_name FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.customer_id=$1 ORDER BY s.id DESC",[req.user.customerId]),query('SELECT * FROM invoices WHERE customer_id=$1 ORDER BY invoice_date DESC',[req.user.customerId]),query('SELECT p.* FROM payments p JOIN invoices i ON i.id=p.invoice_id WHERE i.customer_id=$1 ORDER BY p.paid_on DESC',[req.user.customerId])]);res.json({data:{subscriptions:subs.rows,invoices:invoices.rows,payments:payments.rows}});}catch(e){next(e);}});
router.get('/subscriptions',async(req,res,next)=>{try{const {rows}=await query('SELECT s.*,p.name AS plan_name FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.customer_id=$1 ORDER BY s.id DESC',[req.user.customerId]);res.json({data:rows});}catch(e){next(e);}});
router.get('/invoices',async(req,res,next)=>{try{const {rows}=await query('SELECT * FROM invoices WHERE customer_id=$1 ORDER BY invoice_date DESC',[req.user.customerId]);res.json({data:rows});}catch(e){next(e);}});
router.get('/payments',async(req,res,next)=>{try{const {rows}=await query('SELECT p.* FROM payments p JOIN invoices i ON i.id=p.invoice_id WHERE i.customer_id=$1 ORDER BY p.paid_on DESC',[req.user.customerId]);res.json({data:rows});}catch(e){next(e);}});
export default router;

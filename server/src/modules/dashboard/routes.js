import { Router } from 'express';
import { query } from '../../db/pool.js';
import { auth, requireRole } from '../../middleware/auth.js';
import { getToday } from '../../lib/clock.js';
const router = Router(); router.use(auth, requireRole('admin','staff'));
router.get('/summary', async (req,res,next)=>{try{const today=await getToday();const {rows}=await query(`SELECT
 (SELECT count(*)::int FROM subscriptions WHERE status='active') AS active_subscriptions,
 (SELECT count(*)::int FROM subscriptions WHERE status='active' AND paused_at IS NOT NULL) AS paused_subscriptions,
 (SELECT COALESCE(sum(total),0) FROM invoices WHERE status IN('confirmed','paid')) AS invoiced,
 (SELECT COALESCE(sum(amount),0) FROM payments WHERE voided_at IS NULL) AS collected,
 (SELECT COALESCE(sum(total-amount_paid),0) FROM invoices WHERE status='confirmed') AS outstanding,
 (SELECT count(*)::int FROM invoices WHERE status='confirmed' AND due_date<$1 AND amount_paid<total) AS overdue_count,
 (SELECT COALESCE(sum(total-amount_paid),0) FROM invoices WHERE status='confirmed' AND due_date<$1 AND amount_paid<total) AS overdue_amount`,[today]);res.json({data:rows[0]});}catch(e){next(e);}});
router.get('/overdue', async(req,res,next)=>{try{const today=await getToday();const {rows}=await query(`SELECT i.*,c.name AS customer_name,($1::date-i.due_date) AS days_overdue,(i.total-i.amount_paid) AS outstanding FROM invoices i JOIN customers c ON c.id=i.customer_id WHERE i.status='confirmed' AND i.due_date<$1 AND i.amount_paid<i.total ORDER BY days_overdue DESC LIMIT 100`,[today]);res.json({data:rows});}catch(e){next(e);}});
router.get('/revenue-by-month', async(_req,res,next)=>{try{const {rows}=await query(`SELECT to_char(date_trunc('month',invoice_date),'YYYY-MM') AS month, sum(total) AS total FROM invoices WHERE status IN('confirmed','paid') GROUP BY 1 ORDER BY 1`);res.json({data:rows});}catch(e){next(e);}});
export default router;

@AGENTS.md

# هيكل المشروع — اقرأ قبل أي تعديل

هذا المشروع فيه **ثلاثة أنظمة منفصلة**:

1. `app/[slug]/` — موقع كل صالون العام (landing page لكل عميل)
2. `app/dashboard/` — داش بورد خاص بكل صالون (بعد اللوقين)
3. `app/admin/` — داش بورد الأدمن (واحد فقط)

## ⚠️ تحذير مهم جداً

**Vercel projects منفصلة تماماً:**

| Project | Repo | الغرض |
|---|---|---|
| `barbers-saas` (vercel) | `domxagency1200/barbers-saas` | المنصة الكاملة — انشر هنا دايماً |
| `Qasaty` (vercel) | `domxagency1200/Qasaty` | Landing page تسويقية للشركة فقط — لا تلمسها |

**لا تنشر أي شيء على مشروع `Qasaty` في Vercel إطلاقاً إلا إذا طُلب منك صراحة.**

## قواعد النشر

- كل تعديل يروح على `domxagency1200/barbers-saas` فقط
- `git push` يذهب تلقائياً لـ `barbers-saas` على Vercel
- النسخة الاحتياطية: `domxagency1200/barbers-saas-backup` (private)

## ملاحظات تقنية

- قاعدة البيانات: Supabase — كل صالون له `salon_id` خاص به
- الصالونات تُعرَّف بالـ `slug` في URL مثل `/alfak` أو `/test-salon`
- `SalonPage.tsx` مشترك بين جميع الصالونات — أي تعديل فيه يؤثر على الكل

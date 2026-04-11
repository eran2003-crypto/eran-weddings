# איך לבנות אתר חתונות כמו זה בחינם

## שלב 1: העתקת הפרויקט
1. לך ל: https://github.com/eran2003-crypto/eran-weddings
2. לחץ על **Fork** (למעלה מימין)
3. עכשיו יש לך עותק משלך

## שלב 2: יצירת דאטאבייס (Supabase - חינם)
1. לך ל: https://supabase.com ותירשם
2. צור פרויקט חדש
3. לך ל-SQL Editor והרץ את הקוד מהקובץ `supabase-setup.sql`
4. לך ל-Storage וצור bucket בשם `uploads` (public)
5. העתק את ה-URL וה-anon key מ-Settings > API

## שלב 3: התאמה אישית - מה לשנות:

### בקובץ `.env.local` (צור אותו):
```
NEXT_PUBLIC_SUPABASE_URL=הURL_שלך_מסופאבייס
NEXT_PUBLIC_SUPABASE_ANON_KEY=הKEY_שלך_מסופאבייס
```

### בקובץ `src/app/page.tsx`:
- **שורה עם "ERAN YOSEF"** → שנה לשם שלך
- **שורה עם "WEDDING CLUB"** → שנה לטקסט שלך
- **שורה עם "972544480145"** → שנה למספר הוואטסאפ שלך
- **שורה עם "TASTE OF THE POWER COUPLES"** → שנה לכותרת שלך
- **שורה עם "ABOUT"** → שנה את הטקסט של האודות
- **שורה עם "MY EDITS"** → שנה לכותרת שלך

### בקובץ `src/app/api/notify/route.ts`:
- שנה את מספר הוואטסאפ
- שנה את ה-Green API credentials (ראה שלב 5)

### בקובץ `src/app/layout.tsx`:
- שנה את "Eran Yosef | Wedding Club" לשם שלך

### תמונות - החלף את הקבצים ב-`public/`:
- `hero-bg.jpg` → תמונת הרקע הראשית
- `about-bg.jpg` → תמונת האודות
- `contact-bg.jpg` → תמונת הטופס

## שלב 4: העלאה ל-Vercel (חינם)
1. לך ל: https://vercel.com ותירשם עם GitHub
2. לחץ "Import Project" ובחר את ה-repo שלך
3. הוסף Environment Variables (NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY)
4. לחץ Deploy
5. קיבלת לינק חי!

## שלב 5: התראות וואטסאפ (Green API - חינם)
1. לך ל: https://green-api.com ותירשם
2. צור מופע (Instance)
3. סרוק QR code עם הוואטסאפ שלך
4. העתק idInstance + apiTokenInstance
5. עדכן בקובץ `src/app/api/notify/route.ts`

## שלב 6: הוספת תוכן
- **סרטונים**: העלה ל-YouTube ואז הורד כ-MP4 עם yt-dlp, העלה ל-Supabase Storage
- **זוגות**: היכנס למצב אדמין (3 קליקים על הפוטר) והוסף
- **עריכות מוזיקה**: העלה קבצי MP3 דרך מצב אדמין

## לינקים שתקבל:
- **אתר ראשי**: https://YOURNAME.vercel.app
- **לינק לזוגות**: https://YOURNAME.vercel.app/after
- **אדמין**: 3 קליקים על הפוטר באתר הראשי

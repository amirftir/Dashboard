// ─── Helpers ────────────────────────────────────────────────

const FARSI_DIGITS = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };

function toEnDigits(str) {
  return str.replace(/[۰-۹]/g, (d) => FARSI_DIGITS[d]);
}

function parseNumbers(text) {
  const cleaned = toEnDigits(text.trim());
  return cleaned.split(/[\s,،]+/).map(Number).filter((n) => !isNaN(n));
}

function isYes(text) {
  const t = text.trim();
  return t === 'بله' || t === 'آره' || t === 'اره' || t === 'بلی' || t === '1' || t === '۱' || t === 'yes';
}

function isNo(text) {
  const t = text.trim();
  return t === 'خیر' || t === 'نه' || t === 'نخیر' || t === '2' || t === '۲' || t === 'no' || t === '0' || t === '۰';
}

const MALE_NAMES = new Set(['محمد','علی','حسین','رضا','امیر','احمد','مهدی','حسن','امین','سعید','فرهاد','بهرام','کامران','پیمان','شاهین','آرش','بابک','داریوش','کوروش','سپهر','پارسا','آرمان','مهران','بهنام','نوید','پویا','مجید','جواد','کیان','آرین','برزو','ایمان','رامین','سهیل','مسعود','حمید','سامان','پدرام','یاسین','عرفان','ابوالفضل','محمدرضا','امیرحسین','علیرضا','محمدحسین','امیرعلی','حسام','شایان','آرمین','دانیال','میلاد','فرزاد','وحید','مرتضی','کاظم','اکبر','تقی','جمشید','هومن','بهزاد']);
const FEMALE_NAMES = new Set(['فاطمه','زهرا','مریم','سارا','نازنین','مهسا','شیما','الهام','نرگس','مینا','لیلا','پریسا','نگار','آتوسا','شهلا','فرناز','نیلوفر','ستاره','بهاره','سمیرا','رویا','آزاده','غزاله','پگاه','هانیه','زینب','نسیم','ساناز','گلناز','مهناز','پروانه','شبنم','ترانه','مژگان','فرشته','ثمین','یاسمن','هلیا','مائده','کیمیا','رها','دنیا','مهرناز','لاله','پریناز','آیدا','بیتا','سحر','شیدا','گیتی']);
const AMBIGUOUS_NAMES = new Set(['آریا','سام','نیکا','ساسان','نوا','درسا','روژان','دریا','سایه','بهار','اسرا','صبا','شهاب']);

function detectGender(firstName) {
  const name = firstName.trim();
  if (MALE_NAMES.has(name)) return 'male';
  if (FEMALE_NAMES.has(name)) return 'female';
  if (AMBIGUOUS_NAMES.has(name)) return 'ambiguous';
  // heuristic: names ending in ه/ا tend female but not reliable enough
  return 'unknown';
}

function todayPersian() {
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  } catch {
    return new Date().toLocaleDateString('fa-IR');
  }
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ─── Complaint Severity Scales ──────────────────────────────

const SEVERITY_SCALES = {
  1: { // سردرد
    title: 'سردردتون بیشتر شبیه کدومه؟',
    options: [
      '۱. گاهی یه سردرد خفیف — با یه قرص حل می‌شه',
      '۲. هفته‌ای چند بار سردرد دارم',
      '۳. سردردم با استرس بدتر می‌شه',
      '۴. سردردای شدید که کار و زندگیمو مختل می‌کنه',
      '۵. میگرنی یا با حالت تهوع و حساسیت به نور',
    ],
  },
  2: { // مشکل خواب
    title: 'مشکل خوابتون بیشتر شبیه کدومه؟',
    options: [
      '۱. گاهی یکم دیر می‌خوابم — ولی کلاً خوبه',
      '۲. اکثر شب‌ها طول می‌کشه تا خوابم ببره',
      '۳. بیدار می‌شم وسط شب و خوابم نمی‌بره',
      '۴. صبح خسته بیدار می‌شم انگار نخوابیدم',
      '۵. خواب برام شده یه جنگ هر شبه',
    ],
  },
  3: { // اضطراب
    title: 'اضطرابتون بیشتر شبیه کدوم حالته؟',
    options: [
      '۱. یه کم نگرانی — گاهی فکرم مشغوله ولی مشکل خاصی نیست',
      '۲. نگرانی منظم — هر روز یه چیزی ذهنمو درگیر می‌کنه',
      '۳. بدن هم درگیره — دلشوره، تپش قلب، عرق کف دست',
      '۴. روی زندگیم اثر گذاشته — بعضی کارا رو دیگه نمی‌تونم انجام بدم',
      '۵. کنترل ندارم — حمله پنیک، نمی‌تونم از خونه برم بیرون',
    ],
  },
  4: { // افسردگی
    title: 'حالتون بیشتر شبیه کدومه؟',
    options: [
      '۱. گاهی بی‌حوصله می‌شم — زود برمی‌گردم',
      '۲. انگیزه‌ام کم شده — کارا رو با زور انجام می‌دم',
      '۳. از چیزایی که قبلاً دوست داشتم لذت نمی‌برم',
      '۴. احساس سنگینی مداوم — مثل اینکه یه وزنه روم باشه',
      '۵. بعضی روزا از تخت بلند شدن هم سخته',
    ],
  },
  5: { // مشکل تمرکز
    title: 'مشکل تمرکزتون بیشتر شبیه کدومه؟',
    options: [
      '۱. گاهی حواسم پرت می‌شه — طبیعیه',
      '۲. برای تمرکز باید خیلی تلاش کنم',
      '۳. وسط کار ذهنم می‌ره جای دیگه بدون اینکه بخوام',
      '۴. نمی‌تونم یه کار رو تا آخر ادامه بدم',
      '۵. ذهنم مثل تلویزیونه که کسی مدام کانالشو عوض می‌کنه',
    ],
  },
  6: { // خستگی مزمن
    title: 'خستگیتون بیشتر شبیه کدومه؟',
    options: [
      '۱. آخر روز خسته می‌شم — طبیعیه',
      '۲. از صبح خسته‌ام بدون دلیل مشخص',
      '۳. حتی بعد از استراحت انرژیم برنمی‌گرده',
      '۴. خستگی کارامو مختل کرده',
      '۵. انرژیم مثل باتری خالیه که شارژ نمی‌شه',
    ],
  },
  7: { // استرس
    title: 'استرستون بیشتر شبیه کدومه؟',
    options: [
      '۱. استرس عادی زندگی — قابل کنترله',
      '۲. بیشتر از حد معمول استرس دارم',
      '۳. بدنم هم استرس رو نشون می‌ده — تنش، سردرد، دل‌درد',
      '۴. استرس خوابم، اشتهام، یا روابطمو تحت تأثیر گذاشته',
      '۵. احساس می‌کنم همیشه تو حالت جنگ یا فرارم',
    ],
  },
  8: { // سایر
    title: 'لطفاً مشکلتون رو کوتاه توضیح بدید:',
    options: [],
    freeText: true,
  },
};

const COMPLAINT_LABELS = {
  1: 'سردرد', 2: 'مشکل خواب', 3: 'اضطراب', 4: 'افسردگی',
  5: 'مشکل تمرکز', 6: 'خستگی مزمن', 7: 'استرس', 8: 'سایر',
};

// ─── Assessment Groups ─────────────────────────────────────

const LAYER1_GROUPS = [
  {
    id: 'L1G1', label: 'Body State 🧘', keys: ['L1Q1','L1Q2','L1Q3'],
    intro: 'بیایید با وضعیت بدنتون شروع کنیم.\n\nبرای هر کدوم از ۰ تا ۳ بگید:\n۰ = اصلاً  ۱ = گاهی  ۲ = اغلب  ۳ = تقریباً همیشه\n\n۱. تنش یا بی‌قراری پایه‌ای در بدن\n۲. گرفتگی مزمن در گردن، فک، شانه‌ها یا سینه\n۳. احساس اینکه بدنتون دائماً در حالت آماده‌باشه',
    maxScale: 3,
  },
  {
    id: 'L1G2', label: 'Breathing & Energy 💨', keys: ['L1Q4','L1Q5','L1Q6'],
    intro: 'چند سوال درباره انرژی و تنفس:\n\n۴. سختی در نفس عمیق و راحت\n۵. خستگی زودتر از حد انتظار\n۶. افت‌های ناگهانی انرژی در طول روز',
    maxScale: 3,
    worldFact: '🌍 جالبه بدونید ۸۰٪ مردم دنیا نفس کم‌عمق می‌کشن بدون اینکه خودشون بدونن. این مستقیم روی انرژی اثر می‌ذاره.',
  },
  {
    id: 'L1G3', label: 'Sleep 🌙', keys: ['L1Q7','L1Q8','L1Q9'],
    intro: 'خواب یکی از مهم‌ترین شاخص‌هاست 🌙\n\n۷. چقدر طول می‌کشه تا خوابتون ببره؟\n۰ = کمتر از ۱۵ دقیقه\n۱ = ۱۵-۳۰ دقیقه\n۲ = ۳۰-۴۵ دقیقه\n۳ = ۴۵ دقیقه تا ۱ ساعت\n۴ = بیش از ۱ ساعت\n۵ = فقط با دارو',
    maxScale: 5, count: 1, splitQuestions: true,
  },
  {
    id: 'L1G3b', label: 'Sleep Continuity', keys: ['L1Q8'],
    intro: '۸. خوابتون چقدر پیوسته‌ست؟\n۰ = عمیق و بدون بیداری\n۱ = یکی دو بار بیدار می‌شم ولی زود می‌خوابم\n۲ = چند بار بیدار می‌شم\n۳ = بیداری‌های مکرر\n۴ = خواب بسیار ناپایدار',
    maxScale: 4, count: 1, hidden: true,
  },
  {
    id: 'L1G3c', label: 'Sleep Morning', keys: ['L1Q9'],
    intro: '۹. صبح وقتی بیدار می‌شید چه حسی دارید؟\n۰ = کاملاً سرحال\n۱ = نسبتاً خوب\n۲ = نه خوب نه بد\n۳ = خسته\n۴ = کاملاً خسته — انگار نخوابیدم',
    maxScale: 4, count: 1, hidden: true,
    worldFact: '🌍 ۶۲٪ مردم دنیا از کیفیت خوابشون راضی نیستن. خواب اولین چیزیه که مغز ازش ضربه می‌خوره و اولین چیزیه که با درمان بهتر می‌شه.',
  },
  {
    id: 'L1G4', label: 'Sensitivity 👂', keys: ['L1Q10'],
    intro: '۱۰. حساسیت به صدا، نور یا محیط‌های شلوغ — از ۰ تا ۵:\n۰ = عادی\n۱ = یکم حساسم\n۲ = محیط شلوغ اذیتم می‌کنه\n۳ = باید از بعضی جاها فرار کنم\n۴ = خیلی حساسم — سردرد یا عصبانیت\n۵ = تحمل ندارم — مجبورم محیطمو کنترل کنم',
    maxScale: 5, count: 1,
  },
  {
    id: 'L1G5', label: 'Recovery ⏱️', keys: ['L1Q11'],
    intro: '۱۱. وقتی استرس دارید، بدنتون چقدر طول می‌کشه آروم بشه؟\n۰ = چند دقیقه\n۱ = کمتر از ۱۵ دقیقه\n۲ = ۱۵-۳۰ دقیقه\n۳ = ۳۰ دقیقه تا ۱ ساعت\n۴ = چند ساعت\n۵ = تمام روز یا بیشتر\n\n💡 منظورم بدنتونه نه ذهنتون. حتی اگه ذهنتون بدونه استرس تموم شده، بدنتون ممکنه هنوز فعال باشه.',
    maxScale: 5, count: 1,
    worldFact: '🌍 فقط ۱۵٪ مردم دنیا می‌تونن بعد از استرس ظرف ۵ دقیقه آروم بشن. اکثر ما بدنمون کندتر از ذهنمون ریکاوری می‌کنه.',
  },
  {
    id: 'L1G6', label: 'Safety 🛡️', keys: ['L1Q12'],
    intro: '۱۲. حس کلی امنیت و آرامش درونی:\n۰ = آرام و ایمن\n۱ = گاهی ناآرام\n۲ = اغلب ناآرام\n۳ = تقریباً همیشه ناایمن',
    maxScale: 3, count: 1,
  },
  {
    id: 'L1G7_gate', label: 'Headache Gate 🤕', keys: [],
    intro: 'آیا سردرد تجربه می‌کنید؟ بله / خیر',
    isGate: true,
  },
  {
    id: 'L1G7', label: 'Headache 🤕', keys: ['L1Q13','L1Q14','L1Q15','L1Q16'],
    intro: '۱۳. تکرار سردرد (۰-۳)\n۱۴. ارتباط سردرد با استرس (۰-۴)\n۱۵. قابل پیش‌بینی بودن سردرد (۰-۴)\n۱۶. علائم همراه — تهوع، حساسیت به نور (۰-۵)',
    maxScale: 5, conditional: true,
  },
  {
    id: 'L1G8', label: 'Daily Fluctuation 📊', keys: ['L1Q17'],
    intro: '۱۷. انرژی و حالتون در طول روز چقدر تغییر می‌کنه؟\n۰ = پایدار\n۱ = کمی نوسان\n۲ = نوسان قابل توجه\n۳ = خیلی بالا و پایین\n۴ = کاملاً غیرقابل پیش‌بینی',
    maxScale: 4, count: 1,
  },
  {
    id: 'L1G9', label: 'Mental Load 🧠', keys: ['L1Q18'],
    intro: '۱۸. توانایی تحمل فشار ذهنی:\n۰ = خوب تحمل می‌کنم\n۱ = کمی سخته\n۲ = زود اشباع می‌شم\n۳ = خیلی کم تحمل دارم\n۴ = کوچک‌ترین فشار ذهنی خُردم می‌کنه',
    maxScale: 4, count: 1,
  },
  {
    id: 'L1G10', label: 'Rest Effect 🛋️', keys: ['L1Q19'],
    intro: '۱۹. وقتی استراحت می‌کنید، چه اتفاقی می‌افته؟\n۰ = به‌وضوح بهتر می‌شم\n۱ = کمی بهتر\n۲ = فرق خاصی نمی‌کنه\n۳ = فرقی نمی‌کنه\n۴ = بدتر می‌شم — ذهنم بیشتر درگیر می‌شه',
    maxScale: 4, count: 1,
  },
  {
    id: 'L1G11', label: 'Morning/Evening 🌅', keys: ['L1Q20','L1Q21'],
    intro: '۲۰. صبح‌ها چطورید؟\n۰ = سرحال\n۱ = کمی سنگین\n۲ = سنگین — طول می‌کشه تا راه بیفتم\n۳ = خیلی سخت\n۴ = صبح بدترین بخش روزمه\n۵ = بعضی روزا نمی‌تونم از تخت بلند بشم\n\n۲۱. عصر و شب‌ها چطورید؟\n۰ = خوبم\n۱ = کمی خسته\n۲ = افت خلق یا انرژی\n۳ = خیلی خسته یا بی‌حوصله\n۴ = شب‌ها بدترین حالمه',
    maxScale: 5,
  },
  {
    id: 'L1G12', label: 'Appetite 🍽️', keys: ['L1Q22','L1Q23','L1Q24'],
    intro: 'چند سوال کوتاه درباره اشتها:\n\n۲۲. خوردن بدون گرسنگی واقعی (۰-۴)\n۲۳. ولع شدید به شیرینی، شور یا کربوهیدرات (۰-۵)\n۲۴. تغییر وزن بدون تغییر عمدی رژیم (۰-۴)',
    maxScale: 5,
  },
  {
    id: 'L1G13', label: 'Medications 💊', keys: [],
    intro: 'و در آخر این بخش — آیا دارویی مصرف می‌کنید؟\n\nبرای هر کدوم بگید: ۰ = خیر  ۱ = قبلاً  ۲ = فعلاً\n\n- آرام‌بخش / بنزودیازپین\n- ضدافسردگی\n- خواب‌آور\n- محرک\n- بتابلاکر\n- سایر (اسم بگید)',
    isMedication: true,
    worldFact: '🌍 ۲۵٪ جمعیت بزرگسال دنیا حداقل یک داروی روان‌پزشکی مصرف می‌کنن. شما تنها نیستید.',
    transition: 'عالی بود! بخش اول تموم شد 🌟\nیه نفس عمیق بکشید...\nبریم سراغ بخش دوم — درباره نحوه کار ذهنتون 🧠',
  },
];

const LAYER2_GROUPS = [
  {
    id: 'L2G1', label: 'Response Inhibition 🛑', keys: ['L2Q1','L2Q2','L2Q3'],
    intro: 'بیایید ببینیم ذهنتون چطور ترمز می‌زنه 🛑\n\nبرای هر کدوم از ۰ تا ۳ بگید:\n۰ = اصلاً  ۱ = گاهی  ۲ = اغلب  ۳ = تقریباً همیشه\n\n۱. وقتی یه فکر یا رفتار شروع می‌شه، سخته متوقفش کنم\n۲. قبل از فکر کردن واکنش نشون می‌دم\n۳. خاموش کردن پاسخ‌ها برام زمان‌بره',
    maxScale: 3,
  },
  {
    id: 'L2G2', label: 'Switching 🔄', keys: ['L2Q4','L2Q5','L2Q6'],
    intro: 'درباره جابجایی بین حالات:\n\n۴. سختی در تغییر از کار به استراحت یا برعکس\n۵. گیرکردن بین دو حالت — می‌خوام ولی نمی‌تونم\n۶. بعد از قطع کار، ذهنم هنوز همون‌جاست',
    maxScale: 3,
    worldFact: '🌍 ۷۰٪ مردم می‌گن بعد از کار نمی‌تونن ذهنشونو خاموش کنن. این ربطی به اراده نداره — مربوط به نحوه سوئیچ مغزه.',
  },
  {
    id: 'L2G3', label: 'Salience ⚡', keys: ['L2Q7','L2Q8','L2Q9'],
    intro: 'این سوالات درباره اینه که ذهنتون چی رو مهم می‌بینه:\n\n۷. چیزهای کوچک بیش از حد مهم و فوری به نظر می‌رسن\n۸. تمرکزم مدام توسط محرک‌های بیرونی یا داخلی ربوده می‌شه\n۹. حس فوریت یا هشدار درونی بدون دلیل واضح',
    maxScale: 3,
  },
  {
    id: 'L2G4', label: 'Rumination 🔁', keys: ['L2Q10','L2Q11','L2Q12'],
    intro: 'درباره فکرهای تکراری:\n\n۱۰. فکرها تکراری می‌شن و سخت قطع می‌شن\n۱۱. ذهنم خودبه‌خود به گذشته، آینده یا خودم برمی‌گرده\n۱۲. وقتایی که باید خاموش باشم، ذهنم فعاله',
    maxScale: 3,
    worldFact: '🌍 تحقیقات نشون می‌ده ما روزی حدود ۶۰۰۰ فکر داریم. در افرادی که نشخوار ذهنی دارن، ۸۰٪ این فکرها تکراری هستن.',
  },
  {
    id: 'L2G5', label: 'Executive Control 📋', keys: ['L2Q13','L2Q14','L2Q15'],
    intro: 'درباره شروع و ادامه کارها:\n\n۱۳. شروع کردن سخته حتی اگه بدونم چی باید بکنم\n۱۴. ادامه دادن تا پایان کار سخته\n۱۵. مدیریت اولویت‌ها و برنامه‌ریزی برام دشواره',
    maxScale: 3,
  },
  {
    id: 'L2G6', label: 'Cognitive Flexibility 🤸', keys: ['L2Q16','L2Q17','L2Q18'],
    intro: 'درباره انعطاف ذهنی:\n\n۱۶. زیر فشار، ذهنم خشک می‌شه و گزینه‌ها کم می‌شن\n۱۷. تغییر دیدگاه یا پذیرفتن مسیر جایگزین سخته\n۱۸. یه الگوی فکری رو تکرار می‌کنم حتی اگه مفید نیست',
    maxScale: 3,
  },
  {
    id: 'L2G7', label: 'Functional Impact 📉', keys: ['L2Q19','L2Q20'],
    intro: 'دو سوال آخر این بخش:\n\n۱۹. مشکلات ذهنی عملکرد شغلی یا تحصیلیم رو مختل کرده\n۲۰. تصمیم‌گیری یا روابطم به‌خاطر واکنش‌پذیری ذهنی آسیب دیده',
    maxScale: 3,
    worldFact: '🌍 ۴۵٪ کارکنان در دنیا می‌گن مشکلات ذهنی روی کارشون اثر منفی گذاشته. مغز وقتی درست تنظیم نباشه، هر کاری سخت‌تر می‌شه.',
    transition: 'عالی! بخش آخر رسیدیم 💪 این بخش درباره پایداری تغییرات و سازگاریه. تقریباً تمومه!',
  },
];

const LAYER3_GROUPS = [
  {
    id: 'L3G1', label: 'Transfer & Generalization 🔀', keys: ['L3Q1','L3Q2','L3Q3'],
    reverseKeys: ['L3Q1'],
    intro: 'وقتی چیزی بهتر می‌شه، چه اتفاقی می‌افته؟\n\n۱. وقتی یه مهارت یا عادتم بهتر می‌شه، به بخش‌های دیگه زندگیم هم سرایت می‌کنه\n   ۰ = اصلاً  ۱ = کمی  ۲ = تا حدی  ۳ = کاملاً\n۲. پیشرفت‌هام فقط تو شرایط خاص کار می‌کنن — محیط، حال، زمان خاص (۰-۳)\n۳. پیشرفت دارم ولی پایدار نیست و به شرایط بستگی داره (۰-۳)',
    maxScale: 3,
  },
  {
    id: 'L3G2', label: 'Progress Stability 📈', keys: ['L3Q4','L3Q5','L3Q6'],
    intro: 'درباره ماندگاری تغییرات:\n\n۴. بعد از پیشرفت، بازگشت‌های خفیف مکرر تجربه می‌کنم (۰-۳)\n۵. با کوچک‌ترین فشار، سریع به الگوی قبلی برمی‌گردم (۰-۳)\n۶. تغییرات خوب وجود دارن ولی شکننده هستن (۰-۳)',
    maxScale: 3,
    worldFact: '🌍 تحقیقات نشون می‌ده ۶۵٪ افرادی که تغییرات مثبت تجربه می‌کنن، در ۳ ماه اول برگشت جزئی دارن. این طبیعیه — مغز به تکرار نیاز داره.',
  },
  {
    id: 'L3G3', label: 'Transition Management 🔄', keys: ['L3Q7','L3Q8','L3Q9'],
    intro: 'درباره جابجایی بین فعالیت‌ها:\n\n۷. انتقال بین شروع، ادامه و پایان کارها مشکل‌سازه (۰-۳)\n۸. بعد از وقفه (تعطیلات، سفر، بیماری)، برگشت به روتین سخته (۰-۳)\n۹. ریتم زندگی یا کارم به‌هم می‌خوره و بازسازیش سخته (۰-۳)',
    maxScale: 3,
  },
  {
    id: 'L3G4', label: 'State Dependency 🎭', keys: ['L3Q10','L3Q11','L3Q12'],
    intro: 'عملکردتون چقدر به حالتون بستگی داره؟\n\n۱۰. عملکردم شدیداً به حالت جسمی و روحی اون لحظه وابسته‌ست (۰-۳)\n۱۱. اگه شرایط ایده‌آل نباشه، کیفیت عملکردم به‌شدت افت می‌کنه (۰-۳)\n۱۲. حتی تو شرایط متوسط، باید خیلی فشار بیارم تا درست کار کنم (۰-۳)',
    maxScale: 3,
  },
  {
    id: 'L3G5', label: 'Internal Conflicts ⚔️', keys: ['L3Q13','L3Q14','L3Q15'],
    intro: 'درباره هماهنگی بین فکر، احساس و بدن:\n\n۱۳. حس تعارض مداوم بین فکر، احساس و بدن دارم (۰-۳)\n۱۴. تصمیم می‌گیرم ولی بدن یا احساسم همکاری نمی‌کنه (۰-۳)\n۱۵. حس ناهماهنگی درونی حتی وقتی مشکل بزرگی نیست (۰-۳)',
    maxScale: 3,
    worldFact: '🌍 ۵۵٪ مردم دنیا می‌گن بین چیزی که می‌خوان و چیزی که انجام می‌دن فاصله هست. این یه مسئله مغزیه، نه کمبود اراده.',
  },
  {
    id: 'L3G6', label: 'Adaptive Capacity 🌊', keys: ['L3Q16','L3Q17','L3Q18'],
    reverseKeys: ['L3Q16','L3Q18'],
    intro: 'درباره سازگاری:\n\n۱۶. وقتی برنامه‌ها عوض می‌شن، می‌تونم خودمو وفق بدم\n   ۰ = نمی‌تونم  ۱ = سخته  ۲ = تا حدی  ۳ = راحت وفق می‌دم\n۱۷. تغییرات کوچک باعث به‌هم‌ریختن سیستمم می‌شن (۰-۳)\n۱۸. بعد از یه روز سخت، می‌تونم فردا رو از صفر بسازم\n   ۰ = نمی‌تونم  ۱ = سخته  ۲ = تا حدی  ۳ = بله',
    maxScale: 3,
  },
  {
    id: 'L3G7', label: 'Overall Integration 🎯', keys: ['L3Q19','L3Q20'],
    reverseKeys: ['L3Q19','L3Q20'],
    intro: 'و در نهایت:\n\n۱۹. زندگی روزمره‌م حس یکپارچگی داره — نه تکه‌تکه\n   ۰ = تکه‌تکه  ۱ = بیشتر تکه‌تکه  ۲ = تا حدی یکپارچه  ۳ = کاملاً یکپارچه\n۲۰. می‌تونم تعادل بین چند حوزه زندگی رو همزمان حفظ کنم\n   ۰ = نمی‌تونم  ۱ = سخته  ۲ = تا حدی  ۳ = بله',
    maxScale: 3,
  },
];

// ─── Report Generator ───────────────────────────────────────

function reverseScore(val, max = 3) {
  return max - val;
}

function groupCap(answers, keys) {
  let mx = 0;
  for (const k of keys) {
    if (answers[k] !== undefined) mx = Math.max(mx, answers[k]);
  }
  return mx;
}

function generateClinicalReport(data) {
  const a = data.answers;
  const date = todayPersian();
  const gender = data.gender === 'male' ? 'مرد' : data.gender === 'female' ? 'زن' : 'نامشخص';

  // Layer 1 TFS
  const l1Keys = Object.keys(a).filter((k) => k.startsWith('L1Q'));
  const tfs = l1Keys.reduce((s, k) => s + (a[k] || 0), 0);

  // Core items with ≥2
  const coreL1 = { L1Q3: 'Q3 آماده‌باش بدن', L1Q7: 'Q7 تأخیر خواب', L1Q8: 'Q8 پیوستگی خواب', L1Q9: 'Q9 کیفیت بیداری', L1Q10: 'Q10 حساسیت', L1Q11: 'Q11 ریکاوری', L1Q12: 'Q12 امنیت', L1Q19: 'Q19 اثر استراحت', L1Q20: 'Q20 صبح' };
  const flaggedCore = Object.entries(coreL1).filter(([k]) => (a[k] || 0) >= 2).map(([, v]) => v);

  // Layer 2 caps
  const l2Caps = LAYER2_GROUPS.map((g) => ({ label: g.label, cap: groupCap(a, g.keys), keys: g.keys }));
  const l2t = l2Caps.reduce((s, c) => s + c.cap, 0);
  const dominantNet = ['Salience', 'DMN', 'Executive'];
  const domScores = [l2Caps[2]?.cap || 0, l2Caps[3]?.cap || 0, l2Caps[4]?.cap || 0];
  const domIdx = domScores.indexOf(Math.max(...domScores));
  const dominant = dominantNet[domIdx];

  // Layer 3 — apply reverse scoring
  const reverseKeysSet = new Set(['L3Q1','L3Q16','L3Q18','L3Q19','L3Q20']);
  const l3Scored = {};
  for (const k of Object.keys(a).filter((k) => k.startsWith('L3Q'))) {
    l3Scored[k] = reverseKeysSet.has(k) ? reverseScore(a[k], 3) : a[k];
  }
  const l3Caps = LAYER3_GROUPS.map((g) => {
    const cap = Math.max(...g.keys.map((k) => l3Scored[k] ?? 0));
    return { label: g.label, cap, keys: g.keys };
  });
  const l3t = l3Caps.reduce((s, c) => s + c.cap, 0);

  function interp(score) {
    if (score <= 6) return 'خفیف';
    if (score <= 13) return 'متوسط';
    return 'بالا';
  }

  const complaints = (data.complaints || []).map((c) => {
    const label = COMPLAINT_LABELS[c.id] || 'سایر';
    return `${label} — سطح ${c.severity}`;
  }).join('\n');

  const medsText = data.medications || 'ندارد';
  const headacheSkipped = !a.L1Q13 && a.L1Q13 !== 0;

  // Build report
  let r = '';
  r += '═══════════════════════════════════════\n';
  r += '📊 گزارش بالینی — TMN Neuro-Regulation Assessment\n';
  r += '═══════════════════════════════════════\n\n';
  r += `🗓️ تاریخ: ${date}\n`;
  r += `👤 مراجع: ${data.name}\n`;
  r += `🔢 سن: ${data.age} | جنسیت: ${gender}\n`;
  r += `📱 تماس: ${data.phone}\n\n`;
  r += '───────────────────────────────────────\n';
  r += `⚠️ غربالگری: ${data.screeningPassed ? 'PASS ✅' : 'FAIL ⛔'}\n`;
  r += '───────────────────────────────────────\n\n';
  r += `🎯 شکایت اصلی:\n${complaints}\n\n`;

  r += '───────────────────────────────────────\n';
  r += '📋 لایه اول: پایه (Foundation)\n';
  r += '───────────────────────────────────────\n\n';
  r += `A) وضعیت بدن: Q1=${a.L1Q1??'-'} Q2=${a.L1Q2??'-'} Q3◆=${a.L1Q3??'-'}\n`;
  r += `B) تنفس/انرژی: Q4=${a.L1Q4??'-'} Q5=${a.L1Q5??'-'} Q6=${a.L1Q6??'-'}\n`;
  r += `C) خواب◆: Q7◆=${a.L1Q7??'-'} Q8◆=${a.L1Q8??'-'} Q9◆=${a.L1Q9??'-'}\n`;
  r += `D) حساسیت: Q10◆=${a.L1Q10??'-'}\n`;
  r += `E) ریکاوری: Q11◆=${a.L1Q11??'-'}\n`;
  r += `F) امنیت: Q12◆=${a.L1Q12??'-'}\n`;
  if (headacheSkipped) {
    r += 'G) سردرد: SKIPPED\n';
  } else {
    r += `G) سردرد: Q13=${a.L1Q13??'-'} Q14=${a.L1Q14??'-'} Q15=${a.L1Q15??'-'} Q16=${a.L1Q16??'-'}\n`;
  }
  r += `H) نوسان: Q17=${a.L1Q17??'-'}\n`;
  r += `I) بار ذهنی: Q18=${a.L1Q18??'-'}\n`;
  r += `J) اثر استراحت: Q19◆=${a.L1Q19??'-'}\n`;
  r += `K) صبح/شب: Q20◆=${a.L1Q20??'-'} Q21=${a.L1Q21??'-'}\n`;
  r += `L) اشتها: Q22=${a.L1Q22??'-'} Q23=${a.L1Q23??'-'} Q24=${a.L1Q24??'-'}\n`;
  r += `M) داروها: ${medsText}\n\n`;
  r += `📊 امتیاز کل پایه (TFS): ${tfs}\n`;
  r += `⚠️ آیتم‌های هسته‌ای (◆) ≥2: ${flaggedCore.length > 0 ? flaggedCore.join('، ') : 'ندارد'}\n\n`;

  r += '───────────────────────────────────────\n';
  r += '📋 لایه دوم: شبکه‌ای (Network)\n';
  r += '───────────────────────────────────────\n\n';
  const l2Labels = ['A) مهار پاسخ','B) سوئیچ','C) سالینس','D) نشخوار/DMN','E) اجرایی','F) انعطاف','G) عملکردی'];
  l2Caps.forEach((c, i) => {
    const qs = c.keys.map((k) => `${k.replace('L2','')}◆=${a[k]??'-'}`).join(' ');
    r += `${l2Labels[i]}: ${qs} → Cap: ${c.cap}\n`;
  });
  r += `\n📊 L2-T: ${l2t}/21\n`;
  r += `🎯 شبکه غالب: ${dominant}\n`;
  r += `تفسیر: ${interp(l2t)}\n\n`;

  r += '───────────────────────────────────────\n';
  r += '📋 لایه سوم: یکپارچگی (Integration)\n';
  r += '───────────────────────────────────────\n\n';
  r += '⚠️ (R) = برعکس امتیازدهی شده\n\n';
  const l3Labels = ['A) انتقال','B) پایداری','C) مدیریت انتقال','D) وابستگی','E) تعارض','F) انطباق','G) یکپارچگی'];
  l3Caps.forEach((c, i) => {
    const g = LAYER3_GROUPS[i];
    const qs = g.keys.map((k) => {
      const raw = a[k] ?? '-';
      if (reverseKeysSet.has(k)) return `${k.replace('L3','')}(R)=${raw}→${l3Scored[k]}`;
      return `${k.replace('L3','')}=${raw}`;
    }).join(' ');
    r += `${l3Labels[i]}: ${qs} → Cap: ${c.cap}\n`;
  });
  r += `\n📊 L3-T: ${l3t}/21\n`;
  r += `تفسیر: ${interp(l3t)}\n\n`;

  r += '───────────────────────────────────────\n';
  r += '📊 خلاصه اجرایی\n';
  r += '───────────────────────────────────────\n\n';
  r += '| لایه | امتیاز | وضعیت |\n';
  r += '|------|--------|-------|\n';
  r += `| پایه (TFS) | ${tfs} | ${tfs <= 20 ? 'خفیف' : tfs <= 40 ? 'متوسط' : 'بالا'} |\n`;
  r += `| شبکه (L2-T) | ${l2t}/21 | ${interp(l2t)} |\n`;
  r += `| یکپارچگی (L3-T) | ${l3t}/21 | ${interp(l3t)} |\n\n`;
  r += `🎯 شبکه غالب: ${dominant}\n\n`;
  r += `⚠️ پرچم‌های بالینی:\n${flaggedCore.length > 0 ? flaggedCore.join('\n') : 'ندارد'}\n\n`;
  r += `💊 وضعیت دارویی:\n${medsText}\n\n`;
  r += `📝 یادداشت:\n${data.notes || 'موردی ثبت نشده'}\n\n`;
  r += '═══════════════════════════════════════';

  return r;
}

function generateAdminReport(data) {
  const date = todayPersian();
  const gender = data.gender === 'male' ? 'مرد' : data.gender === 'female' ? 'زن' : 'نامشخص';
  const genderCode = data.gender === 'male' ? 'M' : data.gender === 'female' ? 'F' : '?';
  const mainComplaint = (data.complaints || [])[0];
  const mainLabel = mainComplaint ? COMPLAINT_LABELS[mainComplaint.id] : '-';
  const complaints = (data.complaints || []).map((c) => `${COMPLAINT_LABELS[c.id] || 'سایر'} — سطح ${c.severity}`).join('، ');
  const medsText = data.medications || 'ندارد';
  const hasMeds = medsText !== 'ندارد';

  let r = '';
  r += '═══════════════════════════════════════\n';
  r += '📋 گزارش اداری — پروفایل مراجع\n';
  r += '═══════════════════════════════════════\n\n';
  r += `👤 نام: ${data.name}\n`;
  r += `📱 تلفن: ${data.phone}\n`;
  r += `🔢 سن: ${data.age} | جنسیت: ${gender}\n`;
  r += `🗓️ تاریخ ارزیابی: ${date}\n\n`;
  r += '───────────────────────────────────────\n';
  r += `✅ غربالگری: ${data.screeningPassed ? 'قبول' : 'رد — نیاز به تأیید دکتر'}\n`;
  r += '───────────────────────────────────────\n\n';
  r += `🎯 شکایت اصلی: ${complaints}\n\n`;
  r += `💊 داروها: ${medsText}\n\n`;
  r += '───────────────────────────────────────\n';
  r += '📝 اقدامات لازم:\n';
  r += '───────────────────────────────────────\n\n';
  r += '1. ☐ پروفایل در Google Sheet ایجاد شود\n';
  r += `2. ☐ نام پیشنهادی فایل: ${data.name}-${data.age}${genderCode}-${mainLabel}-${todayISO()}\n`;
  r += '3. ☐ وقت QEEG هماهنگ شود\n';
  r += '4. ☐ رضایت‌نامه امضا شده اسکن و ذخیره شود\n';
  r += '5. ☐ فرم غربالگری بایگانی شود\n';
  if (hasMeds) r += '6. ☐ لیست داروها به دکتر فتاحی اطلاع داده شود\n';
  r += '\n📅 قدم بعدی: هماهنگی وقت QEEG با مراجع\n\n';
  r += '═══════════════════════════════════════';

  return r;
}

// ─── Conversation Engine ────────────────────────────────────

const STATES = {
  WELCOME: 'WELCOME',
  WAIT_NAME: 'WAIT_NAME',
  WAIT_GENDER: 'WAIT_GENDER',
  WAIT_PHONE: 'WAIT_PHONE',
  WAIT_AGE: 'WAIT_AGE',
  SCREENING_INTRO: 'SCREENING_INTRO',
  SCREENING_Q: 'SCREENING_Q',
  SCREENING_FAIL: 'SCREENING_FAIL',
  COMPLAINTS: 'COMPLAINTS',
  SEVERITY: 'SEVERITY',
  MORE_COMPLAINTS: 'MORE_COMPLAINTS',
  ASSESSMENT_INTRO: 'ASSESSMENT_INTRO',
  ASSESSMENT_GROUP: 'ASSESSMENT_GROUP',
  CLOSING: 'CLOSING',
  IDLE: 'IDLE',
};

export class ConversationEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = STATES.WELCOME;
    this.data = {
      name: '', firstName: '', phone: '', age: '', gender: '',
      screeningPassed: true, screeningFails: [],
      complaints: [], currentComplaintIdx: 0,
      answers: {}, medications: '', notes: '',
    };
    this.screeningStep = 0;
    this.screeningQuestions = [];
    this.groupQueue = [];
    this.currentGroupIdx = 0;
    this.assessmentPhase = null;
    this.headacheGateAnswer = null;
    this.previousAssessment = null;
    this.isReassessment = false;
    this.worldFactsUsed = 0;
  }

  getInitialMessage() {
    this.state = STATES.WAIT_NAME;
    return 'سلام و خوش آمدید! 🌿\nمن دستیار ارزیابی کلینیک TMN هستم.\nلطفاً اسم کاملتون رو بگید.';
  }

  processInput(text) {
    const trimmed = text.trim();

    // Check report codes at any time
    if (trimmed === 'Ali - 189419') {
      return generateClinicalReport(this.data);
    }
    if (trimmed === 'Atousa:12271227') {
      return generateAdminReport(this.data);
    }

    // Re-assessment trigger
    if ((trimmed === 'بازارزیابی' || trimmed.toLowerCase() === 'reassess') && this.state === STATES.IDLE) {
      return this._startReassessment();
    }

    // Safety check
    const safetyWords = ['خودکشی','خودکُشی','می‌خوام بمیرم','نمی‌خوام زنده باشم','self-harm','suicide'];
    if (safetyWords.some((w) => trimmed.includes(w))) {
      return '[SYSTEM: ⛔ SAFETY FLAG — Client expressed distress. Atousa must immediately inform Dr. Fattahi. Assessment paused.]\n\nممنون که بهم اعتماد کردید و این رو گفتید. الان آتوسا خانم کمکتون می‌کنه. 💚';
    }

    switch (this.state) {
      case STATES.WAIT_NAME: return this._handleName(trimmed);
      case STATES.WAIT_GENDER: return this._handleGender(trimmed);
      case STATES.WAIT_PHONE: return this._handlePhone(trimmed);
      case STATES.WAIT_AGE: return this._handleAge(trimmed);
      case STATES.SCREENING_Q: return this._handleScreening(trimmed);
      case STATES.COMPLAINTS: return this._handleComplaints(trimmed);
      case STATES.SEVERITY: return this._handleSeverity(trimmed);
      case STATES.MORE_COMPLAINTS: return this._handleMoreComplaints(trimmed);
      case STATES.ASSESSMENT_INTRO: return this._handleAssessmentIntro(trimmed);
      case STATES.ASSESSMENT_GROUP: return this._handleAssessmentGroup(trimmed);
      case STATES.IDLE: return 'ارزیابی تمام شده. اگه سوالی دارید بپرسید 😊';
      default: return 'متوجه نشدم. لطفاً دوباره تلاش کنید.';
    }
  }

  // ── Phase 1: Quick Info ──

  _handleName(text) {
    this.data.name = text;
    const parts = text.split(/\s+/);
    this.data.firstName = parts[0];
    const g = detectGender(parts[0]);

    if (g === 'ambiguous' || g === 'unknown') {
      this.state = STATES.WAIT_GENDER;
      return `ممنون ${this.data.firstName} جان.\nلطفاً جنسیتتون رو بگید:\n۱. مرد\n۲. زن`;
    }

    this.data.gender = g;
    this.state = STATES.WAIT_PHONE;
    return `ممنون ${this.data.firstName} جان.\nلطفاً شماره تماستون رو بگید.`;
  }

  _handleGender(text) {
    const nums = parseNumbers(text);
    if (nums[0] === 1 || text.includes('مرد')) {
      this.data.gender = 'male';
    } else if (nums[0] === 2 || text.includes('زن')) {
      this.data.gender = 'female';
    } else {
      return 'لطفاً بگید:\n۱. مرد\n۲. زن';
    }
    this.state = STATES.WAIT_PHONE;
    return 'ممنون.\nلطفاً شماره تماستون رو بگید.';
  }

  _handlePhone(text) {
    this.data.phone = toEnDigits(text.replace(/\s+/g, ''));
    this.state = STATES.WAIT_AGE;
    return 'سنتون چنده؟';
  }

  _handleAge(text) {
    const nums = parseNumbers(text);
    if (nums.length === 0) return 'لطفاً سنتون رو به عدد بگید.';
    this.data.age = nums[0];
    return this._startScreening();
  }

  // ── Phase 2: Screening ──

  _startScreening() {
    this.screeningQuestions = [
      'آیا پیس‌میکر یا دستگاه الکتریکی کاشته‌شده در بدن دارید؟',
      'آیا سابقه صرع یا تشنج دارید؟',
    ];
    if (this.data.gender === 'female' || this.data.gender === 'ambiguous') {
      this.screeningQuestions.push('آیا باردار هستید؟');
    }
    this.screeningQuestions.push('آیا ایمپلنت فلزی در سر دارید؟ (پلاتین، کلیپس، شنت)');
    this.screeningQuestions.push('آیا تومور مغزی فعال دارید؟');

    this.screeningStep = 0;
    this.state = STATES.SCREENING_Q;
    return `ممنون ${this.data.firstName} جان. قبل از شروع ارزیابی، چند سوال کوتاه پزشکی دارم. لطفاً با بله یا خیر جواب بدید.\n\n${this.screeningQuestions[0]}`;
  }

  _handleScreening(text) {
    const yes = isYes(text);
    const no = isNo(text);

    if (!yes && !no) return 'لطفاً با بله یا خیر جواب بدید.';

    if (yes) {
      this.data.screeningPassed = false;
      this.data.screeningFails.push(this.screeningQuestions[this.screeningStep]);
      this.state = STATES.SCREENING_FAIL;
      return `⛔ متأسفانه با توجه به شرایط پزشکی شما، امکان ادامه ارزیابی وجود ندارد. لطفاً با دکتر فتاحی مشورت خواهد شد.\n\n[SYSTEM: FLAG — SCREENING FAILED. Item: ${this.screeningQuestions[this.screeningStep]}. Atousa must consult Dr. Fattahi before proceeding.]`;
    }

    this.screeningStep++;
    if (this.screeningStep < this.screeningQuestions.length) {
      return this.screeningQuestions[this.screeningStep];
    }

    // All passed
    this.state = STATES.COMPLAINTS;
    return 'عالیه، مشکلی نیست ✅ بریم سراغ ارزیابی.\n\nکدوم مورد بیشتر اذیتتون می‌کنه؟ شماره‌شو بگید. چند مورد هم می‌تونید انتخاب کنید.\n\n۱. سردرد\n۲. مشکل خواب\n۳. اضطراب\n۴. افسردگی\n۵. مشکل تمرکز\n۶. خستگی مزمن\n۷. استرس\n۸. سایر';
  }

  // ── Phase 3: Complaints ──

  _handleComplaints(text) {
    const nums = parseNumbers(text);
    if (nums.length === 0 || nums.some((n) => n < 1 || n > 8)) {
      return 'لطفاً شماره مورد نظرتون رو بگید (۱ تا ۸).';
    }

    this.data.complaints = nums.map((n) => ({ id: n, severity: 0 }));
    this.data.currentComplaintIdx = 0;
    return this._askSeverity();
  }

  _askSeverity() {
    const c = this.data.complaints[this.data.currentComplaintIdx];
    if (!c) {
      this.state = STATES.MORE_COMPLAINTS;
      return 'مشکل دیگه‌ای هم هست؟ ۰ = نه، همین بود. یا شماره مورد جدید رو بگید.';
    }

    const scale = SEVERITY_SCALES[c.id];
    if (scale.freeText) {
      this.state = STATES.SEVERITY;
      return scale.title;
    }

    this.state = STATES.SEVERITY;
    return `${scale.title}\n\n${scale.options.join('\n')}`;
  }

  _handleSeverity(text) {
    const c = this.data.complaints[this.data.currentComplaintIdx];
    const scale = SEVERITY_SCALES[c.id];

    if (scale.freeText) {
      c.severity = 0;
      c.freeText = text;
      this.data.notes = (this.data.notes ? this.data.notes + '\n' : '') + `سایر: ${text}`;
    } else {
      const nums = parseNumbers(text);
      if (nums.length === 0 || nums[0] < 1 || nums[0] > 5) {
        return 'لطفاً یه شماره از ۱ تا ۵ بگید.';
      }
      c.severity = nums[0];
    }

    this.data.currentComplaintIdx++;
    return this._askSeverity();
  }

  _handleMoreComplaints(text) {
    const nums = parseNumbers(text);
    if (nums.length > 0 && nums[0] === 0) {
      return this._startAssessment();
    }

    if (nums.length > 0 && nums[0] >= 1 && nums[0] <= 8) {
      const existing = this.data.complaints.find((c) => c.id === nums[0]);
      if (!existing) {
        this.data.complaints.push({ id: nums[0], severity: 0 });
        this.data.currentComplaintIdx = this.data.complaints.length - 1;
        return this._askSeverity();
      }
    }

    return 'لطفاً ۰ بگید اگه مورد دیگه‌ای نیست، یا شماره مورد جدید رو بگید.';
  }

  // ── Phase 4: Assessment ──

  _startAssessment() {
    this.state = STATES.ASSESSMENT_INTRO;
    return `خوبه ${this.data.firstName} جان 🌿 الان یه سری سوالات داریم که کمک می‌کنه وضعیتتون رو دقیق‌تر بررسی کنیم.\n\nحدود ۱۵ دقیقه طول می‌کشه. راحت جواب بدید — درست و غلط نداره.\nبر اساس ۴-۶ هفته اخیرتون جواب بدید.\n\nبریم؟ 😊`;
  }

  _handleAssessmentIntro() {
    this._buildGroupQueue();
    this.currentGroupIdx = 0;
    return this._showNextGroup();
  }

  _buildGroupQueue() {
    this.groupQueue = [];

    // Layer 1
    for (const g of LAYER1_GROUPS) {
      if (g.hidden) continue;
      this.groupQueue.push({ ...g, layer: 1 });
    }

    // Layer 2
    for (const g of LAYER2_GROUPS) {
      this.groupQueue.push({ ...g, layer: 2 });
    }

    // Layer 3
    for (const g of LAYER3_GROUPS) {
      this.groupQueue.push({ ...g, layer: 3 });
    }
  }

  _showNextGroup() {
    if (this.currentGroupIdx >= this.groupQueue.length) {
      return this._closeAssessment();
    }

    const group = this.groupQueue[this.currentGroupIdx];

    // Handle headache gate
    if (group.id === 'L1G7_gate') {
      this.state = STATES.ASSESSMENT_GROUP;
      return group.intro;
    }

    // Skip conditional headache questions if gate was no
    if (group.conditional && this.headacheGateAnswer === false) {
      this.currentGroupIdx++;
      return 'عالیه! 👍 بریم سراغ بخش بعدی.\n\n' + this._showNextGroup();
    }

    this.state = STATES.ASSESSMENT_GROUP;
    return group.intro;
  }

  _handleAssessmentGroup(text) {
    const group = this.groupQueue[this.currentGroupIdx];

    // Headache gate
    if (group.id === 'L1G7_gate') {
      if (isYes(text)) {
        this.headacheGateAnswer = true;
        this.currentGroupIdx++;
        return this._showNextGroup();
      } else if (isNo(text)) {
        this.headacheGateAnswer = false;
        this.currentGroupIdx++;
        return this._showNextGroup();
      }
      return 'لطفاً با بله یا خیر جواب بدید.';
    }

    // Medication group
    if (group.isMedication) {
      this.data.medications = text;
      this.currentGroupIdx++;
      let response = '';
      if (group.worldFact && this.worldFactsUsed < 7) {
        response += group.worldFact + '\n\n';
        this.worldFactsUsed++;
      }
      if (group.transition) {
        response += group.transition;
      }
      const next = this._showNextGroup();
      return response + '\n\n' + next;
    }

    // Parse numeric answers
    const nums = parseNumbers(text);
    const expectedCount = group.count || group.keys.length;

    if (nums.length < expectedCount) {
      return `لطفاً ${expectedCount} عدد وارد کنید (با فاصله از هم).`;
    }

    // Validate ranges
    const maxVal = group.maxScale || 3;
    for (let i = 0; i < expectedCount; i++) {
      if (nums[i] < 0 || nums[i] > maxVal) {
        return `لطفاً اعداد بین ۰ تا ${maxVal} باشن.`;
      }
    }

    // Store answers
    for (let i = 0; i < expectedCount; i++) {
      if (group.keys[i]) {
        this.data.answers[group.keys[i]] = nums[i];
      }
    }

    // Handle split sleep questions → insert sub-questions
    if (group.splitQuestions) {
      // Q7 answered, now insert Q8 and Q9 sub-groups
      this.data.answers['L1Q7'] = nums[0];
      this.currentGroupIdx++;
      // Next should be L1G3b (Q8) which is hidden and in LAYER1_GROUPS
      // We need to manually show them
      const q8Group = LAYER1_GROUPS.find((g) => g.id === 'L1G3b');
      const q9Group = LAYER1_GROUPS.find((g) => g.id === 'L1G3c');
      this.groupQueue.splice(this.currentGroupIdx, 0, { ...q8Group, layer: 1 }, { ...q9Group, layer: 1 });
      return this._showNextGroup();
    }

    this.currentGroupIdx++;

    // Build response with world fact + transition if applicable
    let response = '';
    if (group.worldFact && this.worldFactsUsed < 7) {
      response += group.worldFact + '\n\n';
      this.worldFactsUsed++;
    }
    if (group.transition) {
      response += group.transition + '\n\n';
    }

    const next = this._showNextGroup();
    return response ? response + next : next;
  }

  // ── Phase 5: Closing ──

  _closeAssessment() {
    this.state = STATES.IDLE;
    return `تمام شد! 🎉\n\nخیلی ممنون ${this.data.firstName} جان که وقت گذاشتید و با دقت جواب دادید.\n\n📋 پاسخ‌های شما ثبت شد\n👨‍⚕️ دکتر فتاحی بررسی می‌کنن\n📞 نتایج و برنامه درمان بهتون اطلاع داده می‌شه\n\nاگه سوالی دارید بپرسید. مراقب خودتون باشید 💚`;
  }

  // ── Re-assessment ──

  _startReassessment() {
    this.previousAssessment = { ...this.data.answers };
    this.data.answers = {};
    this.isReassessment = true;
    this.worldFactsUsed = 0;

    this._buildGroupQueue();
    this.currentGroupIdx = 0;
    this.state = STATES.ASSESSMENT_INTRO;

    return `سلام دوباره ${this.data.firstName} جان! 🌿\nدکتر فتاحی درخواست بازارزیابی داده. دوباره همون سوالات رو مرور می‌کنیم تا ببینیم چه تغییراتی داشتید.\n\nبر اساس ۴-۶ هفته اخیر جواب بدید.\nبریم؟`;
  }
}

export default ConversationEngine;

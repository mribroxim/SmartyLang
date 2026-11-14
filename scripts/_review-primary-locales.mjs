import fs from 'node:fs';

// Authored language review for the learner's main navigation and study loop.
// A reviewed source is also applied to duplicate UI keys with the same English text.
const en = JSON.parse(fs.readFileSync('src/locales/ui.en.json', 'utf8'));
const rows = String.raw`
nav.home|Главная|Bosh sahifa|Ana sayfa
nav.learn|Учиться|O‘rganish|Öğren
nav.league|Лига|Liga|Lig
nav.more|Ещё|Yana|Diğer
nav.keepGoing|Продолжай!|Davom eting!|Devam et!
nav.businessShort|Для бизнеса|Biznes|İşletme
nav.business|Панель организации|Tashkilot paneli|İşletme paneli
nav.adminShort|Админ|Admin|Yönetici
nav.contentShort|Материалы|Materiallar|İçerik
nav.orgShort|Организация|Tashkilot|Kurum
nav.practice|Практика|Mashq qilish|Pratik
nav.lessons|Уроки|Darslar|Dersler
nav.reference|Справочник|Ma’lumotnoma|Başvuru kaynağı
nav.reading|Чтение|O‘qish|Okuma
nav.listening|Аудирование|Tinglab tushunish|Dinleme
nav.speaking|Говорение|Gapirish|Konuşma
nav.writing|Письмо|Yozish|Yazma
nav.exercises|Упражнения|Mashqlar|Alıştırmalar
nav.vocabulary|Словарный запас|Lug‘at boyligi|Kelime hazinesi
nav.dictionary|Словарь|Lug‘at|Sözlük
nav.classes|Классы|Guruhlar|Sınıflar
nav.myClasses|Мои классы|Guruhlarim|Sınıflarım
nav.plans|Тарифы|Tariflar|Planlar
nav.upgrade|Улучшить тариф|Tarifni yangilash|Planı yükselt
nav.account|Аккаунт|Hisob|Hesap
nav.profile|Профиль|Profil|Profil
nav.organization|Организация|Tashkilot|Kurum
nav.admin|Панель администратора|Administrator paneli|Yönetici paneli
nav.content|Управление материалами|Materiallarni boshqarish|İçerik yönetimi
nav.management|Управление|Boshqaruv|Yönetim
nav.menu|Меню|Menyu|Menü
nav.listen|Слушать|Tinglash|Dinle
nav.speak|Говорить|Gapirish|Konuş
onboard.native.title|На каком языке ты говоришь?|Qaysi tilda gaplashasiz?|Hangi dili konuşuyorsun?
onboard.native.subtitle|На этом языке будут меню, кнопки, переводы и инструкции к проверке уровня.|Menyu, tugmalar, tarjimalar va daraja sinovi ko‘rsatmalari shu tilda bo‘ladi.|Menüler, düğmeler, çeviriler ve seviye tespiti yönergeleri bu dilde olacak.
onboard.learning.title|Какой язык ты изучаешь?|Qaysi tilni o‘rganmoqchisiz?|Hangi dili öğreniyorsun?
onboard.learning.subtitle|Уроки и задания для проверки уровня будут на выбранном языке.|Darslar va daraja sinovi topshiriqlari tanlangan tilda bo‘ladi.|Dersler ve seviye tespiti soruları seçtiğin dilde olacak.
onboard.goal.title|Для чего тебе язык?|Tilni nima maqsadda o‘rganmoqchisiz?|Dili ne için öğreniyorsun?
onboard.goal.subtitle|Это поможет подобрать первые занятия. Позже цель можно изменить в профиле.|Bu dastlabki darslarni tanlashga yordam beradi. Maqsadni keyin profilda o‘zgartirishingiz mumkin.|Bu, ilk derslerini seçmemize yardımcı olur. Hedefini daha sonra profilinden değiştirebilirsin.
onboard.goal.daily.title|Для повседневной жизни|Kundalik hayot uchun|Günlük yaşam
onboard.goal.daily.desc|Общаться и понимать других каждый день|Kundalik hayotda gapirish va tushunish|Günlük yaşamda konuşmak ve anlamak
onboard.goal.school.title|Для учёбы|O‘qish uchun|Okul ve eğitim
onboard.goal.school.desc|Успевать на занятиях и справляться с домашними заданиями|Darslarni tushunish va uy vazifalarini bajarish|Dersleri takip etmek ve ödevleri yapmak
onboard.goal.exam.title|Для экзаменов и сертификатов|Imtihon va sertifikatlar uchun|Sınavlar ve sertifikalar
onboard.goal.exam.desc|Готовиться к экзамену с нужным результатом|Kerakli natija uchun imtihonga tayyorlanish|Hedeflediğin puan için sınava hazırlanmak
onboard.placement.title|Проверка уровня|Darajani aniqlash|Seviye tespiti
onboard.placement.subtitle|Проверим твои знания изучаемого языка. Инструкции останутся на твоём языке. Незнакомые задания можно пропускать.|O‘rganayotgan tilingiz bo‘yicha bilimingizni tekshiramiz. Ko‘rsatmalar o‘z tilingizda qoladi. Bilmagan savollaringizni o‘tkazib yuboring.|Öğrendiğin dildeki bilgini ölçelim. Yönergeler kendi dilinde kalacak. Bilmediğin soruları geçebilirsin.
onboard.selfLevel.title|Выбери начальный уровень|Boshlang‘ich darajangizni tanlang|Başlangıç seviyeni seç
onboard.selfLevel.subtitle|Для этого языка пока нет проверки уровня. Выбери уровень, на котором тебе комфортно.|Bu til uchun avtomatik sinov hali yo‘q. O‘zingizga mos darajani tanlang.|Bu dil için henüz otomatik seviye tespiti yok. Kendine uygun seviyeyi seç.
onboard.section.grammar|Грамматика|Grammatika|Dil bilgisi
onboard.section.vocabulary|Словарный запас|Lug‘at boyligi|Kelime bilgisi
onboard.section.truefalse|Верно / Неверно|To‘g‘ri / Noto‘g‘ri|Doğru / Yanlış
onboard.reading.title|Прочитай текст|Matnni o‘qing|Metni oku
onboard.reading.subtitle|Внимательно прочитай текст, затем ответь на вопросы.|Matnni diqqat bilan o‘qib, keyingi savollarga javob bering.|Metni dikkatlice oku, ardından soruları yanıtla.
onboard.listening.subtitle|Прочитай текст записи и выбери лучший ответ.|Audio matnini o‘qib, eng mos javobni tanlang.|Dinleyeceğin metni oku, ardından en uygun yanıtı seç.
onboard.true|Верно|To‘g‘ri|Doğru
onboard.false|Неверно|Noto‘g‘ri|Yanlış
onboard.passageLabel|Текст|Matn|Metin
onboard.questionOf|Вопрос {n} из {total}|{total} ta savoldan {n}-savol|Soru {n}/{total}
onboard.answered|Ответов: {n}|Javob berildi: {n}|Yanıtlanan: {n}
onboard.seeLevel|Узнать свой уровень|Darajamni ko‘rish|Seviyemi gör
onboard.next|Далее|Keyingi|İleri
onboard.skipQuestion|Пропустить вопрос|Savolni o‘tkazib yuborish|Soruyu geç
onboard.skipPlacement|Пропустить проверку|Sinovni o‘tkazib yuborish|Seviye tespitini geç
onboard.skipForNow|Пока пропустить|Hozircha o‘tkazib yuborish|Şimdilik geç
onboard.continue|Продолжить|Davom etish|Devam et
onboard.back|Назад|Orqaga|Geri
onboard.result.title|Твой уровень|Darajangiz|Seviyen
onboard.result.subtitle|Предыдущие уровни тоже открыты. Мы советуем начать здесь.|Oldingi darajalar ham ochiq qoladi. Shu yerdan boshlashni tavsiya qilamiz.|Önceki seviyeler de açık kalacak. Buradan başlamanı öneriyoruz.
onboard.result.starting|Начальный уровень|Boshlang‘ich daraja|Başlangıç seviyesi
onboard.result.correct|Верных ответов: {correct} из {total}|To‘g‘ri javoblar: {correct}/{total}|Doğru yanıt: {correct}/{total}
onboard.result.skills|Результаты по навыкам|Ko‘nikmalar bo‘yicha natijalar|Becerilere göre sonuçlar
onboard.result.strengths|Сильные стороны|Kuchli tomonlar|Güçlü yönlerin
onboard.result.weaknesses|Нужно потренировать|Ko‘proq mashq qilish kerak|Biraz daha pratik yap
onboard.result.nextTitle|Что дальше|Keyin nima bo‘ladi|Sırada ne var?
onboard.startLesson|Начать первый урок|Birinchi darsimni boshlash|İlk dersime başla
onboard.goHome|На главную|Bosh sahifaga o‘tish|Ana sayfaya git
onboard.continuePlans|Перейти к тарифам|Tariflarga o‘tish|Planlara git
onboard.step.native|Твой язык|Sizning tilingiz|Konuştuğun dil
onboard.step.learning|Изучаемый язык|O‘rganiladigan til|Öğrendiğin dil
onboard.step.goal|Цель|Maqsad|Hedef
onboard.step.result|Начало|Boshlash|Başlangıç
onboard.step.meet|Знакомство со Smarty|Smarty bilan tanishing|Smarty ile tanış
onboard.progress|Шаг {n} из {total}|{total} ta bosqichdan {n}-bosqich|Adım {n}/{total}
onboard.meet.subtitle|Твой спутник в изучении языка — шаг за шагом.|Til o‘rganishda hamrohingiz — qadam-baqadam.|Dil öğrenirken, her küçük adımda yanında.
onboard.meet.name|Как тебя называть?|Sizni qanday chaqiray?|Sana nasıl hitap edeyim?
onboard.meet.placeholder|Имя или никнейм|Ismingiz yoki taxallusingiz|Adın veya takma adın
onboard.meet.optional|Необязательно. Это можно изменить в настройках Smarty.|Majburiy emas. Buni Smarty sozlamalarida o‘zgartirishingiz mumkin.|İsteğe bağlı. Bunu Smarty ayarlarından değiştirebilirsin.
onboard.meet.hello|Привет, {name}! Готовы учиться вместе?|Salom, {name}! Birga o‘rganishga tayyormisiz?|Merhaba {name}! Birlikte öğrenmeye hazır mısın?
onboard.meet.friend|Привет! Я Smarty. Давай выучим первые слова.|Salom! Men Smartyman. Keling, dastlabki so‘zlaringizni o‘rganamiz.|Merhaba! Ben Smarty. Hadi ilk kelimelerini öğrenelim.
onboard.minutes.title|Сколько времени в день?|Kuniga qancha vaqt ajratasiz?|Günde ne kadar zaman ayırabilirsin?
onboard.minutes.subtitle|Начни с малого. Цель можно изменить в любой момент.|Oz-ozdan boshlang. Maqsadni istalgan vaqtda o‘zgartirishingiz mumkin.|Küçük adımlarla başla. Hedefini istediğin zaman değiştirebilirsin.
onboard.minutes.option|{n} мин|{n} daqiqa|{n} dk.
onboard.minutes.xp|Цель на день: {n} XP|Kunlik maqsad: {n} XP|Günlük hedef: {n} XP
onboard.minutes.reaction.5|Понемногу каждый день. Я с тобой!|Har kuni oz-ozdan. Men siz bilanman!|Her gün biraz. Ben yanındayım!
onboard.minutes.reaction.10|Шаг за шагом выработаем привычку!|Muntazam odat hosil qilamiz. Boshlaymiz!|Düzenli bir alışkanlık. Hadi başlayalım!
onboard.minutes.reaction.15|Ещё больше новых слов. У тебя получится!|Yana ko‘proq so‘z o‘rganamiz. Siz uddalaysiz!|Birkaç yeni kelimeye daha yer var. Yapabilirsin!
onboard.minutes.reaction.20|Большие планы? Я помогу на каждом шаге!|Maqsad katta ekan! Har bir darsda yoningizdaman!|Hedefin büyük mü? Her derste yanında olacağım!
onboard.startBite|Начать первый миниурок|Birinchi qisqa darsimni boshlash|İlk kısa dersime başla
onboard.saving|Всё готовим…|Tayyorlayapmiz…|Hazırlanıyor…
onboard.saveError|Не удалось сохранить настройки. Проверь подключение и попробуй ещё раз.|Sozlamalarni saqlab bo‘lmadi. Internet aloqasini tekshirib, yana urinib ko‘ring.|Ayarların kaydedilemedi. Bağlantını kontrol edip tekrar dene.
onboard.result.daily|Твоя цель на день: {minutes} мин · {xp} XP|Kunlik maqsadingiz: {minutes} daqiqa · {xp} XP|Günlük hedefin: {minutes} dk. · {xp} XP
onboard.result.firstBite|Первый миниурок начнётся с уровня «{level}»|Birinchi qisqa darsingiz {level} darajasidan boshlanadi|İlk kısa dersin {level} seviyesinde başlayacak
onboard.result.biteSteps|Учи новые слова, читай вслух и закрепляй знания в коротких занятиях|Yangi so‘zlarni o‘rganing, ovoz chiqarib o‘qing va qisqa darslarda mashq qiling|Yeni kelimeler öğren, sesli oku ve kısa derslerle pratik yap
onboard.result.levelsOpen|Все уровни открыты — можешь исследовать дальше|Barcha darajalar ochiq — xohlaganingizni sinab ko‘ring|Tüm seviyeler açık; keşfetmek sana kalmış
onboard.result.streakXp|Серия и XP начнут считаться с первого миниурока|Ketma-ketlik va XP birinchi qisqa darsingizdan hisoblanadi|Serin ve XP puanın ilk kısa dersinden itibaren sayılacak
onboard.result.skipped|Проверка уровня пропущена|Daraja sinovi o‘tkazib yuborildi|Seviye tespiti geçildi
onboard.result.skippedBody|Ничего страшного! Начнём с простого. На учебном пути всегда можно перейти дальше.|Hechqisi yo‘q! Osonidan boshlaymiz. O‘quv yo‘lingizda istalgan vaqtda oldinga o‘tishingiz mumkin.|Sorun değil! Kolaydan başlayacağız. Öğrenme yolunda istediğin zaman ileri geçebilirsin.
onboard.hello.title|Привет! Я Smarty!|Salom! Men Smartyman!|Merhaba! Ben Smarty!
onboard.hello.body|Всего несколько вопросов — и начнём первый миниурок.|Bir nechta qisqa savoldan keyin birinchi darsingizni boshlaymiz.|Birkaç kısa soru, ardından ilk kısa dersin.
onboard.moreLanguages|Другие языки|Boshqa tillar|Diğer diller
onboard.choose|Выбрать…|Tanlang…|Seç…
onboard.tip.sameLang|Обычно здесь выбирают другой язык: например, говорят на языке «{native}», а изучают «{learn}».|Odatda bu yerda boshqa til tanlanadi: masalan, {native} tilida gaplashib, {learn} tilini o‘rganishadi.|Burada genellikle farklı bir dil seçilir; örneğin {native} konuşup {learn} öğrenmek gibi.
onboard.loadingCheck|Готовим проверку уровня…|Daraja sinovini tayyorlayapmiz…|Seviye tespitin hazırlanıyor…
onboard.examHint|Подготовка к IELTS находится во вкладке «Практика».|IELTS mashqlari «Mashq qilish» bo‘limida.|IELTS alıştırmaları Pratik sekmesinde.
onboard.minutes.casual|Легко|Yengil|Rahat
onboard.minutes.regular|Регулярно|Muntazam|Düzenli
onboard.minutes.serious|Серьёзно|Jiddiy|Ciddi
onboard.minutes.intense|Интенсивно|Jadal|Yoğun
onboard.start.title|С чего начнём?|Qayerdan boshlaymiz?|Nereden başlayalım?
onboard.start.scratch.title|Начать с нуля|Boshidan boshlash|Sıfırdan başla
onboard.start.scratch.desc|Начни с самого первого урока начального уровня.|Boshlang‘ich darajaning ilk darsidan boshlang.|Başlangıç seviyesinin ilk dersinden başla.
onboard.start.find.title|Узнать свой уровень|Darajamni aniqlash|Seviyemi bul
onboard.start.find.desc|Короткая проверка покажет, что ты уже знаешь.|Qisqa sinov orqali nimalarni bilishingizni aniqlaymiz.|Kısa bir testle neler bildiğini görelim.
onboard.result.levelLine|Начинаем с уровня «{level}»!|{level} darajasidan boshlaysiz!|{level} seviyesinde başlıyorsun!
today.title|Сегодня со Smarty|Bugun Smarty bilan|Bugün Smarty ile
today.friend|друг|do‘stim|arkadaşım
today.greeting.morning|Доброе утро, {name}!|Xayrli tong, {name}!|Günaydın {name}!
today.greeting.afternoon|Добрый день, {name}!|Xayrli kun, {name}!|İyi günler {name}!
today.greeting.evening|Добрый вечер, {name}!|Xayrli kech, {name}!|İyi akşamlar {name}!
today.greeting.night|Немного поучимся перед сном, {name}?|Uyqu oldidan biroz o‘rganamizmi, {name}?|Gece biraz çalışmaya ne dersin {name}?
today.greeting.return|С возвращением, {name}!|Yana xush kelibsiz, {name}!|Tekrar hoş geldin {name}!
today.subtitle|Несколько слов. Немного практики. Ещё один шаг вперёд.|Bir nechta so‘z. Biroz mashq. Yana bir qadam olg‘a.|Birkaç kelime. Biraz pratik. Bir adım ileri.
today.streak|Серия: {n} дн.|{n} kunlik ketma-ketlik|{n} günlük seri
today.goal|Сегодня: {n} / {goal} XP|Bugun: {n} / {goal} XP|Bugün: {n} / {goal} XP
today.streakRisk|Сохрани серию: {n} дн. Один миниурок — и всё готово.|{n} kunlik ketma-ketligingizni saqlang. Buning uchun bitta qisqa dars yetarli.|{n} günlük serini koru. Bir kısa ders yeterli.
today.start|Начать миниурок дня|Bugungi qisqa darsni boshlash|Günün kısa dersine başla
today.dailyLabel|Маленькая победа сегодня|Bugun uchun kichik yutuq|Bugün için küçük bir başarı
today.biteTitle|Миниурок дня|Bugungi qisqa dars|Günün kısa dersi
today.biteBody|Выучи несколько новых слов и повтори сложные. Здесь жизни не теряются.|Bir nechta yangi so‘zni o‘rganib, qiyinlarini takrorlang. Bu yerda jonlar sarflanmaydi.|Birkaç yeni kelime öğren ve zorlandıklarını tekrar et. Burada can kaybetmezsin.
today.sessionSize|{n} коротких вопросов · около 3–5 мин|{n} ta qisqa savol · taxminan 3–5 daqiqa|{n} kısa soru · yaklaşık 3–5 dk.
today.done|Миниурок дня завершён|Bugungi qisqa dars tugadi|Günün kısa dersi tamamlandı
today.rewardClaimed|XP за сегодня получены|Bugungi XP olindi|Günlük XP kazanıldı
today.reviewAgain|Потренироваться ещё|Yana mashq qilish|Tekrar pratik yap
today.replayBody|XP за сегодня уже получены. Этот раунд был дополнительной практикой.|Bugungi XP allaqachon olindi. Bu safar qo‘shimcha mashq qildingiz.|Bugünkü XP zaten kazanıldı. Bu tur ek pratik içindi.
today.continuePath|Продолжить учебный путь|O‘quv yo‘lini davom ettirish|Öğrenme yoluna devam et
today.pathPreview|Твои следующие три урока|Keyingi uchta darsingiz|Sıradaki üç dersin
today.tip|Составь своё предложение с новым словом. Так оно лучше запомнится.|Yangi so‘z bilan o‘zingiz gap tuzing. Shunda u yaxshiroq esda qoladi.|Yeni kelimeyle kendi cümleni kur. Böylece aklında daha iyi kalır.
today.weakTip|Повторим слово «{word}». Немного практики поможет его запомнить.|«{word}» so‘zini yana ko‘rib chiqamiz. Biroz takrorlash uni eslab qolishga yordam beradi.|“{word}” kelimesine tekrar bakalım. Biraz tekrar çok işe yarar.
today.meaning|Что это значит?|Bu nimani anglatadi?|Ne anlama geliyor?
today.chooseWord|Какое слово подходит к этому значению?|Bu ma’noga qaysi so‘z mos keladi?|Bu anlama hangi kelime uyuyor?
today.correct|Верно!|To‘g‘ri!|Doğru!
today.answer|Правильный ответ: {answer}|To‘g‘ri javob: {answer}|Doğru yanıt: {answer}
today.noWords|Слова ещё загружаются. Вернись на учебный путь и попробуй снова.|So‘zlar hali yuklanmoqda. O‘quv yo‘liga qaytib, yana urinib ko‘ring.|Kelimeler hâlâ yükleniyor. Öğrenme yoluna dönüp tekrar dene.
today.reminderTitle|Немного поучимся со Smarty?|Smarty bilan biroz o‘rganamizmi?|Smarty ile biraz öğrenmeye ne dersin?
today.reminderBody|Миниурок дня готов. Нужно всего несколько минут.|Bugungi qisqa dars tayyor. Bir necha daqiqa kifoya.|Günün kısa dersi hazır. Birkaç dakika yeterli.
today.riskReminderTitle|Сохрани свою серию|Ketma-ketligingizni saqlang|Serini koru
today.riskReminderBody|Сегодня ты ещё не занимался. Пройди миниурок, чтобы сохранить серию.|Bugun hali mashq qilmadingiz. Ketma-ketlikni saqlash uchun qisqa darsni tugating.|Bugün henüz pratik yapmadın. Serini korumak için bir kısa ders tamamla.
today.notifications|Уведомления|Bildirishnomalar|Bildirimler
today.reminderTime|Напоминание в {time}, пока приложение открыто.|Ilova ochiq bo‘lsa, eslatma {time} da chiqadi.|Uygulama açıkken {time} saatinde hatırlatma.
today.reminderSetup|Выбери время напоминания в настройках Smarty.|Smarty sozlamalarida eslatma vaqtini tanlang.|Smarty ayarlarından bir hatırlatma saati seç.
today.reminderSettings|Настройки|Sozlamalar|Ayarlar
today.enableReminders|Включить уведомления на компьютере|Kompyuter bildirishnomalarini yoqish|Masaüstü hatırlatmalarını etkinleştir
today.remindersEnabled|Уведомления на компьютере включены|Kompyuter bildirishnomalari yoqilgan|Masaüstü hatırlatmaları etkin
hearts.title|Твои жизни|Jonlaringiz|Canların
hearts.count|Жизни: {n}|Jonlar: {n}|Can: {n}
hearts.unlimited|Безлимитные жизни|Cheksiz jonlar|Sınırsız can
hearts.empty|Пора немного повторить|Biroz takrorlash vaqti|Biraz tekrar zamanı
hearts.body|Первая ошибка в задании миниурока на учебном пути стоит одну жизнь. Жизни восстанавливаются со временем. Миниурок дня и тренировка для восстановления жизней их не тратят.|O‘quv yo‘lidagi qisqa dars topshirig‘ida birinchi urinishdagi xato bitta jonni sarflaydi. Jonlar vaqt o‘tishi bilan tiklanadi. Bugungi qisqa dars va jon uchun mashqlar jon sarflamaydi.|Öğrenme yolundaki bir kısa ders sorusunda ilk denemede yanlış yapmak bir can harcar. Canlar zamanla yenilenir. Günün kısa dersi ve can kazanma pratiği can harcamaz.
hearts.maxBody|Smarty Max даёт безлимитные жизни. Учись в своём темпе.|Smarty Max bilan jonlar cheksiz. O‘z sur’atingizda o‘rganing.|Smarty Max sınırsız can sunar. Kendi hızında öğrenmeye devam et.
hearts.next|Следующая жизнь через {time}|Keyingi jongacha: {time}|Sonraki can: {time} sonra
hearts.practice|Потренироваться и получить жизнь|Mashq qilib jon olish|Pratik yaparak can kazan
hearts.review|Повторить шесть слов|Oltita so‘zni takrorlash|Altı kelimeyi tekrar et
hearts.today|Пройти миниурок дня — жизни не нужны|Bugungi qisqa darsni sinab ko‘ring — jon kerak emas|Günün kısa dersini dene — can gerekmez
hearts.refill|Восстановить все жизни · {n} монет|Barcha jonlarni tiklash · {n} tanga|Tüm canları doldur · {n} jeton
hearts.coins|Монеты: {n}|Tangalaringiz: {n}|Jetonun: {n}
hearts.upgrade|Безлимитные жизни со Smarty Max|Smarty Max bilan cheksiz jonlar|Smarty Max ile sınırsız can
hearts.earned|Получено жизней: +{n}!|+{n} ta jon olindi!|+{n} can kazanıldı!
hearts.grace|Smarty прощает первые {n} ошибок.|Smarty dastlabki {n} ta xatoda jonlaringizni saqlab qoladi.|Smarty ilk {n} hatanda can kaybetmeni önlüyor.
bites.quit|Выйти из миниурока|Qisqa darsdan chiqish|Kısa dersten çık
bites.quitTitle|Выйти из миниурока?|Qisqa darsdan chiqasizmi?|Kısa dersten çıkılsın mı?
bites.quitBody|Пройденные этапы сохранены. Можно продолжить позже.|Tugallangan bosqichlar saqlandi. Darsni keyin davom ettirishingiz mumkin.|Tamamladığın adımlar kaydedildi. Bu derse daha sonra devam edebilirsin.
bites.keepGoing|Продолжить учиться|O‘rganishni davom ettirish|Öğrenmeye devam et
bites.quitConfirm|Выйти|Chiqish|Çık
bites.retry|Ещё одна попытка: сложные слова|Yana bir imkoniyat: xato qilingan so‘zlar|Bir şans daha: zorlandığın kelimeler
bites.cantSpeak|Сейчас не могу говорить|Hozir gapira olmayman|Şu an konuşamıyorum
bites.readDone|Чтение вслух завершено: точность {n}%|Ovoz chiqarib o‘qish tugadi: aniqlik {n}%|Sesli okuma tamamlandı: doğruluk %{n}
bites.doneTitle|Миниурок завершён!|Qisqa dars tugadi!|Kısa ders tamamlandı!
bites.accuracy|Точность|Aniqlik|Doğruluk
bites.time|Время|Vaqt|Süre
bites.backToPath|На учебный путь|O‘quv yo‘liga qaytish|Öğrenme yoluna dön
bites.share|Поделиться|Ulashish|Paylaş
bites.shareText|Я завершил(а) «{title}» в SmartyLang с точностью {n}%!|SmartyLang’da «{title}» darsini {n}% aniqlik bilan tugatdim!|SmartyLang'de “{title}” dersini %{n} doğrulukla tamamladım!
bites.recap.perfect|Отличный миниурок! Ни одной ошибки. Впечатляет!|Ajoyib dars! Bitta ham xato yo‘q. Juda zo‘r!|Harika bir ders! Tek bir hata bile yok. Etkileyici!
bites.recap.comeback|Вот это рывок! В начале было сложно, зато финиш отличный.|Ajoyib natija! Boshida qiyin bo‘ldi, lekin yakuni zo‘r!|Ne güzel toparladın! Başta zorlandın ama harika bitirdin.
bites.recap.tough|Было непросто! Так мы и учимся. Скоро попробуем ещё раз.|Qiyin bo‘ldi! Shu tariqa o‘rganamiz. Tez orada yana urinib ko‘ramiz.|Zordu! Öğrenmek böyle olur. Yakında tekrar deneyelim.
bites.recap.weakWord|Слово «{word}» оказалось сложным. Повторим его завтра.|«{word}» so‘zi qiyin bo‘ldi. Uni ertaga yana takrorlaymiz.|“{word}” kelimesi zor geldi. Yarın tekrar çalışırız.
bites.recap.night|Занимаешься допоздна! После урока хорошенько отдохни.|Kechgacha o‘qiyapsiz! Darsdan keyin yaxshilab dam oling.|Geç saate kadar çalışıyorsun! Dersten sonra güzelce dinlen.
bites.kind.meet|Знакомство со словами|So‘zlar bilan tanishish|Kelimelerle tanış
bites.kind.read|Чтение|O‘qish|Oku
bites.kind.words|Практика слов|So‘zlarni mashq qilish|Kelime pratiği
bites.kind.sentences|Предложения|Gaplar|Cümleler
bites.kind.listen-speak|Слушать и говорить|Tinglash va gapirish|Dinle ve konuş
bites.kind.heart-practice|Тренировка для восстановления жизней|Jon olish uchun mashq|Can kazanma pratiği
bites.step.vocab-intro|Новые слова|Yangi so‘zlar|Yeni kelimeler
bites.step.read-aloud|Прочитай историю вслух|Hikoyani ovoz chiqarib o‘qing|Hikâyeyi sesli oku
bites.step.definition-quiz|Выбери значение|Ma’nosini tanlang|Anlamını seç
bites.step.word-match|Соедини пары|Juftlarni moslang|Çiftleri eşleştir
bites.step.word-scramble|Собери слово из букв|Harflardan so‘z tuzing|Harfleri düzenleyip kelimeyi bul
bites.step.listening-match|Послушай и выбери|Tinglang va tanlang|Dinle ve seç
bites.step.true-false-quiz|Верно или неверно?|To‘g‘rimi yoki noto‘g‘rimi?|Doğru mu, yanlış mı?
bites.step.spelling-practice|Напиши слово|So‘zni yozing|Kelimeyi yaz
bites.step.pronunciation|Произнеси слово|So‘zni talaffuz qiling|Kelimeyi söyle
bites.step.sentence-reorder|Составь предложение|Gap tuzing|Cümleyi kur
bites.step.cloze|Заполни пропуск|Bo‘sh joyni to‘ldiring|Boşluğu doldur
bites.step.comprehension|Разберись в истории|Hikoyani tushuning|Hikâyeyi anla
bites.step.audio-dictation|Напиши, что слышишь|Eshitganingizni yozing|Duyduğunu yaz
bites.step.read-back-shadowing|Прочитай ещё раз вслух|Qayta ovoz chiqarib o‘qing|Sesli olarak tekrar oku
bites.step.word-review|Повторим слова|So‘zlarni takrorlaymiz|Biraz kelime pratiği
bites.notFound|Этот миниурок больше недоступен. Выбери другой урок на учебном пути.|Bu qisqa dars endi mavjud emas. O‘quv yo‘lingizdan boshqa darsni tanlang.|Bu kısa ders artık mevcut değil. Öğrenme yolundan bir ders seç.
bites.micUnavailable|Микрофон недоступен. Попробуй ещё раз или пропусти говорение. Жизни не потеряются.|Mikrofon ishlamayapti. Qayta urinib ko‘ring yoki gapirishni o‘tkazib yuboring. Jonlaringiz sarflanmaydi.|Mikrofon kullanılamadı. Tekrar dene veya konuşmayı geç. Canların güvende.
path.title|Твой учебный путь|O‘quv yo‘lingiz|Öğrenme yolun
path.subtitle|Уроков пройдено: {done} из {total}. Шаг за шагом!|{total} ta darsdan {done} tasi tugadi. Qadam-baqadam!|Tamamlanan ders: {done}/{total}. Adım adım!
path.allLessons|Все уроки|Barcha darslar|Tüm dersler
path.unit|Раздел {n}|{n}-bo‘lim|Ünite {n}
path.unitDone|Раздел завершён!|Bo‘lim tugadi!|Ünite tamamlandı!
path.unitChest|Заверши раздел, чтобы открыть|Ochish uchun bo‘limni tugating|Açmak için üniteyi tamamla
path.levelDone|Уровень завершён! Отличная работа, {name}.|Daraja tugadi! Ajoyib ish, {name}.|Seviye tamamlandı! Harika iş çıkardın {name}.
path.levelDone.plain|Уровень завершён! Отличная работа.|Daraja tugadi! Ajoyib ish.|Seviye tamamlandı! Harika iş çıkardın.
path.bitesDone|Миниуроков: {done}/{total}|Qisqa darslar: {done}/{total}|Kısa ders: {done}/{total}
path.jumpAhead|Хочешь перейти дальше? Можно, но предыдущие уроки помогут освоить основы.|Oldinga o‘tmoqchimisiz? Mumkin, lekin oldingi darslar asoslarni o‘rgatadi.|İleri mi geçmek istiyorsun? Geçebilirsin ama önceki dersler temeli oluşturur.
path.practiseAgain|Повторить|Takrorlash|Tekrar çalış
path.startLesson|Начать|Boshlash|Başla
path.jump|Перейти сюда?|Shu yerga o‘tasizmi?|Buraya geçilsin mi?
mascot.correct.1|Здорово!|Zo‘r!|Harika!
mascot.correct.2|Верно!|To‘g‘ri topdingiz!|Bildin!
mascot.correct.3|Идеально!|A’lo!|Mükemmel!
mascot.correct.4|Умное решение!|Aqlli tanlov!|Akıllıca!
mascot.correct.5|Так держать!|Shu tarzda davom eting!|Böyle devam et!
mascot.combo|Подряд: {n}!|Ketma-ket {n} ta!|Üst üste {n}!
mascot.wrong.1|Почти! Попробуй ещё.|Deyarli topdingiz! Yana urinib ko‘ring.|Çok yaklaştın! Tekrar dene.
mascot.wrong.2|Ошибки помогают учиться.|Xatolar o‘rganishga yordam beradi.|Hatalar öğrenmene yardımcı olur.
mascot.wrong.3|Не переживай, у тебя получится.|Xavotir olmang, siz uddalaysiz.|Üzülme, yapabilirsin.
mascot.complete.1|Получилось!|Uddaladingiz!|Başardın!
mascot.complete.2|Отличная работа!|Ajoyib ish!|Harika iş çıkardın!
mascot.complete.3|Превосходно!|Juda ajoyib!|Muhteşem!
mascot.greet.morning|Доброе утро! Готов к короткому уроку?|Xayrli tong! Qisqa darsga tayyormisiz?|Günaydın! Kısa bir derse hazır mısın?
mascot.greet.afternoon|Привет! Узнаем сегодня что-нибудь новое.|Salom! Bugun yangi narsa o‘rganamiz.|Merhaba! Bugün yeni bir şey öğrenelim.
mascot.greet.evening|Добрый вечер! Один урок перед сном?|Xayrli kech! Uyqudan oldin bitta dars-chi?|İyi akşamlar! Yatmadan önce bir ders daha mı?
mascot.greet.night|Не спится? Давай короткий урок.|Hali uxlamadingizmi? Qisqa dars qilamiz.|Hâlâ ayakta mısın? Kısa bir ders yapalım.
mascot.lesson.start|Давай потренируемся! У тебя получится.|Mashq qilamiz! Siz uddalaysiz.|Hadi pratik yapalım! Yapabilirsin.
mascot.lesson.reread|Если сначала перечитать текст, результат может стать лучше.|Avval matnni qayta o‘qisangiz, natijangiz yaxshilanishi mumkin.|Önce metni tekrar okumak puanını yükseltebilir.
mascot.lesson.done|Готово! Ты отлично справился.|Tugadi! Juda yaxshi uddaladingiz.|Bitti! Harika iş çıkardın.
mascot.goal|Цель на день достигнута!|Kunlik maqsadga erishildi!|Günlük hedef tamamlandı!
mascot.streak|Серия: {n} дн. Так держать!|{n} kunlik ketma-ketlik! Davom eting!|{n} günlük seri! Böyle devam et!
mascot.cert|Заслуженная награда! Есть чем гордиться.|Bu mukofotga loyiqsiz! Faxrlansangiz arziydi.|Bunu hak ettin! Gurur duyabilirsin.
mascot.settings.label|Реакции Smarty|Smarty reaksiyalari|Smarty tepkileri
mascot.settings.desc|Smarty будет подбадривать тебя во время упражнений.|Smarty mashqlar davomida sizni ruhlantirib turadi.|Smarty, alıştırmalarda seni cesaretlendirir.
core.accountRole.admin|Администратор|Administrator|Yönetici
core.accountRole.contentManager|Редактор материалов|Materiallar muharriri|İçerik yöneticisi
core.accountRole.teacher|Преподаватель|O‘qituvchi|Öğretmen
core.accountRole.organization|Организация|Tashkilot|Kurum
core.accountRole.student|Ученик|O‘quvchi|Öğrenci
core.accountRole.user|Учащийся|O‘rganuvchi|Öğrenen
lang.interface|Язык интерфейса|Interfeys tili|Arayüz dili
lang.learning|Изучаемый язык|O‘rganiladigan til|Öğrenilen dil
lang.languages|Языки|Tillar|Diller
lang.search|Поиск языков|Tillarni qidirish|Dil ara
action.signIn|Войти|Kirish|Giriş yap
action.signOut|Выйти из аккаунта|Hisobdan chiqish|Çıkış yap
action.customize|Настроить|Moslashtirish|Özelleştir
action.done|Готово|Tayyor|Bitti
action.play|Воспроизвести аудио|Audioni ijro etish|Sesi oynat
action.stop|Остановить аудио|Audioni to‘xtatish|Sesi durdur
action.download|Скачать|Yuklab olish|İndir
action.backToLevels|К уровням|Darajalarga qaytish|Seviyelere dön
action.backToLibrary|В библиотеку|Kutubxonaga qaytish|Kütüphaneye dön
action.backToEntry|К записи|Yozuvga qaytish|Kayda dön
action.backToExercises|К упражнениям|Mashqlarga qaytish|Alıştırmalara dön
action.backToTopics|К темам|Mavzularga qaytish|Konulara dön
action.backToStories|К историям|Hikoyalarga qaytish|Hikâyelere dön
action.getStarted|Начать заниматься|O‘rganishni boshlash|Öğrenmeye başla
action.cancel|Отмена|Bekor qilish|İptal
action.tryAgain|Попробовать снова|Yana urinib ko‘rish|Tekrar dene
action.dismiss|Закрыть|Yopish|Kapat
action.record|Записать голос|Ovozni yozib olish|Ses kaydet
action.write|Написать|Yozish|Yaz
action.use|Использовать|Foydalanish|Kullan
common.all|Все|Barchasi|Tümü
common.day|День|Kun|Gün
common.7d|7 дн.|7 kun|7 gün
common.30d|30 дн.|30 kun|30 gün
common.year|Год|Yil|Yıl
common.allTime|За всё время|Barcha vaqt|Tüm zamanlar
common.language|Язык|Til|Dil
common.type|Тип|Tur|Tür
common.when|Когда|Qachon|Tarih
common.score|Результат|Natija|Puan
common.recording|Запись|Yozuv|Kayıt
common.source|Источник|Manba|Kaynak
common.part|Часть|Qism|Bölüm
common.prompt|Задание|Topshiriq|Soru
common.featured|Рекомендуемое|Tavsiya etilgan|Öne çıkan
common.progress|Прогресс|Natijalar|İlerleme
common.words|слова|so‘zlar|kelimeler
common.wordsDetected|Распознано слов: {n}|Aniqlangan so‘zlar: {n}|Algılanan kelime: {n}
common.wordsCount|Слов: {n}|So‘zlar: {n}|Kelime: {n}
common.topicsCompleted|Пройдено тем: {done} из {total}|{total} ta mavzudan {done} tasi tugadi|Tamamlanan konu: {done}/{total}
common.title|Название|Sarlavha|Başlık
level.beginner|Начальный|Boshlang‘ich|Başlangıç
level.elementary|Базовый|Asosiy|Temel
level.preIntermediate|Ниже среднего|O‘rtadan quyi|Orta altı
level.intermediate|Средний|O‘rta|Orta
level.advanced|Продвинутый|Yuqori|İleri
settings.smarty.desc|Твой помощник в учёбе. Выбери, насколько он разговорчив и как тебя поддерживает.|O‘qishdagi hamrohingiz. Uning qanchalik faol bo‘lishini va sizni qanday ruhlantirishini tanlang.|Öğrenme arkadaşın. Ne kadar konuşkan olacağını ve seni nasıl destekleyeceğini seç.
settings.smarty.liveliness|Характер|Xarakter|Kişilik
settings.smarty.liveliness.lively|Живой|Faol|Canlı
settings.smarty.liveliness.calm|Спокойный|Sokin|Sakin
settings.smarty.liveliness.off|Выключен|O‘chirilgan|Kapalı
settings.smarty.liveliness.lively.desc|Реагирует, празднует, играет и иногда шутит.|Munosabat bildiradi, tabriklaydi, o‘ynaydi va ba’zan hazillashadi.|Tepki verir, kutlar, oynar ve bazen şakalaşır.
settings.smarty.liveliness.calm.desc|Тихий помощник: только обратная связь, без всплывающих сообщений.|Sokin yordamchi: faqat fikr bildiradi, qalqib chiquvchi xabarlarsiz.|Sessiz yardımcı: yalnızca geri bildirim, açılır mesaj yok.
settings.smarty.liveliness.off.desc|Smarty отдыхает. Без всплывающих сообщений и забав.|Smarty dam oladi. Qalqib chiquvchi xabarlar va o‘yinlar bo‘lmaydi.|Smarty dinlenir. Açılır mesaj ve oyun yok.
settings.smarty.name|Как Smarty должен тебя называть?|Smarty sizni qanday chaqirsin?|Smarty sana nasıl hitap etsin?
settings.smarty.name.desc|Это имя появится в сообщениях Smarty.|Bu ism Smarty xabarlarida ishlatiladi.|Smarty'nin mesajlarında kullanılır.
settings.smarty.name.placeholder|Твоё имя|Ismingiz|Adın
settings.smarty.minutes|Цель на день (минуты)|Kunlik maqsad (daqiqa)|Günlük hedef (dakika)
settings.smarty.minutes.desc|Около одного миниурока за 5 минут.|Har 5 daqiqada taxminan bitta qisqa dars.|Yaklaşık her 5 dakikada bir kısa ders.
settings.smarty.sound|Звуки|Ovozlar|Sesler
settings.smarty.sound.desc|Короткие звуки при ответах и получении наград.|Javoblar va mukofotlar uchun qisqa ovozlar.|Yanıtlar ve ödüller için kısa sesler.
settings.smarty.haptics|Вибрация|Tebranish|Titreşim
settings.smarty.haptics.desc|Короткая вибрация телефона при ответах и получении наград.|Javoblar va mukofotlar uchun telefonning yengil tebranishi.|Yanıtlar ve ödüller için telefonda hafif titreşim.
settings.smarty.seasonal|Сезонные сюрпризы|Mavsumiy syurprizlar|Mevsimlik sürprizler
settings.smarty.seasonal.desc|Праздничные наряды и особые дни.|Bayram liboslari va alohida kunlar.|Bayram kıyafetleri ve özel günler.
settings.smarty.reminder|Ежедневное напоминание|Kundalik eslatma|Günlük hatırlatma
settings.smarty.reminder.desc|Если ты ещё не занимался, Smarty напомнит в это время.|Hali mashq qilmagan bo‘lsangiz, Smarty shu vaqtda eslatadi.|Henüz çalışmadıysan Smarty bu saatte hatırlatır.
smarty.prefs.name.1|Хорошо! Теперь буду называть тебя так.|Tushunarli! Endi sizni shunday chaqiraman.|Tamam! Sana böyle hitap edeceğim.
smarty.prefs.name.named.1|Рад знакомству, {name}!|Tanishganimdan xursandman, {name}!|Tanıştığımıza memnun oldum {name}!
smarty.prefs.saved.1|Сохранено! Smarty это запомнит.|Saqlandi! Smarty buni eslab qoladi.|Kaydedildi! Smarty bunu hatırlayacak.
`;

const sourceReview = new Map();
for (const row of rows.trim().split('\n')) {
  const [key, ...values] = row.split('|');
  if (values.length !== 3 || !en[key]) throw new Error(`Invalid review row ${key}`);
  sourceReview.set(en[key], values);
}
for (const [index, lang] of ['ru', 'uz', 'tr'].entries()) {
  const overrides = {};
  for (const [key, source] of Object.entries(en)) {
    const values = sourceReview.get(source);
    if (!values) continue;
    const value = values[index];
    const marks = s => [...s.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map(m => m[1]).sort().join(',');
    if (marks(value) !== marks(source)) throw new Error(`${lang} placeholder mismatch: ${key}`);
    overrides[key] = value;
  }
  fs.writeFileSync(`scripts/ui-locale-overrides-${lang}.json`, JSON.stringify(overrides, null, 2) + '\n');
  console.log(lang, Object.keys(overrides).length, 'reviewed UI keys');
}

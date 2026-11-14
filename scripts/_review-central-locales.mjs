import fs from 'node:fs';
const en = JSON.parse(fs.readFileSync('src/locales/ui.en.json', 'utf8'));
// Authored navigation and core learning flow: Polish, Swedish, Czech, Romanian, Greek.
const rows = String.raw`
nav.home|Strona główna|Startsida|Domů|Acasă|Αρχική
nav.learn|Ucz się|Lär dig|Učit se|Învață|Μάθε
nav.league|Liga|Liga|Liga|Ligă|Πρωτάθλημα
nav.more|Więcej|Mer|Více|Mai multe|Περισσότερα
nav.keepGoing|Tak trzymaj!|Fortsätt så!|Jen tak dál!|Continuă tot așa!|Συνέχισε έτσι!
nav.businessShort|Dla firm|Företag|Pro firmy|Companii|Επιχειρήσεις
nav.business|Panel organizacji|Företagspanel|Firemní přehled|Panoul organizației|Πίνακας επιχείρησης
nav.adminShort|Admin|Admin|Správce|Admin|Διαχειριστής
nav.contentShort|Materiały|Innehåll|Obsah|Conținut|Περιεχόμενο
nav.organization|Organizacja|Organisation|Organizace|Organizație|Οργανισμός
nav.practice|Ćwicz|Öva|Procvičování|Exersează|Εξασκήσου
nav.lessons|Lekcje|Lektioner|Lekce|Lecții|Μαθήματα
nav.reference|Materiały pomocnicze|Uppslagsverk|Příručka|Resurse de referință|Υλικό αναφοράς
nav.reading|Czytanie|Läsning|Čtení|Citire|Ανάγνωση
nav.listening|Słuchanie|Hörförståelse|Poslech|Ascultare|Ακρόαση
nav.speaking|Mówienie|Tal|Mluvení|Vorbire|Ομιλία
nav.writing|Pisanie|Skrivning|Psaní|Scriere|Γραφή
nav.exercises|Ćwiczenia|Övningar|Cvičení|Exerciții|Ασκήσεις
nav.vocabulary|Słownictwo|Ordförråd|Slovní zásoba|Vocabular|Λεξιλόγιο
nav.dictionary|Słownik|Ordbok|Slovník|Dicționar|Λεξικό
nav.classes|Klasy|Klasser|Třídy|Clase|Τάξεις
nav.myClasses|Moje klasy|Mina klasser|Moje třídy|Clasele mele|Οι τάξεις μου
nav.plans|Plany|Abonnemang|Předplatné|Abonamente|Συνδρομές
nav.upgrade|Zmień plan na wyższy|Uppgradera abonnemang|Vylepšit předplatné|Treci la un abonament superior|Αναβάθμιση συνδρομής
nav.account|Konto|Konto|Účet|Cont|Λογαριασμός
nav.profile|Profil|Profil|Profil|Profil|Προφίλ
nav.admin|Panel administratora|Administratörspanel|Správa|Panoul de administrare|Πίνακας διαχείρισης
nav.content|Zarządzanie materiałami|Innehållshantering|Správa obsahu|Gestionarea conținutului|Διαχείριση περιεχομένου
nav.management|Zarządzanie|Hantering|Správa|Administrare|Διαχείριση
nav.menu|Menu|Meny|Nabídka|Meniu|Μενού
nav.listen|Słuchaj|Lyssna|Poslouchat|Ascultă|Άκουσε
nav.speak|Mów|Tala|Mluvit|Vorbește|Μίλησε
lang.interface|Język interfejsu|Gränssnittsspråk|Jazyk rozhraní|Limba interfeței|Γλώσσα περιβάλλοντος
lang.learning|Język, którego się uczysz|Språk du lär dig|Studovaný jazyk|Limba pe care o înveți|Γλώσσα εκμάθησης
lang.languages|Języki|Språk|Jazyky|Limbi|Γλώσσες
lang.search|Szukaj języków|Sök språk|Hledat jazyky|Caută limbi|Αναζήτηση γλωσσών
action.signIn|Zaloguj się|Logga in|Přihlásit se|Conectează-te|Σύνδεση
action.signOut|Wyloguj się|Logga ut|Odhlásit se|Deconectează-te|Αποσύνδεση
action.done|Gotowe|Klart|Hotovo|Gata|Τέλος
action.back|Wstecz|Tillbaka|Zpět|Înapoi|Πίσω
action.start|Zacznij|Börja|Začít|Începe|Έναρξη
action.cancel|Anuluj|Avbryt|Zrušit|Anulează|Ακύρωση
action.tryAgain|Spróbuj ponownie|Försök igen|Zkusit znovu|Încearcă din nou|Δοκίμασε ξανά
action.getStarted|Rozpocznij naukę|Kom igång|Začít se učit|Începe să înveți|Ξεκίνα να μαθαίνεις
action.download|Pobierz|Ladda ner|Stáhnout|Descarcă|Λήψη
action.record|Nagraj głos|Spela in|Nahrát hlas|Înregistrează|Ηχογράφηση
action.write|Napisz|Skriv|Psát|Scrie|Γράψε
action.customize|Dostosuj|Anpassa|Přizpůsobit|Personalizează|Προσαρμογή
action.dismiss|Zamknij|Stäng|Zavřít|Închide|Κλείσιμο
common.all|Wszystkie|Alla|Vše|Toate|Όλα
common.day|Dzień|Dag|Den|Zi|Ημέρα
common.year|Rok|År|Rok|An|Έτος
common.allTime|Cały okres|Sedan starten|Za celou dobu|Dintotdeauna|Από την αρχή
common.language|Język|Språk|Jazyk|Limbă|Γλώσσα
common.score|Wynik|Resultat|Výsledek|Scor|Βαθμολογία
common.recording|Nagranie|Inspelning|Nahrávka|Înregistrare|Ηχογράφηση
common.progress|Postępy|Framsteg|Pokrok|Progres|Πρόοδος
common.wordsCount|Liczba słów: {n}|Antal ord: {n}|Počet slov: {n}|Număr de cuvinte: {n}|Λέξεις: {n}
level.beginner|Początkujący|Nybörjare|Začátečník|Începător|Αρχάριο
level.elementary|Podstawowy|Grundläggande|Základní|Elementar|Βασικό
level.preIntermediate|Niższy średnio zaawansowany|Lägre medelnivå|Nižší středně pokročilý|Pre-intermediar|Κατώτερο μεσαίο
level.intermediate|Średnio zaawansowany|Medelnivå|Středně pokročilý|Intermediar|Μεσαίο
level.advanced|Zaawansowany|Avancerad|Pokročilý|Avansat|Προχωρημένο
onboard.hello.title|Cześć! Jestem Smarty!|Hej! Jag är Smarty!|Ahoj! Já jsem Smarty!|Salut! Eu sunt Smarty!|Γεια σου! Είμαι ο Smarty!
onboard.hello.body|Kilka krótkich pytań i zaczniesz pierwszą minilekcję.|Bara några snabba frågor, sedan din första minilektion.|Jen pár krátkých otázek a začne tvoje první minilekce.|Doar câteva întrebări rapide, apoi prima ta minilecție.|Λίγες σύντομες ερωτήσεις και ξεκινά το πρώτο σου μικρό μάθημα.
onboard.step.meet|Poznaj Smarty’ego|Lär känna Smarty|Seznam se se Smartym|Fă cunoștință cu Smarty|Γνώρισε τον Smarty
onboard.meet.name|Jak mam się do ciebie zwracać?|Vad ska jag kalla dig?|Jak ti mám říkat?|Cum să-ți spun?|Πώς να σε φωνάζω;
onboard.meet.placeholder|Twoje imię lub pseudonim|Ditt namn eller smeknamn|Tvé jméno nebo přezdívka|Numele sau porecla ta|Το όνομα ή το ψευδώνυμό σου
onboard.meet.optional|Opcjonalnie. Możesz to zmienić w ustawieniach Smarty’ego.|Valfritt. Du kan ändra det i Smartys inställningar.|Nepovinné. Můžeš to změnit v nastavení Smartyho.|Opțional. Poți schimba asta din setările Smarty.|Προαιρετικό. Μπορείς να το αλλάξεις στις ρυθμίσεις του Smarty.
onboard.native.title|W jakim języku mówisz?|Vilket språk talar du?|Jakým jazykem mluvíš?|Ce limbă vorbești?|Ποια γλώσσα μιλάς;
onboard.learning.title|Jakiego języka chcesz się uczyć?|Vilket språk vill du lära dig?|Jaký jazyk se chceš učit?|Ce limbă vrei să înveți?|Ποια γλώσσα θέλεις να μάθεις;
onboard.goal.title|Dlaczego chcesz się uczyć?|Varför vill du lära dig?|Proč se chceš učit?|De ce vrei să înveți?|Γιατί θέλεις να μάθεις;
onboard.goal.daily.title|Codzienne sytuacje|Vardag|Každodenní život|Viața de zi cu zi|Καθημερινή χρήση
onboard.goal.school.title|Szkoła i studia|Skola och studier|Škola a studium|Școală și studiu|Σχολείο και σπουδές
onboard.goal.exam.title|Egzaminy i certyfikaty|Prov och certifikat|Zkoušky a certifikáty|Examene și certificate|Εξετάσεις και πιστοποιήσεις
onboard.minutes.title|Ile czasu dziennie?|Hur mycket tid varje dag?|Kolik času denně?|Cât timp pe zi?|Πόσο χρόνο κάθε μέρα;
onboard.minutes.subtitle|Zacznij od małych kroków. Cel możesz zmienić w każdej chwili.|Börja smått. Du kan ändra ditt mål när som helst.|Začni po malých krocích. Cíl můžeš kdykoli změnit.|Începe cu pași mici. Poți schimba obiectivul oricând.|Ξεκίνα με μικρά βήματα. Μπορείς να αλλάξεις τον στόχο σου όποτε θέλεις.
onboard.minutes.option|{n} min|{n} min|{n} min|{n} min|{n} λεπτά
onboard.minutes.xp|Dzienny cel: {n} XP|Dagsmål: {n} XP|Denní cíl: {n} XP|Obiectiv zilnic: {n} XP|Ημερήσιος στόχος: {n} XP
onboard.minutes.casual|Na spokojnie|Lugnt|Pohodové|Lejer|Χαλαρά
onboard.minutes.regular|Regularnie|Regelbundet|Pravidelné|Regulat|Σταθερά
onboard.minutes.serious|Na poważnie|Ambitiöst|Důkladné|Serios|Σοβαρά
onboard.minutes.intense|Intensywnie|Intensivt|Intenzivní|Intens|Εντατικά
onboard.start.title|Od czego zaczynamy?|Var ska vi börja?|Kde začneme?|De unde începem?|Από πού ξεκινάμε;
onboard.start.scratch.title|Zacznij od zera|Börja från början|Začít od nuly|Începe de la zero|Ξεκίνα από το μηδέν
onboard.start.find.title|Sprawdź mój poziom|Hitta min nivå|Zjistit mou úroveň|Află-mi nivelul|Βρες το επίπεδό μου
onboard.placement.title|Test poziomujący|Nivåtest|Rozřazovací test|Test de nivel|Τεστ επιπέδου
onboard.skipPlacement|Pomiń test poziomujący|Hoppa över nivåtestet|Přeskočit rozřazovací test|Sari peste testul de nivel|Παράλειψη τεστ επιπέδου
onboard.skipForNow|Na razie pomiń|Hoppa över tills vidare|Zatím přeskočit|Sari deocamdată|Παράλειψη προς το παρόν
onboard.skipQuestion|Pomiń pytanie|Hoppa över frågan|Přeskočit otázku|Sari peste întrebare|Παράλειψη ερώτησης
onboard.continue|Kontynuuj|Fortsätt|Pokračovat|Continuă|Συνέχεια
onboard.next|Dalej|Nästa|Další|Mai departe|Επόμενο
onboard.seeLevel|Zobacz mój poziom|Visa min nivå|Zobrazit mou úroveň|Vezi nivelul meu|Δες το επίπεδό μου
onboard.questionOf|Pytanie {n} z {total}|Fråga {n} av {total}|Otázka {n} z {total}|Întrebarea {n} din {total}|Ερώτηση {n} από {total}
onboard.progress|Krok {n} z {total}|Steg {n} av {total}|Krok {n} z {total}|Pasul {n} din {total}|Βήμα {n} από {total}
onboard.result.levelLine|Zaczynasz na poziomie {level}!|Du börjar på nivån {level}!|Začínáš na úrovni {level}!|Începi la nivelul {level}!|Ξεκινάς στο επίπεδο {level}!
onboard.startBite|Rozpocznij moją pierwszą minilekcję|Starta min första minilektion|Začít mou první minilekci|Începe prima mea minilecție|Ξεκίνα το πρώτο μου μικρό μάθημα
onboard.saving|Przygotowujemy wszystko…|Förbereder…|Připravujeme vše…|Pregătim totul…|Ετοιμαζόμαστε…
onboard.saveError|Nie udało się zapisać ustawień. Sprawdź połączenie i spróbuj ponownie.|Det gick inte att spara dina inställningar. Kontrollera anslutningen och försök igen.|Nastavení se nepodařilo uložit. Zkontroluj připojení a zkus to znovu.|Nu am putut salva setările. Verifică conexiunea și încearcă din nou.|Δεν αποθηκεύτηκαν οι ρυθμίσεις σου. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.
today.title|Dzisiaj ze Smarty’m|I dag med Smarty|Dnes se Smartym|Astăzi cu Smarty|Σήμερα με τον Smarty
today.greeting.morning|Dzień dobry, {name}!|God morgon, {name}!|Dobré ráno, {name}!|Bună dimineața, {name}!|Καλημέρα, {name}!
today.greeting.afternoon|Witaj, {name}!|God eftermiddag, {name}!|Dobré odpoledne, {name}!|Bună ziua, {name}!|Καλό απόγευμα, {name}!
today.greeting.evening|Dobry wieczór, {name}!|God kväll, {name}!|Dobrý večer, {name}!|Bună seara, {name}!|Καλησπέρα, {name}!
today.greeting.return|Miło cię znów widzieć, {name}!|Välkommen tillbaka, {name}!|Vítej zpět, {name}!|Bine ai revenit, {name}!|Καλώς ήρθες ξανά, {name}!
today.start|Rozpocznij dzisiejszą minilekcję|Starta dagens minilektion|Začít dnešní minilekci|Începe minilecția de astăzi|Ξεκίνα το σημερινό μικρό μάθημα
today.biteTitle|Dzisiejsza minilekcja|Dagens minilektion|Dnešní minilekce|Minilecția de astăzi|Το σημερινό μικρό μάθημα
today.done|Dzisiejsza minilekcja ukończona|Dagens minilektion är klar|Dnešní minilekce dokončena|Minilecția de astăzi este finalizată|Το σημερινό μικρό μάθημα ολοκληρώθηκε
today.continuePath|Kontynuuj ścieżkę nauki|Fortsätt på din lärstig|Pokračovat v učební cestě|Continuă parcursul tău|Συνέχισε τη μαθησιακή σου πορεία
today.goal|Dzisiaj: {n} / {goal} XP|I dag: {n} / {goal} XP|Dnes: {n} / {goal} XP|Astăzi: {n} / {goal} XP|Σήμερα: {n} / {goal} XP
today.reminderSettings|Ustawienia|Inställningar|Nastavení|Setări|Ρυθμίσεις
today.notifications|Powiadomienia|Aviseringar|Oznámení|Notificări|Ειδοποιήσεις
hearts.title|Twoje życia|Dina liv|Tvé životy|Viețile tale|Οι ζωές σου
hearts.count|Życia: {n}|Liv: {n}|Životy: {n}|Vieți: {n}|Ζωές: {n}
hearts.unlimited|Nieograniczone życia|Obegränsade liv|Neomezené životy|Vieți nelimitate|Απεριόριστες ζωές
hearts.empty|Czas na małą powtórkę|Dags för lite repetition|Čas na malé opakování|E timpul să recapitulăm puțin|Ώρα για λίγη επανάληψη
hearts.practice|Ćwicz, aby zdobyć życie|Öva för att få ett liv|Procvičovat a získat život|Exersează ca să câștigi o viață|Εξασκήσου για να κερδίσεις μια ζωή
hearts.next|Następne życie za {time}|Nästa liv om {time}|Další život za {time}|Următoarea viață în {time}|Επόμενη ζωή σε {time}
hearts.review|Powtórz sześć słów|Repetera sex ord|Zopakovat šest slov|Repetă șase cuvinte|Κάνε επανάληψη έξι λέξεων
bites.quit|Wyjdź z minilekcji|Lämna minilektionen|Opustit minilekci|Ieși din minilecție|Έξοδος από το μικρό μάθημα
bites.quitConfirm|Wyjdź|Lämna|Opustit|Ieși|Έξοδος
bites.keepGoing|Ucz się dalej|Fortsätt lära dig|Pokračovat v učení|Continuă să înveți|Συνέχισε να μαθαίνεις
bites.cantSpeak|Nie mogę teraz mówić|Jag kan inte prata just nu|Teď nemůžu mluvit|Nu pot vorbi acum|Δεν μπορώ να μιλήσω τώρα
bites.doneTitle|Minilekcja ukończona!|Minilektionen är klar!|Minilekce dokončena!|Minilecție finalizată!|Το μικρό μάθημα ολοκληρώθηκε!
bites.accuracy|Dokładność|Träffsäkerhet|Přesnost|Precizie|Ακρίβεια
bites.time|Czas|Tid|Čas|Timp|Χρόνος
bites.backToPath|Wróć do ścieżki nauki|Tillbaka till lärstigen|Zpět na učební cestu|Înapoi la parcurs|Πίσω στη μαθησιακή πορεία
bites.share|Udostępnij|Dela|Sdílet|Distribuie|Κοινοποίηση
path.title|Twoja ścieżka nauki|Din lärstig|Tvá učební cesta|Parcursul tău de învățare|Η μαθησιακή σου πορεία
path.allLessons|Wszystkie lekcje|Alla lektioner|Všechny lekce|Toate lecțiile|Όλα τα μαθήματα
path.unit|Rozdział {n}|Avsnitt {n}|Celek {n}|Unitatea {n}|Ενότητα {n}
path.unitDone|Rozdział ukończony!|Avsnittet är klart!|Celek dokončen!|Unitate finalizată!|Η ενότητα ολοκληρώθηκε!
path.jump|Przejść tutaj?|Hoppa hit?|Přeskočit sem?|Sari aici?|Μετάβαση εδώ;
`;
const reviewed = new Map();
for (const row of rows.trim().split('\n')) {
  const [key, ...values] = row.split('|');
  if (values.length !== 5 || !en[key]) throw new Error(`Invalid review row ${key}`);
  reviewed.set(en[key], values);
}
for (const [index, lang] of ['pl', 'sv', 'cs', 'ro', 'el'].entries()) {
  const overrides = {};
  for (const [key, source] of Object.entries(en)) {
    const values = reviewed.get(source);
    if (!values) continue;
    const marks = s => [...s.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map(m => m[1]).sort().join(',');
    if (marks(values[index]) !== marks(source)) throw new Error(`${lang} placeholder mismatch: ${key}`);
    overrides[key] = values[index];
  }
  fs.writeFileSync(`scripts/ui-locale-overrides-${lang}.json`, JSON.stringify(overrides, null, 2) + '\n');
  console.log(lang, Object.keys(overrides).length, 'reviewed UI keys');
}

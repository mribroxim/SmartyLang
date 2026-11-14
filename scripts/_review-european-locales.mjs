import fs from 'node:fs';
const en = JSON.parse(fs.readFileSync('src/locales/ui.en.json', 'utf8'));
// Authored main-flow terminology: Spanish, German, French, Italian, Portuguese, Dutch.
const rows = String.raw`
nav.home|Inicio|Startseite|Accueil|Home|Início|Startpagina
nav.learn|Aprender|Lernen|Apprendre|Impara|Aprender|Leren
nav.league|Liga|Liga|Ligue|Lega|Liga|Competitie
nav.more|Más|Mehr|Plus|Altro|Mais|Meer
nav.keepGoing|¡Sigue así!|Weiter so!|Continue comme ça !|Continua così!|Continue assim!|Ga zo door!
nav.businessShort|Empresas|Unternehmen|Entreprises|Aziende|Empresas|Zakelijk
nav.business|Panel de empresa|Unternehmensübersicht|Tableau de bord de l’entreprise|Pannello aziendale|Painel da empresa|Bedrijfsdashboard
nav.adminShort|Admin.|Admin|Admin|Admin|Admin|Beheer
nav.contentShort|Contenido|Inhalte|Contenu|Contenuti|Conteúdo|Inhoud
nav.organization|Organización|Organisation|Organisation|Organizzazione|Organização|Organisatie
nav.practice|Practicar|Üben|S’entraîner|Esercitati|Praticar|Oefenen
nav.lessons|Lecciones|Lektionen|Leçons|Lezioni|Lições|Lessen
nav.reference|Referencia|Nachschlagen|Références|Consultazione|Referências|Naslagwerk
nav.reading|Lectura|Lesen|Lecture|Lettura|Leitura|Lezen
nav.listening|Comprensión auditiva|Hörverstehen|Compréhension orale|Ascolto|Compreensão oral|Luisteren
nav.speaking|Expresión oral|Sprechen|Expression orale|Conversazione|Conversação|Spreken
nav.writing|Escritura|Schreiben|Écriture|Scrittura|Escrita|Schrijven
nav.exercises|Ejercicios|Übungen|Exercices|Esercizi|Exercícios|Oefeningen
nav.vocabulary|Vocabulario|Wortschatz|Vocabulaire|Vocabolario|Vocabulário|Woordenschat
nav.dictionary|Diccionario|Wörterbuch|Dictionnaire|Dizionario|Dicionário|Woordenboek
nav.classes|Clases|Klassen|Classes|Classi|Turmas|Klassen
nav.myClasses|Mis clases|Meine Klassen|Mes classes|Le mie classi|Minhas turmas|Mijn klassen
nav.plans|Planes|Abos|Abonnements|Piani|Planos|Abonnementen
nav.upgrade|Mejorar plan|Abo erweitern|Passer à une offre supérieure|Passa a un piano superiore|Melhorar plano|Abonnement upgraden
nav.account|Cuenta|Konto|Compte|Account|Conta|Account
nav.profile|Perfil|Profil|Profil|Profilo|Perfil|Profiel
nav.admin|Panel de administración|Verwaltung|Administration|Pannello di amministrazione|Painel de administração|Beheerpaneel
nav.content|Gestión de contenidos|Inhaltsverwaltung|Gestion du contenu|Gestione dei contenuti|Gestão de conteúdo|Inhoudsbeheer
nav.management|Gestión|Verwaltung|Gestion|Gestione|Gestão|Beheer
nav.menu|Menú|Menü|Menu|Menu|Menu|Menu
nav.listen|Escuchar|Anhören|Écouter|Ascolta|Ouvir|Luisteren
nav.speak|Hablar|Sprechen|Parler|Parla|Falar|Spreken
lang.interface|Idioma de la interfaz|Anzeigesprache|Langue de l’interface|Lingua dell’interfaccia|Idioma da interface|Interfacetaal
lang.learning|Idioma que aprendes|Lernsprache|Langue apprise|Lingua da imparare|Idioma que está aprendendo|Taal die je leert
lang.languages|Idiomas|Sprachen|Langues|Lingue|Idiomas|Talen
lang.search|Buscar idiomas|Sprachen suchen|Rechercher une langue|Cerca una lingua|Buscar idiomas|Talen zoeken
action.signIn|Iniciar sesión|Anmelden|Se connecter|Accedi|Entrar|Inloggen
action.signOut|Cerrar sesión|Abmelden|Se déconnecter|Esci dall’account|Sair da conta|Uitloggen
action.done|Listo|Fertig|Terminé|Fatto|Concluído|Klaar
action.back|Atrás|Zurück|Retour|Indietro|Voltar|Terug
action.start|Empezar|Starten|Commencer|Inizia|Começar|Beginnen
action.cancel|Cancelar|Abbrechen|Annuler|Annulla|Cancelar|Annuleren
action.tryAgain|Volver a intentar|Erneut versuchen|Réessayer|Riprova|Tentar novamente|Opnieuw proberen
action.getStarted|Empezar|Loslegen|C’est parti|Inizia subito|Começar agora|Aan de slag
action.download|Descargar|Herunterladen|Télécharger|Scarica|Baixar|Downloaden
action.record|Grabar voz|Aufnehmen|Enregistrer|Registra|Gravar voz|Opnemen
action.write|Escribir|Schreiben|Écrire|Scrivi|Escrever|Schrijven
action.customize|Personalizar|Anpassen|Personnaliser|Personalizza|Personalizar|Aanpassen
action.dismiss|Cerrar|Schließen|Fermer|Chiudi|Fechar|Sluiten
common.all|Todo|Alle|Tout|Tutto|Tudo|Alles
common.day|Día|Tag|Jour|Giorno|Dia|Dag
common.year|Año|Jahr|Année|Anno|Ano|Jaar
common.allTime|Todo el período|Gesamter Zeitraum|Depuis le début|Da sempre|Todo o período|Altijd
common.language|Idioma|Sprache|Langue|Lingua|Idioma|Taal
common.score|Puntuación|Ergebnis|Score|Punteggio|Pontuação|Score
common.recording|Grabación|Aufnahme|Enregistrement|Registrazione|Gravação|Opname
common.progress|Progreso|Fortschritt|Progression|Progressi|Progresso|Voortgang
common.wordsCount|{n} palabras|Wörter: {n}|{n} mots|{n} parole|{n} palavras|{n} woorden
level.beginner|Principiante|Anfänger|Débutant|Principiante|Iniciante|Beginner
level.elementary|Básico|Grundstufe|Élémentaire|Elementare|Básico|Basis
level.preIntermediate|Preintermedio|Untere Mittelstufe|Pré-intermédiaire|Pre-intermedio|Pré-intermediário|Voor gemiddeld
level.intermediate|Intermedio|Mittelstufe|Intermédiaire|Intermedio|Intermediário|Gemiddeld
level.advanced|Avanzado|Fortgeschritten|Avancé|Avanzato|Avançado|Gevorderd
onboard.hello.title|¡Hola! ¡Soy Smarty!|Hallo! Ich bin Smarty!|Salut ! Je suis Smarty !|Ciao! Sono Smarty!|Olá! Eu sou o Smarty!|Hoi! Ik ben Smarty!
onboard.hello.body|Solo unas preguntas rápidas y empezarás tu primera minilección.|Nur ein paar kurze Fragen, dann beginnt deine erste Lerneinheit.|Quelques questions rapides, puis ta première mini-leçon.|Solo qualche domanda veloce, poi la tua prima mini lezione.|Só algumas perguntas rápidas e você começa sua primeira lição curta.|Eerst een paar korte vragen, dan je eerste korte les.
onboard.step.meet|Conoce a Smarty|Lerne Smarty kennen|Fais connaissance avec Smarty|Conosci Smarty|Conheça o Smarty|Maak kennis met Smarty
onboard.meet.name|¿Cómo quieres que te llame?|Wie soll ich dich nennen?|Comment dois-je t’appeler ?|Come vuoi che ti chiami?|Como você quer que eu te chame?|Hoe zal ik je noemen?
onboard.meet.placeholder|Tu nombre o apodo|Dein Name oder Spitzname|Ton prénom ou surnom|Il tuo nome o soprannome|Seu nome ou apelido|Je naam of bijnaam
onboard.meet.optional|Opcional. Puedes cambiarlo en los ajustes de Smarty.|Freiwillig. Du kannst das in den Smarty-Einstellungen ändern.|Facultatif. Tu peux le modifier dans les réglages de Smarty.|Facoltativo. Puoi cambiarlo nelle impostazioni di Smarty.|Opcional. Você pode mudar isso nas configurações do Smarty.|Niet verplicht. Je kunt dit wijzigen in de instellingen van Smarty.
onboard.native.title|¿Qué idioma hablas?|Welche Sprache sprichst du?|Quelle langue parles-tu ?|Quale lingua parli?|Qual idioma você fala?|Welke taal spreek je?
onboard.learning.title|¿Qué idioma quieres aprender?|Welche Sprache möchtest du lernen?|Quelle langue veux-tu apprendre ?|Quale lingua vuoi imparare?|Qual idioma você quer aprender?|Welke taal wil je leren?
onboard.goal.title|¿Para qué quieres aprender?|Wofür lernst du die Sprache?|Pourquoi veux-tu apprendre ?|Perché vuoi imparare?|Por que você quer aprender?|Waarom wil je leren?
onboard.goal.daily.title|Uso cotidiano|Alltag|Vie quotidienne|Vita quotidiana|Uso no dia a dia|Dagelijks gebruik
onboard.goal.school.title|Escuela y estudios|Schule und Studium|École et études|Scuola e studio|Escola e estudos|School en studie
onboard.goal.exam.title|Exámenes y certificados|Prüfungen und Zertifikate|Examens et certifications|Esami e certificazioni|Provas e certificados|Examens en certificaten
onboard.minutes.title|¿Cuánto tiempo al día?|Wie viel Zeit pro Tag?|Combien de temps par jour ?|Quanto tempo al giorno?|Quanto tempo por dia?|Hoeveel tijd per dag?
onboard.minutes.subtitle|Empieza poco a poco. Puedes cambiar tu objetivo cuando quieras.|Fang klein an. Du kannst dein Ziel jederzeit ändern.|Commence doucement. Tu peux changer ton objectif à tout moment.|Inizia con poco. Puoi cambiare il tuo obiettivo quando vuoi.|Comece aos poucos. Você pode mudar sua meta quando quiser.|Begin klein. Je kunt je doel op elk moment aanpassen.
onboard.minutes.option|{n} min|{n} Min.|{n} min|{n} min|{n} min|{n} min
onboard.minutes.xp|Objetivo diario: {n} XP|Tagesziel: {n} XP|Objectif quotidien : {n} XP|Obiettivo giornaliero: {n} XP|Meta diária: {n} XP|Dagdoel: {n} XP
onboard.minutes.casual|Tranquilo|Locker|Tranquille|Tranquillo|Tranquilo|Rustig
onboard.minutes.regular|Constante|Regelmäßig|Régulier|Regolare|Regular|Regelmatig
onboard.minutes.serious|En serio|Engagiert|Sérieux|Impegnativo|Sério|Serieus
onboard.minutes.intense|Intensivo|Intensiv|Intensif|Intenso|Intenso|Intensief
onboard.start.title|¿Por dónde empezamos?|Wo fangen wir an?|Par où commence-t-on ?|Da dove iniziamo?|Por onde começamos?|Waar beginnen we?
onboard.start.scratch.title|Empezar desde cero|Ganz von vorne anfangen|Partir de zéro|Parti da zero|Começar do zero|Vanaf nul beginnen
onboard.start.find.title|Encontrar mi nivel|Mein Niveau ermitteln|Trouver mon niveau|Trova il mio livello|Descobrir meu nível|Mijn niveau bepalen
onboard.placement.title|Prueba de nivel|Einstufungstest|Test de niveau|Test di livello|Teste de nível|Niveautest
onboard.skipPlacement|Omitir la prueba de nivel|Einstufungstest überspringen|Passer le test de niveau|Salta il test di livello|Pular o teste de nível|Niveautest overslaan
onboard.skipForNow|Omitir por ahora|Vorerst überspringen|Passer pour le moment|Salta per ora|Pular por enquanto|Voor nu overslaan
onboard.skipQuestion|Omitir pregunta|Frage überspringen|Passer la question|Salta la domanda|Pular pergunta|Vraag overslaan
onboard.continue|Continuar|Weiter|Continuer|Continua|Continuar|Doorgaan
onboard.next|Siguiente|Weiter|Suivant|Avanti|Próxima|Volgende
onboard.seeLevel|Ver mi nivel|Mein Niveau anzeigen|Voir mon niveau|Vedi il mio livello|Ver meu nível|Mijn niveau bekijken
onboard.questionOf|Pregunta {n} de {total}|Frage {n} von {total}|Question {n} sur {total}|Domanda {n} di {total}|Pergunta {n} de {total}|Vraag {n} van {total}
onboard.progress|Paso {n} de {total}|Schritt {n} von {total}|Étape {n} sur {total}|Passaggio {n} di {total}|Etapa {n} de {total}|Stap {n} van {total}
onboard.result.levelLine|¡Empiezas en el nivel {level}!|Du startest auf dem Niveau {level}!|Tu commences au niveau {level} !|Inizi dal livello {level}!|Você começa no nível {level}!|Je begint op niveau {level}!
onboard.startBite|Empezar mi primera minilección|Meine erste Lerneinheit starten|Commencer ma première mini-leçon|Inizia la mia prima mini lezione|Começar minha primeira lição curta|Mijn eerste korte les starten
onboard.saving|Preparándolo todo…|Wird vorbereitet…|Préparation…|Preparazione…|Preparando tudo…|Even voorbereiden…
onboard.saveError|No pudimos guardar tu configuración. Revisa la conexión e inténtalo de nuevo.|Deine Einstellungen konnten nicht gespeichert werden. Prüfe deine Verbindung und versuche es erneut.|Impossible d’enregistrer tes réglages. Vérifie ta connexion et réessaie.|Non siamo riusciti a salvare le impostazioni. Controlla la connessione e riprova.|Não foi possível salvar suas configurações. Verifique a conexão e tente novamente.|Je instellingen konden niet worden opgeslagen. Controleer je verbinding en probeer het opnieuw.
today.title|Hoy con Smarty|Heute mit Smarty|Aujourd’hui avec Smarty|Oggi con Smarty|Hoje com o Smarty|Vandaag met Smarty
today.greeting.morning|¡Buenos días, {name}!|Guten Morgen, {name}!|Bonjour {name} !|Buongiorno, {name}!|Bom dia, {name}!|Goedemorgen, {name}!
today.greeting.afternoon|¡Buenas tardes, {name}!|Guten Tag, {name}!|Bon après-midi, {name} !|Buon pomeriggio, {name}!|Boa tarde, {name}!|Goedemiddag, {name}!
today.greeting.evening|¡Buenas noches, {name}!|Guten Abend, {name}!|Bonsoir {name} !|Buonasera, {name}!|Boa noite, {name}!|Goedenavond, {name}!
today.greeting.return|¡Qué bueno verte de nuevo, {name}!|Willkommen zurück, {name}!|Bon retour, {name} !|Bentornato, {name}!|Que bom ter você de volta, {name}!|Welkom terug, {name}!
today.start|Empezar la lección de hoy|Heutige Lerneinheit starten|Commencer la leçon du jour|Inizia la lezione del giorno|Começar a lição do dia|De les van vandaag starten
today.biteTitle|Lección de hoy|Heutige Lerneinheit|Leçon du jour|Lezione del giorno|Lição do dia|Les van vandaag
today.done|Lección diaria completada|Tägliche Lerneinheit abgeschlossen|Leçon du jour terminée|Lezione del giorno completata|Lição do dia concluída|Dagelijkse les afgerond
today.continuePath|Continuar mi ruta de aprendizaje|Auf deinem Lernpfad weitermachen|Continuer ton parcours|Continua il tuo percorso|Continuar seu percurso|Verder op je leerpad
today.streak|Racha de {n} días|Serie: {n} Tage|Série de {n} jours|Serie di {n} giorni|Sequência de {n} dias|Reeks van {n} dagen
today.goal|Hoy: {n} / {goal} XP|Heute: {n} / {goal} XP|Aujourd’hui : {n} / {goal} XP|Oggi: {n} / {goal} XP|Hoje: {n} / {goal} XP|Vandaag: {n} / {goal} XP
today.reminderSettings|Ajustes|Einstellungen|Réglages|Impostazioni|Configurações|Instellingen
today.notifications|Notificaciones|Benachrichtigungen|Notifications|Notifiche|Notificações|Meldingen
hearts.title|Tus vidas|Deine Herzen|Tes vies|Le tue vite|Suas vidas|Je levens
hearts.count|Vidas: {n}|Herzen: {n}|Vies : {n}|Vite: {n}|Vidas: {n}|Levens: {n}
hearts.unlimited|Vidas ilimitadas|Unbegrenzte Herzen|Vies illimitées|Vite illimitate|Vidas ilimitadas|Onbeperkte levens
hearts.empty|Es hora de repasar un poco|Zeit für eine kleine Wiederholung|C’est le moment de réviser|È ora di ripassare un po’|Hora de revisar um pouco|Tijd om even te herhalen
hearts.practice|Practicar para ganar una vida|Üben und ein Herz verdienen|S’entraîner pour gagner une vie|Esercitati per ottenere una vita|Praticar para ganhar uma vida|Oefen om een leven te verdienen
hearts.next|Próxima vida en {time}|Nächstes Herz in {time}|Prochaine vie dans {time}|Prossima vita tra {time}|Próxima vida em {time}|Volgend leven over {time}
hearts.review|Repasar seis palabras|Sechs Wörter wiederholen|Réviser six mots|Ripassa sei parole|Revisar seis palavras|Zes woorden herhalen
bites.quit|Salir de la minilección|Lerneinheit verlassen|Quitter la mini-leçon|Esci dalla mini lezione|Sair da lição curta|Korte les verlaten
bites.quitConfirm|Salir|Verlassen|Quitter|Esci|Sair|Verlaten
bites.keepGoing|Seguir aprendiendo|Weiterlernen|Continuer à apprendre|Continua a imparare|Continuar aprendendo|Verder leren
bites.cantSpeak|No puedo hablar ahora|Ich kann gerade nicht sprechen|Je ne peux pas parler maintenant|Non posso parlare adesso|Não posso falar agora|Ik kan nu niet praten
bites.doneTitle|¡Minilección completada!|Lerneinheit abgeschlossen!|Mini-leçon terminée !|Mini lezione completata!|Lição curta concluída!|Korte les afgerond!
bites.accuracy|Precisión|Genauigkeit|Précision|Precisione|Precisão|Nauwkeurigheid
bites.time|Tiempo|Zeit|Durée|Tempo|Tempo|Tijd
bites.backToPath|Volver a la ruta de aprendizaje|Zurück zum Lernpfad|Retour au parcours|Torna al percorso|Voltar ao percurso|Terug naar je leerpad
bites.share|Compartir|Teilen|Partager|Condividi|Compartilhar|Delen
path.title|Tu ruta de aprendizaje|Dein Lernpfad|Ton parcours|Il tuo percorso|Seu percurso de aprendizagem|Je leerpad
path.allLessons|Todas las lecciones|Alle Lektionen|Toutes les leçons|Tutte le lezioni|Todas as lições|Alle lessen
path.unit|Unidad {n}|Einheit {n}|Unité {n}|Unità {n}|Unidade {n}|Onderdeel {n}
path.unitDone|¡Unidad completada!|Einheit abgeschlossen!|Unité terminée !|Unità completata!|Unidade concluída!|Onderdeel afgerond!
path.jump|¿Saltar aquí?|Hierhin springen?|Passer ici ?|Vuoi passare qui?|Pular para cá?|Hiernaartoe springen?
`;
const reviewed = new Map();
for (const row of rows.trim().split('\n')) {
  const [key, ...values] = row.split('|');
  if (values.length !== 6 || !en[key]) throw new Error(`Invalid review row ${key}`);
  reviewed.set(en[key], values);
}
for (const [index, lang] of ['es', 'de', 'fr', 'it', 'pt', 'nl'].entries()) {
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

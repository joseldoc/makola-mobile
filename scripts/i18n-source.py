# Source of the interface texts, one entry per key: (English, French).
# Generates src/i18n/en.json and src/i18n/fr.json — both always hold the same keys.
#   python3 scripts/i18n-source.py
# Voice (@makola content rules): plain and factual, "you" ("vous"), never playful,
# never "we"; a message always says what the user can do and states the limits.
#
# Typography (text review of 7 November 2026):
# - English: British spelling (recognised, revise), like the en-GB dates and
#   Kenya; sentence case; curly quotes around a quoted value; no contractions.
# - French: guillemets « » ; a non-breaking space (U+00A0) before : ; ? ! and
#   inside « » — added by `fr_typography()` when the JSON is written, so the
#   source keeps ordinary spaces and the rule cannot be forgotten; « n° 3 » ;
#   hours « 19:00 », as in the design system mock-ups.
# - Both: straight apostrophe ('), as in the design system and in the data typed
#   by teachers (N'GUESSAN) — never the curly one; figures for counts
#   ("6 digits", « 6 chiffres »); a non-breaking space written as \u00a0 between
#   a number and its unit ("45 s", "2 min") or a symbol ("2 / 6").
#
# Glossary (en / fr) — one object, one name, everywhere:
#   teacher / professeur (never « enseignant ») · student / élève · parent / parent
#   school / établissement (never « école ») · class / classe · subject / matière
#   assignment / devoir · test / contrôle (an announced test) · grade / note
#   scale / barème · coefficient, "coef 2" / coefficient, « coef 2 »
#   average / moyenne · class average / moyenne de la classe · rank / rang
#   pass mark / moyenne de passage · term / trimestre · closing / clôture
#   report card / bulletin · grade entry, enter / saisie, saisir · feed / fil
#   alert / alerte · link / rattachement · invitation code / code d'invitation
#   consent / consentement · space / espace · calling code / indicatif
#   school management / direction · offline / hors ligne · network / réseau
import json, os, re

T = {
  "common": {
    "back": ("Back", "Retour"),
    "close": ("Close", "Fermer"),
    "clear": ("Clear", "Effacer"),
    "continue": ("Continue", "Continuer"),
    "search": ("Search", "Rechercher"),
    "signOut": ("Sign out", "Se déconnecter"),
    # Non-breaking space: the number never wraps away from its word ("Term / 2"),
    # e.g. in an app-bar subtitle narrowed by a third action (ID-02).
    "term": ("Term\u00a0{{n}}", "Trimestre\u00a0{{n}}"),
  },
  "language": {"label": ("Language", "Langue")},
  # App-bar action towards the account's other space (ID-02), shown only when it holds both roles.
  "spaces": {
    "teacher": ("Teacher space", "Espace professeur"),
    "parent": ("Parent space", "Espace parent"),
  },
  "network": {
    "offline": ("Offline · you can keep entering grades; they will be sent when the network is back.",
                "Hors ligne · la saisie fonctionne ; les notes partiront au retour du réseau."),
    "offlinePending": ("Offline · entries waiting to be sent: {{count}}. You can keep entering grades.",
                       "Hors ligne · saisies en attente d'envoi : {{count}}. Vous pouvez continuer la saisie."),
    "synced": ("Everything is synced.", "Tout est synchronisé."),
  },
  "keypad": {
    "absent": ("Absent", "Absent"),
    "ungraded": ("Not graded", "Non noté"),
    "backspace": ("Erase", "Effacer"),
  },
  "progressDots": {"position": ("{{current}} of {{total}}", "{{current}} sur {{total}}")},
  "countries": {
    "CG": ("Republic of the Congo", "République du Congo"),
    "KE": ("Kenya", "Kenya"),
  },
  "subjects": {
    "maths": ("Mathematics", "Mathématiques"),
    "physics": ("Physics and chemistry", "Physique-chimie"),
    "biology": ("Life and Earth sciences", "Sciences de la vie et de la Terre"),
    "french": ("French", "Français"),
    "english": ("English", "Anglais"),
    "history": ("History and geography", "Histoire-géographie"),
    "philosophy": ("Philosophy", "Philosophie"),
    "sport": ("Physical education", "Éducation physique et sportive"),
  },
  "levels": {
    "primary": ("Primary", "Primaire"),
    # British / international terms (ISCED), not the American "middle / high school".
    "middle": ("Lower secondary", "Collège"),
    "high": ("Upper secondary", "Lycée"),
    "university": ("University", "Université"),
    "terms": ("Terms", "Trimestres"),
    "semesters": ("Semesters", "Semestres"),
  },
  "onboarding": {
    "screen": ("screen", "écran"),
    "skip": ("Skip", "Passer"),
    "next": ("Next", "Suivant"),
    "start": ("Get started", "Commencer"),
    "dotsLabel": ("Onboarding screens", "Écrans de présentation"),
    "slides": {
      "classrooms": {
        "kicker": ("The teacher's gradebook", "Le carnet de notes du professeur"),
        "title": ("Your classes, sorted by school", "Vos classes, rangées par établissement"),
        # The grade entry screen does not show the school: the text says where it is shown.
        "text": ("Each class belongs to a school, named at the top of the class screen: two schools never get mixed up.",
                 "Chaque classe appartient à un établissement, dont le nom figure en tête de l'écran de la classe : deux établissements ne se mélangent jamais."),
      },
      "offline": {
        "kicker": ("Offline", "Hors ligne"),
        "title": ("Grade entry carries on without a network", "La saisie continue sans réseau"),
        "text": ("Grades are saved on the phone and sent when the network is back. A banner always tells you how many entries are waiting.",
                 "Les notes sont enregistrées sur le téléphone et partent au retour du réseau. Un bandeau vous dit toujours combien de saisies attendent."),
      },
      "parents": {
        "kicker": ("Parents", "Parents"),
        "title": ("Each parent follows their child", "Chaque parent suit son enfant"),
        # RM-12 (SMS by default, email by choice) and A-19 (the inviting teacher's subject only).
        "text": ("You invite a parent with a 6-digit code, sent by SMS or email. They see their child's grades in your subject, never those of other students.",
                 "Vous invitez un parent par un code à 6\u00a0chiffres, envoyé par SMS ou par email. Il voit les notes de son enfant dans votre matière, jamais celles des autres élèves."),
      },
      "reportCards": {
        "kicker": ("Report cards", "Bulletins"),
        # RM-11 / US-P09 as amended on 7 November 2026: the class average per subject
        # appears on the report card; the rank never does — the slide states that limit.
        "title": ("Averages, never a rank", "Des moyennes, jamais de rang"),
        "text": ("Report cards show the student's averages and, for each subject, the class average — never a rank. Submitting them to the school management stays your decision.",
                 "Les bulletins portent les moyennes de l'élève et, par matière, la moyenne de la classe — jamais de rang. Leur transmission à la direction reste votre décision."),
      },
    },
  },
  "auth": {
    "errors": {
      "unknown-account": ("No account uses {{identifier}}. Check it or create an account.",
                          "Aucun compte n'utilise {{identifier}}. Vérifiez la saisie ou créez un compte."),
      "existing-account": ("An account already uses {{identifier}}. Sign in with it instead.",
                           "Un compte utilise déjà {{identifier}}. Connectez-vous plutôt."),
      "wrong-code": ("This code does not match the one sent. Check the message or ask for a new code.",
                     "Ce code ne correspond pas à celui envoyé. Vérifiez le message ou demandez un nouveau code."),
      # The invitation may come by SMS or by email (RM-12): "the message", not "the SMS".
      "unknown-invitation": ("This code matches no current invitation. Check the message you received or ask the teacher for a new code.",
                             "Ce code ne correspond à aucune invitation en cours. Vérifiez le message reçu ou demandez un nouveau code au professeur."),
      "offline": ("Offline · sending and checking the code need the network. Try again when it is back.",
                  "Hors ligne · l'envoi et la vérification du code demandent le réseau. Réessayez à son retour."),
      "invitation-declined": ("No link was made. Ask the teacher to check the student concerned, then enter the new code.",
                              "Aucun rattachement n'a été fait. Demandez au professeur de vérifier l'élève concerné, puis saisissez le nouveau code."),
      # Kenyan parental consents (RI-20) — see the warning above `auth.consents`.
      "parental-consent-required": ("A consent required for this invitation is missing. Go back, continue again and tick each box shown.",
                                    "Il manque un consentement demandé pour cette invitation. Revenez en arrière, continuez de nouveau et cochez chaque case affichée."),
      "consents-declined": ("No link was made: without the consents requested, your child cannot be followed in @makola. If you change your mind, enter the code again before it expires.",
                            "Aucun rattachement n'a été fait : sans les consentements demandés, votre enfant ne peut pas être suivi dans @makola. Si vous changez d'avis, saisissez de nouveau le code avant son échéance."),
      "unexpected": ("The server did not answer. Try again in a moment.", "Le serveur n'a pas répondu. Réessayez dans un instant."),
    },
    "phone": {
      "label": ("Phone", "Téléphone"),
      "changeCountry": ("Calling code +{{code}}, {{country}}. Change country", "Indicatif +{{code}}, {{country}}. Changer de pays"),
    },
    "country": {
      "title": ("Calling code", "Indicatif du pays"),
      "text": ("It sets your country: you will not be asked for it again.", "Il détermine votre pays : il ne vous sera plus demandé."),
      "digits": ("+{{code}} · {{length}}\u00a0digits after the calling code", "+{{code}} · {{length}}\u00a0chiffres après l'indicatif"),
    },
    "welcome": {
      "promise": ("Your students' grades, entered and kept on your phone — with or without a network.",
                  "Les notes de vos élèves, saisies et gardées sur votre téléphone — avec ou sans réseau."),
      "signUp": ("Create a teacher account", "Créer un compte professeur"),
      "signIn": ("I already have an account", "J'ai déjà un compte"),
      "parent": ("Parent? Enter the code you received", "Parent d'élève ? Saisir le code reçu"),
    },
    "identifier": {
      "sign-up": {
        "phone": {
          "step": ("Account creation", "Création du compte"),
          "title": ("Create your account", "Créer votre compte"),
          "text": ("Your number is enough. A 6-digit code will be sent to you: no password to remember.",
                   "Votre numéro suffit. Un code à 6\u00a0chiffres vous sera envoyé : pas de mot de passe à retenir."),
        },
        "email": {
          "step": ("Account creation", "Création du compte"),
          "title": ("Create your account", "Créer votre compte"),
          "text": ("Your address is enough. A 6-digit code will be sent to you: no password to remember.",
                   "Votre adresse suffit. Un code à 6\u00a0chiffres vous sera envoyé : pas de mot de passe à retenir."),
        },
      },
      "sign-in": {
        "phone": {
          "step": ("", ""),
          "title": ("Your number", "Votre numéro"),
          "text": ("A 6-digit code will be sent to you: no password to remember.",
                   "Un code à 6\u00a0chiffres vous sera envoyé : pas de mot de passe à retenir."),
        },
        "email": {
          "step": ("", ""),
          "title": ("Your email address", "Votre adresse email"),
          "text": ("A 6-digit code will be sent to you: no password to remember.",
                   "Un code à 6\u00a0chiffres vous sera envoyé : pas de mot de passe à retenir."),
        },
      },
      "invitation": {
        "phone": {
          "step": ("Step 2 of 3 · Parent account", "Étape 2 sur 3 · Compte parent"),
          "title": ("Your number", "Votre numéro"),
          "text": ("It is used to sign in and to receive alerts. A confirmation code will be sent to you.",
                   "Il sert à vous connecter et à recevoir les alertes. Un code de confirmation vous sera envoyé."),
        },
        "email": {
          "step": ("Step 2 of 3 · Parent account", "Étape 2 sur 3 · Compte parent"),
          "title": ("Your email address", "Votre adresse email"),
          "text": ("It is used to sign in. A confirmation code will be sent to you.",
                   "Elle sert à vous connecter. Un code de confirmation vous sera envoyé."),
        },
      },
      "phoneRequired": ("Enter your number on the keypad.", "Saisissez votre numéro sur le pavé."),
      "phoneFormat": ("A mobile number (+{{code}}) starts with {{prefixes}}. Erase and correct it or change the calling code.",
                      "Un numéro mobile (+{{code}}) commence par {{prefixes}}. Effacez et corrigez ou changez d'indicatif."),
      "phoneComplete": ("Number complete. The code will be sent by SMS.", "Numéro complet. Le code partira par SMS."),
      "phoneProgress": ("{{total}}\u00a0digits after the calling code · {{count}} of {{total}}.",
                        "{{total}}\u00a0chiffres après l'indicatif · {{count}} sur {{total}}."),
      "emailRequired": ("Enter your address to receive the code.", "Saisissez votre adresse pour recevoir le code."),
      "emailFormat": ("Part of the address is missing: it looks like firstname.lastname@example.com.",
                      "Il manque une partie de l'adresse : elle prend la forme prenom.nom@exemple.cg."),
      "emailLabel": ("Email address", "Adresse email"),
      "emailHint": ("The code will be sent by email.", "Le code partira par email."),
      "emailPlaceholder": ("firstname.lastname@example.com", "prenom.nom@exemple.cg"),
      "sending": ("Sending the code…", "Envoi du code…"),
      "checkingInvitation": ("Checking the invitation…", "Vérification de l'invitation…"),
      "missingPhone": ("Enter your number", "Saisissez votre numéro"),
      "digitsLeft": ("Digits left: {{count}}", "Chiffres restants : {{count}}"),
      "fixPhone": ("Correct your number", "Corrigez votre numéro"),
      "missingEmail": ("Enter your address", "Saisissez votre adresse"),
      "fixEmail": ("Correct your address", "Corrigez votre adresse"),
      "getCode": ("Get the code", "Recevoir le code"),
      "useEmail": ("Use an email address", "Utiliser une adresse email"),
      "usePhone": ("Use a phone number", "Utiliser un numéro de téléphone"),
    },
    "code": {
      "step": {
        "sign-up": ("Account creation", "Création du compte"),
        "sign-in": ("", ""),
        "invitation": ("Step 3 of 3 · Parent account", "Étape 3 sur 3 · Compte parent"),
      },
      # « à » and not « au »: the identifier may be an email address.
      "sentTo": ("Sent to {{identifier}}. It expires in 10\u00a0minutes.", "Envoyé à {{identifier}}. Il expire dans 10\u00a0minutes."),
      "titleSms": ("Code received by SMS", "Code reçu par SMS"),
      "titleEmail": ("Code received by email", "Code reçu par email"),
      "checking": ("Checking the code…", "Vérification du code…"),
      "missing": ("Enter the code you received", "Saisissez le code reçu"),
      # No plural in Transloco: the count comes after a label (« 1 chiffres » never appears).
      "progress": ("Digits entered: {{count}} of {{total}}.", "Chiffres saisis : {{count}} sur {{total}}."),
      "resendIn": ("Nothing received? You can ask for a new code in {{seconds}}\u00a0s.",
                   "Rien reçu ? Vous pourrez demander un nouveau code dans {{seconds}}\u00a0s."),
      "nothingReceived": ("Nothing received?", "Rien reçu ?"),
      "resend": ("Resend the code", "Renvoyer le code"),
      # Not "Enter": in English that is the verb of typing a code or a grade.
      "enter": ("Open @makola", "Entrer dans @makola"),
      "changePhone": ("Change number", "Changer de numéro"),
      "changeEmail": ("Change address", "Changer d'adresse"),
    },
    "invitation": {
      "step": ("Step 1 of 3 · Parent account", "Étape 1 sur 3 · Compte parent"),
      "title": ("Invitation code", "Code d'invitation"),
      "text": ("The 6-digit code sent by your child's teacher, by SMS or email.",
               "Le code à 6\u00a0chiffres envoyé par le professeur de votre enfant, par SMS ou par email."),
      "searching": ("Looking for the invitation…", "Recherche de l'invitation…"),
      "validity": ("The code is valid for 7\u00a0days and works only once.", "Le code est valable 7\u00a0jours et ne sert qu'une fois."),
      "seeStudent": ("See the student", "Voir l'élève concerné"),
    },
    "child": {
      "title": ("Your child", "Votre enfant"),
      "subtitle": ("Step 1 of 3 · Check", "Étape 1 sur 3 · Vérification"),
      "intro": ("Check before continuing: this code links your account to a single student.",
                "Vérifiez avant de continuer : ce code rattache votre compte à un seul élève."),
      "linkedStudent": ("Linked student", "Élève rattaché"),
      "invitedBy": ("Invited by {{teacher}} · {{subject}}", "Invitation de {{teacher}} · {{subject}}"),
      # A-19: only the subject of the teacher who invites — the screen states that limit.
      "youWillSee": ("You will see {{name}}'s grades, announced tests and report cards in {{subject}}.",
                     "Vous verrez les notes, les contrôles annoncés et les bulletins de {{name}} en {{subject}}."),
      "neverOthers": ("Never the grades of other students.", "Jamais les notes des autres élèves."),
      "confirm": ("Yes, this is {{name}}", "Oui, c'est {{name}}"),
      "decline": ("This is not my child", "Ce n'est pas mon enfant"),
    },
    # Kenyan parental consents (RI-20, DPA Kenya). NOT VALIDATED LEGAL TEXTS:
    # ID-10 (hosting in the EU) and ID-13 (pseudonymised grades until consent) are
    # acted "subject to a formal legal opinion". Plain wording on purpose — no
    # article number, no document version, nothing presented as the official
    # text. To be reviewed by counsel before opening in Kenya. Kenya is named
    # because it is the only country whose `country_config` asks for these
    # consents: a new country asking for them means revisiting these sentences.
    # English and French only at the MVP (ID-11): no Kiswahili.
    "consents": {
      "title": ("Your consent", "Votre consentement"),
      "subtitle": ("Step 2 of 3 · Consent", "Étape 2 sur 3 · Consentement"),
      "intro": ("Before the code is sent, @makola asks for your consent on each point below. Every box must be ticked to follow {{name}}.",
                "Avant l'envoi du code, @makola vous demande votre consentement sur chaque point ci-dessous. Chaque case doit être cochée pour suivre {{name}}."),
      "group": ("Consents requested", "Consentements demandés"),
      "documents": {
        "CHILD_DATA": {
          "title": ("{{name}}'s school data", "Données scolaires de {{name}}"),
          "text": ("You agree that @makola processes {{name}}'s school data: name, class, grades, announced tests and report cards.",
                   "Vous acceptez que @makola traite les données scolaires de {{name}} : nom, classe, notes, contrôles annoncés et bulletins."),
        },
        "CROSS_BORDER_TRANSFER": {
          "title": ("Storage outside Kenya", "Hébergement hors du Kenya"),
          "text": ("You agree that your link with {{name}}, and {{name}}'s school data, are stored in Europe, outside Kenya.",
                   "Vous acceptez que le lien qui vous rattache à {{name}}, et ses données scolaires, soient hébergés en Europe, hors du Kenya."),
        },
      },
      "withdrawal": ("You can withdraw each consent later: the link with {{name}} then ends, and you will no longer see their grades.",
                     "Vous pourrez retirer chaque consentement plus tard : le rattachement à {{name}} prend alors fin, et ses notes ne vous sont plus montrées."),
      "left": ("Boxes left to tick: {{count}}", "Cases restantes à cocher : {{count}}"),
      "decline": ("I do not consent", "Je ne consens pas"),
    },
    "alerts": {
      "title": ("Your alerts", "Vos alertes"),
      "subtitle": ("Can be changed at any time", "Modifiables à tout moment"),
      "intro": ("Choose what you receive by SMS about {{name}}.", "Choisissez ce que vous recevez par SMS au sujet de {{name}}."),
      "yourChild": ("your child", "votre enfant"),
      "noSms": ("No SMS: you will check the feed yourself.", "Aucun SMS : vous consulterez le fil vous-même."),
      "smsPerMonth": ("About {{count}} SMS a month with these settings.", "Environ {{count}} SMS par mois avec ces réglages."),
      "guarantee": ("Turning an alert off never removes access: the feed stays available.",
                    "Désactiver une alerte n'ôte jamais l'accès : le fil reste consultable."),
      "openFeed": ("Open {{name}}'s feed", "Ouvrir le fil de {{name}}"),
      "saving": ("Saving alerts…", "Enregistrement des alertes…"),
      "options": {
        "newGrade": {"label": ("New grade", "Nouvelle note"),
                     "detail": ("As soon as the teacher publishes a graded assignment.", "Dès que le professeur publie un devoir noté.")},
        "gradeBelowPass": {"label": ("Grade below 10", "Note en dessous de 10"),
                           # « moyenne de passage »: since RM-11 as amended, « la moyenne » alone
                           # could be read as the class average — never a comparison (RM-11).
                           "detail": ("Only when a grade falls below the pass mark.", "Seulement quand une note passe sous la moyenne de passage.")},
        "testAnnounced": {"label": ("Test announced", "Contrôle annoncé"),
                          "detail": ("With the chapters to revise.", "Avec les chapitres à réviser.")},
        "reportCardAvailable": {"label": ("Report card available", "Bulletin disponible"),
                                "detail": ("Once a term.", "Une fois par trimestre.")},
        "weeklySummary": {"label": ("Weekly summary", "Résumé hebdomadaire"),
                          "detail": ("One SMS every Sunday at 19:00.", "Un SMS chaque dimanche à 19:00.")},
      },
    },
    "profile": {
      "steps": {
        "identity": {"title": ("Who are you?", "Qui êtes-vous ?"),
                     "subtitle": ("Step 1 of 3 · Identity", "Étape 1 sur 3 · Identité"),
                     "intro": ("Your name as parents and schools will read it.", "Votre nom tel que les parents et les établissements le liront.")},
        "subjects": {"title": ("Your subjects", "Vos matières"),
                     "subtitle": ("Step 2 of 3 · Teaching", "Étape 2 sur 3 · Enseignement"),
                     "intro": ("What you teach, and at which level. You can add more later.",
                               "Ce que vous enseignez, et à quel niveau. Vous pourrez compléter plus tard.")},
        "city": {"title": ("Where do you teach?", "Où enseignez-vous ?"),
                 "subtitle": ("Step 3 of 3 · City", "Étape 3 sur 3 · Ville"),
                 "intro": ("Your city is enough: you will never be asked for your exact address.",
                           "Votre ville suffit : votre adresse exacte ne vous sera jamais demandée.")},
      },
      "lastName": ("Last name", "Nom de famille"),
      "firstName": ("First name", "Prénom"),
      "previewLabel": ("On class lists", "Sur les listes de classe"),
      "subjectsTitle": ("Subjects taught", "Matières enseignées"),
      "levelsTitle": ("Levels taught", "Niveaux enseignés"),
      "country": ("Country", "Pays"),
      "countryFromNumber": ("Deduced from your number {{number}}.", "Déduit de votre numéro {{number}}."),
      "city": ("City", "Ville"),
      "cityHint": ("Your city only, never your exact address.", "Votre ville seulement, jamais votre adresse exacte."),
      "frequentCities": ("Frequent cities", "Villes fréquentes"),
      "activate": ("Activate my account", "Activer mon compte"),
      "activating": ("Activating the account…", "Activation du compte…"),
      "errors": {
        "lastName": ("Enter your last name.", "Saisissez votre nom de famille."),
        "firstName": ("Enter your first name.", "Saisissez votre prénom."),
        "city": ("Enter the city where you teach.", "Indiquez la ville où vous enseignez."),
      },
      "missing": {
        "lastName": ("Enter your last name", "Saisissez votre nom de famille"),
        "firstName": ("Enter your first name", "Saisissez votre prénom"),
        "subjects": ("Choose at least one subject", "Choisissez au moins une matière"),
        "levels": ("Choose at least one level", "Choisissez au moins un niveau"),
        "city": ("Enter your city", "Indiquez votre ville"),
        "country": ("Choose your country", "Choisissez votre pays"),
      },
    },
  },
  "classroom": {
    "tabs": {
      "assignments": ("Assignments", "Devoirs"),
      "students": ("Students", "Élèves"),
      "reportCard": ("Report card", "Bulletin"),
    },
    "assignmentMeta": ("coef {{coefficient}} · /{{scale}} · {{date}}", "coef {{coefficient}} · /{{scale}} · {{date}}"),
    "classAverage": ("Class average", "Moyenne de la classe"),
    "termAverage": ("Term average", "Moyenne du trimestre"),
    "noMatch": ("No student is named “{{query}}”. Try a last name alone or clear the search.",
                "Aucun élève ne porte « {{query}} ». Essayez un nom de famille seul ou effacez la recherche."),
    # RM-11 / US-P09 as amended on 7 November 2026: what the report card shows, and the limit (no rank).
    # Term and closing date are data of the class (RM-14, A-20), formatted by the page.
    "reportCardNotice": ("The term {{term}} report card will be available once the term closes, on {{date}}. It will show, for each subject, the class average beside the student's, and no rank.",
                         "Le bulletin du trimestre {{term}} sera disponible après sa clôture, le {{date}}. Il portera, par matière, la moyenne de la classe à côté de celle de l'élève, et aucun rang."),
    "searchPlaceholder": ("Student name", "Nom d'élève"),
    "newAssignment": ("+ Assignment", "+ Devoir"),
  },
  "assignment": {
    "title": ("New assignment", "Nouveau devoir"),
    "titleLabel": ("Assignment title", "Intitulé du devoir"),
    "titlePlaceholder": ("Test 3", "Contrôle n°\u00a03"),
    "titleErrors": {
      "empty": ("Give it a title: it is what students and parents will see.", "Donnez un intitulé : c'est ce que verront les élèves et les parents."),
      # A refusal says what to do: the minimum (RM-13, 3 to 60 characters).
      "tooShort": ("Too short to be recognised in the list of assignments: 3\u00a0characters minimum.",
                   "Trop court pour être reconnaissable dans la liste des devoirs : 3\u00a0caractères minimum."),
      "duplicate": ("“{{title}}” already exists in this class this term. Change the number or the date.",
                    "« {{title}} » existe déjà dans cette classe ce trimestre. Changez le numéro ou la date."),
      "tooLong": ("{{max}}\u00a0characters maximum: beyond that, the title is cut off on the report card.",
                  "{{max}}\u00a0caractères maximum : au-delà, l'intitulé est coupé sur le bulletin."),
      "long": ("Long for a report card: readable, but tight.", "Long pour un bulletin : il sera lisible, mais serré."),
    },
    "scale": ("Scale", "Barème"),
    "coefficient": {
      "decrease": ("Decrease the coefficient", "Diminuer le coefficient"),
      "increase": ("Increase the coefficient", "Augmenter le coefficient"),
      "max": ("Maximum coefficient. Beyond it, a single assignment would decide the average.",
              "Coefficient maximal. Au-delà, un seul devoir déciderait de la moyenne."),
      "base": ("Counts like a standard assignment.", "Compte comme un devoir ordinaire."),
      "weight": ("Weighs {{count}} times as much as a coefficient 1 assignment.", "Pèse {{count}} fois plus qu'un devoir de coefficient 1."),
    },
    "dateLabel": ("Assignment date", "Date du devoir"),
    "changeDate": ("Change", "Changer"),
    "create": ("Create and enter grades", "Créer et saisir les notes"),
    "fixField": ("Correct the flagged field", "Corrigez le champ signalé"),
    "date": {
      "today": ("Today · {{date}}", "Aujourd'hui · {{date}}"),
      "inTerm": ("In term {{term}}, which runs until {{end}}.", "Dans le trimestre {{term}}, en cours jusqu'au {{end}}."),
      "afterClose": ("After term {{term}} closes: this assignment will count for term {{next}}.",
                     "Après la clôture du trimestre {{term}} : ce devoir comptera pour le trimestre {{next}}."),
      "closed": ("Term {{term}} is closed. Choose a date after {{after}}.", "Le trimestre {{term}} est clôturé. Choisissez une date après le {{after}}."),
    },
  },
  "gradeEntry": {
    "progress": ("{{count}}\u00a0/\u00a0{{total}} entered", "{{count}}\u00a0/\u00a0{{total}} saisis"),
    # App-bar subtitle: class, scale, coefficient, progress (US-P06) — was built in TypeScript.
    "subtitle": ("{{classroom}} · /{{scale}} · coef\u00a0{{coefficient}} · {{progress}}",
                 "{{classroom}} · /{{scale}} · coef\u00a0{{coefficient}} · {{progress}}"),
    "inProgress": ("Being entered", "En cours de saisie"),
    "nextStudent": ("Next student", "Élève suivant"),
  },
  "parentFeed": {
    "switchChild": ("Switch child", "Changer d'enfant"),
    "subjectAverage": ("Average · {{subject}}", "Moyenne · {{subject}}"),
    # Term card: a fact of the term (its closing, RM-14), never a judgement of the child —
    # « en progression » in green, with an arrow, rewarded the student (removed on 7 November 2026).
    "termCloses": ("Closes on {{date}}", "Clôture le {{date}}"),
    "weeklySummary": ("Weekly summary", "Résumé hebdomadaire"),
    "weeklySummaryOn": ("One SMS every Sunday at 19:00.", "Un SMS chaque dimanche à 19:00."),
    "weeklySummaryOff": ("Off — the feed stays available.", "Désactivé — le fil reste consultable."),
    # Twin buttons of the footer: « Toutes les notes » was cut at 360 dp (126 px for 134).
    "allGrades": ("Grades", "Notes"),
    "reportCards": ("Report cards", "Bulletins"),
    "reportCardMeta": ("Term {{term}} · {{subject}}", "Trimestre {{term}} · {{subject}}"),
    # Non-breaking spaces: the label and its value wrap as one block, never "Class / average 12.4".
    "classAverage": ("Class\u00a0average\u00a0{{value}}", "Moyenne\u00a0de\u00a0la\u00a0classe\u00a0{{value}}"),
    # Subject card (RM-11, 7 November 2026): ordinary spaces on purpose. The card is half
    # the width at 360 dp; unbreakable, the French line (159 px) would widen it and squeeze
    # the term card beside it. Here it wraps before the number, which never splits.
    "classSubjectAverage": ("Class average {{value}}", "Moyenne de la classe {{value}}"),
    "types": {
      "newGrade": ("New grade", "Nouvelle note"),
      "gradeBelowPass": ("Grade below 10", "Note en dessous de 10"),
      "testAnnounced": ("Test announced", "Contrôle annoncé"),
      "reportCard": ("Report card available", "Bulletin disponible"),
    },
    "when": {
      "minutesAgo": ("{{count}}\u00a0min ago", "il y a {{count}}\u00a0min"),
      "yesterdayAt": ("yesterday, {{time}}", "hier, {{time}}"),
    },
  },
}

def fr_typography(text):
    """Non-breaking space before : ; ? ! and inside « » — never a line starting with them."""
    text = re.sub(r' ([:;?!»])', '\u00a0\\1', text)
    return text.replace('« ', '«\u00a0')

def pick(node, i):
    finish = fr_typography if i == 1 else (lambda t: t)
    return {k: (finish(v[i]) if isinstance(v, tuple) else pick(v, i)) for k, v in node.items()}

root = os.path.join(os.path.dirname(__file__), '..', 'src', 'i18n')
for i, lang in enumerate(['en', 'fr']):
    with open(os.path.join(root, f'{lang}.json'), 'w', encoding='utf-8') as f:
        json.dump(pick(T, i), f, ensure_ascii=False, indent=2)
        f.write('\n')
print('written')

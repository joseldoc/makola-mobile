# @makola — Système de conception

Système de conception de **@makola**, application mobile de suivi scolaire pour
le marché congolais (Brazzaville). Il est **extrait d'une maquette réelle**, pas
inventé : chaque valeur a été relevée sur les écrans livrés.

Ce document est une copie de référence, tirée du projet
[claude.ai/design "@makola Design System"](https://claude.ai/design), pour
guider l'intégration des écrans **Angular / Ionic** dans ce dépôt. Les jetons
CSS vivent dans `src/theme/tokens/*.scss` (importés depuis `src/styles.scss`)
et l'inventaire d'icônes dans `src/theme/icons.ts`. Le système sur claude.ai/design
reste construit en React (composants de démonstration) — **il ne s'implémente
pas tel quel ici** ; ce dépôt devient la source de vérité au fur et à mesure que
les écrans Angular/Ionic sont écrits, et ce document devra être confronté aux
écrans réels quand ils existeront.

## Le produit

@makola est un **carnet de notes pour le professeur**, doublé d'un fil de lecture
pour le parent et d'un tableau de transmission pour la direction. Quatre rôles :

| Rôle | Ce qu'il fait | Teinte |
|---|---|---|
| **Enseignant** | Saisit les notes, annonce les contrôles, produit et dépose les bulletins | Vert dilué `#D8EBE0` |
| **Parent** | Lit les notes de son enfant, règle ses alertes | Ambre dilué `#F7E7CE` |
| **Promoteur / direction** | Constate les dépôts, relance, atteste — ne saisit rien | Bleu dilué `#DCE4FA` |
| **Administrateur** | Rattache les classes et les enseignants | Neutre `#E9ECF2` |

Contraintes réelles qui façonnent tout le système : **terminaux d'entrée de gamme**,
**réseau intermittent**, saisie **debout, en fin de cours**, parents joignables
**par SMS** avant que par email.

## Les règles qu'on ne peut pas casser

Elles viennent du cahier des charges, pas du goût. Un composant peut changer ;
celles-ci, non.

1. **Ni moyenne de classe, ni rang** — pour aucun acteur (RM-11). Le rang est le
   principal vecteur de pression sur l'élève et de conflit avec le parent.
2. **« Absent » et « non noté » ne sont pas des zéros** (RM-15) — ils n'entrent
   pas dans la moyenne et se distinguent sur le bulletin.
3. **Le hors-ligne informe, ne bloque jamais** — la saisie fonctionne sans réseau,
   et le bandeau le dit.
4. **Un champ que l'utilisateur peut légitimement remplir est saisissable** —
   `disabled` seulement quand une règle de gestion l'impose.
5. **Un bouton indisponible dit ce qui manque** — jamais un « Valider » grisé.
6. **Coefficient borné à 1–9, barèmes /20, /10, /5** (RM-13). À la borne, le
   bouton reste tapable et le message explique.
7. **Une période clôturée ne se rouvre pas par une saisie** (RM-14).
8. **La direction ne voit jamais une note** — elle constate le dépôt, relance,
   atteste (RM-01).
9. **Le parent ne voit que son enfant** — jamais les notes des autres élèves.
10. **Désactiver une alerte n'ôte jamais l'accès à la donnée** (RM-16).

## Contenu et ton

Le produit parle **français**, à un enseignant adulte pressé. La voix est **sobre,
factuelle, jamais familière** — et surtout jamais enjouée : on annonce des notes
d'enfants, ce n'est pas un jeu.

- **Personne** : on dit **vous** au lecteur, jamais « tu », jamais « nous ». Pas de
  « Nous avons envoyé votre code », mais « Le code partira par SMS ».
- **Casse** : phrase normale partout. Majuscules réservées aux boutons M2
  (500 · 14 · +0,4 px) et aux noms de famille dans les listes (« ILUNGA Marie »).
- **Nombres** : virgule décimale française (**16,75**, jamais 16.75), toujours en
  chiffres tabulaires (`--mk-num: tabular-nums`). Les périodes sont des **trimestres**.
- **Emoji : jamais.** Aucun, nulle part.

Ce qu'on ne dit jamais, et à la place :

| Interdit | À la place |
|---|---|
| « Champ invalide », « Erreur de saisie » | « *« Contrôle n°2 » existe déjà dans cette classe ce trimestre. Changez le numéro ou la date.* » |
| « Valider » grisé | « *Corrigez le champ signalé* » — le bouton dit ce qui manque |
| « Aucun résultat » | « *Aucun élève ne porte « Mari ». Essayez un nom de famille seul.* » |
| « Bien noté », « Excellent » | rien — une couleur ne récompense pas un élève |
| « Oups », « Aïe », « C'est parti ! » | rien — le produit n'a pas d'humeur |

Le message **dit toujours ce qu'on peut faire**, et **énonce les limites du
produit au lieu de les cacher**.

## Fondations visuelles

**Couleur.** Six couleurs de base, pas une de plus : encre `#101A2E`, bleu
primaire `#1B4FD8`, vert `#1E7A46`, ambre `#9A5A0B`, rouge `#C8341F`,
marge `#EEF1F5`. Les quatre surfaces de rôle sont des dilutions de ces mêmes
hexadécimaux et **ne portent jamais de texte**. Le sens est fixe : le vert dit
*transmis*, jamais *bon* ; l'ambre dit *en attente*, jamais *une faute*. Trois
opacités de texte seulement : 100 %, 62 %, 45 % (la dernière réservée aux
valeurs de 24 sp et plus).

**Typographie.** Roboto seule, cinq tailles (22 / 16 / 16-500 / 30-600 / 13),
plancher absolu à 12 px. Titre d'écran en 400, jamais en gras. Toute valeur
numérique en chiffres tabulaires.

**Fond, formes, imagerie.** Fond blanc ; les listes alternent `#FFFFFF` /
`#FBFCFD`. Écrans d'entrée : bandeau tonal M3 (aplat de la teinte du rôle,
coins bas arrondis à 32 dp, deux formes rondes de la teinte foncée qui débordent
du cadre). **Jamais de dégradé.** **Aucune illustration, aucune photographie,
aucune image** — la donnée est le contenu.

**Rayons.** Cinq valeurs, une intention chacune : **4** ce qui se remplit
(champ, bouton M2) · **8** les encadrés · **16** les touches et feuilles
modales · **24** ce qui se tape en pleine largeur · **rond** les cibles
ponctuelles et pilules. Le bas d'un bandeau tonal est l'exception, à 32.

**Cartes et encadrés.** Pas de carte au sens habituel : pas d'ombre portée, pas
de coin arrondi flottant sur fond gris. Un groupe se délimite par un contour de
1 px (rayon 8) ou une ligne de séparation `#EEF1F5`. Seule ombre du système :
la barre d'app au défilement (`0 2px 8px rgba(16,26,46,.14)`).

**Transparence et flou.** Aucun flou, nulle part, aucun `backdrop-filter`.
Seule transparence : le voile d'une feuille modale (`rgba(16,26,46,.42)`) et
les opacités de texte.

**Mouvement.** Quatre durées, la plus courte est la plus importante :

| Quoi | Durée |
|---|---|
| Enfoncement de touche — échelle 0,93 + fond `#D3DCEF` | **70 ms** |
| Action de pied — échelle 0,98 | 70 ms |
| Contour, couleur (focus de champ) | 120 ms |
| Interrupteur, pastille de progression | 150 ms |
| Flash de confirmation d'une ligne | 420 ms |

Aucun rebond, aucun ressort, aucune entrée en fondu. L'enfoncement des touches
du pavé est le **seul retour tactile de la saisie** — ne jamais le retirer.

**États de pression.** Pas d'état de survol (application tactile). La touche
s'enfonce, le bouton M2 prend la teinte du rôle, la cible de barre d'app prend
un fond rond, l'action de pied s'assombrit légèrement. Jamais de changement
d'opacité seule.

**Mise en page.** Marge d'écran de 16 px (20 dans un bandeau). Barre d'app en
haut, une seule action de pied fixe en bas, la liste défile entre les deux.
Groupes de frères en flex/grid avec `gap` — jamais de marges individuelles.
Cible tactile de **44 dp minimum**, **48 dp** pour toute action de barre d'app.

**Mode sombre.** Une dérivation, pas un thème parallèle : mêmes composants,
mêmes mesures, mêmes règles, seules les valeurs changent
(`[data-mk-theme="sombre"]`, voir `src/theme/tokens/dark.scss`). L'encre
devient la surface (jamais de noir pur), les trois teintes de rôle
disparaissent au profit d'une élévation `#1B2740`, et le rouge est désaturé
(`#FF9E8E`).

## Iconographie

Ionicons, **style outline exclusivement** — aucune variante pleine, aucune
`-sharp`. Quinze noms, et c'est tout : voir `src/theme/icons.ts` (`ICONS`). Une
icône qui n'y figure pas est une décision à prendre, pas un détail
d'implémentation.

- Tailles : 22 dans une cible de barre d'app (cible à 48 dp), 18 dans un champ,
  16 en ligne de texte. L'icône hérite de `currentColor`.
- `label`/accessibilité seulement quand l'icône est seule et porteuse de sens
  (retour, recherche) ; sinon décorative et masquée aux lecteurs d'écran.
- Aucun glyphe Unicode, aucun emoji, nulle part.

Avec Ionic, une fois installé : `addIcons` (paquet `ionicons`) + `<ion-icon
name="...">`, alimenté par les noms de `ICONS`.

## Marque

@makola n'a pas de logo. Le nom est rendu **en type** : `@` dans la teinte de
rôle de l'écran, `makola` en encre, Roboto 24 px graisse 400. Mettre le nom en
type là où une marque irait ; ne pas dessiner de logo.

## Jetons — index

| Fichier (ce dépôt) | Contenu |
|---|---|
| `src/styles.scss` | Point d'entrée — importe les fichiers de jetons dans l'ordre du système source |
| `src/theme/tokens/colors.scss` | Base, surfaces de rôle, alias sémantiques |
| `src/theme/tokens/typography.scss` | Famille, cinq tailles, chiffres tabulaires |
| `src/theme/tokens/spacing.scss` | Échelle de 4 px, hauteurs relevées, cibles tactiles |
| `src/theme/tokens/radius.scss` | Les cinq rayons et leur intention |
| `src/theme/tokens/motion.scss` | Quatre durées, trois échelles de pression |
| `src/theme/tokens/dark.scss` | La dérivation sombre (`[data-mk-theme="sombre"]`) |
| `src/theme/tokens/fonts.scss` | Import Google Fonts (Roboto 400/500/600) |
| `src/theme/icons.ts` | Inventaire des 15 icônes Ionicons |

## Composants du système de référence

Le projet claude.ai/design contient 16 composants React de démonstration
(`FooterAction`, `OutlinedButton`, `MiniFab`, `TextField`, `SearchField`,
`Checkbox`, `RadioButton`, `Switch`, `Keypad`, `AppBar`, `Tabs`,
`ProgressDots`, `ListRow`, `TonalHeader`, `NetworkBanner`, `Icon`) et quatre
surfaces d'UI kit (classe, saisie, création de devoir, fil parent). Ce sont des
**recréations fidèles des mesures de la maquette**, pas des extraits d'une
implémentation — aucun code produit n'existe encore à confronter. Utilisez-les
comme référence de mesures/comportement en construisant les composants Angular
standalone de ce dépôt (voir `.claude/CLAUDE.md` pour la structure de
composants/containers/stores) ; ne les portez pas tels quels (React → Angular).

## Périmètre

Aucune surface hors MVP (carte, encadrement, marché de l'emploi, commission,
rôles élève/étudiant) n'existe dans ce système — ne pas les inventer.

---
Source : projet claude.ai/design **"@makola Design System"** (lecture au
2026-09-15). En cas d'écart entre ce document et le projet claude.ai/design,
c'est le projet claude.ai/design qui fait foi jusqu'à ce que les écrans Angular
de ce dépôt deviennent eux-mêmes la source de vérité.

# OnePiece - Attrape les Chapeaux de Paille !

Un jeu web dynamique inspiré de l'univers One Piece.

## Comment jouer

1. **Ouvrir** `index.html` dans un navigateur (Chrome, Firefox, Edge)
2. **Cliquer** sur "Commencer l'aventure !"
3. **Déplacer** le personnage avec les **flèches gauche/droite** du clavier
4. **Attraper 10 chapeaux de paille** qui tombent du ciel pour terminer l'étape
5. **Répondre au quiz** de traduction français → allemand (3 propositions)
6. Si la réponse est correcte, vous passez au niveau suivant avec une vitesse accrue !

## Règles

- Chaque niveau demande d'attraper **10 chapeaux**
- À chaque étape, la **vitesse augmente**
- Un **quiz de traduction** (français → allemand) est posé entre chaque étape
- 7 mots à traduire : livre, stylo, stylo plume, trousse, gomme, marqueur, taille-crayon
- Si la réponse est fausse, on peut réessayer

## Structure du projet

```
index.html   - Page principale du jeu
style.css    - Styles et mise en page
game.js      - Logique du jeu, dessin canvas, quiz
```

## Technologies

- HTML5 Canvas
- CSS3
- JavaScript vanilla (aucune dépendance externe)

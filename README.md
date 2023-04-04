
Voici le repo git de mon projet d'école, je l'ai copié car seulement les professeurs peuvent donner l'accès. J'ai écrit la majorité du code dans les fichiers suivants:
server\app\classes\
- game.ts
- limited-time-game.ts
- matchmaking.ts
- player.ts
 -socket-manager.ts
- waiting-room.ts

server\app\services\
- game-data.service.ts
- image-data.service.ts
- database.service.ts

À noter que je suis en train d'implémenter la fonction de connexion à une partie multijoueur cette semaine, donc il est impossible de se connecter pour le moment. Vous pourrez donc seulement juger la propreté du code.

# Commandes npm

Les commandes commençant par `npm` devront être exécutées dans les dossiers `client` et `server`. Les scripts non standard doivent être lancés en lançant `npm run myScript`.

## Installation des dépendances de l'application

1. Installer `npm`. `npm` vient avec `Node` que vous pouvez télécharger [ici](https://nodejs.org/en/download/)

2. Lancer `npm ci` (Continuous Integration) pour installer les versions exactes des dépendances du projet. Ceci est possiblement seulement si le fichier `package-lock.json` existe. Ce fichier vous est fourni dans le code de départ.

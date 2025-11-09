# HES-SO MScBA MSI - Projet EAD Zalaxus : Partie 4 Webapp 

## Objectif du projet


Cette webapp Angular permet d’obtenir une **prédiction d’achat de vélo** à partir des données client saisies.

L’application envoie ces informations à une **API** qui interroge directement le **modèle de machine learning hébergé sur Dataiku**.
Ce modèle, de type **Random Forest**, a été entraîné sur un jeu de données d’environ **9 000 enregistrements clients** issus du dataset *Customer*.

L’objectif est de **simuler la probabilité qu’un client achète un vélo** à partir de ses caractéristiques personnelles et socio-économiques.

La webapp :

* permet la saisie des variables du client (âge, genre, revenu, état civil, enfants, etc.) ;
* envoie les informations pertinentes à la prédiction à l’**API Dataiku** ;
* affiche la prédiction avec les infos suivantes :

  * `BikeBuyer = Oui / Non`
  * `Pourcentage` 
  * `AUC Score` 
* conserve chaque simulation localement pour un **historique des prédictions**.

## Fonctionnement métier

### 1. Saisie utilisateur

L’utilisateur remplit les **données** du formulair, notamment :

* Informations personnelles : *Langue, Titre, Prénom, Nom, Genre, Date de naissance, Taille*
* Statut familial : *État civil, Enfants, Enfants à la maison*
* Contact : *Email, Téléphone, Abonnement newsletter*
* Adresse : *Pays, NPA, Localité, Rue, Canton*
* Niveau d’éducation et profession
* Informations économiques : *Propriétaire logement, Revenu annuel, Nombre de voitures*

> Tous les champs du dataset `Customer` sont affichés dans le formulaire pour garder une cohérence avec le dataset d'origine.

---

### 2. Champs envoyés à l’API Dataiku

Seuls les champs **nécessaires à la prédiction** sont envoyés à l’API `PredictBikeBuyer` :

| Champ envoyé à l’API | Source du formulaire | Description                                           |
| -------------------- | -------------------- | ----------------------------------------------------- |
| **Occupation**       | Profession           | Type d’emploi                                         |
| **DivorcedFlag**     | Calcul automatique   | 1 si `Célibataire` + `Enfants > 0`, sinon 0           |
| **Country**          | Pays                 | Code pays                                             |
| **City**             | Localité             | Ville saisie                                          |
| **Gender**           | Genre                | M/F                                                   |
| **EducationLevel**   | Niveau d’éducation   | 1 à 5                                                 |
| **UrbanLevel**       | Calculé depuis CSV   | Niveau urbain de la ville (`assets/Town_Typlogy.csv`) |
| **Age**              | Calculé              | Dérivé de la date de naissance                        |

> Ces variables sont cohérentes avec le modèle ML *BikeBuyer* entraîné dans Dataiku.
> Les autres champs sont utiles pour la cohérence du formulaire mais ne sont pas transmis à l’API.

---

### 3. Réponse de l’API

L’API renvoie un objet JSON contenant :

* `prediction`: `true` ou `false`
* `probaPercentile`: le pourcentage de probabilité d’achat
* `probas AUC`: les probabilités détaillées pour chaque classe (`true` / `false`)

Ces valeurs sont affichées sous forme de badges dans l’interface :

* **BikeBuyer: Oui / Non**
* **Pourcentage ou probabilité**

---

### 4. Historique local

Chaque simulation est sauvegardée dans le navigateur (via **localStorage**) :

* Prénom
* Nom
* Email
* Résultat de la prédiction (`Oui / Non`)
* Pourcentage (`Percentile`)

Une section “Historique local” s’affiche sous le formulaire :

* Chaque ligne peut être supprimée avec le bouton corbeille
* Le bouton “Vider l’historique” efface toutes les prédictions

---

## Structure du projet

| Dossier / Fichier                       | Description                                  |
| --------------------------------------- | -------------------------------------------- |
| `src/app/features/registration-form.*`  | Composant principal du formulaire            |
| `src/app/features/submission-history.*` | Composant de l’historique local              |
| `src/app/services/api.service.ts`       | Appel API Dataiku                            |
| `src/app/services/geoadmin.service.ts`  | Recherche de localité via GeoAdmin           |
| `src/app/services/history.service.ts`   | Gestion de l’historique (localStorage)       |
| `src/assets/Town_Typlogy.csv`           | Fichier des communes avec leur niveau urbain |

---

## Lancement de la webapp

### 1. Installer les dépendances

```bash
npm install
```

### 2. Lancer le serveur

```bash
ng serve
```

> puis ouvrir [http://localhost:4200](http://localhost:4200)

### 3. Tester le prédicteur

* Remplis les champs du formulaire
* Clique sur **“Prédire l’achat de vélo”**
* Observe le résultat et l’ajout dans l’historique local

---

## Notes techniques

* **Angular 20 + Angular Material** pour l’UI
* **LocalStorage** pour persister l’historique
* **GeoAdmin API** pour autocompléter les villes suisses
* **CSV loader** (`Town_Typlogy.csv`) pour mapper les communes à leur `UrbanLevel`

---

## Exemple de réponse API Dataiku

```json
{
  "result": {
    "prediction": true,
    "probaPercentile": 78,
    "probas": {
      "false": 0.22,
      "true": 0.78
    }
  }
}
```

---
Projet pédagogique développé dans le cadre du module Exploration avancée des données et intelligence décisionnelle du Master MScBA en Management des Systèmes d’Information de la HES-SO.


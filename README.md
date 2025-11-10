# Webapp d’appel à l’API d’un modèle de prédiction Dataiku

Projet réalisé dans le cadre du **Master HES-SO MScBA en Management des Systèmes d’Information** —
**Cours : Exploration avancée des données – Projet EAD Zalaxus : Partie 4 Webapp**

## Objectif

La webapp développée en Angular permet d’obtenir une **prédiction d’achat de vélo** à partir des **données client saisies** dans un formulaire interactif.
Les informations sont envoyées à une **API sur la plateforme Dataiku** hébergeant un modèle **Random Forest** entraîné sur un dataset d’environ **9'600 enregistrements clients (ZalaxusCustomer)**.

L’objectif de cette webapp est de **simuler la probabilité qu’un client achète un vélo** selon les caractéristiques démographiques d'un nouveau client.


## Fonctionnement global

### 1. Saisie utilisateur

L’utilisateur remplit un formulaire complet reprenant les champs du dataset *ZalaxusCustomer* :

| Catégorie                   | Champs principaux                                            |
| --------------------------- | ------------------------------------------------------------ |
| **Profil**                  | Langue, Titre, Prénom, Nom, Genre, Date de naissance, Taille, Genre, Statut marital |
| **Contact**                 | Email, Téléphone, Abonnement newsletter                      |
| **Adresse**                 | Pays, Code postal, Localité, Rue, Canton                             |
| **Ménage et revenu**                 | Revenu annuel, propriétaire de son logement, nb d'enfant, nb d'enfants à la maison, nb de voitures                             |
| **Éducation et profession** | Niveau d’éducation, Profession                               |

Tous les champs du dataset ZalaxusCustomer sont visibles pour conserver la cohérence avec la base d’origine, même si seule une partie est utilisée pour la prédiction.

---
### 2. Champs transmis à l’API Dataiku

Seules les variables pertinentes pour la prédiction sont envoyées au modèle :

| Champ API        | Source du formulaire   | Description                             |
| ---------------- | ---------------------- | --------------------------------------- |
| `Occupation`     | Profession             | Type d’emploi                           |
| `DivorcedFlag`   | Calcul automatique     | 1 si Célibataire + Enfants > 0, sinon 0 |
| `Country`        | Pays                   | Code pays                               |
| `City`           | Localité               | Ville saisie                            |
| `Gender`         | Genre                  | M/F                                     |
| `EducationLevel` | Niveau d’éducation     | Échelle 1 – 5                           |
| `UrbanLevel`     | CSV (Town_Typlogy.csv) | Niveau urbain de la commune             |
| `Age`            | Calculé                | Dérivé de la date de naissance          |

Les autres champs sont ignorés dans l’appel API, mais conservés pour cohérence de saisie.

---

### 3. Réponse de l’API

L’API retourne un objet JSON du type :

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

Ces valeurs sont affichées dans l’interface sous forme de badges :

* **BikeBuyer** : Oui / Non
* **Pourcentage de probabilité**
* **Score AUC**

---

### 4. Historique local

Chaque simulation est conservée dans le **localStorage** du navigateur :

| Données sauvegardées |                       |
| -------------------- | --------------------- |
| Prénom / Nom         | Pour affichage rapide |
| Email                | Clé de référence      |
| Résultat (Oui / Non) | Statut BikeBuyer      |
| Pourcentage          | Probabilité d’achat   |

---

## Structure du projet
<img width="1730" height="725" alt="Partie4_SchemaWebApp" src="https://github.com/user-attachments/assets/406d778a-6d59-4ade-b6db-e6d25dd9ccf3" />


---

## Technologies utilisées

* **Angular 20** + **Angular Material** (UI)
* **GeoAdmin API** (suggestion de localité suisse)
* **CSV Loader** (mapping UrbanLevel)
* **LocalStorage** (persistance de l’historique)

---

##  Lancement du projet localement

1. **Cloner le repository**
Dans votre IDE, lancer la commande `git clone https://github.com/francoisbrouchoud/bike-buyer-form.git`

2. **Installer les dépendances**

   ```bash
   npm install
   ```
   NB : Il convient d'avoir node.js installé.

3. **Lancer le serveur**

   ```bash
   ng serve
   ```
   
   puis ouvrir : [http://localhost:4200](http://localhost:4200)

4. **Tester le prédicteur**

   * Remplir les champs du formulaire
   * Cliquer sur **Prédire l’achat de vélo**
   * Observer le résultat et l’ajout dans l’historique

---

## Déploiement automatique (CI/CD)

Le projet est autodéployé sur GitHub Pages via une pipeline CI/CD GitHub Actions.
À chaque push sur la branche master, le workflow :

1. Installe les dépendances Node.js
2. Compile l’application Angular
3. Publie le build final sur GitHub Pages à l'adresse [francoisbrouchoud.github.io/bike-buyer-form/](https://francoisbrouchoud.github.io/bike-buyer-form/)

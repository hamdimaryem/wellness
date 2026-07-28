-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3305
-- Généré le : sam. 23 mai 2026 à 22:27
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `wellness_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `coachings`
--

CREATE TABLE `coachings` (
  `id` int(11) NOT NULL,
  `titre` varchar(150) NOT NULL,
  `coach` varchar(120) NOT NULL,
  `categorie` varchar(80) NOT NULL,
  `type` enum('presentiel','en ligne','individuel','groupe') NOT NULL,
  `nb_places` int(11) NOT NULL,
  `prix` decimal(10,2) NOT NULL,
  `image` longtext DEFAULT NULL,
  `description` text DEFAULT NULL,
  `date_coaching` date DEFAULT NULL COMMENT 'Date de la seance fixee par l''admin',
  `heure_coaching` varchar(5) DEFAULT NULL COMMENT 'Heure de debut (format HH:MM)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `coachings`
--

INSERT INTO `coachings` (`id`, `titre`, `coach`, `categorie`, `type`, `nb_places`, `prix`, `image`, `description`, `date_coaching`, `heure_coaching`) VALUES
(5, 'Relaxation profonde', 'Sarra Mejri', 'Relaxation', 'presentiel', 9, 40.00, 'https://img1.wsimg.com/isteam/stock/jm3npgk/:/cr=t:0%25,l:0%25,w:100%25,h:100%25/rs=w:1280', 'Séance lente avec étirements, respiration et détente musculaire.', NULL, NULL),
(7, 'Yoga prénatal', 'Nour Ben Salem', 'Yoga', 'presentiel', 8, 45.00, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80', 'Accompagnement sécurisé pour futures mamans avec mouvements adaptés.', NULL, NULL),
(8, 'Méditation guidée anti-stress', 'Karim Mansouri', 'Meditation', 'en ligne', 20, 25.00, 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=80', 'Respiration, visualisation et recentrage pour relâcher la pression.', NULL, NULL),
(9, 'Pleine conscience débutant', 'Ines Haddad', 'Meditation', 'groupe', 15, 30.00, 'https://images.unsplash.com/photo-1528319725582-ddc096101511?auto=format&fit=crop&w=1200&q=80', 'Initiation accessible à la méditation et à l’écoute corporelle.', NULL, NULL),
(10, 'Coaching sommeil individuel', 'Karim Mansouri', 'Relaxation', 'individuel', 0, 65.00, 'https://images.unsplash.com/photo-1511295742362-92c96b1cf484?auto=format&fit=crop&w=1200&q=80', 'Programme personnalisé pour améliorer routine, détente et qualité du sommeil.', NULL, NULL),
(11, 'Pilates posture & dos', 'Leila Ferchichi', 'Yoga', 'groupe', 7, 38.00, 'https://images.unsplash.com/photo-1510894347713-fc3ed6fdf539?auto=format&fit=crop&w=1200&q=80', 'Renforcement doux pour posture, mobilité et confort du dos.', NULL, NULL),
(17, 'Respiration guidée anti-stress', 'Sarra Mejri', 'Respiration', 'en ligne', 20, 20.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTk7NykOxSzCQMQ6uRBsQhImDA8E02Vc6YI6w&s', 'Techniques de respiration pour réduire le stress, calmer l’esprit et améliorer la concentration.', NULL, NULL),
(18, 'Respiration & cohérence cardiaque', 'Karim Mansouri', 'Respiration', 'individuel', 10, 30.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3sqBCzQddLg2zvUCebgogwtEi8aaoMme_Jg&s', 'Séance de respiration rythmée pour stabiliser le rythme cardiaque et améliorer le bien-être.', NULL, NULL),
(19, 'Nutrition équilibrée débutant', 'Ines Haddad', 'Nutrition', 'en ligne', 25, 25.00, 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80', 'Apprentissage des bases d’une alimentation saine et équilibrée pour le quotidien.', NULL, NULL),
(20, 'Plan nutrition perte de poids', 'Leila Ferchichi', 'Nutrition', 'individuel', 12, 50.00, 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80', 'Programme nutritionnel personnalisé pour atteindre un poids santé.', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `commandes`
--

CREATE TABLE `commandes` (
  `id` int(11) NOT NULL,
  `id_utilisateur` int(11) NOT NULL,
  `id_produit` int(11) NOT NULL,
  `quantite_commandee` int(11) NOT NULL,
  `date_commande` datetime NOT NULL DEFAULT current_timestamp(),
  `statut` enum('En cours','Livree','Annulee') NOT NULL DEFAULT 'En cours',
  `total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `produits`
--

CREATE TABLE `produits` (
  `id` int(11) NOT NULL,
  `nom` varchar(150) NOT NULL,
  `categorie` varchar(80) NOT NULL,
  `prix` decimal(10,2) NOT NULL,
  `quantite` int(11) NOT NULL,
  `image` longtext DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `produits`
--

INSERT INTO `produits` (`id`, `nom`, `categorie`, `prix`, `quantite`, `image`, `description`) VALUES
(9, 'Huile essentielle de lavande', 'Huiles', 24.90, 35, 'https://provence-huile-olive.fr/img/p/5/6/56.jpg', 'Huile relaxante pour massage, bain et rituel du soir.'),
(10, 'Huile essentielle eucalyptus', 'Huiles', 22.50, 28, 'https://panacea-pharma.com/wp-content/uploads/2020/02/huile-essentielle-eucalyptus-radie.jpg', 'Fraicheur respiratoire et sensation de clarté.'),
(11, 'Huile de massage amande douce', 'Huiles', 29.00, 20, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYv1oRakn2ZxKKo8SmetQnU0Xw8qhCUVkkSw&s', 'Texture douce pour les soins corporels apaisants.'),
(12, 'Bougie naturelle rose & jasmin', 'Bougies', 18.00, 42, 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1200&q=80', 'Bougie parfumée végétale pour créer une ambiance calme.'),
(13, 'Bougie soja fleur d’oranger', 'Bougies', 20.00, 25, 'https://iokko.fr/cdn/shop/products/2_fd0112a0-8305-4cdc-9554-f67221792387_2048x.jpg?v=1680787438', 'Cire de soja et parfum doux inspiré des jardins méditerranéens.'),
(14, 'Tisane nuit paisible', 'Tisanes', 14.50, 55, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPLTw4KjoRJH38uQlTeFixsZZZafFnfI4TRg&s', 'Mélange verveine, camomille et lavande pour le soir.'),
(15, 'Tisane detox menthe citron', 'Tisanes', 13.90, 60, 'https://images.unsplash.com/photo-1470162656305-6f429ba817bf?auto=format&fit=crop&w=1200&q=80', 'Infusion fraiche et légère pour accompagner la journée.'),
(16, 'Tisane énergie gingembre', 'Tisanes', 15.00, 38, 'https://ileauxepices.com/blog/wp-content/uploads/2018/03/infusion-au-gingembre.jpg', 'Notes épicées pour un rituel tonique naturel.'),
(17, 'Tapis de yoga antidérapant', 'Accessoires', 49.00, 18, 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=1200&q=80', 'Tapis confortable pour yoga, stretching et méditation.'),
(18, 'Brique de yoga en liège', 'Accessoires', 19.00, 30, 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=1200&q=80', 'Support naturel pour améliorer alignement et stabilité.'),
(19, 'Carnet rituel bien-être', 'Accessoires', 16.50, 24, 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80', 'Carnet pour suivre humeur, sommeil et objectifs personnels.'),
(20, 'Soin visage argile rose', 'Soins', 27.00, 26, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80', 'Masque doux pour peau sensible et éclat naturel.');

-- --------------------------------------------------------

--
-- Structure de la table `reservations`
--

CREATE TABLE `reservations` (
  `id` int(11) NOT NULL,
  `id_utilisateur` int(11) NOT NULL,
  `id_coaching` int(11) NOT NULL,
  `creneau` varchar(50) NOT NULL,
  `date_seance` datetime NOT NULL,
  `statut` enum('En attente','Confirmee','Annulee') NOT NULL DEFAULT 'En attente',
  `montant_paye` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

CREATE TABLE `utilisateurs` (
  `id` int(11) NOT NULL,
  `prenom` varchar(80) NOT NULL,
  `nom` varchar(80) NOT NULL,
  `email` varchar(120) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `telephone` varchar(30) DEFAULT NULL,
  `role` enum('client','admin') NOT NULL DEFAULT 'client',
  `actif` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id`, `prenom`, `nom`, `email`, `mot_de_passe`, `telephone`, `role`, `actif`) VALUES
(1, 'Admin', 'Wellness', 'admin@wellness.tn', 'admin123', '+21671000000', 'admin', 1),
(2, 'Sarra', 'Mejri', 'sarra@email.com', 'client123', '+21622111222', 'client', 1),
(4, 'Ines', 'Haddad', 'ines@email.com', 'client123', '+21622555666', 'client', 1),
(5, 'Karim', 'Mansouri', 'karim@email.com', 'mimi', '+21622777880', 'client', 1),
(9, 'Amira', 'Trabelsi', 'amira.trabelsi@email.tn', 'client123', '+21698111222', 'client', 1),
(10, 'Omar', 'Ben Ali', 'omar.benali@email.tn', 'client123', '+21698777444', 'client', 1),
(11, 'Yasmine', 'Jebali', 'yasmine.jebali@email.tn', 'client123', '+21699444555', 'client', 1),
(12, 'Mohamed', 'Chaabane', 'mohamed.chaabane@email.tn', 'client123', '+21622333444', 'client', 1),
(13, 'Nour', 'Hammami', 'nour.hammami@email.tn', 'client123', '+21655888999', 'client', 1);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `coachings`
--
ALTER TABLE `coachings`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `commandes`
--
ALTER TABLE `commandes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_utilisateur` (`id_utilisateur`),
  ADD KEY `id_produit` (`id_produit`);

--
-- Index pour la table `produits`
--
ALTER TABLE `produits`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_utilisateur` (`id_utilisateur`),
  ADD KEY `id_coaching` (`id_coaching`);

--
-- Index pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `coachings`
--
ALTER TABLE `coachings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT pour la table `commandes`
--
ALTER TABLE `commandes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `produits`
--
ALTER TABLE `produits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT pour la table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `commandes`
--
ALTER TABLE `commandes`
  ADD CONSTRAINT `commandes_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `commandes_ibfk_2` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`id_utilisateur`) REFERENCES `utilisateurs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`id_coaching`) REFERENCES `coachings` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

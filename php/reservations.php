<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($method) {

    case 'GET':
        $db   = getDB();
        $user = requireAuth();
        if ($user['role'] === 'admin') {
            $stmt = $db->query(
                'SELECT r.*, u.prenom, u.nom, u.email, c.titre AS coaching_titre, c.prix
                 FROM reservations r
                 JOIN utilisateurs u ON u.id = r.id_utilisateur
                 JOIN coachings c ON c.id = r.id_coaching
                 ORDER BY r.date_seance DESC'
            );
        } else {
            $stmt = $db->prepare(
                'SELECT r.*, c.titre AS coaching_titre, c.image AS coaching_image
                 FROM reservations r
                 JOIN coachings c ON c.id = r.id_coaching
                 WHERE r.id_utilisateur = ?
                 ORDER BY r.date_seance DESC'
            );
            $stmt->execute([$user['id']]);
        }
        jsonResponse($stmt->fetchAll());
        break;

    case 'POST':
        $user = requireAuth();
        $body = getBody();
        $db   = getDB();

        $id_coaching = (int)($body['id_coaching'] ?? 0);

        // Récupérer infos coaching (date, heure, nb_places)
        $stmt = $db->prepare('SELECT nb_places, date_coaching, heure_coaching FROM coachings WHERE id = ?');
        $stmt->execute([$id_coaching]);
        $coaching = $stmt->fetch();
        if (!$coaching) jsonResponse(['error' => 'Coaching introuvable'], 404);

        // Vérifier places disponibles (seulement les réservations confirmées comptent pour diminuer les places)
        $placed = $db->prepare(
            "SELECT COUNT(*) AS cnt FROM reservations WHERE id_coaching = ? AND statut != 'Annulee'"
        );
        $placed->execute([$id_coaching]);
        $cnt = (int)$placed->fetch()['cnt'];
        if ($cnt >= $coaching['nb_places']) jsonResponse(['error' => 'Plus de places disponibles'], 409);

        // Vérifier que l'utilisateur n'a pas déjà réservé ce coaching
        $already = $db->prepare(
            "SELECT id FROM reservations WHERE id_coaching = ? AND id_utilisateur = ? AND statut != 'Annulee'"
        );
        $already->execute([$id_coaching, $user['id']]);
        if ($already->fetch()) jsonResponse(['error' => 'Vous avez déjà réservé ce coaching'], 409);

        // Utiliser la date et l'heure fixées par l'admin
        $date_seance = null;
        if ($coaching['date_coaching'] && $coaching['heure_coaching']) {
            $date_seance = $coaching['date_coaching'] . ' ' . $coaching['heure_coaching'] . ':00';
        } else {
            $date_seance = date('Y-m-d H:i:s');
        }
        $creneau = $coaching['heure_coaching'] ?? '08:00';

        $ins = $db->prepare(
            'INSERT INTO reservations (id_utilisateur, id_coaching, creneau, date_seance, statut, montant_paye)
             VALUES (?,?,?,?,?,?)'
        );
        $ins->execute([
            $user['id'],
            $id_coaching,
            $creneau,
            $date_seance,
            'En attente',
            $body['montant_paye'] ?? 0,
        ]);
        jsonResponse(['success' => true, 'id' => $db->lastInsertId()], 201);
        break;

    case 'PUT':
        requireAdmin();
        if (!$id) jsonResponse(['error' => 'ID requis'], 400);
        $body   = getBody();
        $db     = getDB();
        $statut = $body['statut'] ?? 'Confirmee';

        // Si on confirme une réservation, décrémenter nb_places du coaching
        if ($statut === 'Confirmee') {
            // Récupérer id_coaching de la réservation
            $rStmt = $db->prepare('SELECT id_coaching, statut FROM reservations WHERE id = ?');
            $rStmt->execute([$id]);
            $reservation = $rStmt->fetch();
            if ($reservation && $reservation['statut'] !== 'Confirmee') {
                // Décrémenter nb_places
                $upd = $db->prepare('UPDATE coachings SET nb_places = nb_places - 1 WHERE id = ? AND nb_places > 0');
                $upd->execute([$reservation['id_coaching']]);
            }
        }

        $stmt = $db->prepare('UPDATE reservations SET statut = ? WHERE id = ?');
        $stmt->execute([$statut, $id]);
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        $user = requireAuth();
        if (!$id) jsonResponse(['error' => 'ID requis'], 400);
        $db   = getDB();
        // Client ne peut annuler que ses propres réservations
        if ($user['role'] !== 'admin') {
            $check = $db->prepare('SELECT id_utilisateur FROM reservations WHERE id = ?');
            $check->execute([$id]);
            $row = $check->fetch();
            if (!$row || $row['id_utilisateur'] != $user['id']) {
                jsonResponse(['error' => 'Non autorisé'], 403);
            }
        }
        $stmt = $db->prepare("UPDATE reservations SET statut = 'Annulee' WHERE id = ?");
        $stmt->execute([$id]);
        jsonResponse(['success' => true]);
        break;

    default:
        jsonResponse(['error' => 'Méthode non supportée'], 405);
}

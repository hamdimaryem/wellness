<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($method) {

    case 'GET':
        $db = getDB();
        if ($id) {
            $stmt = $db->prepare('SELECT * FROM coachings WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            $row ? jsonResponse($row) : jsonResponse(['error' => 'Coaching introuvable'], 404);
        } else {
            $cat    = $_GET['categorie'] ?? '';
            $type   = $_GET['type'] ?? '';
            $sql    = 'SELECT * FROM coachings WHERE 1=1';
            $params = [];
            if ($cat)  { $sql .= ' AND categorie = ?'; $params[] = $cat; }
            if ($type) { $sql .= ' AND type = ?';      $params[] = $type; }
            $sql .= ' ORDER BY id DESC';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            jsonResponse($stmt->fetchAll());
        }
        break;

    case 'POST':
        requireAdmin();
        $body = getBody();
        $db   = getDB();
        $stmt = $db->prepare(
            'INSERT INTO coachings (titre, coach, categorie, type, nb_places, prix, image, description, date_coaching, heure_coaching)
             VALUES (?,?,?,?,?,?,?,?,?,?)'
        );
        $stmt->execute([
            $body['titre']          ?? '',
            $body['coach']          ?? '',
            $body['categorie']      ?? '',
            $body['type']           ?? 'groupe',
            $body['nb_places']      ?? 10,
            $body['prix']           ?? 0,
            $body['image']          ?? null,
            $body['description']    ?? null,
            $body['date_coaching']  ?? null,
            $body['heure_coaching'] ?? null,
        ]);
        jsonResponse(['success' => true, 'id' => $db->lastInsertId()], 201);
        break;

    case 'PUT':
        requireAdmin();
        if (!$id) jsonResponse(['error' => 'ID requis'], 400);
        $body = getBody();
        $db   = getDB();
        $stmt = $db->prepare(
            'UPDATE coachings SET titre=?, coach=?, categorie=?, type=?, nb_places=?, prix=?, image=?, description=?, date_coaching=?, heure_coaching=? WHERE id=?'
        );
        $stmt->execute([
            $body['titre'],
            $body['coach'],
            $body['categorie'],
            $body['type'],
            $body['nb_places'],
            $body['prix'],
            $body['image'],
            $body['description'],
            $body['date_coaching'] ?? null,
            $body['heure_coaching'] ?? null,
            $id
        ]);
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        requireAdmin();
        if (!$id) jsonResponse(['error' => 'ID requis'], 400);
        $db   = getDB();
        $stmt = $db->prepare('DELETE FROM coachings WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['success' => true]);
        break;

    default:
        jsonResponse(['error' => 'Méthode non supportée'], 405);
}

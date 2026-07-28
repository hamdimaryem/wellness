<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($method) {

    case 'GET':
        $db = getDB();
        if ($id) {
            $stmt = $db->prepare('SELECT * FROM produits WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            $row ? jsonResponse($row) : jsonResponse(['error' => 'Produit introuvable'], 404);
        } else {
            $cat    = $_GET['categorie'] ?? '';
            $sql    = 'SELECT * FROM produits WHERE 1=1';
            $params = [];
            if ($cat) { $sql .= ' AND categorie = ?'; $params[] = $cat; }
            $sort = $_GET['sort'] ?? '';
            if ($sort === 'prix_asc')  $sql .= ' ORDER BY prix ASC';
            elseif ($sort === 'stock') $sql .= ' ORDER BY quantite DESC';
            else                       $sql .= ' ORDER BY id DESC';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            jsonResponse($stmt->fetchAll());
        }
        break;

    case 'POST':
        requireAdmin();
        $body = getBody();
        $db   = getDB();

        // Gestion image base64
        $imageData = null;
        if (!empty($body['image_base64'])) {
            $imageData = $body['image_base64'];
        } elseif (!empty($body['image'])) {
            $imageData = $body['image'];
        }

        $stmt = $db->prepare(
            'INSERT INTO produits (nom, categorie, prix, quantite, image, description) VALUES (?,?,?,?,?,?)'
        );
        $stmt->execute([
            $body['nom']         ?? '',
            $body['categorie']   ?? '',
            $body['prix']        ?? 0,
            $body['quantite']    ?? 0,
            $imageData,
            $body['description'] ?? null,
        ]);
        jsonResponse(['success' => true, 'id' => $db->lastInsertId()], 201);
        break;

    case 'PUT':
        requireAdmin();
        if (!$id) jsonResponse(['error' => 'ID requis'], 400);
        $body = getBody();
        $db   = getDB();

        // Gestion image base64
        $imageData = null;
        if (!empty($body['image_base64'])) {
            $imageData = $body['image_base64'];
        } elseif (!empty($body['image'])) {
            $imageData = $body['image'];
        }

        $stmt = $db->prepare(
            'UPDATE produits SET nom=?, categorie=?, prix=?, quantite=?, image=?, description=? WHERE id=?'
        );
        $stmt->execute([
            $body['nom'], $body['categorie'], $body['prix'],
            $body['quantite'], $imageData, $body['description'], $id
        ]);
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        requireAdmin();
        if (!$id) jsonResponse(['error' => 'ID requis'], 400);
        $db   = getDB();
        $stmt = $db->prepare('DELETE FROM produits WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['success' => true]);
        break;

    default:
        jsonResponse(['error' => 'Methode non supportee'], 405);
}

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
                'SELECT c.*, u.prenom, u.nom, p.nom AS produit_nom, p.image AS produit_image
                 FROM commandes c
                 JOIN utilisateurs u ON u.id = c.id_utilisateur
                 JOIN produits p ON p.id = c.id_produit
                 ORDER BY c.date_commande DESC'
            );
        } else {
            $stmt = $db->prepare(
                'SELECT c.*, p.nom AS produit_nom, p.image AS produit_image
                 FROM commandes c
                 JOIN produits p ON p.id = c.id_produit
                 WHERE c.id_utilisateur = ?
                 ORDER BY c.date_commande DESC'
            );
            $stmt->execute([$user['id']]);
        }
        jsonResponse($stmt->fetchAll());
        break;

    case 'POST':
        $user  = requireAuth();
        $body  = getBody();
        $db    = getDB();
        $items = $body['items'] ?? []; // [{ id_produit, quantite }]

        if (empty($items)) jsonResponse(['error' => 'Panier vide'], 400);

        $db->beginTransaction();
        try {
            $ids = [];
            foreach ($items as $item) {
                $pid = (int)($item['id_produit'] ?? 0);
                $qty = (int)($item['quantite']   ?? 1);

                $stmt = $db->prepare('SELECT prix, quantite FROM produits WHERE id = ? FOR UPDATE');
                $stmt->execute([$pid]);
                $prod = $stmt->fetch();
                if (!$prod) throw new Exception("Produit $pid introuvable");
                if ($prod['quantite'] < $qty) throw new Exception("Stock insuffisant pour le produit $pid");

                $total = round($prod['prix'] * $qty, 2);
                $ins = $db->prepare(
                    'INSERT INTO commandes (id_utilisateur, id_produit, quantite_commandee, statut, total)
                     VALUES (?,?,?,?,?)'
                );
                $ins->execute([$user['id'], $pid, $qty, 'En cours', $total]);
                $ids[] = $db->lastInsertId();

                // Décrémenter stock
                $upd = $db->prepare('UPDATE produits SET quantite = quantite - ? WHERE id = ?');
                $upd->execute([$qty, $pid]);
            }
            $db->commit();
            jsonResponse(['success' => true, 'ids' => $ids], 201);
        } catch (Exception $e) {
            $db->rollBack();
            jsonResponse(['error' => $e->getMessage()], 400);
        }
        break;

    case 'PUT':
        requireAdmin();
        if (!$id) jsonResponse(['error' => 'ID requis'], 400);
        $body   = getBody();
        $statut = $body['statut'] ?? 'Livree';
        $db     = getDB();
        $stmt   = $db->prepare('UPDATE commandes SET statut = ? WHERE id = ?');
        $stmt->execute([$statut, $id]);
        jsonResponse(['success' => true]);
        break;

    default:
        jsonResponse(['error' => 'Méthode non supportée'], 405);
}

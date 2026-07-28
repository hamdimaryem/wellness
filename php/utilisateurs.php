<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($method) {

    case 'GET':
        requireAdmin();
        $db   = getDB();
        $stmt = $db->query('SELECT id, prenom, nom, email, telephone, role, actif FROM utilisateurs ORDER BY id DESC');
        jsonResponse($stmt->fetchAll());
        break;

    case 'PUT':
        // Admin peut tout modifier ; un client peut modifier son propre profil
        $user = requireAuth();
        if (!$id) jsonResponse(['error' => 'ID requis'], 400);

        // Un client ne peut modifier que son propre compte
        if ($user['role'] !== 'admin' && $user['id'] != $id) {
            jsonResponse(['error' => 'Non autorisé'], 403);
        }

        $body = getBody();
        $db   = getDB();

        if ($user['role'] === 'admin' && !isset($body['prenom'])) {
            // Mode admin : basculer actif/rôle
            $fields = [];
            $params = [];
            if (isset($body['actif'])) { $fields[] = 'actif = ?'; $params[] = (int)$body['actif']; }
            if (isset($body['role']))  { $fields[] = 'role = ?';  $params[] = $body['role']; }
            if (empty($fields)) jsonResponse(['error' => 'Rien à modifier'], 400);
            $params[] = $id;
            $stmt = $db->prepare('UPDATE utilisateurs SET ' . implode(', ', $fields) . ' WHERE id = ?');
            $stmt->execute($params);
        } else {
            // Mode profil client (ou admin modifiant un profil complet)
            $prenom = trim($body['prenom'] ?? '');
            $nom    = trim($body['nom']    ?? '');
            $email  = trim($body['email']  ?? '');
            $tel    = trim($body['telephone'] ?? '');

            if (!$prenom || !$nom || !$email) jsonResponse(['error' => 'Champs obligatoires manquants'], 400);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonResponse(['error' => 'Email invalide'], 400);

            // Vérifier unicité email (sauf pour l'utilisateur lui-même)
            $chk = $db->prepare('SELECT id FROM utilisateurs WHERE email = ? AND id != ?');
            $chk->execute([$email, $id]);
            if ($chk->fetch()) jsonResponse(['error' => 'Email déjà utilisé'], 409);

            if (!empty($body['mot_de_passe'])) {
                $stmt = $db->prepare('UPDATE utilisateurs SET prenom=?, nom=?, email=?, telephone=?, mot_de_passe=? WHERE id=?');
                $stmt->execute([$prenom, $nom, $email, $tel, $body['mot_de_passe'], $id]);
            } else {
                $stmt = $db->prepare('UPDATE utilisateurs SET prenom=?, nom=?, email=?, telephone=? WHERE id=?');
                $stmt->execute([$prenom, $nom, $email, $tel, $id]);
            }

            // Mettre à jour la session si c'est l'utilisateur connecté
            if ($_SESSION['user']['id'] == $id) {
                $_SESSION['user']['prenom']    = $prenom;
                $_SESSION['user']['nom']       = $nom;
                $_SESSION['user']['email']     = $email;
                $_SESSION['user']['telephone'] = $tel;
            }
        }
        jsonResponse(['success' => true]);
        break;

    case 'DELETE':
        requireAdmin();
        if (!$id) jsonResponse(['error' => 'ID requis'], 400);
        $db   = getDB();
        $stmt = $db->prepare('DELETE FROM utilisateurs WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['success' => true]);
        break;

    default:
        jsonResponse(['error' => 'Méthode non supportée'], 405);
}

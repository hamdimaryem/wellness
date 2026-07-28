<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';

switch ($action) {

    // ── Connexion ──────────────────────────────────────────────────────────
    case 'login':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'POST requis'], 405);
        $body = getBody();
        $email = trim($body['email'] ?? '');
        $pwd   = trim($body['mot_de_passe'] ?? '');

        if (!$email || !$pwd) jsonResponse(['error' => 'Email et mot de passe requis'], 400);

        $db   = getDB();
        $stmt = $db->prepare('SELECT * FROM utilisateurs WHERE email = ? AND actif = 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        // NOTE: En production utiliser password_hash / password_verify
        // Ici on compare en clair pour correspondre au script SQL de base
        if (!$user || $user['mot_de_passe'] !== $pwd) {
            jsonResponse(['error' => 'Identifiants incorrects'], 401);
        }

        $_SESSION['user'] = [
            'id'        => $user['id'],
            'prenom'    => $user['prenom'],
            'nom'       => $user['nom'],
            'email'     => $user['email'],
            'telephone' => $user['telephone'] ?? '',
            'role'      => $user['role'],
        ];

        jsonResponse(['success' => true, 'user' => $_SESSION['user']]);
        break;

    // ── Inscription ────────────────────────────────────────────────────────
    case 'register':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonResponse(['error' => 'POST requis'], 405);
        $body      = getBody();
        $prenom    = trim($body['prenom'] ?? '');
        $nom       = trim($body['nom'] ?? '');
        $email     = trim($body['email'] ?? '');
        $pwd       = trim($body['mot_de_passe'] ?? '');
        $telephone = trim($body['telephone'] ?? '');

        if (!$prenom || !$nom || !$email || !$pwd) {
            jsonResponse(['error' => 'Champs obligatoires manquants'], 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['error' => 'Email invalide'], 400);
        }

        $db   = getDB();
        $chk  = $db->prepare('SELECT id FROM utilisateurs WHERE email = ?');
        $chk->execute([$email]);
        if ($chk->fetch()) jsonResponse(['error' => 'Email déjà utilisé'], 409);

        $stmt = $db->prepare(
            'INSERT INTO utilisateurs (prenom, nom, email, mot_de_passe, telephone, role) VALUES (?,?,?,?,?,?)'
        );
        $stmt->execute([$prenom, $nom, $email, $pwd, $telephone, 'client']);
        $newId = $db->lastInsertId();

        $_SESSION['user'] = [
            'id'        => $newId,
            'prenom'    => $prenom,
            'nom'       => $nom,
            'email'     => $email,
            'telephone' => $telephone,
            'role'      => 'client',
        ];

        jsonResponse(['success' => true, 'user' => $_SESSION['user']], 201);
        break;

    // ── Déconnexion ────────────────────────────────────────────────────────
    case 'logout':
        $_SESSION = [];
        session_destroy();
        jsonResponse(['success' => true, 'message' => 'Déconnecté']);
        break;

    // ── Vérification session ───────────────────────────────────────────────
    case 'me':
        if (!empty($_SESSION['user'])) {
            // Relire depuis la BDD pour avoir les données toujours à jour
            $db   = getDB();
            $stmt = $db->prepare('SELECT id, prenom, nom, email, telephone, role FROM utilisateurs WHERE id = ?');
            $stmt->execute([$_SESSION['user']['id']]);
            $fresh = $stmt->fetch();
            if ($fresh) {
                $_SESSION['user'] = array_merge($_SESSION['user'], $fresh);
                jsonResponse(['authenticated' => true, 'user' => $_SESSION['user']]);
            } else {
                // Utilisateur supprimé entre temps
                $_SESSION = [];
                session_destroy();
                jsonResponse(['authenticated' => false]);
            }
        } else {
            jsonResponse(['authenticated' => false]);
        }
        break;

    default:
        jsonResponse(['error' => 'Action inconnue'], 404);
}

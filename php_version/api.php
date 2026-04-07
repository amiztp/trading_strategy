<?php
/**
 * Strategy Builder Pro - API Endpoints
 * This file handles all CRUD operations for strategies and rules.
 */

require_once 'db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'add_strategy':
        $name = isset($_POST['name']) ? $_POST['name'] : 'New Strategy';
        $stmt = $pdo->prepare("INSERT INTO strategies (name, created_at) VALUES (?, NOW())");
        $stmt->execute([$name]);
        $id = $pdo->lastInsertId();
        header("Location: index.php?id=$id");
        break;

    case 'delete_strategy':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM strategies WHERE id = ?");
            $stmt->execute([$id]);
        }
        header("Location: index.php");
        break;

    case 'duplicate_strategy':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM strategies WHERE id = ?");
            $stmt->execute([$id]);
            $strategy = $stmt->fetch();
            
            if ($strategy) {
                $stmt = $pdo->prepare("INSERT INTO strategies (name, created_at) VALUES (?, NOW())");
                $stmt->execute([$strategy['name'] . ' (Copy)']);
                $new_id = $pdo->lastInsertId();
                
                // Duplicate rules
                $stmt = $pdo->prepare("SELECT * FROM rules WHERE strategy_id = ?");
                $stmt->execute([$id]);
                $rules = $stmt->fetchAll();
                
                foreach ($rules as $rule) {
                    $stmt = $pdo->prepare("INSERT INTO rules (strategy_id, text, checked) VALUES (?, ?, ?)");
                    $stmt->execute([$new_id, $rule['text'], $rule['checked']]);
                }
                header("Location: index.php?id=$new_id");
                exit;
            }
        }
        header("Location: index.php");
        break;

    case 'add_rule':
        $strategy_id = isset($_POST['strategy_id']) ? $_POST['strategy_id'] : null;
        $text = isset($_POST['text']) ? $_POST['text'] : '';
        if ($strategy_id && $text) {
            $stmt = $pdo->prepare("INSERT INTO rules (strategy_id, text, checked) VALUES (?, ?, 0)");
            $stmt->execute([$strategy_id, $text]);
        }
        header("Location: index.php?id=$strategy_id");
        break;

    case 'toggle_rule':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if ($id) {
            $stmt = $pdo->prepare("UPDATE rules SET checked = NOT checked WHERE id = ?");
            $stmt->execute([$id]);
            $stmt = $pdo->prepare("SELECT strategy_id FROM rules WHERE id = ?");
            $stmt->execute([$id]);
            $rule = $stmt->fetch();
            header("Location: index.php?id=" . $rule['strategy_id']);
            exit;
        }
        header("Location: index.php");
        break;

    case 'delete_rule':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if ($id) {
            $stmt = $pdo->prepare("SELECT strategy_id FROM rules WHERE id = ?");
            $stmt->execute([$id]);
            $rule = $stmt->fetch();
            $stmt = $pdo->prepare("DELETE FROM rules WHERE id = ?");
            $stmt->execute([$id]);
            header("Location: index.php?id=" . $rule['strategy_id']);
            exit;
        }
        header("Location: index.php");
        break;

    default:
        header("Location: index.php");
        break;
}

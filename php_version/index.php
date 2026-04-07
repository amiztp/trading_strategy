<?php
/**
 * Strategy Builder Pro - Main Entry Point
 * This file handles the main UI and strategy selection.
 */

require_once 'db.php';

// Fetch all strategies for the sidebar
$stmt = $pdo->query("SELECT * FROM strategies ORDER BY created_at DESC");
$strategies = $stmt->fetchAll();

// Get active strategy
$active_id = isset($_GET['id']) ? $_GET['id'] : (count($strategies) > 0 ? $strategies[0]['id'] : null);
$active_strategy = null;
$rules = [];

if ($active_id) {
    $stmt = $pdo->prepare("SELECT * FROM strategies WHERE id = ?");
    $stmt->execute([$active_id]);
    $active_strategy = $stmt->fetch();
    
    if ($active_strategy) {
        $stmt = $pdo->prepare("SELECT * FROM rules WHERE strategy_id = ? ORDER BY id ASC");
        $stmt->execute([$active_id]);
        $rules = $stmt->fetchAll();
    }
}

// Calculate accuracy
$checked_count = 0;
foreach ($rules as $rule) {
    if ($rule['checked']) $checked_count++;
}
$total_count = count($rules);
$accuracy = $total_count > 0 ? round(($checked_count / $total_count) * 100) : 0;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Strategy Builder Pro | PHP Edition</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body>
    <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo-container">
                    <div class="logo-icon">S</div>
                    <div class="logo-text">
                        <span class="brand">Strategy</span>
                        <span class="sub-brand">Builder Pro</span>
                    </div>
                </div>
            </div>

            <nav class="strategy-list">
                <div class="list-header">
                    <span class="label">Your Strategies</span>
                    <button class="btn-add" onclick="addStrategy()">+</button>
                </div>
                
                <?php foreach ($strategies as $s): ?>
                <a href="?id=<?= $s['id'] ?>" class="strategy-item <?= $s['id'] == $active_id ? 'active' : '' ?>">
                    <span class="dot"></span>
                    <span class="name"><?= htmlspecialchars($s['name']) ?></span>
                </a>
                <?php endforeach; ?>
            </nav>

            <div class="sidebar-footer">
                <div class="user-profile">
                    <div class="avatar">A</div>
                    <div class="user-info">
                        <span class="username">Amiz TP</span>
                        <span class="email">amishkatp@gmail.com</span>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <?php if ($active_strategy): ?>
            <div class="content-wrapper">
                <header class="content-header">
                    <div class="header-info">
                        <h2 class="strategy-title" id="strategy-name" onclick="editStrategyName(<?= $active_strategy['id'] ?>)">
                            <?= htmlspecialchars($active_strategy['name']) ?>
                        </h2>
                        <p class="meta">Created on <?= date('M d, Y', strtotime($active_strategy['created_at'])) ?></p>
                    </div>
                    <div class="header-actions">
                        <button class="btn-secondary" onclick="duplicateStrategy(<?= $active_strategy['id'] ?>)">Duplicate</button>
                        <button class="btn-danger" onclick="deleteStrategy(<?= $active_strategy['id'] ?>)">Delete</button>
                    </div>
                </header>

                <div class="bento-grid">
                    <!-- Rules Section -->
                    <div class="card rules-card">
                        <div class="card-header">
                            <h3 class="card-title">Strategy Rules</h3>
                            <span class="badge"><?= count($rules) ?> Total</span>
                        </div>
                        <div class="rules-list">
                            <?php foreach ($rules as $rule): ?>
                            <div class="rule-item <?= $rule['checked'] ? 'checked' : '' ?>">
                                <div class="rule-content">
                                    <button class="checkbox" onclick="toggleRule(<?= $rule['id'] ?>)">
                                        <span class="check-icon">✓</span>
                                    </button>
                                    <span class="rule-text" onclick="editRule(<?= $rule['id'] ?>)">
                                        <?= htmlspecialchars($rule['text']) ?>
                                    </span>
                                </div>
                                <div class="rule-actions">
                                    <button class="btn-icon" onclick="duplicateRule(<?= $rule['id'] ?>)">⧉</button>
                                    <button class="btn-icon delete" onclick="deleteRule(<?= $rule['id'] ?>)">✕</button>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                        <div class="card-footer">
                            <form action="api.php?action=add_rule" method="POST" class="add-rule-form">
                                <input type="hidden" name="strategy_id" value="<?= $active_strategy['id'] ?>">
                                <input type="text" name="text" placeholder="Add a new rule..." required>
                                <button type="submit" class="btn-primary">Add Rule</button>
                            </form>
                        </div>
                    </div>

                    <!-- Stats Section -->
                    <div class="stats-container">
                        <div class="card chart-card">
                            <div id="accuracy-chart" data-accuracy="<?= $accuracy ?>"></div>
                            <div class="chart-legend">
                                <div class="legend-item">
                                    <span class="dot checked"></span>
                                    <div class="legend-info">
                                        <span class="label">Checked</span>
                                        <span class="value"><?= $checked_count ?></span>
                                    </div>
                                </div>
                                <div class="legend-item">
                                    <span class="dot total"></span>
                                    <div class="legend-info">
                                        <span class="label">Total</span>
                                        <span class="value"><?= $total_count ?></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card status-card">
                            <h3 class="card-title">Execution Status</h3>
                            <div class="status-grid">
                                <div class="status-box">
                                    <span class="label">Checked</span>
                                    <span class="value"><?= $checked_count ?></span>
                                </div>
                                <div class="status-box">
                                    <span class="label">Remaining</span>
                                    <span class="value"><?= $total_count - $checked_count ?></span>
                                </div>
                            </div>
                            <div class="progress-container">
                                <div class="progress-bar" style="width: <?= $accuracy ?>%"></div>
                                <p class="progress-label">Overall Strategy Progress</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <?php else: ?>
            <div class="empty-state">
                <div class="empty-icon">S</div>
                <h2>No Strategy Selected</h2>
                <p>Select an existing strategy or create a new one to begin.</p>
                <button class="btn-primary" onclick="addStrategy()">Create New Strategy</button>
            </div>
            <?php endif; ?>
        </main>
    </div>

    <script src="app.js"></script>
</body>
</html>

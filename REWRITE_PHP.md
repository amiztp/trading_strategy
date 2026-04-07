# Strategy Builder Pro: PHP Rewrite Guide

This document provides the complete code and instructions for rewriting the Strategy Builder application in **PHP, HTML, and CSS**.

## Project Structure
The rewritten project is located in the `/php_version` directory:
- `index.php`: The main dashboard UI.
- `api.php`: Backend logic for all CRUD operations.
- `db.php`: Database connection configuration (PDO).
- `style.css`: Enhanced, modern dashboard styling.
- `app.js`: Frontend interactivity and D3.js data visualization.
- `schema.sql`: MySQL database schema.

## Enhancements in the PHP Version
1.  **Secure Database Access**: Uses PHP Data Objects (PDO) with prepared statements to prevent SQL injection.
2.  **Modular Logic**: Separation of concerns between the UI (`index.php`), the backend logic (`api.php`), and the database configuration (`db.php`).
3.  **D3.js Visualization**: Replaced Recharts with D3.js for a more lightweight and customizable accuracy donut chart in a vanilla JS environment.
4.  **Bento-Style Dashboard**: Maintained and enhanced the modern bento-grid layout with a clean, indigo-centric theme.
5.  **Robust Duplication**: Implemented deep duplication for strategies, ensuring all rules are copied correctly to the new strategy.

## How to Deploy
1.  **Database Setup**:
    -   Create a MySQL database named `strategy_builder`.
    -   Import the `schema.sql` file into your database.
2.  **Configuration**:
    -   Open `db.php` and update the `$user` and `$pass` variables with your MySQL credentials.
3.  **Server**:
    -   Upload all files in the `php_version/` directory to your PHP-enabled web server (e.g., Apache, Nginx).
    -   Access the application via `http://your-server/index.php`.

## Note on the Preview
The current AI Studio preview environment runs on **Node.js**. To see the "vibe" of the PHP version in the preview, I have updated the main React application to mirror the enhanced design and logic of the PHP rewrite.

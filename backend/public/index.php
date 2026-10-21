<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Hosted in a sub-folder (e.g. https://avyajewels.ca/backend) through backend/.htaccess, which forwards
// requests into public/: tell Laravel the folder is /backend so routes such as /admin still match.
$script = $_SERVER['SCRIPT_NAME'] ?? '';
if (str_ends_with($script, '/public/index.php') && ! str_starts_with($_SERVER['REQUEST_URI'] ?? '', dirname($script))) {
    $_SERVER['SCRIPT_NAME'] = $_SERVER['PHP_SELF'] = dirname($script, 2).'/index.php';
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());

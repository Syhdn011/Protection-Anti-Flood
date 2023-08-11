<?php

if (!isset($_SESSION)) {
    session_start();
}
if ($_SESSION['last_session_request'] > time() - 2) {
    header("location: http://www.google.com/");
    exit;
}
$_SESSION['last_session_request'] = time();

?>
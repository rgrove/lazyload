<?php
header('Content-Type: text/css');
sleep(rand(0,5));

$num = (int) $_GET['num'];

echo "#css-status { background-color: " . ($num === 5 ? '#00ff00' : '#ff0000') . "; }\n" .
     "#n" . (int) $_GET['num'] . " { width: 5px; }\n";

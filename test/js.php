<?php
header('Content-Type: text/javascript');
sleep(rand(0,5));
echo "jslog('script " . (int) $_GET['num'] . " executed');\n";

<?php

use Phalcon\Loader,
    Phalcon\DI\FactoryDefault,
    Phalcon\Mvc\Application,
    Phalcon\Mvc\View;


$loader = new Loader();

$loader->registerDirs(
    array(
        './controller',
        './model',
    )
)->register();


Config::$mysqlHost = '127.0.0.1';
if (isset($_SERVER['NDCDB_HOST']))
{
    //Config::$mysqlHost = $_SERVER['NDCDB_HOST'];
}

$di = new FactoryDefault();

// Registering the view component
$di->set('view', function() {
    $view = new View();
    $view->setViewsDir(__DIR__ . '/view');
    return $view;
});

$di->set('db', function() {
    return new Phalcon\Db\Adapter\Pdo\Mysql(array(
        'host' => Config::$mysqlHost,
        'username' => 'root',
        'password' => 'root',
        'dbname' => 'ndcdb2',
        "options" => array(
            PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8'
        )
    ));
});

$di->set('redis', function() {
    require_once("redisproxy.php");
    $redis = new RedisProxy();

    return $redis;
});


$di->set('modelsManager', function() {
    return new Phalcon\Mvc\Model\Manager();
});

try {

    ini_set('date.timezone','Asia/Shanghai');
    $t1 = microtime(true);
    $application = new Application($di);
    
    echo $application->handle()->getContent();
    $t2 = microtime(true);
    #echo ($t2 - $t1);

} catch (\Exception $e) {
    echo $e->getMessage();
}
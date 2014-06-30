<?php

use Phalcon\Loader,
    Phalcon\DI\FactoryDefault,
    Phalcon\Mvc\Application,
    Phalcon\Mvc\View;

//ini_set("session.save_handler", "redis");
// ini_set("session.save_path", "tcp://127.0.0.1:6379");


$loader = new Loader();

$loader->registerDirs(
    array(
        './controller',
        './model',
    )
)->register();

$di = new FactoryDefault();

// Registering the view component
$di->set('view', function() {
    $view = new View();
    $view->setViewsDir(__DIR__ . '/view');
    return $view;
});

$di->set('db', function() {
    return new Phalcon\Db\Adapter\Pdo\Mysql(array(
        'host' => "127.0.0.1",
        'username' => 'root',
        'password' => 'root',
        'dbname' => 'ndcdb',
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
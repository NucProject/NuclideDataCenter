
<?php

class ApiController extends \Phalcon\Mvc\Controller
{



    protected $debug = false;

    private $beginTime;


	public function initialize()
    {
        $this->view->disable();
    }

    public function startSession()
    {
        session_start();


        if ($_SESSION['debug'] == "1")
        {
            $this->debug = true;
            $this->beginTime = microtime(true);
        }

        $this->view->disable();
    }

    public function getPayload($field = null)
    {
        $payload = json_decode($this->request->getRawBody());
        if (isset($field))
        {
            return $payload->$field;
        }
        return $payload;
    }

	// return results
	public function result($results)
	{
		$ret = array(
			"errorCode" => Error::None, 
			"results" => $results);
        
        if ($this->debug)
        {
            $timeConsuming = microtime(true) - $this->beginTime;
            $ret = array_merge($ret, array("consuming" => $timeConsuming));
        }
		echo json_encode($ret);
		return true;
	}

	// echo Error message
	public function error($errorCode, $errorMessage)
	{
		$ret = array(
			"errorCode" => $errorCode, 
			"errorMessage" => $errorMessage);
		echo json_encode($ret);
		return true;
	}

	public function clearAllSessionAction($securityCode)
	{
        if (isset($securityCode))
        {
            $redis = $this->redis;
            $keys = $redis->getKeys("PHPREDIS_SESSION:*");

            foreach ($keys as $key)
            {
                $redis->del($key);
            }
        }
	}

    public function delRedisValueAction($prefix)
    {
        $redis = $this->redis;
        $keys = $redis->getKeys("$prefix*");

        foreach ($keys as $key)
        {
            $redis->del($key);
        }
    }

	public function clearAllCacheAction($securityCode)
	{
		// TODO: Security check!!!

		$redis = $this->redis;
        $keys = $redis->getKeys("*");

        foreach ($keys as $key)
        {
        	$redis->del($key);
        }
	}

	public function getRedisValueAction($key)
	{
		$redis = $this->redis;
		if ($redis->exists($key))
        {

        }
		else
        {
            echo '<None>';
        }
	}

    public function getAction($type)
    {
        if ($this->request->isGet())
        {
            if ($type == "phpinfo")
            {
                echo phpinfo();
            }
            else if ($type == "memory")
            {
                // TODO: Return the server memory status
            }
        }
    }

    public function testAction()
    {
        $phql = "SELECT A.academy_id as academy_id, A.name as name  FROM Academy AS A where A.school_id=1001";
        $names = $this->modelsManager->executeQuery($phql);
        //echo count($names);
        foreach ($names as $name)
        {
            echo $name->name;
            return;
        }

    }

    private function test()
    {
        $a = array("a" => "1");
        $b = array("a" => "2");

        $r = array($a, $b);
        foreach ($r as &$i)
        {
            $i["a"] = "34";
        }

        echo json_encode($r);
    }

	public function exitScript()
	{
		die();
	}

}

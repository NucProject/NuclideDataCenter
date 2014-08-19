
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

    public function testN42Action()
    {

        $f = "D:\\Projects\\NuclideDataCenter\\www\\view\\file\\128\\labr\\2014-07\\24\\sara0316_2014-07-24t23_00_00-5min.n42";

        $xml = simplexml_load_file($f);

        $data = $this->getN42Data($xml);

        echo json_encode($data);
    }

    public function getN42Data($xml)
    {
        $namespaces = $xml->getNameSpaces(true);
        $prefix     = array_keys($namespaces);
        $m = $xml->children($namespaces[$prefix[0]])->Measurement;

        $specs = $m->children($namespaces[$prefix[0]])->Spectrum->children($namespaces[$prefix[0]]);
        $saras = $m->children($namespaces[$prefix[0]])->Spectrum->children($namespaces[$prefix[1]]);

        $doserate = $m->children($namespaces[$prefix[0]])->CountDoseData->DoseRate;
        $nuclidefound = $m->AnalysisResults->NuclideAnalysis->children($namespaces[$prefix[1]])->CalibrationNuclideFound;
        $t = $saras->Temperature;
        $v = $saras->HighVoltage;
        $startTime = $specs->StartTime;
        $endTime = $saras->EndTime;
        return array(
            'doserate' => (double)$doserate, 'temperature' => (double)$t, 'highvoltage' => (double)$v,
            'nuclidefound' => (string)$nuclidefound == 'true',
            'starttime' => self::parseTime( (string)$startTime), 'endtime' => self::parseTime( (string)$endTime)
        );
    }

    public function testAction()
    {
        echo HpicAlert::count();
    }

    public static function parseTime($time)
    {
        $parsed = date_parse_from_format("Y-m-d H:i:s", $time);
        $ret = mktime(
            $parsed['hour'],
            $parsed['minute'],
            $parsed['second'],
            $parsed['month'],
            $parsed['day'],
            $parsed['year']
        );
        // echo json_encode($parsed);
        return date('Y-m-d H:i:s', $ret + 8 * 3600);
    }

    public static function parseTime2($time)
    {
        $parsed = date_parse_from_format("Y-m-d H:i:s", $time);
        $ret = mktime(
            $parsed['hour'],
            $parsed['minute'],
            $parsed['second'],
            $parsed['month'],
            $parsed['day'],
            $parsed['year']
        );
        // echo json_encode($parsed);
        return $ret;
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

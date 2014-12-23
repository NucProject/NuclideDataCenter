
<?php
// ZM:所有的Controller的基类
class ApiController extends \Phalcon\Mvc\Controller
{

    protected $debug = false;

    private $beginTime;


	public function initialize()
    {
        $this->view->disable();
    }

    public function test1Action()
    {
        $d = CinderellaSum::find(array('sid' => 'G201_20141216090100'));
        foreach ($d as $i)
        {
            echo json_encode($i);
        }
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

	public function redisAction($key)
	{
		$redis = $this->redis;
		if ($redis->exists($key))
        {
            echo $redis->get($key);
        }
		else
        {
            echo "[None] $key";
        }
	}

    // Test method
    public function testN42Action()
    {

        $f = "sara0316_2014-07-24t23_00_00-5min.n42";

        $xml = simplexml_load_file($f);

        $data = $this->getN42Data($xml);

        echo json_encode($data);
    }

    // ZM:解析Xml数据为PHP data
    public static function getN42Data($xml)
    {
        $namespaces = $xml->getNameSpaces(true);
        $prefix     = array_keys($namespaces);
        $m = $xml->children($namespaces[$prefix[0]])->Measurement;

        $specs = $m->children($namespaces[$prefix[0]])->Spectrum->children($namespaces[$prefix[0]]);
        $saras = $m->children($namespaces[$prefix[0]])->Spectrum->children($namespaces[$prefix[1]]);

        $c1 = count($m->children($namespaces[$prefix[0]])->CountDoseData);
        $c1 -= 1;
        if ($c1 < 0) $c1 = 0;
        $doserate = $m->children($namespaces[$prefix[0]])->CountDoseData[$c1 - 1]->DoseRate;

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


    public function envAction($type, $param = null)
    {
        if ($type == 'time')
        {
            return self::result(array('time' => date('Y-m-d H:i:s', time())));
        }
        else if ($type == 'cache')
        {
            if ($this->redis)
            {
                if (!isset($param))
                {
                    $keys = $this->redis->keys('*');

                    return self::result(array('cache' => $keys));
                }
                else
                {
                    $dataType = $this->redis->type($param);
                    //echo "$dataType";
                    if ($dataType == 1)
                    {
                        return self::result(array('cache' => $this->redis->get($param)));
                    }
                    else if ($dataType == 3)
                    {
                        return self::result(array('cache' => $this->redis->lRange($param, 0, -1)));
                    }

                    // TODO: Support more redis types.


                }
            }
            else
            {
                return self::result(array('cache' => 'None'));
            }
        }
        else if ($type == 'latest')
        {
            return self::result($param::findFirst(array('order' => 'time desc')));
        }
    }

    public function crystalAction()
    {
        $ObjectFactory = new COM ( "CrystalReports115.ObjectFactory.1" ) or die ( "Error on load" );
            echo "AA";

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


	public function exitScript()
	{
		die();
	}

}

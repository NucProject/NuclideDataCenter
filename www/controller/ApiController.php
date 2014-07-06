
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
        $myRequest ='<?xml version="1.0" encoding="ISO-8859-1"?>
<N42InstrumentData xmlns="http://physics.nist.gov/Divisions/Div846/Gp4/ANSIN4242/2005/ANSIN4242" xmlns:sara="http://www.technidata.com/ENVINET/SARA" xmlns:envinet="http://www.technidata.com/ENVINET">
  <Measurement>
    <InstrumentInformation>
       <InstrumentType>Spectrometer</InstrumentType>
       <Manufacturer>ENVINET GmbH</Manufacturer>
       <InstrumentModel>XGS810</InstrumentModel>
       <InstrumentVersion>0.9.15_trunk_R2896modified</InstrumentVersion>
       <InstrumentID>sara0231</InstrumentID>
       <InstrumentMode>Measure</InstrumentMode>
       <QualityControl>
          <InService>0</InService>
       </QualityControl>
    </InstrumentInformation>
    <Spectrum>
      <Remark>44.3125°C; High Voltage 785.7V</Remark>
      <StartTime>2012-09-01T03:50:00Z</StartTime>
      <RealTime>PT296.099S</RealTime>
      <LiveTime>PT295.485S</LiveTime>
      <Calibration Type="Other">
        <Remark>ChannelDataTemperatureCompensation</Remark>
        <Equation Model="Polynomial">
          <Coefficients>0.00E+00 1.000E+00</Coefficients>
        </Equation>
      </Calibration>
      <Calibration EnergyUnits="keV" Type="Energy">
        <Equation Model="Polynomial">
          <Coefficients>-4.10513E+00 1.38713E+00 1.12549E-04</Coefficients>
        </Equation>
      </Calibration>
      <sara:EndTime>2012-09-01T03:55:00Z</sara:EndTime>
      <sara:SpectralEnsembleName>5min</sara:SpectralEnsembleName>
      <sara:EnergyCalibrationSource>ConsecutiveSlidingSumReferencePeak</sara:EnergyCalibrationSource>
      <sara:ReferenceLineChannelOffset>2</sara:ReferenceLineChannelOffset>
      <sara:ReferencePeakCorrection>1.002E+00</sara:ReferencePeakCorrection>
      <sara:Temperature>4.431E+01</sara:Temperature>
      <sara:HighVoltage>7.857E+02</sara:HighVoltage>
    </Spectrum>
    <CountDoseData>
      <StartTime>2012-09-01T03:50:00Z</StartTime>
      <SampleRealTime>PT300S</SampleRealTime>
      <DoseRate Units="uSv" envinet:TimeRelation="h" envinet:Offset="0.000E+00">5.590E-01</DoseRate>
    </CountDoseData>
    <AnalysisResults>
      <NuclideAnalysis ActivityUnits="Bq" AlgorithmDescription="Quick IDENTIFY" AlgorithmVersion="1.06.0003ENV" sara:ActivityRelation="m2">
        <Nuclide>
          <NuclideName>Co-60</NuclideName>
          <NuclideType>Industrial</NuclideType>
          <NuclideActivity>2.30E+02 5.90E+01</NuclideActivity>
          <NuclideIDConfidenceIndication>100</NuclideIDConfidenceIndication>
          <NuclideIDConfidenceDescription>High</NuclideIDConfidenceDescription>
           <sara:Peak Channel="785" Energy="1.155E+03" Area="3.365E+04"></sara:Peak>
           <sara:Peak Channel="889" Energy="1.319E+03" Area="3.013E+04"></sara:Peak>
          <sara:MaxViolatedLevel>3</sara:MaxViolatedLevel>
          <sara:NuclideDetectionAlarmingTableExecption>0</sara:NuclideDetectionAlarmingTableExecption>
        </Nuclide>
        <Nuclide>
          <NuclideName>Am-241</NuclideName>
          <NuclideType>Unspecified</NuclideType>
          <NuclideActivity>4.200E+00 0</NuclideActivity>
          <NuclideIDConfidenceIndication>0</NuclideIDConfidenceIndication>
          <NuclideIDConfidenceDescription>Undetected</NuclideIDConfidenceDescription>
          <sara:MaxViolatedLevel>0</sara:MaxViolatedLevel>
          <sara:NuclideDetectionAlarmingTableExecption>0</sara:NuclideDetectionAlarmingTableExecption>
        </Nuclide>
        <Nuclide>
          <NuclideName>Ba-140</NuclideName>
          <NuclideType>Industrial</NuclideType>
          <NuclideActivity>2.500E+01 0</NuclideActivity>
          <NuclideIDConfidenceIndication>0</NuclideIDConfidenceIndication>
          <NuclideIDConfidenceDescription>Undetected</NuclideIDConfidenceDescription>
          <sara:MaxViolatedLevel>0</sara:MaxViolatedLevel>
          <sara:NuclideDetectionAlarmingTableExecption>0</sara:NuclideDetectionAlarmingTableExecption>
        </Nuclide>
        <Nuclide>
          <NuclideName>Cs-134</NuclideName>
          <NuclideType>Industrial</NuclideType>
          <NuclideActivity>1.500E+01 0</NuclideActivity>
          <NuclideIDConfidenceIndication>0</NuclideIDConfidenceIndication>
          <NuclideIDConfidenceDescription>Undetected</NuclideIDConfidenceDescription>
          <sara:MaxViolatedLevel>0</sara:MaxViolatedLevel>
          <sara:NuclideDetectionAlarmingTableExecption>0</sara:NuclideDetectionAlarmingTableExecption>
        </Nuclide>
        <Nuclide>
          <NuclideName>Cs-137</NuclideName>
          <NuclideType>Industrial</NuclideType>
          <NuclideActivity>1.600E+01 0</NuclideActivity>
          <NuclideIDConfidenceIndication>0</NuclideIDConfidenceIndication>
          <NuclideIDConfidenceDescription>Undetected</NuclideIDConfidenceDescription>
          <sara:MaxViolatedLevel>0</sara:MaxViolatedLevel>
          <sara:NuclideDetectionAlarmingTableExecption>0</sara:NuclideDetectionAlarmingTableExecption>
        </Nuclide>
        <Nuclide>
          <NuclideName>I-133</NuclideName>
          <NuclideType>Industrial</NuclideType>
          <NuclideActivity>6.600E+00 0</NuclideActivity>
          <NuclideIDConfidenceIndication>0</NuclideIDConfidenceIndication>
          <NuclideIDConfidenceDescription>Undetected</NuclideIDConfidenceDescription>
          <sara:MaxViolatedLevel>0</sara:MaxViolatedLevel>
          <sara:NuclideDetectionAlarmingTableExecption>0</sara:NuclideDetectionAlarmingTableExecption>
        </Nuclide>
        <Nuclide>
          <NuclideName>K-40</NuclideName>
          <NuclideType>Natural</NuclideType>
          <NuclideActivity>2.000E+01 0</NuclideActivity>
          <NuclideIDConfidenceIndication>0</NuclideIDConfidenceIndication>
          <NuclideIDConfidenceDescription>Undetected</NuclideIDConfidenceDescription>
          <sara:MaxViolatedLevel>0</sara:MaxViolatedLevel>
          <sara:NuclideDetectionAlarmingTableExecption>0</sara:NuclideDetectionAlarmingTableExecption>
        </Nuclide>
        <Nuclide>
          <NuclideName>Mo-99</NuclideName>
          <NuclideType>Industrial</NuclideType>
          <NuclideActivity>2.300E+00 0</NuclideActivity>
          <NuclideIDConfidenceIndication>0</NuclideIDConfidenceIndication>
          <NuclideIDConfidenceDescription>Undetected</NuclideIDConfidenceDescription>
          <sara:MaxViolatedLevel>0</sara:MaxViolatedLevel>
          <sara:NuclideDetectionAlarmingTableExecption>0</sara:NuclideDetectionAlarmingTableExecption>
        </Nuclide>
        <Nuclide>
          <NuclideName>Rh-106m</NuclideName>
          <NuclideType>Industrial</NuclideType>
          <NuclideActivity>6.300E+00 0</NuclideActivity>
          <NuclideIDConfidenceIndication>0</NuclideIDConfidenceIndication>
          <NuclideIDConfidenceDescription>Undetected</NuclideIDConfidenceDescription>
          <sara:MaxViolatedLevel>0</sara:MaxViolatedLevel>
          <sara:NuclideDetectionAlarmingTableExecption>0</sara:NuclideDetectionAlarmingTableExecption>
        </Nuclide>
        <Nuclide>
          <NuclideName>Ru-103</NuclideName>
          <NuclideType>Industrial</NuclideType>
          <NuclideActivity>6.100E+00 0</NuclideActivity>
          <NuclideIDConfidenceIndication>0</NuclideIDConfidenceIndication>
          <NuclideIDConfidenceDescription>Undetected</NuclideIDConfidenceDescription>
          <sara:MaxViolatedLevel>0</sara:MaxViolatedLevel>
          <sara:NuclideDetectionAlarmingTableExecption>0</sara:NuclideDetectionAlarmingTableExecption>
        </Nuclide>
        <Nuclide>
          <NuclideName>Te-129</NuclideName>
          <NuclideType>Industrial</NuclideType>
          <NuclideActivity>6.500E+01 0</NuclideActivity>
          <NuclideIDConfidenceIndication>0</NuclideIDConfidenceIndication>
          <NuclideIDConfidenceDescription>Undetected</NuclideIDConfidenceDescription>
          <sara:MaxViolatedLevel>0</sara:MaxViolatedLevel>
          <sara:NuclideDetectionAlarmingTableExecption>0</sara:NuclideDetectionAlarmingTableExecption>
        </Nuclide>
        <Nuclide>
          <NuclideName>Te-132</NuclideName>
          <NuclideType>Industrial</NuclideType>
          <NuclideActivity>1.600E+00 0</NuclideActivity>
          <NuclideIDConfidenceIndication>0</NuclideIDConfidenceIndication>
          <NuclideIDConfidenceDescription>Undetected</NuclideIDConfidenceDescription>
          <sara:MaxViolatedLevel>0</sara:MaxViolatedLevel>
          <sara:NuclideDetectionAlarmingTableExecption>0</sara:NuclideDetectionAlarmingTableExecption>
        </Nuclide>
        <sara:NotAssignedPeaks>
          <sara:Peak Channel="54" Energy="7.094E+01" Area="8.190E+02"></sara:Peak>
          <sara:Peak Channel="1671" Energy="2.628E+03" Area="5.840E+02"></sara:Peak>
          <sara:MaxViolatedLevel>0</sara:MaxViolatedLevel>
          <sara:NuclideDetectionAlarmingTableExecption>false</sara:NuclideDetectionAlarmingTableExecption>
        </sara:NotAssignedPeaks>
        <sara:CalibrationNuclideFound>false</sara:CalibrationNuclideFound>
        <sara:ReferenceLinePosition>0.000E+00</sara:ReferenceLinePosition>
        <sara:ReferencePeakEnergyFromPosition>-4.105E+00</sara:ReferencePeakEnergyFromPosition>
        <sara:ReferenceChannelDivergenceByCorrection>0.000E+00</sara:ReferenceChannelDivergenceByCorrection>
      </NuclideAnalysis>
    </AnalysisResults>
  </Measurement>
</N42InstrumentData>';


        $xml = simplexml_load_string($myRequest);

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

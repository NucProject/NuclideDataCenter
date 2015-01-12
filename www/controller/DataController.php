<?php
/**
 * Created by PhpStorm.
 * User: Healer
 * Date: 14-6-5
 * Time: 下午9:08
 */

class DataController extends ApiController
{
    public function initialize()
    {
        $this->view->disable();
    }

    // ZM:客户端上传数据的入口
    public function commitAction()
    {
        if (!$this->request->isPost())
        {
            return parent::error(Error::BadHttpMethod, '');
        }

        $station = parent::getPayload("station");
        $entries = parent::getPayload("entry");
        $history = parent::getPayload("history");

        $success = array();
        $failure = array();
        $alerts = array();
        foreach ($entries as $entry)
        {
            $data = self::parseData($station, $entry);
            $device = $entry->device;
            if ($data->save() !== false) {
                // ZM:Cinderella设备每到Sid变化了，就对之前的N个一组数据进行Summary汇总（统计数据的由来）
                if ($device == 'cinderelladata') {

                    $sid = Cache::getCurrentSid($this->redis, $station);
                    if ($sid != $data->Sid) {
                        Cache::setCurrentSid($this->redis, $station, $data->Sid);

                        self::summaryCinderellaData($station, $sid);
                    }
                }

                if (!isset($history)) {
                    Cache::updateLatestTime($this->redis, $station, $device);
                    $check = AlertController::checkAlertRule($this->redis, $station, $device, $data);

                    array_push($alerts, $check);
                }
                array_push($success, array('device' => $device, 'time' => $entry->time));
            }
            else
            {
                array_push($failure, array('device' => $device, 'time' => $entry->time));
            }

        }

        return parent::result(array("success" => $success, "failure" => $failure, 'alert' => $alerts));

    }

    // ZM：对于上传文件的设备来说，文件从这里上传(珠海没有，北京的才有)
    public function uploadAction($station, $fileType, $folder, $folder2)
    {
        if (!$this->request->isPost())
        {
            return parent::error(Error::BadHttpMethod, '');
        }

        if($this->request->hasFiles() == true)
        {
            if ($fileType == 'labr')
            {
                $path = File::checkPath($station, $fileType, $folder, $folder2);
            }
            else if ($fileType == 'hpge')
            {
                $path = File::checkPath($station, $fileType, $folder, null);
            }

            //$path = $this->checkPath($station, $fileType, $folder, $folder2);
            $uploads = $this->request->getUploadedFiles();
            $isUploaded = false;
            #do a loop to handle each file individually
            foreach($uploads as $upload)
            {
                $fileName = $upload->getname();
                if ($fileType == 'hpge')
                {
                    $fileName = substr($fileName, 1);
                }
                $filePath = $path . strtolower($fileName);

                ($upload->moveTo($filePath)) ? $isUploaded = true : $isUploaded = false;

                if ($fileType == 'labr')
                {
                    File::recordN42File($station, $filePath, $folder, $folder2, $fileName);
                    Cache::updateLatestTime($this->redis, $station, 'labr');
                }
                else if ($fileType == 'hpge')
                {
                    File::recordHpGeFile($station, $filePath, $fileName, $folder, $folder2);
                    Cache::updateLatestStat($this->redis, $station, $fileType, $folder, 3600 * 8);
                    Cache::updateLatestTime($this->redis, $station, 'hpge');
                }
            }

            return parent::result(array('upload' => $isUploaded, 'station' => $station, 'fileType' => $fileType));
        }
        return parent::error(Error::BadPayload, '');
    }

    // Fetch data by { device, start, end, station }
    public function fetchAction($station, $device)
    {
        if ($this->request->isPost())
        {
            $payload = $this->request->getPost();
            $start = $payload['start'];
            $end = $payload['end'];
            $interval = $payload['interval'];
        }
        else
        {
            $start = $this->request->getQuery('start');
            $end = $this->request->getQuery('end');
            $interval = $this->request->getQuery('interval');
        }

        $interval = isset($interval) ? $interval : 30;

        // ZM: BigData: 当interval不是30的时候的一种补充, 走最新的SQL（区分设备）
        if ($interval != 30)
        {
            if ($device == 'weather')
            {
                $items = $this->fetchWeatherData($station, $start, $end, $interval);
                return parent::result(array("items" => $items));
            }
            else if ($device == 'hpic')
            {
                $items = $this->fetchHpicData($station, $start, $end, $interval);
                return parent::result(array("items" => $items));
            }
            else if ($device == 'environment')
            {
                $items = $this->fetchEnvironmentData($station, $start, $end, $interval);
                return parent::result(array("items" => $items));
            }

            // HpGe and Labr don't follow this rule.
        }

        $condition = "station=$station";

        if (isset($start) && isset($end)){
            // echo "$start";
            $condition .= " and time >= '$start' and time < '$end'";
        }

        //echo $condition;
        $data = $device::find(array(
            $condition,
        ));

        $items = array();
        foreach ($data as $item)
        {
            if ($device == 'labr')
            {
                $item->doserate = floatval($item->doserate) * 1000.0;
            }
            array_push($items, $item);
        }
        return parent::result(array("items" => $items));
    }

    public function downloadAction($station, $device)
    {
        $start = $this->request->getPost('start');
        $end = $this->request->getPost('end');

        $interval = $this->request->getPost('interval');
        $interval = $interval?: 30;

        $fileName = "{$device}_{$start}_{$end}.csv";
        Header("Content-type: application/octet-stream");
        Header("Accept-Ranges: bytes");
        Header("Accept-Length:-1");
        Header("Content-Disposition: attachment; filename=" . $fileName);

        $items = array();

        if ($device == 'weather')
        {
            $items = $this->fetchWeatherData($station, $start, $end, $interval);

        }
        else if ($device == 'hpic')
        {
            $items = $this->fetchHpicData($station, $start, $end, $interval);

        }
        else if ($device == 'labr')
        {
            $items = $this->fetchLabrData($station, $start, $end, $interval);

        }

        foreach ($items as $item)
        {
            $a = array();
            foreach($item as $k => $v)
            {
                array_push($a, $v);
            }
            echo implode(',', $a), "\n";
        }


        exit;
    }


    private function fetchWeatherData($station, $start, $end, $interval)
    {
        $phql = <<<PHQL
select
avg(d.Temperature) as Temperature,
avg(d.Humidity) as Humidity,
avg(d.Pressure) as Pressure,
avg(d.Windspeed) as Windspeed,
avg(d.Raingauge) as Raingauge,
avg(d.Direction) as Direction,
d.time,
FROM_UNIXTIME(CEILING((UNIX_TIMESTAMP(d.time) + 8 * 3600) / $interval) * $interval - 8 * 3600)  as time2
from weather as d
where d.station=$station and d.time>'$start' and d.time<'$end' group by time2
PHQL;

        $data = $this->modelsManager->executeQuery($phql);
        $items = array();
        foreach ($data as $item)
        {
            $item->time = $item->time2;
            unset($item->time2);
            array_push($items, $item);
        }
        return $items;
    }

    private function fetchHpicData($station, $start, $end, $interval)
    {
        $phql = <<<PHQL
select
avg(d.doserate) as doserate,
avg(d.battery) as battery,
avg(d.highvoltage) as highvoltage,
avg(d.temperature) as temperature,
d.time,
FROM_UNIXTIME(CEILING((UNIX_TIMESTAMP(d.time) + 8 * 3600) / $interval) * $interval - 8 * 3600)  as time2
from hpic as d
where d.station=$station and d.time>'$start' and d.time<'$end' group by time2
PHQL;

        //echo $interval;

        $data = $this->modelsManager->executeQuery($phql);
        $items = array();
        foreach ($data as $item)
        {
            $item->time = $item->time2;
            unset($item->time2);
            array_push($items, $item);
        }
        return $items;
    }

    private function fetchLabrData($station, $start, $end, $interval)
    {
        $phql = <<<PHQL
select
avg(d.doserate) as doserate,
avg(d.highvoltage) as highvoltage,
avg(d.temperature) as temperature,
d.time,
FROM_UNIXTIME(CEILING((UNIX_TIMESTAMP(d.time) + 8 * 3600) / $interval) * $interval - 8 * 3600)  as time2
from labr as d
where d.station=$station and d.time>'$start' and d.time<'$end' group by time2
PHQL;

        $data = $this->modelsManager->executeQuery($phql);
        $items = array();
        foreach ($data as $item)
        {
            $item->time = $item->time2;
            unset($item->time2);
            array_push($items, $item);
        }
        return $items;
    }

    private function fetchEnvironmentData($station, $start, $end, $interval)
    {
        $phql = <<<PHQL
select
avg(d.Temperature) as Temperature,
avg(d.Humidity) as Humidity,
avg(d.IfMainPowerOff) as IfMainPowerOff,
avg(d.BatteryHours) as BatteryHours,
avg(d.IfSmoke) as IfSmoke,
avg(d.IfWater) as IfWater,
avg(d.IfDoorOpen) as IfDoorOpen,
d.time,
FROM_UNIXTIME(CEILING((UNIX_TIMESTAMP(d.time) + 8 * 3600) / $interval) * $interval - 8 * 3600)  as time2
from Environment as d
where d.station=$station and d.time>'$start' and d.time<'$end' group by time2
PHQL;

        $data = $this->modelsManager->executeQuery($phql);
        $items = array();
        foreach ($data as $item)
        {
            $item->time = $item->time2;
            unset($item->time2);
            array_push($items, $item);
        }
        return $items;
    }

    public function fetchHpgeAction($station)
    {
        if ($this->request->isPost())
        {
            $payload = $this->request->getPost();
            $start = $payload['start'];
            $end = $payload['end'];
            $sid = $payload['sid'];
        }

        $condition = "station=$station";

        if ($sid)
        {
            $condition .= " and sid='$sid'";
        }
        else
        {
            $condition .= " and time >= '$start' and time < '$end'";
        }

        //echo $condition;
        $data = Hpge::find(array($condition, 'order' => 'time desc'));

        $items = array();
        foreach ($data as $item)
        {
            array_push($items, $item);
        }

        return parent::result(array("items" => $items));
    }

    // ZM: 界面取最新时间，看设备是否还在上传（设备运行，停止的依据）
    public function latestAction($station, $device)
    {
        $status = Cache::getLatest($this->redis, $station, $device);
        if ($status === false) {
            $status= 0;
        }
        return parent::result(array('station' => $station, 'device' => $device, 'status' => $status));
    }

    public function alertsAction($station, $device, $all = false)
    {
        if ($all)
        {
            $condition = "station_id=$station";
        }
        else
        {
            $condition = "station_id=$station and handled=0";
        }

        $modelName = $device . 'Alert';

        $alerts =  $modelName::find(array($condition, 'order' => 'time desc'));
        $ret = array();
        foreach ($alerts as $alert)
        {
            array_push($ret, $alert);
        }

        return parent::result(array('station' => $station, 'device' => $device, 'items' => $ret));
    }


    private static function parseData($station, $entry)
    {
        $device = $entry->device;

        $deviceConfig = Config::$m[$device];

        $data = new $device();

        $data->station = $station;
        foreach ($deviceConfig as $key => $item)
        {
            $value = $entry->$key;

            if ($value === true)
                $value = 1;
            if ($value === false)
                $value = 0;

            $data->$item = $value;
        }
        return $data;
    }
    

    public function countAction($station, $device)
    {
        if (!$this->request->isPost())
        {
            return parent::error(Error::BadHttpMethod, '');
        }

        $payload = $this->request->getPost();
        $start = $payload['start'];
        $end = $payload['end'];

        $count = $device::count(array("station=$station and time >= '$start' and time < '$end'"));
        return parent::result(array('count' => $count));
    }

    public function count2Action($station, $device)
    {
        $start = $this->request->getQuery('start');
        $end = $this->request->getQuery('end');

        $phql = "SELECT count(distinct d.time) as count,  from_unixtime( floor((unix_timestamp(d.time) + 8 * 3600)/ 24 / 3600) * 24 * 3600 ) as time, day(d.time) as time1 from $device as d where d.station=$station and d.time>='$start' and d.time <'$end' group by time1";
        $counts = $this->modelsManager->executeQuery($phql);
        $items = array();
        foreach ($counts as $count)
        {
            array_push($items, $count);
        }
        return parent::result(array('counts' => $items));

    }

    public function checkAction($station, $device)
    {
        if (!$this->request->isPost())
        {
            return parent::error(Error::BadHttpMethod, '');
        }

        $payload = $this->request->getPost();
        $start = $payload['start'];
        $end = $payload['end'];
        $expect = $payload['expect'];
        $set = $payload['set'];

        $data = $device::find(array("station=$station and time >= '$start' and time < '$end'"));
        if (count($data) < $expect)
        {
            $array = array();
            foreach ($data as $item)
            {
                $key = parent::parseTime2($item->time);
                array_push($array, (int)$key);
            }

            $b = parent::parseTime2($start);
            $e = parent::parseTime2($end);
            $array2 = array();
            for ($i = $b; $i < $e; $i += 30)
            {
                array_push($array2, (int)$i);
            }

            if ($set)
            {
                $times = array_values(array_diff($array2, $array));
                $content = array(
                    'start' => $start,
                    'end' => $end,
                    'times' => implode(',', $times));
                CommandController::addCommand($this->redis, $station, 'history', $device, $content);
                return parent::result(array('count' => count($array), 'c' => count($array2)));
            }

            return parent::result(array('times' => array_values(array_diff($array2, $array)), 'count' => count($array)));
        }

    }

    public function execSummaryAction($station, $sid)
    {
        self::summaryCinderellaData($station, $sid);
    }

    public function cinderellaSummaryAction($station)
    {
        if (!$this->request->isGet())
        {
            return parent::error(Error::BadHttpMethod, '');
        }
        $data = CinderellaSum::find(array("station=$station"));
        $ret = array();
        foreach ($data as $item)
        {
            array_push($ret, $item);
        }
        return parent::result(array('items' => $ret));
    }

    public function cinderellaSummary2Action($station)
    {
        if (!$this->request->isGet())
        {
            return parent::error(Error::BadHttpMethod, '');
        }

        $phql = "select s.sid, s.begintime, s.endtime, barcode, count(distinct h.path) as count, s.flow, s.flowPerHour, s.worktime from CinderellaSum s left join Hpge h on h.sid=s.sid where s.station=$station group by s.sid order by s.begintime DESC";

        $data = $this->modelsManager->executeQuery($phql);
        $ret = array();
        foreach ($data as $item)
        {
            array_push($ret, $item);
        }
        return parent::result(array('items' => $ret));
    }

    public function delCinderellaSummaryAction($station, $sid)
    {
        if (!$this->request->isGet())
        {
            return parent::error(Error::BadHttpMethod, '');
        }

        $data = CinderellaSum::find(array("station=$station and sid='$sid'"));
        if ($data)
        {
            if ($data->delete())
            {
                return parent::result(array('sid' => $sid, 'removed' => true));
            }
        }

        return parent::error(Error::BadRecord, '');
    }

    private static function summaryCinderellaData($station, $sid)
    {
        $data = CinderellaData::find(array("station=$station and Sid='$sid'"));
        $count = count($data);
        if ($count == 0)
            return;

        $f = $data[0];
        $begin = ApiController::parseTime2($f->BeginTime);
        $worktime = $f->WorkTime;
        $barcode = $f->barcode;
        $flow = 0.0;
        $flowPerHour = 0.0;
        $pressure = 0.0;
        $end = 0;

        foreach ($data as $item)
        {
            $cb = ApiController::parseTime2($item->time);

            if ($cb > $end) {
                $end = $cb;
            }

            if ($item->WorkTime > $worktime) {
                $worktime = $item->WorkTime;
            }

            if ($item->Flow > $flow)
                $flow = $item->Flow;
            $flowPerHour += $item->FlowPerHour;
            $pressure += $item->Pressure;
        }

        $s = CinderellaSum::findFirst("sid ='$sid' and station =$station");
        if (!$s)
        {
            $s = new CinderellaSum();
            $s->sid = $sid;
            $s->station = $station;
        }

        $s->begintime = date('Y-m-d H:i:s', $begin);
        $s->endtime = date('Y-m-d H:i:s', $end);
        $s->barcode = $barcode;
        $s->flow = $flow;

        $s->pressure = 0;
        $s->flowPerHour = $flow / ((strtotime($worktime, 0) + 8 * 3600) / 3600);
        $s->worktime = $worktime;
        // echo ((strtotime($worktime, 0) + 8 * 3600));

        return $s->save();
    }

    public function fetchLabrEnergyDataAction($station){;
        $time = $_REQUEST['time'];
        /*if($this->request->isPost()){
            $payload = $this->request->getPost();
            $time = $payload['time'];
        }*/
        if(isset($time)) {

            $phql = "select l.channeldata, l.k1, l.k0 from LabrFilter l where (l.station=$station) and (l.time = '$time')";

            $data = $this->modelsManager->executeQuery($phql);
            $channeldata = $data[0]['channeldata'];
            $k1 = $data[0]['k1'];
            $k0 = $data[0]['k0'];
            $channeldata = explode(" ",$channeldata);
            $energyData = implode(';', $this->getPoints($channeldata, $k0, $k1));
            //echo json_encode($energyData);
            //return json_encode($energyData);

        }

            $phql = "select l.name, l.activity, l.channel, l.energy from LabrNuclideFilter l where (l.station=$station) and (l.time = '$time')";
            $data = $this->modelsManager->executeQuery($phql);

            foreach($data as $item){
                $nuclideRet[] = array(
                    'name' => "$item->name",
                    'activity' => "$item->activity",
                    'channel' => "$item->channel",
                    'energy' => "$item->energy"
                );
            }

        $result = array(
            'data' => $energyData,
            'nuclide' => $nuclideRet
        );
        echo json_encode($result);

    }

    private function getPoints($datas, $k0, $k1)
    {
        $k0 = floatval($k0);
        $k1 = floatval($k1);

        $n = array();

        for ($j = 1; $j <= 1024; $j++)
        {
            $r = $j + 0.5;
            $ex = round($k1 * $r + $k0, 2);

            $v = $datas[$j - 1];
            $n[] = "$ex, $v";
            if ($ex >= 3200)
                break;

        }
        return $n;
    }
}
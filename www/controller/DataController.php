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
                    File::recordN42File($station, $filePath, $folder, $folder2, $fileName, $this->redis);
                    Cache::updateLatestTime($this->redis, $station, 'labr');
                }
                else if ($fileType == 'hpge')
                {
                    File::recordHpGeFile($station, $filePath, $fileName, $folder, $folder2);
                    Cache::updateLatestStat($this->redis, $station, $fileType, $folder, 3600 * 8);
                    Cache::updateLatestTime($this->redis, $station, 'hpge');

                    $p = explode(',', $folder2);
                    if (strtoupper($p[3]) == 'RPT')
                    {
                        self::doHpgeAlerts($filePath, $station, $p[2], $this->redis, $folder);
                    }
                }
            }

            return parent::result(array('upload' => $isUploaded, 'station' => $station, 'fileType' => $fileType));
        }
        return parent::error(Error::BadPayload, '');
    }

    public function hpgeParseAction()
    {
        self::doHpgeAlerts('D:\\samplereport24_2015_05_31T11_04_00.rpt', 128, '2015-03-26 10:10:10', $this->redis, 'AA11_20150523112100');
    }

    private function hasFile($url)
    {
        return @file_get_contents( $url, null, null, -1, 1) ? true: false;
    }

    public function recoverHpgeDataAction()
    {
        $s = Hpge::find(array("time>='2015-06-01' and mode='RPT'"));
        foreach ($s as $i)
        {
           // echo $i->sid, " ", $i->path, " ";
            $p = $i->path;
            $q = explode('/', $p);
            $station = $q[3];
            $sid = $q[4];
            $fileName = $q[5];

            $url = 'http://127.0.0.1:8080' . "/file/$station/hpge/$sid/$fileName";

            if ($this->hasFile($url))
            {
                $flow = self::getFlowBySid($sid);
                if (!$flow)
                    $flow = 1.0;
                // echo "($flow)<br>";
                echo self::doHpgeData($url, $station, $flow, $i->time);
                echo "<br>";
            }
            else
            {
                echo "No File {$url} <br>";
            }

        }
    }

    private static function getFlowBySid($sid)
    {
        $p = explode('_', $sid);
        if (count($p) != 2)
            return -1;
        $d = substr($p[1], 0, 8);
        $twoDaysAgo = date('Ymd', ApiController::parseTime2($d) - 3600 * 48);

        $conn = mysqli_connect('127.0.0.1', 'root', 'root');
        mysqli_select_db($conn, 'ndcdb');
        $r = mysqli_query($conn, "select * from cinderella_sum where sid like '%_$twoDaysAgo%' limit 1");
        $row = mysqli_fetch_array($r, MYSQLI_ASSOC);
        mysqli_close($conn);
        // print_r($row);
        return $row[7];

    }

    public function parseSidAction($sid)
    {
        echo self::getFlowBySid($sid);
    }

    private static function doHpgeData($url, $station, $flow, $time)
    {
        $a = @file_get_contents($url);
        if (!$a)
            return "No contents";

        $lines = explode("\n", $a);
        $content = array();
        foreach ($lines as $line)
        {
            array_push($content, $line);
        }
        unset($line);
        $start1 = false;
        $start2 = false;
        $counter = 0;

        foreach($content as $line) {
            $counter++;
            $line = trim($line);
            if (strstr($line, 'S U M M A R Y   O F   N U C L I D E S   I N   S A M P L E') ) {
                $start1 = true;

                continue;
            }

            if ($start1) {
                //echo "F";
                if (strstr($line, '__________') ) {
                    $start2 = true;
                    continue;
                }
            }

            if ($start2) {
                if ($line == '') continue;
                echo 1;
                if (strlen($line) < 5) continue;
                echo 2;
                if (strstr($line, 'sample') ) continue;
                echo 3;
                if (strstr($line, 'ORTEC') ) continue;
                echo 4;
                if (strstr($line, '- - - - - - - - - - - - - -') ) break;
                echo 5;

                $a = @split("[ ]+", $line);

                if (strlen(trim($a[0])) == 0)
                    continue;
                if ($a[1] == '<')
                    continue;

                $data = new HpgeData();
                $data->station = $station;
                $data->time = $time;
                $data->nuclide = $a[0];
                $value = $a[1] != '#' ? floatval($a[1]) : floatval($a[2]);

                $cval = floatval($value) / floatval($flow);
                $data->value = $value;
                $data->cvalue = $cval;
                $data->flow = $flow;
                $data->percent = 0.0;
                $data->save();
            }

        }
        return "C [$counter]";
    }

    private static function doHpgeAlerts($filePath, $station, $time, $redis, $sid)
    {
        $flow = self::getFlowBySid($sid);
        if (!$flow)
            $flow = 1.0;

        $a = file($filePath);

        $start1 = false;
        $start2 = false;
        foreach($a as $l => $content)
        {
            if (strstr($content, 'S U M M A R Y   O F   N U C L I D E S   I N   S A M P L E') )
            {
                $start1 = true;
                continue;
            }

            if ($start1)
            {
                if (strstr($content, '___________________________________') )
                {
                    $start2 = true;
                    continue;
                }
            }

            if ($start2)
            {
                $line = trim($content) ;
                if ($line == '') continue;
                if (strlen($line) < 5) continue;
                if (strstr($line, 'sample') ) continue;
                if (strstr($line, 'ORTEC') ) continue;
                if (strstr($line, '- - - - - - - - - - - - - -') ) break;

                $a = @split("[ ]+", $line);
                if ($a[0] == '<')
                    break;
                if ($a[1] == '<')
                    continue;

                $data = new HpgeData();
                $data->station = $station;
                $data->time = $time;
                $data->nuclide = $a[0];
                $value = $a[1] != '#' ? floatval($a[1]) : floatval($a[2]);

                $cval = floatval( $value )/ floatval($flow);
                $data->value = $value;
                $data->cvalue = $cval;
                $data->flow = $flow;
                $data->percent = 0.0;
                $data->save();

                $data = new stdClass();
                $data->time = $time;
                $data->field = $a[0];
                $data->value = $cval;
                $data->is_nuclide = true;
                AlertController::checkAlertRule($redis, $station, 'hpge', $data);
            }
        }
    }

    private static function getPagedData($items, $page, $PageCount)
    {
        if (!$page || $page == 0)
            return $items;

        $counter = 0;
        $start = ($page - 1) * $PageCount;
        $end = ($page) * $PageCount;
        $array = array();
        foreach ($items as $item)
        {
            if ($counter >= $start)
            {
                array_push($array, $item);
            }
            $counter++;
            if ($counter > $end)
            {
                break;
            }
        }
        return $array;
    }

    // Fetch data by { device, start, end, station }
    public function fetchAction($station, $device)
    {
        if ($this->request->isPost())
        {
            $payload = $this->request->getPost();
            $start = $payload['start'];
            $end = $payload['end'];
            $interval = array_key_exists('interval', $payload) ?$payload['interval'] : null;
            $page = 1;
            $PageCount = 2880;
            if (array_key_exists('page', $payload))
                $page = $payload['page'];
            if (array_key_exists('PageCount', $payload))
                $PageCount = $payload['PageCount'];
        }
        else
        {
            $start = $this->request->getQuery('start');
            $end = $this->request->getQuery('end');
            $interval = $this->request->getQuery('interval');
            $page = $this->request->getQuery('page');
            $PageCount = $this->request->getQuery('PageCount');
        }

        if ($device == 'labr' || $device == 'labrfilter')
        {
            $interval = isset($interval) ? $interval : 300;
        }
        else
        {
            $interval = isset($interval) ? $interval : 30;
        }
        // ZM: BigData: 当interval不是30的时候的一种补充, 走最新的SQL（区分设备）
        if (true)
        {
            if ($device == 'weather')
            {
                $items = $this->fetchWeatherData($station, $start, $end, $interval);
                $count = count($items);
                $items = self::getPagedData($items, $page, $PageCount);
                return parent::result(array("items" => $items, 'interval' => $interval, 'count' => $count ));
            }
            else if ($device == 'hpic')
            {
                $items = $this->fetchHpicData($station, $start, $end, $interval);
                $count = count($items);
                $items = self::getPagedData($items, $page, $PageCount);
                return parent::result(array("items" => $items, 'interval' => $interval, 'count' => $count ));
            }
            else if ($device == 'environment')
            {
                $items = $this->fetchEnvironmentData($station, $start, $end, $interval);
                $count = count($items);
                $items = self::getPagedData($items, $page, $PageCount);
                return parent::result(array("items" => $items, 'interval' => $interval, 'count' => $count ));
            }
            else if ($device == 'labr' && $interval != 300)
            {
                $items = $this->fetchLabrData($station, $start, $end, $interval);
                $count = count($items);
                $items = self::getPagedData($items, $page, $PageCount);
                return parent::result(array("items" => $items, 'interval' => $interval, 'count' => $count ));

            }
            else if ($device == 'labrfilter' && $interval != 300)
            {
                $items = $this->fetchLabrFilterData($station, $start, $end, $interval);
                $count = count($items);
                $items = self::getPagedData($items, $page, $PageCount);
                return parent::result(array("items" => $items, 'interval' => $interval, 'count' => $count ));
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
            $condition, 'order' => 'time desc'
        ));

        $items = array();
        $count = count($data);
        if ($device == 'labr')
        {
            foreach ($data as $item)
            {
                $item->doserate = floatval($item->doserate) * 1000.0;
                array_push($items, $item);
            }
        }
        else
        {

            if ($page && $PageCount)
            {
                $items = self::getPagedData($data, $page, $PageCount);
            }
            else
            {
                foreach ($data as $item)
                {
                    array_push($items, $item);
                }
            }
        }

        return parent::result(array("items" => $items, 'interval' => $interval, 'count' => $count));
    }

    //用户导出设备数据，存储为csv文件
    public function downloadAction($station, $device)
    {
        $start = $this->request->getPost('start');
        $end = $this->request->getPost('end');

        $interval = $this->request->getPost('interval');
        $interval = $interval?: 30;

        $fileName = "{$device}_{$start}_{$end}.csv";
        Header("Content-type: application/octet-stream;charset=UTF-8");
        Header("Accept-Ranges: bytes");
        Header("Accept-Length:-1");
        Header("Content-Disposition: attachment; filename=" . $fileName);
        echo pack('H*','EFBBBF');   // 写入 BOM header for UTF8 files.

        $items = array();
        $headers = '';
        if ($device == 'weather')
        {
            // $i->rainspeed, $i->windspeed, $i->direction, $i->pressure, $i->temperature, $i->humidity)
            $headers = '时间, 雨量, 风速, 方向, 气压, 温度, 湿度';
            $items = $this->fetchWeatherData($station, $start, $end, $interval);
        }
        else if ($device == 'hpic')
        {
            $headers = '时间, 剂量率, 电池电压(V), 探头电压(V), 探头温度(℃)';
            $items = $this->fetchHpicData($station, $start, $end, $interval);

        }
        else if ($device == 'labr')
        {
            $headers = '时间, 剂量率, 高压, 温度';
            $items = $this->fetchLabrData($station, $start, $end, $interval);
        }
        else if ($device == 'labrfilter')
        {
            $headers = '时间, 剂量率, 温度, 高压, 本底相似度, cps';
            $items = $this->fetchLabrFilterData($station, $start, $end, $interval);
        }


        if ($headers)
        {
            echo $headers, "\r\n";
        }

        foreach ($items as $item)
        {
            $a = array();
            foreach($item as $k => $v)
            {
                array_push($a, $v);
            }
            echo implode(',', $a), "\r\n";
        }
        exit;
    }

    //用户导出设备数据，存储为csv文件
    public function downloadSummaryAction($station)
    {
        $start = $this->request->getPost('start');
        $end = $this->request->getPost('end');

        $fileName = "summary_{$start}_{$end}.csv";
        Header("Content-type: application/octet-stream;charset=UTF-8");
        Header("Accept-Ranges: bytes");
        Header("Accept-Length:-1");
        Header("Content-Disposition: attachment; filename=" . $fileName);
        echo pack('H*','EFBBBF');   // 写入 BOM header for UTF8 files.

        $headers = '采样ID,开始时间,结束时间,条码,累计流量,平均瞬时流量,工作时间';
        if ($headers)
        {
            echo $headers, "\r\n";
        }

        $payload = $this->request->getPost();
        $start = $payload['start'];
        $end = $payload['end'];

        $data = CinderellaSum::find(array("station=$station and endtime > '$start' and endtime < '$end'"));

        foreach ($data as $i)
        {
            $sid = $i->sid;
            $beginTime =$i->begintime;
            $endTime =$i->endtime;
            $barCode = $i->barcode;
            $flow = $i->flow;
            $flowPerHour =$i->flowPerHour;
            $workTime=$i->worktime;

            echo "$sid, $beginTime, $endTime, $barCode, $flow, $flowPerHour, $workTime\r\n";
            //echo implode(',', $a), "\r\n";
        }
        exit;
    }

    private static function adjustTime($time, $interval)
    {
        return $time;
//        if ($interval != 3600 * 24)
//        {
//            return $time;
//        }
//        else
//        {
//            return date('Y-m-d H:i:s', ApiController::parseTime2($time) - $interval);
//        }
    }


    private function fetchWeatherData($station, $start, $end, $interval)
    {
        $phql = <<<PHQL
select
d.time,
sum(d.Rainspeed) as Rainspeed,
round(avg(d.Windspeed), 1) as Windspeed,
round(avg(d.Direction), 1) as Direction,
round(avg(d.Pressure), 1) as Pressure,
round(avg(d.Temperature), 1) as Temperature,
round(avg(d.Humidity), 1) as Humidity,
FROM_UNIXTIME(FLOOR((UNIX_TIMESTAMP(d.time) + 8 * 3600) / $interval) * $interval - 8 * 3600)  as time2
from weather as d
where d.station=$station and d.time>'$start' and d.time<'$end' group by time2 order by time2 DESC
PHQL;

        $data = $this->modelsManager->executeQuery($phql);
        $items = array();
        foreach ($data as $i)
        {
            $time = self::adjustTime($i->time2, $interval);
            $item = array(
                'time' => $time,
                'Rainspeed' => $i->Rainspeed,
                'Windspeed' => $i->Windspeed,
                'Direction' => $i->Direction,
                'Pressure' => $i->Pressure,
                'Temperature' => $i->Temperature,
                'Humidity' => $i->Humidity);
            array_push($items, $item);
        }
        return $items;
    }

    private function fetchHpicData($station, $start, $end, $interval)
    {
        $phql = <<<PHQL
select
round(avg(d.doserate), 1) as doserate,
round(avg(d.battery), 1) as battery,
round(avg(d.highvoltage), 1) as highvoltage,
round(avg(d.temperature), 1) as temperature,
d.time,
FROM_UNIXTIME(FLOOR((UNIX_TIMESTAMP(d.time) + 8 * 3600) / $interval) * $interval - 8 * 3600)  as time2
from hpic as d
where d.station=$station and d.time>'$start' and d.time<'$end' group by time2  order by time2 DESC
PHQL;

        //echo $interval;

        $data = $this->modelsManager->executeQuery($phql);
        $items = array();
        foreach ($data as $i)
        {
            $time = self::adjustTime($i->time2, $interval);
            array_push($items, array(
                'time' => $time,
                'doserate' => $i->doserate,
                'battery' => $i->battery,
                'highvoltage' => $i->highvoltage,
                'temperature' => $i->temperature));
        }
        return $items;
    }

    private function fetchLabrData($station, $start, $end, $interval)
    {
        $phql = <<<PHQL
select
FROM_UNIXTIME(CEILING((UNIX_TIMESTAMP(d.time) + 8 * 3600) / $interval) * $interval - 8 * 3600)  as time2,
round(avg(d.doserate * 1000), 1) as doserate,
round(avg(d.highvoltage), 1) as highvoltage,
round(avg(d.temperature), 1) as temperature,
d.time,
FROM_UNIXTIME(FLOOR((UNIX_TIMESTAMP(d.time) + 8 * 3600) / $interval) * $interval - 8 * 3600)  as time2
from labr as d
where d.station=$station and d.time>'$start' and d.time<'$end' group by time2 order by time2 DESC
PHQL;

        $data = $this->modelsManager->executeQuery($phql);
        $items = array();
        foreach ($data as $i)
        {
            $time = self::adjustTime($i->time2, $interval);
            array_push($items, array(
                'time' => $time,
                'doserate' => $i->doserate,
                'highvoltage' => $i->highvoltage,
                'temperature' => $i->temperature));
        }
        return $items;
    }

    private function fetchLabrFilterData($station, $start, $end, $interval)
    {
        $phql = <<<PHQL
select
FROM_UNIXTIME(CEILING((UNIX_TIMESTAMP(d.time) + 8 * 3600) / $interval) * $interval - 8 * 3600)  as time2,
round(avg(d.doserate), 1) as doserate,
round(avg(d.highvoltage), 1) as highvoltage,
round(avg(d.temperature), 1) as temperature,
round(avg(d.bgsimilarity), 1) as bgsimilarity,
round(avg(d.cps), 1) as cps,
d.time,
FROM_UNIXTIME(FLOOR((UNIX_TIMESTAMP(d.time) + 8 * 3600) / $interval) * $interval - 8 * 3600)  as time2
from labrfilter as d
where d.station=$station and d.time>'$start' and d.time<'$end' group by time2 order by time2 DESC
PHQL;

        $data = $this->modelsManager->executeQuery($phql);
        $items = array();
        foreach ($data as $i)
        {
            $time = self::adjustTime($i->time2, $interval);
            array_push($items, array(
                'time' => $time,
                'doserate' => $i->doserate,
                'highvoltage' => $i->highvoltage,
                'temperature' => $i->temperature,
                'bgsimilarity' => $i->bgsimilarity,
                'cps' => $i->cps));
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
FROM_UNIXTIME(FLOOR((UNIX_TIMESTAMP(d.time) + 8 * 3600) / $interval) * $interval - 8 * 3600)  as time2
from Environment as d
where d.station=$station and d.time>'$start' and d.time<'$end' group by time2 order by time2 DESC
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

        return parent::result(array("items" => $items, 'count' => count($items)));
    }

    public function fetchHpgeData2Action($station)
    {
        if ($this->request->isPost())
        {
            $payload = $this->request->getPost();
            $start = $payload['start'];
            $end = $payload['end'];
        }

        $condition = "station=$station";
        $condition .= " and time >= '$start' and time < '$end'";

        $data = HpgeData::find(array($condition, 'order' => 'time desc'));

        $items = array();
        foreach ($data as $item)
        {
            array_push($items, $item);
        }

        return parent::result(array("items" => $items, 'count' => count($items)));
    }

    public function downloadHpgeData2Action($station)
    {
        if ($this->request->isPost())
        {
            $payload = $this->request->getPost();
            $start = $payload['start'];
            $end = $payload['end'];
        }

        $condition = "station=$station";
        $condition .= " and time >= '$start' and time < '$end'";

        $fileName = "hpge_{$start}_{$end}.csv";
        Header("Content-type: application/octet-stream;charset=UTF-8");
        Header("Accept-Ranges: bytes");
        Header("Accept-Length:-1");
        Header("Content-Disposition: attachment; filename=" . $fileName);
        echo pack('H*','EFBBBF');   // 写入 BOM header for UTF8 files.

        echo "时间,核素,活度,总流量,活度浓度\r\n";
        $data = HpgeData::find(array($condition, 'order' => 'time desc'));

        foreach ($data as $i)
        {
            $nuclideName = ucfirst( strtolower($i->nuclide) );
            $result1 = sprintf("%e", $i->value);
            $result2 = sprintf("%e", $i->cvalue);
            echo "{$i->time},{$nuclideName},{$result1},{$i->flow},{$result2}\r\n";
        }

        // return parent::result(array("items" => $items, 'count' => count($items)));
    }

    // ZM: 界面取最新时间，看设备是否还在上传（设备运行，停止的依据）
    public function latestAction($station, $device)
    {
        $status = Cache::getLatest($this->redis, $station, $device);
        if ($status === false) {
            $status = 0;
        }
        return parent::result(array('station' => $station, 'device' => $device, 'status' => $status));
    }

    public function alertsAction($station, $device, $level)
    {
        $condition = "station_id=$station and handled=0 and level=$level";

        $modelName = $device . 'Alert';

        $alerts =  $modelName::find(array($condition, 'order' => 'time desc'));
        $ret = array();
        foreach ($alerts as $alert)
        {
            array_push($ret, $alert);
        }

        return parent::result(array('station' => $station, 'device' => $device, 'items' => $ret));
    }

    public function doorAlertsAction($station, $device, $level)
    {
        $condition = "station=$station and handled=0";

        $modelName = $device . 'Alert';

        $alerts =  $modelName::find(array($condition, 'order' => 'Time desc'));
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

            //$item = strtoupper($item);
            $data->$item = $value;
        }
        return $data;
    }
    
    //统计某个月获取率（已弃用）
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

    //统计某个月获取率
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

    private function checkLabr($station, $device)
    {
        $payload = $this->request->getPost();
        $start = $payload['start'];
        $end = $payload['end'];
        $expect = 288;
        $set = $payload['set'];

        $data = $device::find(array("station=$station and time >= '$start' and time < '$end'"));
        if (count($data) != $expect)
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
            for ($i = $b; $i < $e; $i += 300)
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
        else
        {
            return parent::result(array('times' => array(), 'count' => count($data)));
        }
    }

    //check lose history data
    public function checkAction($station, $device)
    {
        if (!$this->request->isPost())
        {
            return parent::error(Error::BadHttpMethod, '');
        }

        if ($device == 'labr' || $device == 'labrfilter')
        {
            return $this->checkLabr($station, $device);
        }

        $payload = $this->request->getPost();
        $start = $payload['start'];
        $end = $payload['end'];
        $expect = $payload['expect'];
        $set = $payload['set'];

        $data = $device::find(array("station=$station and time >= '$start' and time < '$end'"));
        if (count($data) != $expect)
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
        else
        {
            return parent::result(array('times' => array(), 'count' => count($data)));
        }
    }

    //test in browser
    public function execSummaryAction($station, $sid)
    {
        self::summaryCinderellaData($station, $sid);
    }

    public function cinderellaSummaryAction($station)
    {
        if (!$this->request->isPost())
        {
            return parent::error(Error::BadHttpMethod, '');
        }
        $payload = $this->request->getPost();
        $start = $payload['start'];
        $end = $payload['end'];

        $data = CinderellaSum::find(array("station=$station and endtime > '$start' and endtime < '$end'"));
        $ret = array();
        foreach ($data as $item)
        {
            array_push($ret, $item);
        }
        return parent::result(array('items' => $ret));
    }

    //高纯锗统计调用（网页）
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

    //cinderella删除统计数据（网页）
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

    //cinderella统计数据（网页）
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

    //labrfilter设备获取数据库能谱数据（js）
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

    public function recentAction($modelName)
    {
        $r = $modelName::find(array("order" => "time desc", 'limit' => 10));
        foreach ($r as $i)
        {
            echo json_encode($i);
        }
    }

    public function fetchWeatherAction($station, $a, $b, $interval)
    {
        $a = $this->fetchWeatherData($station, $a, $b, $interval);
        echo json_encode($a);
    }

    public function delHpicAlertsAction()
    {
        $hpicAlerts = HpicAlert::find();
        foreach ($hpicAlerts as $item)
        {
            $item->delete();
        }
    }


    public function alertAction()
    {
        $conn = mysql_connect('127.0.0.1', 'root', 'root');
        mysql_select_db('ndcdb', $conn);
        $r = mysql_query('CREATE TABLE `ndcdb`.`alert_phone` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `station` INT NOT NULL,
  `phone` VARCHAR(45) NOT NULL,
  `name` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = MyISAM;

', $conn);
        mysql_close($conn);
        echo $r;
    }

    public function showCreateTableAction($tableName)
    {
        $conn = mysql_connect('127.0.0.1', 'root', 'root');
        mysql_select_db('ndcdb', $conn);
        $r = mysql_query("show create table $tableName;", $conn);
        print_r( mysql_fetch_row($r) );
        mysql_close($conn);
        //echo $r;
    }


    public function doorAction($station, $open)
    {
        $r = EnvironmentAlert::find(array("order" => "Time desc", 'limit' => 10));
        foreach ($r as $i)
        {
            echo json_encode($i);
            if ($station == 0)
            {
                $i->delete();
            }
        }
        if ($station == 0)
        {
            $this->redis->del('door');
        }

        if ($open)
        {
            $this->redis->hSet('door', $station, $open);
        }
        echo "--";
        echo json_encode( $this->redis->hGetAll('door') );
        echo "--";
    }

    public function simLabrFileAction()
    {
        File::recordN42File(128, "D:\\Projects\\NuclideDataCenter\\www\\view\\file\\128\\labr\\2015-03\\28\\sara0285_2015-03-28T22_10_00-5min.n42",
            '2015-03', '28', 'sara0285_2015-03-28T22_10_00-5min.n42', $this->redis);
    }

    public function flushdbAction()
    {
        $this->redis->flushdb();
    }

    public function keysAction($p)
    {
        $keys = $this->redis->keys($p);
        print_r($keys);
    }

    public function checkRedisAction($key, $operation = '')
    {
        $exists = $this->redis->exists($key);
        if ($exists)
        {
            $type = $this->redis->type($key);
            echo "Exists [$key]";
            if ($type == Redis::REDIS_HASH)
            {
                $all = $this->redis->hGetAll($key);
                $count = count($all);
                echo "Hash size=($count)\n";

                print_r($all);
            }
            else if ($type == Redis::REDIS_LIST)
            {
                $all = $this->redis->lRange($key, 0, -1);
                $count = count($all);
                echo "List size=($count)\n";
                print_r($all);
            }
            else if ($type == Redis::REDIS_STRING)
            {
                echo "(", $this->redis->get($key), ")";
            }
            else if ($type == Redis::REDIS_SET)
            {
                $all = $this->redis->sMembers($key);
                $count = count($all);
                echo "Set size=($count)\n";
                print_r($all);
            }

            if ($operation == 'delete')
            {
                $this->redis->del($key);
            }
        }
    }

    public function delRedisMapAction($map, $key)
    {
        $this->redis->hDel($map, $key);
    }

    /* set get ~~~ */
    public function setValAction($k, $v = false)
    {
        if (!$v)
        {
            return parent::error(405, 'No value param');
        }

        if ($k[0] != '@')
        {
            return parent::error(405, 'Key should begin with @');
        }
        $val = $this->redis->set($k, $v);
        return parent::result(array('set' => 'success', 'value' => $val));
    }

    public function getValAction($k)
    {
        $val = $this->redis->get($k);
        if (!$val)
        {
            return parent::error(404, 'No this value');
        }
        return parent::result(array( 'value' => $val));
    }
}
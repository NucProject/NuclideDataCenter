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

    public function commitAction()
    {
        if (!$this->request->isPost())
        {
            return parent::error(Error::BadHttpMethod, '');
        }

        $station = parent::getPayload("station");
        $entries = parent::getPayload("entry");

        $success = array();
        $failure = array();
        $alerts = array();
        foreach ($entries as $entry)
        {
            $data = self::getData($station, $entry);
            $device = $entry->device;
            echo json_encode($data);
            if ($data->save() !== false)
            {
                Cache::updateLatestTime($this->redis, $station, $device);
                $check = $this->checkAlertRule($station, $device, $data);
                array_push($alerts, $check);
                array_push($success, array('device' => $device, 'time' => $entry->time));
            }
            else
            {
                array_push($failure, array('device' => $device, 'time' => $entry->time));
            }

        }

        return parent::result(array("success" => $success, "failure" => $failure, 'alert' => $alerts));

    }

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
                $path = $this->checkPath($station, $fileType, $folder, $folder2);
            }
            else if ($fileType == 'hpge')
            {
                $path = $this->checkPath($station, $fileType, $folder, null);
            }

            //$path = $this->checkPath($station, $fileType, $folder, $folder2);
            $uploads = $this->request->getUploadedFiles();
            $isUploaded = false;
            #do a loop to handle each file individually
            foreach($uploads as $upload)
            {
                $fileName = $upload->getname();
                $filePath = $path . strtolower($fileName);


                ($upload->moveTo($filePath)) ? $isUploaded = true : $isUploaded = false;

                if ($fileType == 'labr')
                {
                    $this->recordN42File($station, $filePath, $folder, $folder2, $fileName);
                }
                else if ($fileType == 'hpge')
                {
                    $this->recordHpGeFile($station, $filePath, $fileName, $folder, $folder2);
                }
            }

            return parent::result(array('upload' => $isUploaded, 'station' => $station, 'fileType' => $fileType));
        }
        return parent::error(Error::BadPayload, '');
    }

    private function recordHpGeFile($station, $filePath, $fileName, $sid, $params)
    {
        $p = explode(',', $params);
        $d = new Hpge();
        $d->sid = $sid;
        $d->station = $station;
        $d->path = "/download/hpge/$station/$sid/$fileName";
        $d->time = $p[0];
        $d->starttime = $p[1];
        $d->endtime = $p[2];
        $d->mode = $p[3];
        $d->save();
    }

    private function recordN42File($station, $filePath, $month, $day, $fileName)
    {
        $xml = simplexml_load_file($filePath);

        $data = parent::getN42Data($xml);

        $n42Path = "/download/labr/$station/$month/$day/$fileName";

        $d = new Labr();
        $d->station = $station;
        $d->time = $d->endtime = $data['endtime'];
        $d->starttime = $data['starttime'];
        $d->doserate = $data['doserate'];
        $d->temperature = $data['temperature'];
        $d->highvoltage = $data['highvoltage'];
        $d->refnuclidefound = $data['nuclidefound'];
        $d->N42path = $n42Path;
        $d->save();
    }

    public function fetchAction($station, $device)
    {
        if ($this->request->isPost())
        {
            $payload = $this->request->getPost();
            $start = $payload['start'];
            $end = $payload['end'];
        }
        else
        {
            $start = $this->request->getQuery('start');
            $end = $this->request->getQuery('end');
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
            array_push($items, $item);
        }

        // echo "($from, $to)";

        return parent::result(array("items" => $items));

    }

    private function checkPath($station, $fileType, $folder, $folder2)
    {

        if (isset($folder2))
        {
            $ret = ".\\view\\file\\$station\\$fileType\\$folder\\$folder2\\";
        }
        else
        {
            $ret = ".\\view\\file\\$station\\$fileType\\$folder\\";
        }

        if (!file_exists($ret))
        {
            $stationPath = ".\\view\\file\\$station";
            if (!file_exists($stationPath))
            {
                mkdir($stationPath);
            }

            $devicePath = "$stationPath\\$fileType";
            if (!file_exists($devicePath))
            {
                mkdir($devicePath);
            }

            $folderPath = "$devicePath\\$folder";
            if (!file_exists($folderPath))
            {
                mkdir($folderPath);
            }

            if (isset($folder2))
            {
                $folderPath2 = "$folderPath\\$folder2";
                if (!file_exists($folderPath2))
                {
                    mkdir($folderPath2);
                }
            }

        }
        return $ret;
    }

    public function latestAction($station, $device)
    {
        $time = Cache::getLatestTime($this->redis, $station, $device);
        return parent::result(array('station' => $station, 'device' => $device, 'time' => $time));
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

        $alerts =  $modelName::find(array($condition));
        $ret = array();
        foreach ($alerts as $alert)
        {
            array_push($ret, $alert);
        }

        return parent::result(array('station' => $station, 'device' => $device, 'items' => $ret));
    }


    private function checkAlertRule($station, $device, $data)
    {
        $values = AlertRule::getAlertValues($this->redis, $station, $device);

        $rules = Config::$d[$device];

        $ret = array();
        foreach ($values as $value)
        {
            echo json_encode($value);
            $field = $value->field;
            $rule = $rules[$field];
            echo json_encode($rule);

            if ($rule['rule'] == 0)
            {
                if ($data->$field > $value->v1)
                {
                    $saved = self::addAlertData($station, $device, $data, $field, $value->v1, $value->v2);
                    array_push($ret, array($field => $saved));
                }

            }
            else if ($rule->rule == 1)
            {
                // TODO:
            }

        }
        return $ret;
    }

    private static function addAlertData($station, $device, $data, $field, $v1, $v2)
    {
        $modelName = $device . 'Alert';
        $d = new $modelName();

        $d->time = $data->time;
        $d->station_id = $station;
        $d->field = $field;
        $d->value = $data->$field;
        $d->v1 = $v1;
        $d->v2 = $v2;
        $d->handled = 0;

        return $d->save();
    }

    private static function getData($station, $entry)
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


}
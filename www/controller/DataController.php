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

    public function uploadAction($station, $fileType, $folder)
    {
        if (!$this->request->isPost())
        {
            return parent::error(Error::BadHttpMethod, '');
        }


        if($this->request->hasFiles() == true)
        {
            $path = $this->checkPath($station, $fileType, $folder);
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
                    $this->recordN42File($station, $filePath, $fileName);
                }
            }

            return parent::result(array('upload' => $isUploaded, 'station' => $station, 'fileType' => $fileType));
        }
        return parent::error(Error::BadPayload, '');
    }

    private function recordN42File($station, $filePath, $fileName)
    {
        $xml = simplexml_load_file($filePath);
        $endTime = "";
        $startTime = "";
        $doserate = "";
        $temperature = "";
        $highvoltage = "";
        $refnuclidefound = "";
        $n42Path = "";

        $d = new Labr();
        $d->station_id = $station;
        $d->time = $d->endtime = $endTime;
        $d->starttime = $startTime;
        $d->doserate = $doserate;
        $d->temperature = $temperature;
        $d->highvoltage = $highvoltage;
        $d->refnuclidefound = $refnuclidefound;
        $d->n42path = $n42Path;
        $d->save();
    }

    public function fetchAction($station, $device)
    {
        if (!$this->request->isGet())
        {
            return parent::error(Error::BadHttpMethod, '');
        }

        $from = $this->request->getQuery("from");

        $to = $this->request->getQuery("to");

        $condition = "station=$station";
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

    private function checkPath($station, $fileType, $folder)
    {
        // $month = date("y-m", time());
        $ret = ".\\data\\$station\\$fileType\\$folder\\";
        if (!file_exists($ret))
        {
            $stationPath = ".\\data\\$station";
            if (!file_exists($stationPath))
            {
                mkdir($stationPath);
            }

            $devicePath = "$stationPath\\$fileType";
            if (!file_exists($devicePath))
            {
                mkdir($devicePath);
            }

            $monthPath = "$devicePath\\$folder";
            if (!file_exists($monthPath))
            {
                mkdir($monthPath);
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

            $field = $value->field;
            $rule = $rules[$field];

            if ($rule->rule == 0)
            {
                if ($data->$field > $rule->v1)
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
            $data->$item = $value;
        }

        return $data;
    }


}
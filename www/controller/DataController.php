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
        foreach ($entries as $entry)
        {
            $data = self::getData($station, $entry);
            $device = $entry->device;

            if ($data->save() !== false)
            {
                Cache::updateLatestTime($this->redis, $station, $device);
                $this->checkAlertRule($station, $device, $data);
                array_push($success, array('device' => $device, 'time' => $entry->time));
            }
            else
            {
                array_push($failure, array('device' => $device, 'time' => $entry->time));
            }

        }

        return parent::result(array("success" => $success, "failure" => $failure));

    }

    public function uploadAction($station, $fileType)
    {
        if (!$this->request->isPost())
        {
            return parent::error(Error::BadHttpMethod, '');
        }

        if($this->request->hasFiles() == true)
        {
            $uploads = $this->request->getUploadedFiles();
            $isUploaded = false;
            #do a loop to handle each file individually
            foreach($uploads as $upload){

                $path = ".\\data\\$station\\$fileType\\" . strtolower($upload->getname());

                ($upload->moveTo($path)) ? $isUploaded = true : $isUploaded = false;
            }

            return parent::result(array('upload' => $isUploaded, 'station' => $station, 'fileType' => $fileType));
        }
        return parent::error(Error::BadPayload, '');
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

    public function latestAction($station, $device)
    {
        $time = Cache::getLatestTime($this->redis, $station, $device);
        return parent::result(array('station' => $station, 'device' => $device, 'time' => $time));
    }

    private function checkAlertRule($station, $device, $data)
    {
        // TODO:
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
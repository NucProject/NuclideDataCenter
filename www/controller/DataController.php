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

    public function uploadAction()
    {
        if (!$this->request->isPost())
        {
            return parent::error(Error::BadHttpMethod, '');
        }


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
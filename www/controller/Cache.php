<?php

class Cache
{

    public static function addEntry($redis, $station, $device, $entry)
    {
        $key = Key::StationDeviceDataList . $station . $device;
        $redis->lPush($key, json_encode($entry));
    }

    public static function getEntries($redis, $station, $device, $from = 0, $count = 20)
    {
        $key = Key::StationDeviceDataList . $station . $device;
        $items = $redis->lRange($key, $from, $from + $count);
        $entries = array();
        foreach ($items as $item)
        {
            array_push($entries, json_decode($item));
        }
        return $entries;
    }
}
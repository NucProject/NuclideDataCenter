<?php

class Cache
{
    public static function addDataItem($redis, $station, $device, $item)
    {
        $key = Key::StationDeviceData . "[$station][$device]";
        $redis->lPush($key, json_encode($item));
    }

    public static function getDataItems($redis, $station, $device, $from = 0, $count = 20)
    {
        $key = Key::StationDeviceData . "[$station][$device]";
        $array = $redis->lRange($key, $from, $from + $count);
        $items = array();
        foreach ($array as $item)
        {
            array_push($items, json_decode($item));
        }
        return $items;
    }

    public static function updateLatestTime($redis, $station, $device, $ttl = 200)
    {
        $key = Key::StationDeviceLatest . "[$station][$device]";
        $redis->Set($key, time());
    }

    public static function updateLatestStat($redis, $station, $device, $status, $ttl = 200)
    {
        $key = Key::StationDeviceLatestStatus . "[$station][$device]";
        $redis->Setex($key, $ttl, $status);
    }

    public static function getLatest($redis, $station, $device)
    {
        $key = Key::StationDeviceLatest . "[$station][$device]";
        return $redis->Get($key);
    }

    public static function getLatestStatus($redis, $station, $device)
    {
        $key = Key::StationDeviceLatestStatus . "[$station][$device]";
        return $redis->Get($key);
    }

    public static function getCurrentSid($redis, $station)
    {
        $key = Key::StationCinderellaSid . "[$station]";
        return $redis->Get($key);
    }

    public static function setCurrentSid($redis, $station, $sid)
    {
        $key = Key::StationCinderellaSid . "[$station]";
        return $redis->Set($key, $sid);
    }


    public static function setAlertValue($redis, $station, $device)
    {

    }

    public static function getAlertValue($redis, $station, $device)
    {

    }
}
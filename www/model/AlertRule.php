<?php
/**
 * Created by PhpStorm.
 * User: Healer
 * Date: 14-6-5
 * Time: 下午8:56
 */

class AlertRule extends \Phalcon\Mvc\Model
{
    public static function setAlertValue($redis, $station, $device, $field, $v1, $v2 = null)
    {
        $condition = "station=$station and device='$device' and field='$field'";
        $alert = AlertRule::findFirst(array($condition));
        if ($alert !== false)
        {
            $alert->v1 = $v1;
            $alert->v2 = $v2;
            $alert->save();

        }
        else
        {
            $alert = new AlertRule();
            $alert->station = $station;
            $alert->device = $device;
            $alert->field = $field;
            $alert->v1 = $v1;
            $alert->v2 = $v2;
            $alert->save();

            echo "eee";
        }

        $key = Key::StationDeviceFieldRule . "[$station][$device]";
        $redis->hSet($key, $field, json_encode($alert));
    }

    public static function getAlertValue($redis, $station, $device, $field = null)
    {
        $key = Key::StationDeviceFieldRule . "[$station][$device]";

        if (isset($field))
        {
            $value = $redis->hGet($key, $field);
            if ($value !== false)
            {
                return json_decode($value);
            }
        }
        else
        {
            $values = $redis->hGetAll($key);
            if ($values !== false)
            {
                $ret = array();
                foreach ($values as $value)
                {
                    array_push($ret, json_decode($value));
                }
                return $ret;
            }
        }

        $condition = "station=$station and device='$device' and field='$field'";
        $alert = AlertRule::findFirst(array($condition));
        if ($alert !== false)
        {
            $redis->set($key, json_encode($alert));
            return $alert;
        }
    }
}
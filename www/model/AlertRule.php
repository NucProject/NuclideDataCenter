<?php
/**
 * Created by PhpStorm.
 * User: Healer
 * Date: 14-6-5
 * Time: 下午8:56
 */

class AlertRule extends \Phalcon\Mvc\Model
{
    // 设置短信报警的数据库和Redis
    // 并且情况Rule的Redis, 防止缓存过期的项目
    public static function setAlertValueShortMsg($redis, $station, $device, $field, $sm, $level = 2)
    {
        $condition = "station=$station and device='$device' and field='$field'";
        $alert = AlertRule::findFirst(array($condition));
        if ($alert)
        {
            $key = Key::StationDeviceFieldRule . "[$station][$device]";
            $redis->del($key);
            if ($level == 1)
            {
                $alert->sm1 = $sm;
                $redis->set("sm:$station:$device:$field:1", $sm);
            }
            else if ($level == 2)
            {
                $alert->sm2 = $sm;
                $redis->set("sm:$station:$device:$field:2", $sm);
            }


            $alert->save();
            return true;
        }
        else
        {
            return false;
        }

    }

    public static function setAlertValue($redis, $station, $device, $field, $value, $level = 2)
    {
        $condition = "station=$station and device='$device' and field='$field'";
        $alert = AlertRule::findFirst(array($condition));
        if ($alert !== false)
        {
            if ($level == 1)
                $alert->v1 = $value;
            else if($level == 2)
                $alert->v2 = $value;
            $alert->save();

        }
        else
        {
            $alert = new AlertRule();
            $alert->station = $station;
            $alert->device = $device;
            $alert->field = $field;
            if ($level == 1)
                $alert->v1 = $value;
            else if($level == 2)
            {
                $alert->v1 = 99999999.9;
                $alert->v2 = $value;
            }
            $r = $alert->save();
            // echo json_encode($r);
        }

        $key = Key::StationDeviceFieldRule . "[$station][$device]";
        $redis->hSet($key, strtoupper($field), json_encode($alert));
    }

    public static function getAlertValue($redis, $station, $device, $field)
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

        $condition = "station=$station and device='$device' and field='$field'";
        $alert = AlertRule::findFirst(array($condition));
        return $alert;
    }

    public static function getAlertValues($redis, $station, $device)
    {
        if ($device == 'environment')
        {
            return array(json_encode(array('station' => $station, 'device' => 'environment', 'field' => 'IfDoorOpen', 'v2' => 0.5)));
        }

        $key = Key::StationDeviceFieldRule . "[$station][$device]";
        $values = $redis->hGetAll($key);
        $ret = array();
        if (count($values) != 0)
        {
            foreach ($values as $value)
            {
                array_push($ret, json_decode($value));
            }
            return $ret;
        }

        $condition = "station=$station and device='$device'";
        $alerts = AlertRule::find(array($condition));
        if ($alerts !== false)
        {
            foreach ($alerts as $alert)
            {
                array_push($ret, $alert);
                $fieldUpper = strtoupper($alert->field);
                $redis->hSet($key, $fieldUpper, json_encode($alert));
            }
            return $ret;
        }
    }
}
<?php
/**
 * Created by PhpStorm.
 * User: Healer
 * Date: 14-6-13
 * Time: 下午9:45
 */

class AlertController extends ApiController
{
    public function getAction($station, $device)
    {
        $items = Config::$d[$device];
        $values = array();
        foreach ($items as $key => $config )
        {
            $value = AlertRule::getAlertValue($this->redis, $station, $device, $key);

            $values[$key] = array('config' => $config, 'value' => $value);
        }

        return parent::result(array('values' => $values));
    }

    public function setAction($station, $device)
    {
        $field = $this->request->getPost("f");
        $value = $this->request->getPost("v");
        $level = $this->request->getPost("l");
        AlertRule::setAlertValue($this->redis, $station, $device, $field, $value, $level);
        return parent::result(array('set' => true));
    }

    // TODO:
    public function configAction($device)
    {
        return parent::result(Config::$d[$device]);
    }

    public function handleAction()
    {
        $device = $this->request->getPost("device");
        $idList = $this->request->getPost("idList");

        if (isset($device) && isset($idList))
        {
            $alert = $device . 'Alert';

            $idArray = explode(',', $idList);
            foreach ($idArray as $id)
            {
                $d = $alert::findFirst($id);
                if ($d)
                {
                    $d->handled = 1;
                    if (!$d->save())
                    {
                        return parent::error(Error::BadRecord, '');
                    }
                }
            }

            return parent::result(array('handled' => true));
        }
        return parent::error(Error::BadPayload, '');
    }

    public function countAction()
    {
        $c1 = HpicAlert::count('handled = 0 and level is not null');
        // $c2 = WeatherAlert::count('handled = 0');
        $c3 = LabrAlert::count('handled = 0 and level is not null');
        $c4 = HpgeAlert::count('handled = 0 and level is not null');
        // $c5 = EnvironmentAlert::count('handled = 0');
        // $c6 = CinderelladataAlert::count('handled = 0');
        // $c7 = LabrFilterAlert::count('handled = 0');

        $count = $c1 + $c3 + $c4;
        return parent::result(array(
            'hpic' => $c1,
            // 'weather' => $c2,
            'labr' => $c3,
            'hpge' => $c4,
            // 'environment' => $c5,
            // 'cinderella' => $c6,
            // 'labrfilter' => $c7,
            'count' => $count
        ));
    }

    public function count2Action()
    {
        $dateCondition = '';
        $start = $this->request->getQuery('start');
        if (isset($start))
        {
            $end = $this->request->getQuery('end');
            $dateCondition = " and time >= '$start' and time < '$end'";
        }

        $c1 = HpicAlert::count('handled = 0' . $dateCondition);
        //$c2 = WeatherAlert::count('handled = 0' . $dateCondition);
        $c3 = LabrAlert::count('handled = 0' . $dateCondition);
        $c4 = HpgeAlert::count('handled = 0' . $dateCondition);
        //$c5 = EnvironmentAlert::count('handled = 0' . $dateCondition);
        //$c6 = CinderelladataAlert::count('handled = 0' . $dateCondition);
        //$c7 = LabrFilterAlert::count('handled = 0' . $dateCondition);

        $count = $c1 + $c3 + $c4;
        return parent::result(array(
            'hpic' => $c1,
            //'weather' => $c2,
            'labr' => $c3,
            'hpge' => $c4,
            //'environment' => $c5,
            //'cinderella' => $c6,
            //'labrfilter' => $c7,
            'count' => $count
        ));
    }

    private static function doEnvAlert($station, $time, $open)
    {
        $e = new EnvironmentAlert();
        $e->Time = $time;
        $e->station = $station;
        $e->IfDoorOpen = $open;
        $e->save();
    }

    public static function checkAlertRule($redis, $station, $device, $data)
    {
        if ($device == 'environment')
        {
            $open = intval($data->IfDoorOpen);
            $lastDoorStatus = $redis->hGet('door', $station);
            if ($lastDoorStatus === false)
            {
                $redis->hSet('door', $station, 0);
                $lastDoorStatus = 0;
            }

            if ($open != $lastDoorStatus)
            {
                $redis->hSet('door', $station, $open);
                self::doEnvAlert($station, $data->time, $open);
            }
            return;
        }
        $values = AlertRule::getAlertValues($redis, $station, $device);

        $rules = Config::$d[$device];

        $ret = array();
        foreach ($values as $value)
        {
            $field = $value->field;
            $fieldUpper = strtoupper($field);
            $fieldLower = strtolower($field);
            $level = $rules[$fieldUpper]['level'];

            if (array_key_exists('is_nuclide', $data))
            {
                if ($data->field != $field)
                {
                    continue;
                }
            }

            $fieldValue = 0;
            if (array_key_exists($fieldUpper, $data)) {
                $fieldValue = $data->$fieldUpper;
            } else if (array_key_exists($fieldLower, $data)) {
                $fieldValue = $data->$fieldLower;
            }

            // 此处特殊处理
            if ($device == 'labr' && $fieldLower == 'doserate')
            {
                $fieldValue *= 1000;
            }

            $dataValue = array_key_exists('is_nuclide', $data) ? $data->value : $fieldValue;
            // echo "{$value->v1}{$value->v2}-";
            if ($level == 2)
            {
                if ($dataValue > $value->v1) {
                    $saved = self::addAlertData($station, $device, $data, $field, $dataValue, $value->v1, $value->v2, 1);

                    self::trySendAlertShortMsg($station, $device, 'level1', $redis);
                    array_push($ret, array($field => $saved));
                } elseif ($dataValue > $value->v2) {
                    $saved = self::addAlertData($station, $device, $data, $field, $dataValue, $value->v1, $value->v2, 2);
                    array_push($ret, array($field => $saved));
                }
            }
            elseif ($level == 1) {
                if ($dataValue > $value->v2) {

                    $saved = self::addAlertData($station, $device, $data, $field, $dataValue, null, $value->v2, 2);
                    array_push($ret, array($field => $saved));
                }
            }

        }
        return $ret;
    }

    private static function addAlertData($station, $device, $data, $field, $value, $v1, $v2, $level = 1)
    {
        $modelName = $device . 'Alert';
        $d = new $modelName();
        // print_r($data);
        // echo $station, $data->time, $field, $value, '~',$v1, '~',$v2, '~',$level,'~';
        $d->time = $data->time;
        $d->station_id = $station;
        $d->field = $field;
        $d->value = $value;
        $d->v1 = $v1;
        $d->v2 = $v2;
        $d->handled = 0;
        $d->level = $level;

        $result = $d->save();
        return $result;
    }

    /**
     * @param $station
     * @param $device
     * @param $type
     * @param $redis
     * @return bool     offline(离线) | level1(一级报警)
     */
    static function trySendAlertShortMsg($station, $device, $type, $redis)
    {
        if (self::canSendAlertShortMsg($station, $device, $type, $redis))
        {
            return self::sendAlertShortMsg($station, $device, $type, $redis);
        }
        return false;
    }

    static function checkDeviceOnline($redis, $station)
    {
        $curTime = time();

        $devices = array('hpic', 'hpge', 'labr', 'weather', 'cinderelladata', 'environment');

        foreach ($devices as $device)
        {
            $key = "s:d:time[$station][$device]";
            $time = $redis->Get($key);

            if ($curTime - $time > 3600 * 4)
            {
                // 超过1个小时没有数据了
                if (self::canSendAlertShortMsg($station, $device, 'offline', $redis))
                {
                    self::sendAlertShortMsg($station, $device, 'offline', $redis);
                }
            }

        }
    }

    /**
     * @param
     * @param
     * @param
     * @param
     *
     * @return bool
     * Find this alert last time, if time past over the duration...
     */
    static function canSendAlertShortMsg($station, $device, $type, $redis)
    {
        $duration = $redis->get("alarm:duration@$station");
        if (!$duration)
            $duration = 3600 * 4;

        $key = "$device:$type";
        $time = $redis->hGet("alarm@$station", $key);

        if (time() - $time > $duration)
        {
            return true;
        }
        return false;
    }

    static function sendAlertShortMsg($station, $device, $type, $redis)
    {
        $redis->set('a', 2);
        $phones = $redis->sMembers("alarm:phone@$station");
        array_push($phones, '15313195062');
        $message = self::getAlertShortMsgText($station, $device, $type);
        foreach ($phones as $phone)
        {
            $redis->set('a', 3);
            ShortMsg::send($phone, $message);
        }

        $key = "$device:$type";
        $redis->hSet("alarm@$station", $key, time());
        return true;
    }

    static function getAlertShortMsgText($station, $device, $type)
    {
        $stationName = '';
        if ($station == 128)
        {
            $stationName = '北京辐射环境监测站';
        }

        $deviceName = '';
        if ($device == 'hpic')
        {
            $deviceName = '高压电离室';
        }
        else if ($device == 'labr')
        {
            $deviceName = '溴化镧谱仪';
        }
        else if ($device == 'hpge')
        {
            $deviceName = '高纯锗谱仪';
        }
        else if ($device == 'environment')
        {
            $deviceName = '环境与安防监控';
        }

        $alarmText = '警报';
        if ($type == 'level1')
        {
            if ($device == 'hpic')
            {
                $alarmText = '剂量率一级警报';
            }
        }
        else
        {
            $alarmText = '已经离线';
        }
        return $stationName . $deviceName . $alarmText. "!";
    }



} 
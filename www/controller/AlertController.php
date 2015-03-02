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
        $field = $this->request->getQuery("f");

        $values = AlertRule::getAlertValue($this->redis, $station, $device, $field);
        return parent::result(array('values' => $values));
    }

    public function setAction($station, $device)
    {
        $field = $this->request->getPost("f");
        $value1 = $this->request->getPost("v1");
        $value2 = $this->request->getPost("v2");
        AlertRule::setAlertValue($this->redis, $station, $device, $field, $value1, $value2);
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


    public static function checkAlertRule($redis, $station, $device, $data)
    {
        $values = AlertRule::getAlertValues($redis, $station, $device);

        $rules = Config::$d[$device];

        $ret = array();
        foreach ($values as $value)
        {
            // echo json_encode($value);
            $field = $value->field;
            $level = $rules[$field]['level'];

            if (array_key_exists('is_nuclide', $data))
            {
                if ($data->field != $field)
                {
                    continue;
                }
            }

            $dataValue = array_key_exists('is_nuclide', $data) ? $data->value : $data->$field;

            if ($level == 2)
            {
                if ($dataValue > $value->v2) {
                    $saved = self::addAlertData($station, $device, $data, $field, $dataValue, $value->v1, $value->v2, 2);
                    array_push($ret, array($field => $saved));
                } elseif ($dataValue > $value->v1) {
                    $saved = self::addAlertData($station, $device, $data, $field, $dataValue, $value->v1, $value->v2, 1);
                    array_push($ret, array($field => $saved));
                }
            }
            elseif ($level == 1) {
                if ($dataValue > $value->v1) {

                    $saved = self::addAlertData($station, $device, $data, $field, $dataValue, $value->v1, $value->v2, 1);
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

        $d->time = $data->time;
        $d->station_id = $station;
        $d->field = $field;
        $d->value = $value;
        $d->v1 = $v1;
        $d->v2 = $v2;
        $d->handled = 0;
        $d->level = $level;

        return $d->save();
    }
} 
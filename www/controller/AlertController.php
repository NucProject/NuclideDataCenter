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


    public function configAction($device)
    {
        return parent::result(Config::$d[$device]);
    }

    public function handleAction()
    {
        $device = $this->request->getPost("device");
        $id = $this->request->getPost("id");
        $comment = $this->request->getPost("comment");

        if (isset($device) && isset($id) && isset($comment))
        {
            $alert = $device . 'Alert';
            $d = $alert::findFirst($id);
            if ($d)
            {
                $d->handled = 1;
                $d->comment = $comment;
                if ($d->save())
                {
                    return parent::result(array('handled' => 1));
                }
                return parent::error(Error::BadRecord, '');
            }
            return parent::error(Error::BadRecord, '');
        }
        return parent::error(Error::BadPayload, '');
    }

    public function countAction()
    {
        $c1 = HpicAlert::count('handled = 0');
        $c2 = WeatherAlert::count('handled = 0');
        $c3 = LabrAlert::count('handled = 0');
        $c4 = HpgeAlert::count('handled = 0');
        $c5 = EnvironmentAlert::count('handled = 0');
        $c6 = CinderelladataAlert::count('handled = 0');

        $count = $c1 + $c2 + $c3 + $c4 + $c5 + $c6;
        return parent::result(array(
            'hpic' => $c1,
            'weather' => $c2,
            'labr' => $c3,
            'hpge' => $c4,
            'environment' => $c5,
            'cinderella' => $c6,
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
        $c2 = WeatherAlert::count('handled = 0' . $dateCondition);
        $c3 = LabrAlert::count('handled = 0' . $dateCondition);
        $c4 = HpgeAlert::count('handled = 0' . $dateCondition);
        $c5 = EnvironmentAlert::count('handled = 0' . $dateCondition);
        $c6 = CinderelladataAlert::count('handled = 0' . $dateCondition);

        $count = $c1 + $c2 + $c3 + $c4 + $c5 + $c6;
        return parent::result(array(
            'hpic' => $c1,
            'weather' => $c2,
            'labr' => $c3,
            'hpge' => $c4,
            'environment' => $c5,
            'cinderella' => $c6,
            'count' => $count
        ));
    }


    public function checkAlertRule($redis, $station, $device, $data)
    {
        $values = AlertRule::getAlertValues($redis, $station, $device);

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
} 
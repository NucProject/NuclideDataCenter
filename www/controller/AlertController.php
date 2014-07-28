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
} 
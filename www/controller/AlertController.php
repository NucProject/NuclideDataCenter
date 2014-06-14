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
        $rule = $this->request->getPost("r");
        $value1 = $this->request->getPost("v1");
        $value2 = $this->request->getPost("v2");
        AlertRule::setAlertValue($this->redis, $station, $device, $field, $rule, $value1, $value2);
    }


    public function configAction($device)
    {
        return parent::result(Config::$d[$device]);
    }
} 
<?php
/**
 * Created by PhpStorm.
 * User: Healer
 * Date: 14-6-5
 * Time: 下午9:30
 */

class MainController extends ApiController
{
    public function initialize()
    {
    }

    public function indexAction()
    {
        $this->view->pick("index/index");
    }

    public function stationsAction($userId)
    {
        $phql =
            "SELECT S.station_id, S.name, S.station, US.user_id, count(US.user_id) as count FROM Station as S " .
            "LEFT JOIN UserStation as US ON S.station_id=US.station_id and US.user_id=$userId " .
            "GROUP BY US.station_id HAVING US.user_id=$userId";

        $stations = $this->modelsManager->executeQuery($phql);
        $ret = array();
        foreach ($stations as $station)
        {

            array_push($ret, $station);
        }

        return parent::result(array("items" => $ret));
    }
} 
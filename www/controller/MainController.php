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

    public function stationsAction()
    {

    }
} 
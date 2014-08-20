<?php
/**
 * Created by PhpStorm.
 * User: Healer
 * Date: 14-7-6
 * Time: 上午11:48
 */

class CommandController extends ApiController
{


    public function queryAction($station)
    {
        $queue = Key::StationCommandQueue . $station;

        $command = $this->redis->lPop($queue);

        $command = json_decode($command);
        return parent::result($command);
    }

    public function postAction()
    {
        if (!$this->request->isPost())
        {
            return parent::error(Error::BadHttpMethod, '');
        }

        $payload = $this->request->getPost();
        $station = $payload['station'];

        $type = $payload['type'];
        $device = $payload['device'];
        $content = $payload['content'];
        $queue = Key::StationCommandQueue . $station;
        $this->redis->rPush($queue, json_encode(
            array('type' => $type, 'device' => $device, 'content' => $content)));

        return parent::result(array('post' => true));
    }
} 
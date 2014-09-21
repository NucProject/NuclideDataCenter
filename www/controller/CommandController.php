<?php
/**
 * Created by PhpStorm.
 * User: Healer
 * Date: 14-7-6
 * Time: 上午11:48
 */

class CommandController extends ApiController
{
    // Query DC commands from client.
    // Used for KeepAlive also
    public function queryAction($station)
    {
        $queue = Key::StationCommandQueue . $station;

        $command = $this->redis->lPop($queue);

        $lastTime = (int)$this->redis->hGet(Key::KeepAlive, $station);
        $now = time();

        $c = ConnAlert::findFirst(array("station=$station", 'order' => 'id desc'));
        if ($c)
        {
            $beginTime = $c->begintime;
            $offlineTime = date('Y-m-d H:i:s', $now + 20);
            $c->begintime = $offlineTime;
            $c->endtime = $offlineTime;
            $c->save();


            if ($now - parent::parseTime2($beginTime) > 60)
            {

            }
            else
            {

            }
        }

        if ($now - $lastTime > 120)
        {
            $a = new ConnAlert();
            $a->begintime = date('', $now);
            $a->save();
        }


        $this->redis->hSet(Key::KeepAlive, $station, $now);

        $command = json_decode($command);
        return parent::result($command);
    }

    public function aliveAction($station)
    {
        $time = (int)$this->redis->hGet(Key::KeepAlive, $station);
        return parent::result(array('keep-alive' => (time() - $time)));
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

    public function cinderellaAction($station)
    {
        if ($this->request->isPost())
        {
            $status = $this->request->getRawBody();
            $queue = Key::StationCinderellaStatus . $station;
            $this->redis->set($queue, $status);
            return parent::result(array('update' => true));
        }
        else if ($this->request->isGet())
        {
            $queue = Key::StationCinderellaStatus . $station;
            $status = $this->redis->get($queue);
            return parent::result(array('status' => $status));
        }

        return parent::error(Error::BadHttpMethod, '');
    }
}
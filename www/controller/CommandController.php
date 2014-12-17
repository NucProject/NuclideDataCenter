<?php
/**
 * Created by PhpStorm.
 * User: Healer
 * Date: 14-7-6
 * Time: 上午11:48
 */

class CommandController extends ApiController
{

    public function clearAction($station)
    {
        $queue = Key::StationCommandQueue . $station;
        $command = $this->redis->del($queue);
        return parent::result($command);
    }

    // Query DC commands from client.
    // Used for KeepAlive also
    public function queryAction($station)
    {
        $queue = Key::StationCommandQueue . $station;

        $now = time();
        $offlineTime = date('Y-m-d H:i:s', $now + 20);
        $this->redis->hSet(Key::KeepAlive, $station, $now);

        $c = ConnAlert::findFirst(array("station=$station", 'order' => 'id desc'));
        if ($c)
        {
            $beginTime = $c->begintime;

            if ($now - parent::parseTime2($beginTime) > 120)
            {
                // Connection recovered
                $c->endtime = date('Y-m-d H:i:s', $now);
                $c->save();

                $c = new ConnAlert();
                $c->station = $station;
                $c->begintime = $offlineTime;
                $c->endtime = $offlineTime;
                $c->handled = 0;
                $c->save();
            }
            else
            {
                $c->begintime = $offlineTime;
                $c->endtime = $offlineTime;
                $c->save();
            }
        }
        else
        {
            $c = new ConnAlert();
            $c->station = $station;
            $c->begintime = $offlineTime;
            $c->endtime = $offlineTime;
            $c->handled = 0;
            $c->save();
        }

        $command = $this->redis->lPop($queue);
        $command = json_decode($command);
        return parent::result($command);
    }

    public function onlineAction($station)
    {
        $time = $this->redis->hGet(Key::KeepAlive, $station);
        return parent::result(array('diff' => (time() - $time), 'time' => $time));
    }

    public function aliveAction($station)
    {
        $items = ConnAlert::find(array("station = $station", 'order' => 'id desc', 'limit' => 10));
        $ret = array();
        foreach ($items as $item)
        {
            array_push($ret, $item);
        }
        return parent::result(array('items' => $ret));
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

        self::addCommand($this->redis, $station, $type, $device, $content);

        /*
        $queue = Key::StationCommandQueue . $station;
        $this->redis->rPush($queue, json_encode(
            array('type' => $type, 'device' => $device, 'content' => $content)));
        */

        return parent::result(array('post' => true));
    }

    public static function addCommand($redis, $station, $type, $device, $content)
    {
        $queue = Key::StationCommandQueue . $station;
        $redis->rPush($queue,
            json_encode(array('type' => $type, 'device' => $device, 'content' => $content)));
    }

    public function cinderellaAction($station)
    {
        if ($this->request->isPost())
        {
            $status = $this->request->getRawBody();
            $queue = Key::StationCinderellaStatus . $station;
            $this->redis->set($queue, json_encode(array('status' => $status, 'time' => time())));
            return parent::result(array('update' => true));
        }
        else if ($this->request->isGet())
        {
            $queue = Key::StationCinderellaStatus . $station;
            $json = $this->redis->get($queue);
            $d = json_decode($json, true);
            return parent::result(array('status' => $d['status'], 'time' => $d['time']));
        }

        return parent::error(Error::BadHttpMethod, '');
    }
}
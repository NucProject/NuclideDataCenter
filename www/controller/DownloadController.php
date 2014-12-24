<?php
/**
 * Created by PhpStorm.
 * User: Healer
 * Date: 14-7-23
 * Time: 下午11:52
 */

class DownloadController extends ApiController
{
    // ZM: 北京站有两个文件下载的地方，走这里。
    public function hpgeAction($station, $sid, $fileName)
    {
        Header("HTTP/1.1 303 See Other");
        Header("Content-type: application/octet-stream");
        Header("Location: /file/$station/hpge/$sid/$fileName");
        exit;
    }

    public function labrAction($station, $month, $day, $fileName)
    {
        Header("HTTP/1.1 303 See Other");
        Header("Content-type: application/octet-stream");
        Header("Location: /file/$station/labr/$month/$day/$fileName");
        exit;
    }


    public static function getEnergyAction()
    {
        $file = "./view/file/128/labr/2014-08/12/sara0292_2014-08-12T15_10_00-5min.n42";
        // echo $file;
        if (file_exists($file))
        {
            $xml = simplexml_load_file($file);
            $namespaces = $xml->getNameSpaces(true);
            $prefix     = array_keys($namespaces);


            $m = $xml->children($namespaces[$prefix[0]])->Measurement;

            $specs = $m->children($namespaces[$prefix[0]])->Spectrum->children($namespaces[$prefix[0]]);



            $r = $m->children($namespaces[$prefix[0]])->AnalysisResults->children($namespaces[$prefix[0]]);

            $n = $r->NuclideAnalysis->children($namespaces[$prefix[0]]);

            $ns = $n->Nuclide;
            $nuclideCount = count($n->Nuclide);
            $nr = array();
            for ($i = 0; $i < $nuclideCount; $i += 1)
            {
                $nuclide = $ns[$i];
                $items = $nuclide->children($namespaces[$prefix[0]]);
                $saras = $nuclide->children($namespaces[$prefix[1]]);
                if ($items->NuclideIDConfidenceIndication != 0)
                {
                    $a = $saras->Peak[0]->attributes();
                    echo "$items->NuclideName";

                }
            }



        }
    }



    public function energyAction($download, $labr, $station, $month, $day, $fileName)
    {
        if ($download == 'download' && $labr == 'labr')
        {
            $file = "./view/file/$station/labr/$month/$day/$fileName";
            // echo $file;
            if (file_exists($file))
            {
                $xml = simplexml_load_file($file);
                $namespaces = $xml->getNameSpaces(true);
                $prefix     = array_keys($namespaces);


                $m = $xml->children($namespaces[$prefix[0]])->Measurement;

                $specs = $m->children($namespaces[$prefix[0]])->Spectrum->children($namespaces[$prefix[0]]);

                $datas = explode(' ', $specs->ChannelData);

                $c2 = count($specs->Calibration);
                $params = $specs->Calibration[$c2 - 1]->Equation->Coefficients;


                list($c, $b, $a) = explode(' ', $params);

                $r = $m->children($namespaces[$prefix[0]])->AnalysisResults->children($namespaces[$prefix[0]]);

                $n = $r->NuclideAnalysis->children($namespaces[$prefix[0]]);

                $ns = $n->Nuclide;
                $nuclideRet = array();
                $nuclideCount = count($n->Nuclide);
                for ($i = 0; $i < $nuclideCount; $i += 1)
                {
                    $nuclide = $ns[$i];
                    $items = $nuclide->children($namespaces[$prefix[0]]);
                    $saras = $nuclide->children($namespaces[$prefix[1]]);
                    if ("{$items->NuclideIDConfidenceIndication}" != 0)
                    {
                        for ($j = 0; $j < count($saras->Peak); $j += 1)
                        {
                            $attrs = $saras->Peak[$j]->attributes();
                            $channel = $attrs['Channel'];
                            $channel = intval("$channel");
                            $c1 = self::getChannel($channel - 10, $a, $b, $c);
                            $c2 = self::getChannel($channel + 10, $a, $b, $c);
                            $nuclideRet[] = array(
                                'nuclide' => "$items->NuclideName",
                                'ind' => "{$items->NuclideIDConfidenceIndication}",
                                'doserate' => "{$saras->DoseRate}",
                                'c1' => $c1, 'c2' => $c2);
                        }
                    }
                }

                $data = implode(';', $this->getPoints($datas, $a, $b, $c));

                return parent::result(array(
                    'data' => $data,
                    'nuclides' => $nuclideRet
                ));
            }
        }
    }

    public function energy2Action($station)
    {
        $time = $this->request->getPost('time');
        if ($time)
        {
            $data = Labr::find(array("time = '$time' and station=$station", 'limit' => 1));
            if (count($data) > 0)
            {

                $item = $data[0];

                $args = explode('/', $item->N42path);

                call_user_func_array(array($this, 'energyAction'), array_slice($args, 1));
            }

        }
    }

    private function getPoints($datas, $a, $b, $c)
    {
        $a = floatval($a);
        $b = floatval($b);
        $c = floatval($c);

        $n = array();

        for ($j = 1; $j <= 2048; $j++)
        {
            $r = $j + 0.5;
            $ex = round($a * $r * $r + $b * $r + $c, 2);

            $v = $datas[$j - 1];
            $n[] = "$ex, $v";
            if ($ex >= 3200)
                break;

        }
        return $n;
    }

    private static function getChannel($channel, $a, $b, $c)
    {
        $r = $channel + 0.5;
        $ex = round($a * $r * $r + $b * $r + $c, 2);
        return $ex;
    }
} 
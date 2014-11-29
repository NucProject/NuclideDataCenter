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
                $params = $specs->Calibration[1]->Equation->Coefficients;
                if (!$params)
                {
                    $params = $specs->Calibration->Equation->Coefficients;
                }
                list($c, $b, $a) = explode(' ', $params);
                echo implode(';', $this->getPoints($datas, $a, $b, $c));
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
} 
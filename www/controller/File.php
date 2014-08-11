<?php
/**
 * Created by PhpStorm.
 * User: Healer
 * Date: 14-8-10
 * Time: 下午11:38
 */

class File
{
    public static function recordHpGeFile($station, $filePath, $fileName, $sid, $params)
    {
        $p = explode(',', $params);
        $d = new Hpge();
        $d->sid = $sid;
        $d->station = $station;
        $d->path = "/download/hpge/$station/$sid/$fileName";
        $d->time = $p[0];
        $d->starttime = $p[1];
        $d->endtime = $p[2];
        $d->mode = $p[3];
        $d->save();
    }

    public static function recordN42File($station, $filePath, $month, $day, $fileName)
    {
        $xml = simplexml_load_file($filePath);

        $data = parent::getN42Data($xml);

        $n42Path = "/download/labr/$station/$month/$day/$fileName";

        $d = new Labr();
        $d->station = $station;
        $d->time = $d->endtime = $data['endtime'];
        $d->starttime = $data['starttime'];
        $d->doserate = $data['doserate'];
        $d->temperature = $data['temperature'];
        $d->highvoltage = $data['highvoltage'];
        $d->refnuclidefound = $data['nuclidefound'];
        $d->N42path = $n42Path;
        $d->save();
    }

    public static function checkPath($station, $fileType, $folder, $folder2)
    {

        if (isset($folder2))
        {
            $ret = ".\\view\\file\\$station\\$fileType\\$folder\\$folder2\\";
        }
        else
        {
            $ret = ".\\view\\file\\$station\\$fileType\\$folder\\";
        }

        if (!file_exists($ret))
        {
            $stationPath = ".\\view\\file\\$station";
            if (!file_exists($stationPath))
            {
                mkdir($stationPath);
            }

            $devicePath = "$stationPath\\$fileType";
            if (!file_exists($devicePath))
            {
                mkdir($devicePath);
            }

            $folderPath = "$devicePath\\$folder";
            if (!file_exists($folderPath))
            {
                mkdir($folderPath);
            }

            if (isset($folder2))
            {
                $folderPath2 = "$folderPath\\$folder2";
                if (!file_exists($folderPath2))
                {
                    mkdir($folderPath2);
                }
            }

        }
        return $ret;
    }
} 